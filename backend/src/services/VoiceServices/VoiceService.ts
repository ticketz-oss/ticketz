import { Op, Transaction } from "sequelize";
import { sign, verify } from "jsonwebtoken";
import { readFileSync } from "fs";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import { getIO } from "../../libs/socket";
import User from "../../models/User";
import UserQueue from "../../models/UserQueue";
import UserSocketSession from "../../models/UserSocketSession";
import VoiceCall from "../../models/VoiceCall";
import VoiceConnection from "../../models/VoiceConnection";
import Whatsapp from "../../models/Whatsapp";
import WhatsappQueue from "../../models/WhatsappQueue";
import { logger } from "../../utils/logger";
import {
  assertVoiceEnabled,
  voiceEnabledForCompany,
  voiceGloballyEnabled
} from "./VoiceAccessService";
import { clearVoiceQR, setVoiceQR, waitForVoiceQR } from "./VoiceRuntimeStore";
import { WaCallsEvent, waCallsClient } from "./WaCallsClient";
import { resolveVoiceContact } from "./VoiceContactService";
import { finishVoiceHistory, startVoiceHistory } from "./VoiceHistoryService";
import {
  assertVoiceTranscriptionConfigured,
  finalizeVoiceArtifacts
} from "./VoiceArtifactService";

type RequestUser = {
  id: string | number;
  companyId: number;
  profile?: string;
};

type VoiceMediaToken = {
  purpose: "voice-media";
  companyId: number;
  userId: number;
  callId: number;
};

const missedTimers = new Map<number, NodeJS.Timeout>();
let stopEventStream: (() => void) | null = null;
let bridgeRunning = false;
let bridgeConnecting = false;
let bridgeReconnectTimer: NodeJS.Timeout | null = null;

const mediaSecret = (): string => {
  let secret = (process.env.WACALLS_TOKEN_SECRET || "").trim();
  const file = process.env.WACALLS_TOKEN_SECRET_FILE || "";
  if (!secret && file) {
    try {
      secret = readFileSync(file, "utf8").trim();
    } catch {
      secret = "";
    }
  }
  if (secret.length < 32) {
    throw new AppError("ERR_VOICE_SERVICE_NOT_CONFIGURED", 503);
  }
  return secret;
};

const serializeConnection = (connection: VoiceConnection) => ({
  id: connection.id,
  whatsappId: connection.whatsappId,
  state: connection.state,
  paired: connection.paired,
  lastError: connection.lastError,
  updatedAt: connection.updatedAt
});

const callPayload = (call: VoiceCall) => ({
  id: call.id,
  number: call.number,
  contactId: call.contactId,
  contactName: call.contact?.name || call.number,
  whatsappId: call.whatsappId,
  queueId: call.queueId,
  queueIds: call.queueIds || [],
  userId: call.userId,
  state: call.state,
  startedAt: call.startedAt,
  acceptedAt: call.acceptedAt,
  endedAt: call.endedAt,
  durationSeconds: call.durationSeconds,
  error: call.error,
  recordingEnabled: Boolean(call.recordingEnabled),
  transcriptionEnabled: Boolean(call.transcriptionEnabled),
  artifactStatus: call.artifactStatus
});

const queueIdsForWhatsapp = async (whatsappId: number): Promise<number[]> => {
  const rows = await WhatsappQueue.findAll({
    where: { whatsappId },
    attributes: ["queueId"]
  });
  return Array.from(new Set(rows.map(row => row.queueId)));
};

const eligibleUserIds = async (queueIds: number[]): Promise<number[]> => {
  if (queueIds.length === 0) return [];
  const assignments = await UserQueue.findAll({
    where: { queueId: { [Op.in]: queueIds } },
    attributes: ["userId"]
  });
  return Array.from(new Set(assignments.map(row => row.userId)));
};

