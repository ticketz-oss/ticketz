import { Request, Response } from "express";
import {
  getWbot,
  removeWbot,
  resolvePasskeyToken,
  createCaptureToken,
  getPasskeyToken,
  invalidateCaptureToken,
  clearQrRetries,
  cancelReconnect
} from "../libs/wbot";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import UpdateWhatsAppService from "../services/WhatsappService/UpdateWhatsAppService";
import ImportWhatsAppSessionService from "../services/WbotServices/ImportWhatsAppSessionService";
import { startBuildCaptureExtension } from "../services/WbotServices/BuildCaptureExtensionService";
import AppError from "../errors/AppError";
import { getIO } from "../libs/socket";
import { logger } from "../utils/logger";
import {
  cleanupRetiredBaileysSessions,
  ensureBaileysSession,
  resetBaileysSession,
  StaleBaileysSessionError,
  withActiveBaileysSession
} from "../services/WbotServices/BaileysSessionService";

const store = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  const whatsapp = await ShowWhatsAppService(whatsappId);

  if (whatsapp && whatsapp.companyId !== companyId) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  if (!whatsapp) {
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  if (whatsapp.channel !== "whatsapp") {
    throw new AppError("ERR_INVALID_CHANNEL", 400);
  }

  await StartWhatsAppSession(whatsapp, companyId);

  return res.status(200).json({ message: "Starting session." });
};

const update = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  const { whatsapp } = await UpdateWhatsAppService({
    whatsappId,
    companyId,
    whatsappData: { session: "" }
  });

  if (whatsapp.channel === "whatsapp") {
    await StartWhatsAppSession(whatsapp, companyId);
  }

  return res.status(200).json({ message: "Starting session." });
};

const remove = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  const whatsapp = await ShowWhatsAppService(whatsappId);

  if (whatsapp && whatsapp.companyId !== companyId) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  if (!whatsapp) {
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  if (whatsapp.channel === "whatsapp") {
    const wbot = getWbot(whatsapp.id);
    const sessionId = wbot.baileysSessionId;
    await wbot.logout();
    try {
      const resetResult = await resetBaileysSession(
        whatsapp.id,
        sessionId,
        wbot.isCurrent
      );
      await withActiveBaileysSession(
        whatsapp.id,
        resetResult.whatsapp.activeBaileysSessionId,
        async current => {
          getIO()
            .to(`company-${current.companyId}-admin`)
            .emit(`company-${current.companyId}-whatsappSession`, {
              action: "update",
              session: current
            });
        }
      );
    } catch (error) {
      if (!(error instanceof StaleBaileysSessionError)) throw error;
    }
    invalidateCaptureToken(whatsapp.id, sessionId);
    clearQrRetries(sessionId);
    cancelReconnect(sessionId);
    await removeWbot(whatsapp.id, false, sessionId, wbot);
    await cleanupRetiredBaileysSessions(whatsapp.id);
  }

  if (whatsapp.channel === "facebook" || whatsapp.channel === "instagram") {
    whatsapp.destroy();
  }

  return res.status(200).json({ message: "Session disconnected." });
};

const refresh = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  const whatsapp = await ShowWhatsAppService(whatsappId);

  if (whatsapp && whatsapp.companyId !== companyId) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  if (!whatsapp) {
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  if (whatsapp.channel === "whatsapp") {
    const wbot = getWbot(whatsapp.id);
    if (!wbot) {
      return res.status(404).json({ message: "Session not found." });
    }
    await wbot.ws.close();
    return res.status(200).json({ message: "Session refreshed." });
  }

  return res.status(400).json({ message: "Session not supported." });
};

const requestCaptureToken = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  const whatsapp = await ShowWhatsAppService(whatsappId);

  if (whatsapp && whatsapp.companyId !== companyId) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  if (!whatsapp) {
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  if (whatsapp.channel !== "whatsapp") {
    throw new AppError("ERR_INVALID_CHANNEL", 400);
  }

  const session = await ensureBaileysSession(whatsapp.id);
  cancelReconnect(session.id);
  let token: string;
  try {
    token = await withActiveBaileysSession(
      whatsapp.id,
      session.id,
      async (current, transaction) => {
        await removeWbot(whatsapp.id, false, session.id);
        const captureToken = createCaptureToken(whatsapp.id, session.id);
        token = captureToken;
        await current.update(
          { status: "passkey_required", qrcode: captureToken, retries: 0 },
          { transaction }
        );
        const io = getIO();
        io.to(`company-${current.companyId}-admin`).emit(
          `company-${current.companyId}-whatsappSession`,
          { action: "update", session: current }
        );
        return captureToken;
      }
    );
  } catch (error) {
    if (getPasskeyToken(whatsapp.id) === token) {
      invalidateCaptureToken(whatsapp.id, session.id);
    }
    throw error;
  }

  return res.status(200).json({ token });
};

