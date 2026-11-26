import * as Sentry from "@sentry/node";
import makeWASocketSingleProcess, {
  WASocket,
  DisconnectReason,
  isJidBroadcast,
  CacheStore,
  WAMessageKey,
  WAMessageContent,
  proto,
  jidNormalizedUser,
  BinaryNode
} from "libzapitu-rf";
import makeWASocketMultiThreaded from "libzapitu-rf/worker";

import { Boom } from "@hapi/boom";
// import MAIN_LOGGER from "@whiskeysockets/baileys/lib/Utils/logger";
import NodeCache from "node-cache";
import { format } from "date-fns";
import { Op } from "sequelize";
import { Agent } from "https";
import { Mutex } from "async-mutex";
import Whatsapp from "../models/Whatsapp";
import { logger, loggerBaileys } from "../utils/logger";
import authState from "../helpers/authState";
import AppError from "../errors/AppError";
import { getIO } from "./socket";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import { GitInfo } from "../gitinfo";
import { sendWhatsappUpdate } from "../services/WhatsappService/SocketSendWhatsappUpdate";
import GetPublicSettingService from "../services/SettingServices/GetPublicSettingService";
import waVersion from "../waversion.json";
import Message from "../models/Message";
import OutOfTicketMessage from "../models/OutOfTicketMessages";
import { DecoupledDriverServices } from "../services/DecoupledDriverServices/DecoupledDriverServices";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import GetTicketWbot from "../helpers/GetTicketWbot";
import { getJidOf } from "../services/WbotServices/getJidOf";
import WhatsappLidMap from "../models/WhatsappLidMap";
import crypto from "crypto";
import { GetCompanySetting } from "../helpers/CheckSettings";
import {
  withActiveBaileysSession,
  resetBaileysSession,
  cleanupRetiredBaileysSessions,
  StaleBaileysSessionError
} from "../services/WbotServices/BaileysSessionService";

// const loggerBaileys = MAIN_LOGGER.child({});
// loggerBaileys.level = process.env.BAILEYS_LOG_LEVEL || "error";

const passkeyTokens = new Map<number, { token: string; sessionId: string }>();

export function setPasskeyToken(
  whatsappId: number,
  token: string,
  sessionId: string
): void {
  passkeyTokens.set(whatsappId, { token, sessionId });
}

export function getPasskeyToken(whatsappId: number): string | undefined {
  return passkeyTokens.get(whatsappId)?.token;
}

export function resolvePasskeyToken(
  token: string
): { whatsappId: number; sessionId: string } | undefined {
  const entry = Array.from(passkeyTokens.entries()).find(
    ([, t]) => t.token === token
  );
  return entry && { whatsappId: entry[0], sessionId: entry[1].sessionId };
}

export function createCaptureToken(
  whatsappId: number,
  sessionId: string
): string {
  const token = crypto.randomBytes(24).toString("hex");
  passkeyTokens.set(whatsappId, { token, sessionId });
  return token;
}

export function invalidateCaptureToken(
  whatsappId: number,
  sessionId?: string
): void {
  if (!sessionId || passkeyTokens.get(whatsappId)?.sessionId === sessionId) {
    passkeyTokens.delete(whatsappId);
  }
}

export type Session = WASocket & {
  id?: number;
  baileysSessionId?: string;
  myJid?: string;
  myLid?: string;
  cacheMessage?: (msg: proto.IWebMessageInfo) => void;
  isRefreshing?: boolean;
  cancelStart?: () => void;
  invalidate?: () => void;
  isCurrent?: () => boolean;
  publiclyAvailable?: boolean;
};

const sessions: Session[] = [];

const retriesQrCodeMap = new Map<string, number>();
const reconnectTimers = new Map<string, NodeJS.Timeout>();

export function cancelReconnect(sessionId: string): void {
  const timer = reconnectTimers.get(sessionId);
  if (timer) clearTimeout(timer);
  reconnectTimers.delete(sessionId);
}