const onlineEligibleUserIds = async (queueIds: number[]): Promise<number[]> => {
  const assigned = await eligibleUserIds(queueIds);
  if (assigned.length === 0) return [];
  const online = await UserSocketSession.findAll({
    where: { userId: { [Op.in]: assigned }, active: true },
    attributes: ["userId"]
  });
  return Array.from(new Set(online.map(row => row.userId)));
};

const emitToUsers = async (
  queueIds: number[],
  event: "voice:incoming" | "voice:updated" | "voice:ended",
  payload: Record<string, unknown>,
  additionalUserId?: number
): Promise<void> => {
  const recipients = new Set(await eligibleUserIds(queueIds));
  if (additionalUserId) recipients.add(additionalUserId);
  const io = getIO();
  recipients.forEach(userId => io.to(`user-${userId}`).emit(event, payload));
};

const finishCall = async (
  call: VoiceCall,
  state: "rejected" | "missed" | "ended" | "failed",
  error?: string
): Promise<VoiceCall> => {
  const now = new Date();
  const timer = missedTimers.get(call.id);
  if (timer) clearTimeout(timer);
  missedTimers.delete(call.id);
  const result = await sequelize.transaction(async transaction => {
    const locked = await VoiceCall.findByPk(call.id, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!locked) return { finished: null, changed: false };
    if (["ended", "failed", "missed", "rejected"].includes(locked.state)) {
      return { finished: locked, changed: false };
    }
    const durationSeconds = locked.acceptedAt
      ? Math.max(
          0,
          Math.floor((now.getTime() - locked.acceptedAt.getTime()) / 1000)
        )
      : 0;
    await locked.update(
      {
        state,
        endedAt: now,
        durationSeconds,
        error: error || null
      },
      { transaction }
    );
    return { finished: locked, changed: true };
  });
  const finished = result.finished || call;
  await finished.reload({ include: ["contact"] }).catch(() => undefined);
  if (finished.acceptedAt) {
    let historyReady = false;
    try {
      const withTicket = await startVoiceHistory(finished);
      if (withTicket.ticketId) {
        await finishVoiceHistory(withTicket);
        historyReady = true;
      }
    } catch (historyError) {
      logger.error(
        { error: historyError, voiceCallId: finished.id },
        "Unable to finalize voice ticket history"
      );
    }
    if (
      historyReady &&
      (result.changed || finished.artifactStatus === "capturing")
    ) {
      setImmediate(() => {
        finalizeVoiceArtifacts(finished.id).catch(artifactError =>
          logger.error(
            { error: artifactError, voiceCallId: finished.id },
            "Unable to finalize voice artifacts"
          )
        );
      });
    }
  }
  await emitToUsers(
    finished.queueIds || [],
    "voice:ended",
    callPayload(finished),
    finished.userId
  );
  return finished;
};

const rejectUpstream = async (call: VoiceCall): Promise<void> => {
  const connection = await VoiceConnection.findByPk(call.voiceConnectionId);
  if (!connection?.sessionId) return;
  try {
    await waCallsClient.rejectCall(connection.sessionId, call.externalCallId);
  } catch {
    logger.warn(
      { voiceCallId: call.id },
      "Unable to reject WaCalls call after local finalization"
    );
  }
};

const timeoutMissedCall = async (callId: number): Promise<void> => {
  const call = await sequelize.transaction(async transaction => {
    const locked = await VoiceCall.findByPk(callId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!locked || locked.state !== "ringing") return null;
    await locked.update(
      { state: "missed", endedAt: new Date(), durationSeconds: 0 },
      { transaction }
    );
    return locked;
  });
  missedTimers.delete(callId);
  if (!call) return;
  await rejectUpstream(call);
  await emitToUsers(call.queueIds || [], "voice:ended", callPayload(call));
};

const scheduleMissedCall = (callId: number): void => {
  const timer = setTimeout(() => {
    timeoutMissedCall(callId).catch(error =>
      logger.error({ error, voiceCallId: callId }, "Voice call timeout failed")
    );
  }, 30000);
  missedTimers.set(callId, timer);
};