const reset = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  const whatsapp = await ShowWhatsAppService(whatsappId);

  if (whatsapp && whatsapp.companyId !== companyId) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  if (!whatsapp) {
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  if (whatsapp.channel !== "whatsapp") {
    throw new AppError("ERR_INVALID_CHANNEL", 400);
  }

  const resetResult = await resetBaileysSession(whatsapp.id);
  if (resetResult.previousSessionId) {
    cancelReconnect(resetResult.previousSessionId);
    invalidateCaptureToken(whatsapp.id, resetResult.previousSessionId);
    clearQrRetries(resetResult.previousSessionId);
    await removeWbot(whatsapp.id, false, resetResult.previousSessionId);
  }
  await cleanupRetiredBaileysSessions(whatsapp.id);

  await withActiveBaileysSession(
    whatsapp.id,
    resetResult.whatsapp.activeBaileysSessionId,
    async current => {
      const io = getIO();
      io.to(`company-${current.companyId}-admin`).emit(
        `company-${current.companyId}-whatsappSession`,
        { action: "update", session: current }
      );
    }
  );

  return res.status(200).json({ message: "Session reset." });
};

const capture = async (req: Request, res: Response): Promise<Response> => {
  const { token } = req.params;
  const captureTarget = resolvePasskeyToken(token);

  if (!captureTarget) {
    return res
      .status(404)
      .json({ message: "Invalid or expired capture token." });
  }

  const whatsapp = await ShowWhatsAppService(
    captureTarget.whatsappId.toString()
  );
  if (!whatsapp) {
    return res.status(404).json({ message: "Session not found." });
  }

  if (whatsapp.channel !== "whatsapp") {
    throw new AppError("ERR_INVALID_CHANNEL", 400);
  }

  const dump = req.body;
  if (!dump || typeof dump !== "object") {
    return res.status(400).json({ message: "Invalid dump payload." });
  }

  try {
    const io = getIO();
    await withActiveBaileysSession(
      whatsapp.id,
      captureTarget.sessionId,
      async (current, transaction) => {
        if (resolvePasskeyToken(token)?.sessionId !== captureTarget.sessionId) {
          throw new AppError("ERR_INVALID_CAPTURE_TOKEN", 404);
        }
        await current.update(
          { status: "IMPORTING", qrcode: "" },
          { transaction }
        );
        io.to(`company-${current.companyId}-admin`).emit(
          `company-${current.companyId}-whatsappSession`,
          { action: "update", session: current }
        );
      }
    );

    await ImportWhatsAppSessionService(
      whatsapp,
      dump,
      captureTarget.sessionId,
      () => resolvePasskeyToken(token)?.sessionId === captureTarget.sessionId
    );

    await withActiveBaileysSession(
      whatsapp.id,
      captureTarget.sessionId,
      async (current, transaction) => {
        if (resolvePasskeyToken(token)?.sessionId !== captureTarget.sessionId) {
          throw new AppError("ERR_INVALID_CAPTURE_TOKEN", 404);
        }
        await current.update({ status: "PENDING" }, { transaction });
        io.to(`company-${current.companyId}-admin`).emit(
          `company-${current.companyId}-whatsappSession`,
          { action: "update", session: current }
        );
        invalidateCaptureToken(whatsapp.id, captureTarget.sessionId);
      }
    );

    // Give the browser extension time to wipe the source WhatsApp Web
    // session before this backend tries to connect with the same credentials.
    setTimeout(async () => {
      try {
        if (getPasskeyToken(whatsapp.id)) return;
        await StartWhatsAppSession(
          whatsapp,
          whatsapp.companyId,
          false,
          captureTarget.sessionId
        );
      } catch (startErr) {
        logger.error(
          { errorType: startErr.name, whatsappId: whatsapp.id },
          "Failed to start imported session"
        );
      }
    }, 5000);

    return res.status(200).json({
      message: "Session dump received and imported."
    });
  } catch (err) {
    logger.error(
      { errorType: err.name, whatsappId: whatsapp.id },
      "Failed to import dump"
    );
    return res.status(500).json({ message: "Failed to process dump." });
  }
};

/**
 * Triggers a background build of the WA Session Capture browser extension.
 *
 * The extension is built from the public zapitu/zapitu-wasession-capture
 * repository, whitelabeled with the configured app name, favicon and frontend
 * URL. The resulting zip is published under /public/capture-extension.zip and
 * the public setting extensionDownloadUrl is updated.
 *
 * Build progress is reported asynchronously via websocket on the
 * company-${companyId}-extensionBuild channel.
 */
const buildCaptureExtension = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const frontendUrl = process.env.FRONTEND_URL || req.headers.origin;

  startBuildCaptureExtension(companyId, frontendUrl);

  return res.status(202).json({ message: "Extension build started." });
};

export default {
  store,
  remove,
  update,
  refresh,
  capture,
  requestCaptureToken,
  buildCaptureExtension,
  reset
};
