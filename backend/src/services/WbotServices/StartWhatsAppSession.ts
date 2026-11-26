import {
  cancelReconnect,
  initWASocket,
  invalidateCaptureToken
} from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import { wbotMessageListener } from "./wbotMessageListener";
import wbotMonitor from "./wbotMonitor";
import { logger } from "../../utils/logger";
import AppError from "../../errors/AppError";
import { sendWhatsappUpdate } from "../WhatsappService/SocketSendWhatsappUpdate";
import {
  cleanupRetiredBaileysSessions,
  ensureBaileysSession,
  StaleBaileysSessionError,
  withActiveBaileysSession
} from "./BaileysSessionService";
import { beginWhatsAppSessionStart } from "./SessionStartTracker";

const pendingStarts = new Map<string, Promise<void>>();

export const StartWhatsAppSession = async (
  whatsapp: Whatsapp,
  companyId: number,
  isRefresh = false,
  expectedSessionId?: string
): Promise<void> => {
  const finishTracking = beginWhatsAppSessionStart(whatsapp.id);
  try {
    const session = await ensureBaileysSession(whatsapp.id, expectedSessionId);
    cancelReconnect(session.id);
    const existing = pendingStarts.get(session.id);
    if (existing) {
      await existing;
      return;
    }
    const start = (async () => {
      await cleanupRetiredBaileysSessions(whatsapp.id);
      await withActiveBaileysSession(
        whatsapp.id,
        session.id,
        async (current, transaction) => {
          invalidateCaptureToken(whatsapp.id, session.id);
          await current.update({ status: "OPENING" }, { transaction });
          sendWhatsappUpdate(current);
        }
      );
      const wbot = await initWASocket(whatsapp, null, isRefresh, session.id);
      await withActiveBaileysSession(whatsapp.id, session.id, async () => {
        wbotMessageListener(wbot, companyId);
        wbotMonitor(wbot, whatsapp, companyId);
      });
    })();
    pendingStarts.set(session.id, start);
    try {
      await start;
    } finally {
      pendingStarts.delete(session.id);
    }
  } catch (err) {
    if (!(err instanceof StaleBaileysSessionError) || !expectedSessionId) {
      logger.error(
        { whatsappId: whatsapp.id, errorType: err.name },
        "Failed to start WhatsApp session"
      );
      throw new AppError("ERR_WAPP_SESSION_START_FAILED", 500);
    }
  } finally {
    finishTracking();
  }
};