const handleIncoming = async (event: WaCallsEvent): Promise<void> => {
  if (!event.sessionId || !event.id) return;
  const connection = await VoiceConnection.findOne({
    where: { sessionId: event.sessionId }
  });
  if (!connection || !(await voiceEnabledForCompany(connection.companyId))) {
    try {
      await waCallsClient.rejectCall(event.sessionId, event.id);
    } catch {
      // A stale/unknown session must not affect the backend event bridge.
    }
    return;
  }

  const existing = await VoiceCall.findOne({
    where: { externalCallId: event.id }
  });
  if (existing) return;

  const queueIds = await queueIdsForWhatsapp(connection.whatsappId);
  const activeCalls = await VoiceCall.count({
    where: {
      companyId: connection.companyId,
      state: { [Op.in]: ["ringing", "accepted"] }
    }
  });
  const { contact, peer } = await resolveVoiceContact(
    connection.companyId,
    event.peer
  );
  const call = await VoiceCall.create({
    externalCallId: event.id,
    companyId: connection.companyId,
    voiceConnectionId: connection.id,
    whatsappId: connection.whatsappId,
    queueId: queueIds[0] || null,
    queueIds,
    contactId: contact.id,
    number: peer.number,
    direction: "inbound",
    state: "ringing",
    startedAt: new Date(event.offeredAt || event.startedAt || Date.now()),
    durationSeconds: 0
  });
  call.contact = contact;

  const onlineUsers = await onlineEligibleUserIds(queueIds);
  if (activeCalls >= 2 || onlineUsers.length === 0) {
    await call.update({
      state: "missed",
      endedAt: new Date(),
      error:
        activeCalls >= 2 ? "pilot_capacity_reached" : "no_attendant_available"
    });
    await rejectUpstream(call);
    await emitToUsers(queueIds, "voice:ended", callPayload(call));
    return;
  }

  const io = getIO();
  onlineUsers.forEach(userId =>
    io.to(`user-${userId}`).emit("voice:incoming", callPayload(call))
  );
  scheduleMissedCall(call.id);
};

const handleConnectionEvent = async (event: WaCallsEvent): Promise<void> => {
  if (!event.sessionId) return;
  const connection = await VoiceConnection.findOne({
    where: { sessionId: event.sessionId }
  });
  if (!connection) return;
  if (event.qr) setVoiceQR(event.sessionId, event.qr);
  const state = event.qr ? "pairing" : event.state || connection.state;
  const paired = event.paired === undefined ? connection.paired : event.paired;
  if (paired) clearVoiceQR(event.sessionId);
  await connection.update({ state, paired, lastError: null });
  getIO()
    .to(`company-${connection.companyId}-admin`)
    .emit("voice:updated", {
      connection: serializeConnection(connection),
      ...(event.qr ? { qr: event.qr } : {})
    });
};

const handleSessionList = async (event: WaCallsEvent): Promise<void> => {
  if (!Array.isArray(event.sessions)) return;
  await Promise.all(
    event.sessions.map(async session => {
      const connection = await VoiceConnection.findOne({
        where: { sessionId: session.id }
      });
      if (!connection) return;
      await connection.update({
        state: session.state || connection.state,
        paired: Boolean(session.paired),
        lastError: null
      });
      getIO()
        .to(`company-${connection.companyId}-admin`)
        .emit("voice:updated", { connection: serializeConnection(connection) });
    })
  );
};

const handleCallStatus = async (event: WaCallsEvent): Promise<void> => {
  if (!event.id) return;
  const call = await VoiceCall.findOne({
    where: { externalCallId: event.id },
    include: ["contact"]
  });
  if (!call) return;
  if (event.status === "connected" && call.state === "accepted") {
    await emitToUsers(
      call.queueIds || [],
      "voice:updated",
      callPayload(call),
      call.userId
    );
  }
};

