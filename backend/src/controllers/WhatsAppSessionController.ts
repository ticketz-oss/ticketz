import { Request, Response } from "express";
import { getWbot } from "../libs/wbot";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import UpdateWhatsAppService from "../services/WhatsappService/UpdateWhatsAppService";
import AppError from "../errors/AppError";
import { validateAndConnectStatelessChannel } from "../helpers/ValidateStatelessChannel";

const STATELESS_CHANNELS = ["telegram", "whatsapp_cloud", "instagram", "email"];

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

  if (whatsapp.channel === "whatsapp") {
    await StartWhatsAppSession(whatsapp, companyId);
    return res.status(200).json({ message: "Starting session." });
  }

  if (STATELESS_CHANNELS.includes(whatsapp.channel)) {
    const connected = await validateAndConnectStatelessChannel(whatsapp);
    return res.status(200).json({
      message: connected ? "Channel connected." : "Channel configuration invalid."
    });
  }

  return res.status(400).json({ message: "Unsupported channel type." });
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
    return res.status(200).json({ message: "Starting session." });
  }

  if (STATELESS_CHANNELS.includes(whatsapp.channel)) {
    const connected = await validateAndConnectStatelessChannel(whatsapp);
    return res.status(200).json({
      message: connected ? "Channel connected." : "Channel configuration invalid."
    });
  }

  return res.status(400).json({ message: "Unsupported channel type." });
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
    try {
      const wbot = getWbot(whatsapp.id);
      wbot.logout();
      wbot.ws.close();
    } catch (err) {
      // Sessão pode já estar encerrada — ignorar
    }
  } else if (STATELESS_CHANNELS.includes(whatsapp.channel)) {
    // Canais stateless: apenas atualiza status para DISCONNECTED via service
    await UpdateWhatsAppService({
      whatsappId,
      companyId,
      whatsappData: { status: "DISCONNECTED" }
    });
    if (whatsapp.channel === "email") {
      const { stopEmailPolling } = require("../services/EmailServices/EmailMessageListener");
      stopEmailPolling(whatsapp.id);
    }
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

export default { store, remove, update, refresh };
