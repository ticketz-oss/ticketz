import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { Op } from "sequelize";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import privateFiles from "../../config/privateFiles";
import {
  transcribeDetailed,
  transcriberModel
} from "../../helpers/transcriber";
import Contact from "../../models/Contact";
import User from "../../models/User";
import UserQueue from "../../models/UserQueue";
import VoiceCall from "../../models/VoiceCall";
import { logger } from "../../utils/logger";
import CreateMessageService from "../MessageServices/CreateMessageService";
import { durationLabel, voiceMessageId } from "./VoiceHistoryService";
import { waCallsClient } from "./WaCallsClient";

type Speaker = "agent" | "customer";
export type LabeledSegment = {
  start: number;
  end: number;
  speaker: string;
  text: string;
};

// Five-minute mono WAV chunks stay well below Groq's 25 MB free-tier upload
// limit while avoiding bursts against the 20 RPM speech-to-text allowance.
const chunkMs = 5 * 60 * 1000;
let groqQueue = Promise.resolve();
let lastGroqRequestAt = 0;

const withGroqRateLimit = async <T>(task: () => Promise<T>): Promise<T> => {
  const queued = groqQueue.then(async () => {
    const waitMs = Math.max(0, 3100 - (Date.now() - lastGroqRequestAt));
    if (waitMs) await new Promise(resolve => setTimeout(resolve, waitMs));
    lastGroqRequestAt = Date.now();
    return task();
  });
  groqQueue = queued.then(
    () => undefined,
    () => undefined
  );
  return queued;
};

const hasAudiblePCM = (wav: Buffer): boolean => {
  if (wav.length <= 44) return false;
  let sum = 0;
  let count = 0;
  for (let offset = 44; offset + 1 < wav.length; offset += 16) {
    const sample = wav.readInt16LE(offset) / 32768;
    sum += sample * sample;
    count += 1;
  }
  return count > 0 && Math.sqrt(sum / count) > 0.002;
};

export const voiceSpeakerName = (
  speaker: Speaker,
  contact: Contact,
  user: User
): string => {
  if (speaker === "agent") return user?.name || "Atendente";
  const name = String(contact?.name || "").trim();
  return name && !/^\d+(?:@lid)?$/i.test(name) ? name : "Usuário";
};