const handleCallEnded = async (event: WaCallsEvent): Promise<void> => {
  if (!event.id) return;
  const call = await VoiceCall.findOne({
    where: { externalCallId: event.id },
    include: ["contact"]
  });
  if (!call || ["ended", "failed", "missed", "rejected"].includes(call.state)) {
    return;
  }
  await finishCall(call, call.state === "accepted" ? "ended" : "missed");
};

export const processWaCallsEvent = async (
  event: WaCallsEvent
): Promise<void> => {
  switch (event.type) {
    case "session-list":
      await handleSessionList(event);
      break;
    case "session-qr":
    case "auth-state":
      await handleConnectionEvent(event);
      break;
    case "incoming":
      await handleIncoming(event);
      break;
    case "call-status":
      await handleCallStatus(event);
      break;
    case "call-ended":
      await handleCallEnded(event);
      break;
    default:
      break;
  }
};

export const startVoiceEventBridge = (): void => {
  if (!voiceGloballyEnabled() || bridgeRunning) return;
  bridgeRunning = true;

  const scheduleReconnect = (): void => {
    if (!bridgeRunning || bridgeReconnectTimer) return;
    bridgeReconnectTimer = setTimeout(() => {
      bridgeReconnectTimer = null;
      connect().catch(error =>
        logger.error({ error }, "WaCalls event bridge reconnect failed")
      );
    }, 5000);
  };

  const connect = async (): Promise<void> => {
    if (!bridgeRunning || bridgeConnecting || stopEventStream) return;
    bridgeConnecting = true;
    try {
      let disconnectedBeforeReady = false;
      const streamStop = await waCallsClient.openEventStream(
        processWaCallsEvent,
        () => {
          disconnectedBeforeReady = true;
          stopEventStream = null;
          bridgeConnecting = false;
          if (bridgeRunning) {
            logger.warn(
              "WaCalls event bridge disconnected; retrying in 5 seconds"
            );
            scheduleReconnect();
          }
        }
      );
      if (disconnectedBeforeReady) streamStop();
      else stopEventStream = streamStop;
    } catch {
      logger.warn("WaCalls event bridge unavailable; retrying in 5 seconds");
      scheduleReconnect();
    } finally {
      bridgeConnecting = false;
    }
  };
  connect().catch(error =>
    logger.error({ error }, "WaCalls event bridge stopped")
  );
};

export const stopVoiceEventBridge = (): void => {
  bridgeRunning = false;
  bridgeConnecting = false;
  if (bridgeReconnectTimer) clearTimeout(bridgeReconnectTimer);
  bridgeReconnectTimer = null;
  stopEventStream?.();
  stopEventStream = null;
  missedTimers.forEach(timer => clearTimeout(timer));
  missedTimers.clear();
};

export const listVoiceConnections = async (companyId: number) => {
  await assertVoiceEnabled(companyId);
  const [connections, whatsapps, serviceHealthy] = await Promise.all([
    VoiceConnection.findAll({ where: { companyId }, order: [["id", "ASC"]] }),
    Whatsapp.findAll({
      where: { companyId, channel: "whatsapp", apiMode: "baileys" },
      attributes: ["id", "name", "status"],
      order: [["name", "ASC"]]
    }),
    waCallsClient.health()
  ]);
  return {
    enabled: true,
    serviceHealthy,
    connections: connections.map(serializeConnection),
    whatsapps
  };
};