export function clearQrRetries(sessionId: string): void {
  if (sessionId) retriesQrCodeMap.delete(sessionId);
}

export const getWbot = (whatsappId: number): Session => {
  const sessionIndex = sessions.findIndex(
    s => s.id === whatsappId && s.publiclyAvailable
  );

  if (sessionIndex === -1) {
    throw new AppError("ERR_WAPP_NOT_INITIALIZED");
  }

  return sessions[sessionIndex];
};

export const getConnectedNumber = (whatsappId: number): string | undefined => {
  const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
  if (sessionIndex === -1) return undefined;
  const myJid = sessions[sessionIndex].myJid;
  if (!myJid) return undefined;
  return myJid.split("@")[0];
};

export const removeWbot = async (
  whatsappId: number,
  isLogout = true,
  expectedSessionId?: string,
  expectedSocket?: Session
): Promise<void> => {
  const sessionIndex = sessions.findIndex(
    s =>
      s.id === whatsappId &&
      (!expectedSessionId || s.baileysSessionId === expectedSessionId) &&
      (!expectedSocket || s === expectedSocket)
  );
  if (sessionIndex !== -1) {
    const session = sessions[sessionIndex];
    sessions.splice(sessionIndex, 1);
    session.cancelStart?.();
    session.ev.removeAllListeners("connection.update");
    session.ev.removeAllListeners("creds.update");
    session.ev.removeAllListeners("presence.update");
    session.ev.removeAllListeners("groups.upsert");
    session.ev.removeAllListeners("groups.update");
    session.ev.removeAllListeners("group-participants.update");
    session.ev.removeAllListeners("contacts.upsert");
    session.ev.removeAllListeners("contacts.update");
    try {
      if (isLogout) await session.logout();
    } finally {
      session.invalidate?.();
      session.end(null);
      session.ws.removeAllListeners();
      await session.ws.close();
    }
  }
};

/**
 * Closes every active WhatsApp session without logging out, so credentials
 * are preserved and sessions can be resumed after a restart. Used during
 * graceful shutdown.
 */
export const closeAllSessions = async (): Promise<void> => {
  const ids = sessions.map(s => s.id).filter((id): id is number => !!id);

  if (ids.length === 0) {
    logger.info("No active WhatsApp sessions to close.");
    return;
  }

  logger.info(`Closing ${ids.length} WhatsApp session(s)...`);
  await Promise.allSettled(ids.map(id => removeWbot(id, false)));
  logger.info("All WhatsApp sessions closed.");
};

function getGreaterVersion(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const numA = a[i] || 0;
    const numB = b[i] || 0;

    if (numA > numB) {
      return a;
    }
    if (numA < numB) {
      return b;
    }
  }

  return a;
}

const waVersionCache = new NodeCache({
  stdTTL: 60 * 60 * 24, // 24 hours
  checkperiod: 60 * 30, // 30 minutes
  useClones: false
});

const waVersionMutex = new Mutex();
const checkWbotDuplicity = new Mutex();

const getProjectWAVersion = async () => {
  try {
    const res = await fetch("https://waversion.ticke.tz");
    const version = await res.json();
    return version;
  } catch {
    logger.warn("Failed to get current WA Version from project repository");
  }
  return waVersion;
};