const timestamp = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(
    safe % 60
  ).padStart(2, "0")}`;
};

export const mergeVoiceTranscript = (
  ...groups: LabeledSegment[][]
): { segments: LabeledSegment[]; transcript: string } => {
  const segments = groups.flat().sort((a, b) => a.start - b.start);
  return {
    segments,
    transcript: segments
      .map(
        segment =>
          `[${timestamp(segment.start)}] ${segment.speaker}: ${segment.text}`
      )
      .join("\n")
  };
};

const providerCredentials = async (
  companyId: number
): Promise<{ provider: string; apiKey: string }> => {
  const environmentProvider = String(
    process.env.VOICE_TRANSCRIPTION_PROVIDER || "groq"
  ).toLowerCase();
  const configuredProvider = await GetCompanySetting(
    companyId,
    "aiProvider",
    ""
  );
  const provider = ["groq", "openai"].includes(environmentProvider)
    ? environmentProvider
    : configuredProvider === "openai"
      ? "openai"
      : "groq";
  const environmentKey =
    provider === "groq" ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY;
  const configuredOpenAIKey =
    provider === "openai"
      ? await GetCompanySetting(companyId, "openAiKey", "")
      : "";
  return {
    provider,
    apiKey: String(environmentKey || configuredOpenAIKey || "")
  };
};

export const assertVoiceTranscriptionConfigured = async (
  companyId: number
): Promise<void> => {
  const { apiKey } = await providerCredentials(companyId);
  if (!apiKey) {
    throw new Error("ERR_VOICE_TRANSCRIPTION_NOT_CONFIGURED");
  }
};

const transcribeTrack = async (
  call: VoiceCall,
  sessionId: string,
  speaker: Speaker,
  label: string,
  provider: string,
  apiKey: string
): Promise<LabeledSegment[]> => {
  const output: LabeledSegment[] = [];
  const totalMs = Math.max(1000, call.durationSeconds * 1000);
  for (let offsetMs = 0; offsetMs < totalMs; offsetMs += chunkMs) {
    const wav = await waCallsClient.getCapture(
      sessionId,
      call.externalCallId,
      speaker,
      offsetMs,
      Math.min(chunkMs, totalMs - offsetMs)
    );
    if (!hasAudiblePCM(wav)) continue;
    const transcribe = () =>
      transcribeDetailed(
        wav,
        { apiKey, provider },
        `${speaker}-${offsetMs}.wav`
      );
    const result =
      provider === "groq"
        ? await withGroqRateLimit(transcribe)
        : await transcribe();
    if (!result) continue;
    result.segments.forEach(segment =>
      output.push({
        start: offsetMs / 1000 + segment.start,
        end: offsetMs / 1000 + segment.end,
        speaker: label,
        text: segment.text
      })
    );
  }
  return output;
};

export const finalizeVoiceArtifacts = async (
  callId: number,
  recoverProcessing = false
): Promise<void> => {
  let call = await VoiceCall.findByPk(callId, {
    include: ["contact", "user", "voiceConnection"]
  });
  if (!call || (!call.recordingEnabled && !call.transcriptionEnabled)) return;
  const claimableStatuses = recoverProcessing
    ? ["capturing", "processing"]
    : ["capturing"];
  const [claimed] = await VoiceCall.update(
    { artifactStatus: "processing", artifactError: null },
    {
      where: {
        id: call.id,
        artifactStatus: { [Op.in]: claimableStatuses }
      }
    }
  );
  if (claimed !== 1) return;
  call = await VoiceCall.findByPk(callId, {
    include: ["contact", "user", "voiceConnection"]
  });
  if (!call) return;
  const sessionId = call.voiceConnection?.sessionId;
  if (!sessionId || !call.ticketId) {
    await call.update({
      artifactStatus: "failed",
      artifactError: "voice_capture_unavailable"
    });
    return;
  }

  try {
    if (call.recordingEnabled) {
      const relativeDir = path.join("voice", String(call.companyId));
      const absoluteDir = path.join(privateFiles.directory, relativeDir);
      await fs.promises.mkdir(absoluteDir, { recursive: true });
      const filename = `${call.id}.wav`;
      const relativePath = path.join(relativeDir, filename);
      const absolutePath = path.join(absoluteDir, filename);
      const temporaryPath = `${absolutePath}.part`;
      try {
        const recording = await waCallsClient.streamCapture(
          sessionId,
          call.externalCallId,
          "mixed"
        );
        await pipeline(
          recording,
          fs.createWriteStream(temporaryPath, { mode: 0o600, flags: "w" })
        );
        await fs.promises.rename(temporaryPath, absolutePath);
      } catch (error) {
        await fs.promises.unlink(temporaryPath).catch(() => undefined);
        throw error;
      }
      await call.update({ recordingUrl: relativePath });
      await CreateMessageService({
        companyId: call.companyId,
        messageData: {
          id: voiceMessageId(call, "recording"),
          ticketId: call.ticketId,
          contactId: call.contactId,
          queueId: call.queueId,
          channel: "voice",
          fromMe: true,
          read: true,
          ack: 2,
          mediaType: "voice_recording",
          body: `Gravação da ligação • ${durationLabel(call.durationSeconds)}`
        }
      });
    }

    if (call.transcriptionEnabled) {
      const { provider, apiKey } = await providerCredentials(call.companyId);
      if (!apiKey) throw new Error("voice_transcription_key_missing");
      const [agentSegments, customerSegments] = await Promise.all([
        transcribeTrack(
          call,
          sessionId,
          "agent",
          voiceSpeakerName("agent", call.contact, call.user),
          provider,
          apiKey
        ),
        transcribeTrack(
          call,
          sessionId,
          "customer",
          voiceSpeakerName("customer", call.contact, call.user),
          provider,
          apiKey
        )
      ]);
      const { segments, transcript } = mergeVoiceTranscript(
        agentSegments,
        customerSegments
      );
      await call.update({
        transcript,
        transcriptSegments: segments,
        transcriptionProvider: provider,
        transcriptionModel: transcriberModel(provider)
      });
      await CreateMessageService({
        companyId: call.companyId,
        messageData: {
          id: voiceMessageId(call, "transcript"),
          ticketId: call.ticketId,
          contactId: call.contactId,
          queueId: call.queueId,
          channel: "voice",
          fromMe: true,
          read: true,
          ack: 2,
          mediaType: "voice_transcript",
          body: transcript
            ? `Transcrição da ligação\n\n${transcript}`
            : "Transcrição da ligação: nenhum áudio com fala foi detectado."
        }
      });
    }
    await call.update({ artifactStatus: "ready", artifactError: null });
  } catch (error) {
    logger.error(
      { voiceCallId: call.id, error: error?.message },
      "Voice call artifact processing failed"
    );
    await call.update({
      artifactStatus: "failed",
      artifactError: String(error?.message || "voice_artifact_failed").slice(
        0,
        1000
      )
    });
  } finally {
    await waCallsClient
      .deleteCapture(sessionId, call.externalCallId)
      .catch(() => undefined);
  }
};

export const recoverPendingVoiceArtifacts = async (): Promise<void> => {
  const pending = await VoiceCall.findAll({
    where: {
      state: { [Op.in]: ["ended", "failed"] },
      ticketId: { [Op.not]: null },
      artifactStatus: { [Op.in]: ["capturing", "processing"] },
      [Op.or]: [{ recordingEnabled: true }, { transcriptionEnabled: true }]
    },
    attributes: ["id"]
  });
  pending.forEach(call => {
    setImmediate(() => {
      finalizeVoiceArtifacts(call.id, true).catch(error =>
        logger.error(
          { voiceCallId: call.id, error: error?.message },
          "Unable to recover pending voice artifacts"
        )
      );
    });
  });
};

export const voiceRecordingPath = async (
  callId: number,
  companyId: number,
  userId: number,
  profile?: string
): Promise<string | null> => {
  const call = await VoiceCall.findOne({ where: { id: callId, companyId } });
  if (!call?.recordingUrl) return null;
  if (profile !== "admin" && call.userId !== userId) {
    const queueIds = call.queueIds || (call.queueId ? [call.queueId] : []);
    if (!queueIds.length) return null;
    const assignment = await UserQueue.findOne({
      where: { userId, queueId: { [Op.in]: queueIds } },
      attributes: ["id"]
    });
    if (!assignment) return null;
  }
  const root = path.resolve(privateFiles.directory);
  const absolute = path.resolve(root, call.recordingUrl);
  if (!absolute.startsWith(`${root}${path.sep}`)) return null;
  return absolute;
};