export const pairVoiceConnection = async (
  companyId: number,
  whatsappId: number,
  riskAccepted: unknown
) => {
  await assertVoiceEnabled(companyId);
  if (riskAccepted !== true) {
    throw new AppError("ERR_VOICE_RISK_CONFIRMATION_REQUIRED", 422);
  }
  const whatsapp = await Whatsapp.findOne({
    where: { id: whatsappId, companyId, channel: "whatsapp" }
  });
  if (!whatsapp) throw new AppError("ERR_WAPP_NOT_FOUND", 404);
  if (whatsapp.apiMode === "official") {
    throw new AppError("ERR_WAPP_OFFICIAL_MODE_NOT_SUPPORTED", 400);
  }

  const [connection] = await VoiceConnection.findOrCreate({
    where: { companyId, whatsappId },
    defaults: {
      companyId,
      whatsappId,
      state: "pairing",
      paired: false
    }
  });

  let sessionId = connection.sessionId;
  if (sessionId && connection.paired) {
    return { connection: serializeConnection(connection), qr: null };
  }
  if (sessionId) {
    try {
      await waCallsClient.pairSession(sessionId);
    } catch {
      sessionId = null;
    }
  }
  if (!sessionId) {
    sessionId = await waCallsClient.createSession(
      `company-${companyId}-whatsapp-${whatsappId}`
    );
  }
  await connection.update({
    sessionId,
    state: "pairing",
    paired: false,
    lastError: null
  });
  const qr = await waitForVoiceQR(sessionId);
  return { connection: serializeConnection(connection), qr };
};

export const disconnectVoiceConnection = async (
  companyId: number,
  whatsappId: number
) => {
  await assertVoiceEnabled(companyId);
  const connection = await VoiceConnection.findOne({
    where: { companyId, whatsappId }
  });
  if (!connection) throw new AppError("ERR_VOICE_CONNECTION_NOT_FOUND", 404);
  if (connection.sessionId) {
    try {
      await waCallsClient.deleteSession(connection.sessionId);
    } catch {
      logger.warn(
        { voiceConnectionId: connection.id },
        "WaCalls session deletion failed; local connection disabled"
      );
    }
    clearVoiceQR(connection.sessionId);
  }
  await connection.update({
    sessionId: null,
    state: "disconnected",
    paired: false,
    lastError: null
  });
  return serializeConnection(connection);
};

export const disableCompanyVoiceConnections = async (
  companyId: number
): Promise<void> => {
  const connections = await VoiceConnection.findAll({ where: { companyId } });
  await Promise.all(
    connections.map(async connection => {
      if (connection.sessionId) {
        try {
          await waCallsClient.deleteSession(connection.sessionId);
        } catch {
          logger.warn(
            { voiceConnectionId: connection.id },
            "WaCalls session deletion failed while disabling tenant"
          );
        }
        clearVoiceQR(connection.sessionId);
      }
      await connection.update({
        sessionId: null,
        state: "disconnected",
        paired: false
      });
    })
  );
};

const lockActionableCall = async (
  callId: number,
  companyId: number,
  transaction: Transaction
): Promise<VoiceCall> => {
  const call = await VoiceCall.findOne({
    where: { id: callId, companyId },
    transaction,
    lock: transaction.LOCK.UPDATE
  });
  if (!call) throw new AppError("ERR_VOICE_CALL_NOT_FOUND", 404);
  return call;
};

const assertUserEligible = async (
  userId: number,
  call: VoiceCall,
  transaction?: Transaction
): Promise<void> => {
  const queues = call.queueIds || [];
  if (queues.length === 0) throw new AppError("ERR_VOICE_QUEUE_FORBIDDEN", 403);
  const assignment = await UserQueue.findOne({
    where: { userId, queueId: { [Op.in]: queues } },
    transaction
  });
  if (!assignment) throw new AppError("ERR_VOICE_QUEUE_FORBIDDEN", 403);
};