export const initWASocket = async (
  whatsapp: Whatsapp,
  proxy?: Agent,
  isRefresh = false,
  sessionId?: string
): Promise<Session> => {
  return new Promise((resolve, reject) => {
    try {
      (async () => {
        const io = getIO();

        const whatsappUpdate = await Whatsapp.findOne({
          where: { id: whatsapp.id }
        });

        if (!whatsappUpdate) throw new AppError("ERR_NO_WAPP_FOUND", 404);

        const { id, name, provider } = whatsappUpdate;

        function handleReachoutTimelock(
          timelock: {
            isActive?: boolean;
            timeEnforcementEnds?: Date;
            enforcementType?: string;
          },
          logData: Record<string, unknown>
        ): void {
          if (!timelock?.isActive) {
            return;
          }

          const message = `Session ${name} is temporarily restricted up to ${
            timelock.timeEnforcementEnds
              ? format(timelock.timeEnforcementEnds, "dd/MM/yyyy HH:mm:ss")
              : "unknown"
          } - ${timelock.enforcementType}.`;

          logger.warn(logData, message);
          io.to(`company-${whatsapp.companyId}-admin`)
            .to("role-connections")
            .to(`role-connections/${whatsapp.id}`)
            .emit(`error`, { message });
        }

        const autoVersion = await waVersionMutex.runExclusive(async () => {
          let wv = waVersionCache.get("waVersion");

          if (!wv) {
            wv = await getProjectWAVersion();

            if (!wv) {
              // anything will be greater
              return [2, 2300, 0];
            }

            waVersionCache.set("waVersion", wv);
          }

          return wv;
        });

        const isLegacy = provider === "stable";

        const version = getGreaterVersion(autoVersion, waVersion);

        logger.info(`using WA v${version.join(".")}`);
        logger.info(`isLegacy: ${isLegacy}`);
        logger.info(`Starting session ${name}`);
        let retriesQrCode = 0;

        let wsocket: Session = null;
        const store = new NodeCache({
          stdTTL: 120,
          checkperiod: 30,
          useClones: false
        });

        async function getMessage(
          key: WAMessageKey
        ): Promise<WAMessageContent> {
          if (!key.id) return null;

          const message = store.get(key.id);

          if (message) {
            logger.debug({ message }, "cacheMessage: recovered from cache");
            return message;
          }

          logger.debug(
            { key },
            "cacheMessage: not found in cache - fallback to database"
          );

          let msg: Message | OutOfTicketMessage;

          msg = await Message.findOne({
            where: { id: key.id, fromMe: true }
          });

          if (!msg) {
            msg = await OutOfTicketMessage.findOne({
              where: { id: key.id }
            });
          }

          if (!msg) {
            logger.debug({ key }, "cacheMessage: not found in database");
            return undefined;
          }

          try {
            const data = JSON.parse(msg.dataJson);
            logger.debug(
              { key, data },
              "cacheMessage: recovered from database"
            );
            store.set(key.id, data.message);
            return data.message || undefined;
          } catch (error) {
            logger.error(
              { key },
              `cacheMessage: error parsing message from database - ${error.message}`
            );
          }

          return undefined;
        }

        let isCurrent = true;
        const { state, saveState } = await authState(
          whatsapp,
          sessionId,
          () => isCurrent
        );

        const msgRetryCounterCache = new NodeCache();
        const internalGroupCache = new NodeCache({
          stdTTL: 5 * 60,
          useClones: false
        });
        const groupCache: CacheStore = {
          get: <T>(key: string): T => {
            logger.debug(`groupCache.get ${key}`);
            const value = internalGroupCache.get(key);
            if (!value) {
              logger.debug(`groupCache.get ${key} not found`);
              wsocket.groupMetadata(key).then(async metadata => {
                logger.debug({ key, metadata }, `groupCache.get ${key} set`);
                internalGroupCache.set(key, metadata);
              });
            }
            return value as T;
          },
          set: async <T>(key: string, value: T) => {
            logger.debug({ key, value }, `groupCache.set ${key}`);
            return internalGroupCache.set(key, value);
          },
          del: async (key: string) => {
            logger.debug(`groupCache.del ${key}`);
            return internalGroupCache.del(key);
          },
          flushAll: async () => {
            logger.debug("groupCache.flushAll");
            return internalGroupCache.flushAll();
          }
        };

        const appName =
          (await GetPublicSettingService({ key: "appName" })) || "Ticketz";
        const hostName = process.env.BACKEND_URL?.split("/")[2];
        const appVersion = GitInfo.tagName || GitInfo.commitHash;
        const clientName = `${appName} ${appVersion}${
          hostName ? ` - ${hostName}` : ""
        }`;

        let makeWASocket: typeof makeWASocketSingleProcess;
        if (
          (await GetCompanySetting(1, "useMultiThreadedWbot", "disabled")) ===
          "enabled"
        ) {
          makeWASocket = makeWASocketMultiThreaded;
        } else {
          makeWASocket = makeWASocketSingleProcess;
        }

        wsocket = makeWASocket({
          logger: loggerBaileys,
          printQRInTerminal: false,
          emitOwnEvents: false,
          markOnlineOnConnect: false,
          browser: [clientName, "Desktop", appVersion],
          auth: {
            creds: state.creds,
            keys: state.keys
          },
          version,
          defaultQueryTimeoutMs: 60000,
          // retryRequestDelayMs: 250,
          // keepAliveIntervalMs: 1000 * 60 * 10 * 3,
          msgRetryCounterCache,
          // syncFullHistory: true,
          generateHighQualityLinkPreview: true,
          getMessage,
          agent: proxy,
          fetchAgent: proxy,
          cachedGroupMetadata: async jid => groupCache.get(jid),
          shouldIgnoreJid: jid =>
            isJidBroadcast(jid) || jid?.endsWith("@newsletter"),
          transactionOpts: { maxCommitRetries: 1, delayBetweenTriesMs: 10 }
        });

        wsocket.id = id;
        wsocket.baileysSessionId = sessionId;
        wsocket.invalidate = () => {
          isCurrent = false;
        };
        wsocket.isCurrent = () => isCurrent;
        wsocket.cancelStart = () => reject(new StaleBaileysSessionError());
        const previous = sessions.find(s => s.id === id);
        if (previous && previous.baileysSessionId !== sessionId) {
          await removeWbot(id, false, previous.baileysSessionId, previous);
        }
        await withActiveBaileysSession(id, sessionId, async current => {
          if (
            current.status === "passkey_required" ||
            current.status === "IMPORTING"
          ) {
            throw new StaleBaileysSessionError();
          }
          const previousIndex = sessions.findIndex(s => s.id === id);
          if (previousIndex !== -1) {
            throw new Error("WhatsApp socket already initialized");
          }
          sessions.push(wsocket);
        }).catch(error => {
          wsocket.end(null);
          throw error;
        });

        wsocket.ev.on("call", async event => {
          logger.trace({ event }, "Received call event");
        });

        wsocket.ws.on("CB:call", async (node: BinaryNode) => {
          logger.trace({ node }, "Received raw call node");
        });

        wsocket.isRefreshing = isRefresh;

        wsocket.cacheMessage = (msg: proto.IWebMessageInfo): void => {
          if (!msg.key.fromMe) return;

          logger.debug({ message: msg.message }, "cacheMessage: saved");

          store.set(msg.key.id, msg.message);
        };

        const updateSession = async (values: Partial<Whatsapp>) => {
          await withActiveBaileysSession(
            id,
            sessionId,
            async (current, transaction) => {
              if (!isCurrent) throw new StaleBaileysSessionError();
              await current.update(values, { transaction });
              if (values.status === "CONNECTED" || values.status === "qrcode") {
                wsocket.publiclyAvailable = true;
              }
              io.to(`company-${current.companyId}-admin`).emit(
                `company-${current.companyId}-whatsappSession`,
                { action: "update", session: current }
              );
              sendWhatsappUpdate(current);
            }
          );
        };
        const handleSocketError = (error: Error) => {
          if (!(error instanceof StaleBaileysSessionError)) {
            logger.error(
              { whatsappId: id, errorType: error.name },
              "Baileys socket event failed"
            );
          }
        };
        wsocket.ev.on("connection.update", async update => {
          await (async () => {
            const { connection, lastDisconnect, qr, reachoutTimeLock } = update;
            if (reachoutTimeLock) {
              await withActiveBaileysSession(id, sessionId, async () => {
                if (!isCurrent) throw new StaleBaileysSessionError();
                handleReachoutTimelock(reachoutTimeLock, { reachoutTimeLock });
              });
            }
            logger.info(`Socket ${name} connection update ${connection || ""}`);
            if (connection === "close") {
              const statusCode = (lastDisconnect?.error as Boom)?.output
                ?.statusCode;
              if (
                statusCode === 403 ||
                statusCode === DisconnectReason.loggedOut
              ) {
                const reset = await resetBaileysSession(
                  id,
                  sessionId,
                  () => isCurrent
                );
                invalidateCaptureToken(id, sessionId);
                clearQrRetries(sessionId);
                cancelReconnect(sessionId);
                await removeWbot(id, false, sessionId, wsocket);
                await cleanupRetiredBaileysSessions(id);
                await withActiveBaileysSession(
                  id,
                  reset.whatsapp.activeBaileysSessionId,
                  async current => {
                    io.to(`company-${current.companyId}-admin`).emit(
                      `company-${current.companyId}-whatsappSession`,
                      { action: "update", session: current }
                    );
                  }
                );
              } else {
                await updateSession({ status: "PENDING" });
                await removeWbot(id, false, sessionId, wsocket);
                cancelReconnect(sessionId);
                const timer = setTimeout(() => {
                  reconnectTimers.delete(sessionId);
                  if (getPasskeyToken(id)) return;
                  StartWhatsAppSession(
                    whatsapp,
                    whatsapp.companyId,
                    true,
                    sessionId
                  );
                }, 2000);
                reconnectTimers.set(sessionId, timer);
              }
              return;
            }
            if (connection === "open") {
              wsocket.myLid = jidNormalizedUser(wsocket.user?.lid);
              wsocket.myJid = jidNormalizedUser(wsocket.user.id);
              await updateSession({
                status: "CONNECTED",
                qrcode: "",
                retries: 0
              });
              clearQrRetries(sessionId);
              retriesQrCode = 0;
              wsocket
                .fetchAccountReachoutTimelock()
                .then(timelock => {
                  if (isCurrent) handleReachoutTimelock(timelock, { timelock });
                })
                .catch(handleSocketError);
              wsocket
                .fetchNewChatMessageCap()
                .then(cap => {
                  if (isCurrent)
                    logger.info({ cap }, "Fetched new chat message cap");
                })
                .catch(handleSocketError);
              await checkWbotDuplicity.runExclusive(async () => {
                if (!isCurrent) throw new StaleBaileysSessionError();
                const duplicate = sessions.find(
                  s => s.id !== id && s.myJid && s.myJid === wsocket.myJid
                );
                if (duplicate) {
                  await duplicate.logout();
                  await duplicate.ws.close();
                }
              });
              await withActiveBaileysSession(id, sessionId, async () => {
                if (!isCurrent) throw new StaleBaileysSessionError();
                wsocket.cancelStart = undefined;
                resolve(wsocket);
              });
              if (wsocket.isRefreshing) {
                setTimeout(() => {
                  if (!isCurrent) return;
                  wsocket
                    .resyncAppState(
                      [
                        "critical_block",
                        "critical_unblock_low",
                        "regular_high",
                        "regular_low",
                        "regular"
                      ],
                      true
                    )
                    .catch(handleSocketError);
                }, 5000);
                wsocket.isRefreshing = false;
              }
            }
            if (qr !== undefined) {
              if ((retriesQrCodeMap.get(sessionId) || 0) >= 3) {
                await updateSession({ status: "DISCONNECTED", qrcode: "" });
                clearQrRetries(sessionId);
                await removeWbot(id, false, sessionId, wsocket);
              } else {
                await updateSession({
                  qrcode: qr,
                  status: "qrcode",
                  retries: 0
                });
                retriesQrCodeMap.set(sessionId, ++retriesQrCode);
              }
            }
          })().catch(handleSocketError);
        });
        wsocket.ev.on("creds.update", () => {
          saveState().catch(handleSocketError);
        });

        wsocket.ev.on("pair.passkey.request", () => {
          (async () => {
            await withActiveBaileysSession(
              id,
              sessionId,
              async (current, transaction) => {
                if (!isCurrent) throw new StaleBaileysSessionError();
                const token = createCaptureToken(id, sessionId);
                await current.update(
                  { status: "passkey_required", qrcode: token, retries: 0 },
                  { transaction }
                );
                io.to(`company-${current.companyId}-admin`).emit(
                  `company-${current.companyId}-whatsappSession`,
                  { action: "update", session: current }
                );
                isCurrent = false;
              }
            );
            await removeWbot(id, false, sessionId, wsocket);
          })().catch(handleSocketError);
        });

        wsocket.ev.on(
          "presence.update",
          async ({ id: remoteJid, presences }) => {
            try {
              logger.debug(
                { remoteJid, presences },
                "Received contact presence"
              );
              if (!presences[remoteJid]?.lastKnownPresence) {
                // ignore presence from groups
                return;
              }

              let contact = await Contact.findOne({
                where: {
                  number: remoteJid.endsWith("@lid")
                    ? remoteJid
                    : remoteJid.replace(/\D/g, ""),
                  companyId: whatsapp.companyId
                }
              });

              if (!contact && remoteJid.endsWith("@lid")) {
                const lidMap = await WhatsappLidMap.findOne({
                  where: {
                    lid: remoteJid,
                    companyId: whatsapp.companyId
                  },
                  include: [Contact]
                });
                contact = lidMap?.contact;
              }

              if (!contact) {
                return;
              }
              const ticket = await Ticket.findOne({
                where: {
                  contactId: contact.id,
                  whatsappId: whatsapp.id,
                  status: {
                    [Op.or]: ["open", "pending"]
                  }
                }
              });

              if (ticket) {
                io.to(ticket.id.toString())
                  .to(`company-${whatsapp.companyId}-${ticket.status}`)
                  .to(`queue-${ticket.queueId}-${ticket.status}`)
                  .emit(`company-${whatsapp.companyId}-presence`, {
                    ticketId: ticket.id,
                    presence: presences[remoteJid].lastKnownPresence
                  });
              }
            } catch (error) {
              logger.error(
                { remoteJid, presences },
                "presence.update: error processing"
              );
              if (error instanceof Error) {
                logger.error(`Error: ${error.name} ${error.message}`);
              } else {
                logger.error(`Error was object of type: ${typeof error}`);
              }
            }
          }
        );

        wsocket.ev.on("groups.upsert", groups => {
          logger.debug("Received new group");
          groups.forEach(group => {
            groupCache.set(group.id, group);
          });
        });

        wsocket.ev.on("groups.update", async ([event]) => {
          logger.debug("Received group update");
          const metadata = await wsocket.groupMetadata(event.id);
          groupCache.set(event.id, metadata);
        });

        wsocket.ev.on("group-participants.update", async event => {
          logger.debug("Received group participants update");
          try {
            const metadata = await wsocket.groupMetadata(event.id);
            groupCache.set(event.id, metadata);
          } catch {
            groupCache.del(event.id);
          }
        });
      })().catch(reject);
    } catch (error) {
      Sentry.captureException(error);
      console.log(error);
      reject(error);
    }
  });
};

const decoupledDriverServices = DecoupledDriverServices.getInstance();

decoupledDriverServices.registerFunction(
  "presenceUpdate",
  async (user, parameters) => {
    const { ticketId, presence } = parameters;
    const ticket = await ShowTicketService(ticketId);
    if (!ticket || ticket.companyId !== user.companyId) {
      return;
    }

    const wbot = await GetTicketWbot(ticket);
    if (!wbot) {
      return;
    }

    const jid = getJidOf(ticket);

    if (jid.endsWith("@lid")) {
      return;
    }

    wbot.sendPresenceUpdate(presence, jid).catch(err => {
      logger.error(
        {
          message: err.message,
          jid,
          presence,
          ticketId: ticket.id,
          companyId: ticket.companyId,
          connection: ticket.whatsapp?.name
        },
        "Error sending presence update"
      );
    });
  }
);