export const acceptVoiceCall = async (
  callId: number,
  requestUser: RequestUser
) => {
  await assertVoiceEnabled(requestUser.companyId);
  const userId = Number(requestUser.id);
  const call = await sequelize.transaction(async transaction => {
    const locked = await lockActionableCall(
      callId,
      requestUser.companyId,
      transaction
    );
    await assertUserEligible(userId, locked, transaction);
    if (locked.state !== "ringing") {
      throw new AppError("ERR_VOICE_CALL_ALREADY_CLAIMED", 409);
    }
    await locked.update(
      { state: "accepted", userId, acceptedAt: new Date() },
      { transaction }
    );
    return locked;
  });

  const timer = missedTimers.get(call.id);
  if (timer) clearTimeout(timer);
  missedTimers.delete(call.id);
  const connection = await VoiceConnection.findByPk(call.voiceConnectionId);
  if (!connection?.sessionId) {
    return finishCall(call, "failed", "voice_connection_unavailable").then(
      () => {
        throw new AppError("ERR_VOICE_SERVICE_UNAVAILABLE", 503);
      }
    );
  }
  try {
    await waCallsClient.acceptCall(
      connection.sessionId,
      call.externalCallId,
      userId
    );
  } catch {
    await finishCall(call, "failed", "upstream_accept_failed");
    throw new AppError("ERR_VOICE_SERVICE_UNAVAILABLE", 503);
  }

  await call.reload({ include: ["contact"] });
  try {
    const withTicket = await startVoiceHistory(call);
    Object.assign(call, withTicket.get ? withTicket.get() : withTicket);
  } catch (historyError) {
    logger.error(
      { error: historyError, voiceCallId: call.id },
      "Unable to create voice ticket history"
    );
  }

  await emitToUsers(
    call.queueIds || [],
    "voice:updated",
    callPayload(call),
    userId
  );
  const mediaToken = sign(
    {
      purpose: "voice-media",
      companyId: call.companyId,
      userId,
      callId: call.id
    } satisfies VoiceMediaToken,
    mediaSecret(),
    { expiresIn: "2m" }
  );
  return { call: callPayload(call), mediaToken };
};

export const rejectVoiceCall = async (
  callId: number,
  requestUser: RequestUser
) => {
  await assertVoiceEnabled(requestUser.companyId);
  const userId = Number(requestUser.id);
  const call = await sequelize.transaction(async transaction => {
    const locked = await lockActionableCall(
      callId,
      requestUser.companyId,
      transaction
    );
    await assertUserEligible(userId, locked, transaction);
    if (locked.state !== "ringing") {
      throw new AppError("ERR_VOICE_CALL_ALREADY_CLAIMED", 409);
    }
    await locked.update(
      { state: "rejected", userId, endedAt: new Date(), durationSeconds: 0 },
      { transaction }
    );
    return locked;
  });
  const timer = missedTimers.get(call.id);
  if (timer) clearTimeout(timer);
  missedTimers.delete(call.id);
  await rejectUpstream(call);
  await emitToUsers(
    call.queueIds || [],
    "voice:ended",
    callPayload(call),
    userId
  );
  return callPayload(call);
};

export const endVoiceCall = async (
  callId: number,
  requestUser: RequestUser
) => {
  await assertVoiceEnabled(requestUser.companyId);
  const call = await VoiceCall.findOne({
    where: { id: callId, companyId: requestUser.companyId }
  });
  if (!call) throw new AppError("ERR_VOICE_CALL_NOT_FOUND", 404);
  const user = await User.findByPk(requestUser.id, { attributes: ["profile"] });
  if (call.userId !== Number(requestUser.id) && user?.profile !== "admin") {
    throw new AppError("ERR_VOICE_CALL_FORBIDDEN", 403);
  }
  if (call.state !== "accepted") return callPayload(call);
  const connection = await VoiceConnection.findByPk(call.voiceConnectionId);
  if (connection?.sessionId) {
    try {
      await waCallsClient.endCall(connection.sessionId, call.externalCallId);
    } catch {
      await finishCall(call, "failed", "upstream_end_failed");
      throw new AppError("ERR_VOICE_SERVICE_UNAVAILABLE", 503);
    }
  }
  await finishCall(call, "ended");
  return callPayload(call);
};

export const setVoiceCallArtifactOption = async (
  callId: number,
  requestUser: RequestUser,
  kind: unknown,
  enabled: unknown
) => {
  await assertVoiceEnabled(requestUser.companyId);
  if (
    !["recording", "transcription"].includes(String(kind)) ||
    typeof enabled !== "boolean"
  ) {
    throw new AppError("ERR_VOICE_INVALID_ARTIFACT_OPTION", 422);
  }
  if (kind === "transcription" && enabled) {
    try {
      await assertVoiceTranscriptionConfigured(requestUser.companyId);
    } catch {
      throw new AppError("ERR_VOICE_TRANSCRIPTION_NOT_CONFIGURED", 422);
    }
  }
  const call = await VoiceCall.findOne({
    where: { id: callId, companyId: requestUser.companyId },
    include: ["contact"]
  });
  if (!call) throw new AppError("ERR_VOICE_CALL_NOT_FOUND", 404);
  const user = await User.findByPk(requestUser.id, { attributes: ["profile"] });
  if (call.userId !== Number(requestUser.id) && user?.profile !== "admin") {
    throw new AppError("ERR_VOICE_CALL_FORBIDDEN", 403);
  }
  if (call.state !== "accepted") {
    throw new AppError("ERR_VOICE_CALL_NOT_ACTIVE", 409);
  }
  const nextRecording =
    kind === "recording" ? enabled : Boolean(call.recordingEnabled);
  const nextTranscription =
    kind === "transcription" ? enabled : Boolean(call.transcriptionEnabled);
  const wasCapturing = call.recordingEnabled || call.transcriptionEnabled;
  const willCapture = nextRecording || nextTranscription;
  const connection = await VoiceConnection.findByPk(call.voiceConnectionId);
  if (!connection?.sessionId) {
    throw new AppError("ERR_VOICE_SERVICE_UNAVAILABLE", 503);
  }
  if (wasCapturing !== willCapture) {
    await waCallsClient.setCapture(
      connection.sessionId,
      call.externalCallId,
      willCapture
    );
  }
  await call.update({
    recordingEnabled: nextRecording,
    transcriptionEnabled: nextTranscription,
    artifactStatus: willCapture ? "capturing" : null,
    artifactError: null
  });
  await emitToUsers(
    call.queueIds || [],
    "voice:updated",
    callPayload(call),
    call.userId
  );
  return callPayload(call);
};

export const exchangeVoiceWebRTC = async (
  callId: number,
  requestUser: RequestUser,
  token: unknown,
  sdpOffer: unknown
) => {
  await assertVoiceEnabled(requestUser.companyId);
  if (typeof token !== "string")
    throw new AppError("ERR_VOICE_MEDIA_TOKEN", 401);
  let payload: VoiceMediaToken;
  try {
    payload = verify(token, mediaSecret()) as VoiceMediaToken;
  } catch {
    throw new AppError("ERR_VOICE_MEDIA_TOKEN", 401);
  }
  if (
    payload.purpose !== "voice-media" ||
    payload.callId !== callId ||
    payload.companyId !== requestUser.companyId ||
    payload.userId !== Number(requestUser.id)
  ) {
    throw new AppError("ERR_VOICE_MEDIA_TOKEN", 401);
  }
  if (
    typeof sdpOffer !== "string" ||
    sdpOffer.length < 20 ||
    sdpOffer.length > 200000
  ) {
    throw new AppError("ERR_VOICE_INVALID_SDP", 422);
  }
  const call = await VoiceCall.findOne({
    where: {
      id: callId,
      companyId: requestUser.companyId,
      userId: Number(requestUser.id),
      state: "accepted"
    }
  });
  if (!call) throw new AppError("ERR_VOICE_CALL_FORBIDDEN", 403);
  const connection = await VoiceConnection.findByPk(call.voiceConnectionId);
  if (!connection?.sessionId) {
    throw new AppError("ERR_VOICE_SERVICE_UNAVAILABLE", 503);
  }
  return {
    sdp_answer: await waCallsClient.exchangeWebRTC(
      connection.sessionId,
      call.externalCallId,
      sdpOffer
    )
  };
};
