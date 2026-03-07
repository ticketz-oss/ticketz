import { Request, Response } from "express";
import { Op } from "sequelize";
import * as https from "https";
import { cacheLayer } from "../libs/cache";
import { getIO } from "../libs/socket";
import { removeWbot } from "../libs/wbot";
import DeleteBaileysService from "../services/BaileysServices/DeleteBaileysService";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";

import CreateWhatsAppService from "../services/WhatsappService/CreateWhatsAppService";
import DeleteWhatsAppService from "../services/WhatsappService/DeleteWhatsAppService";
import ListWhatsAppsService from "../services/WhatsappService/ListWhatsAppsService";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import UpdateWhatsAppService from "../services/WhatsappService/UpdateWhatsAppService";
import AppError from "../errors/AppError";
import Ticket from "../models/Ticket";
import { sendWhatsappUpdate } from "../services/WhatsappService/SocketSendWhatsappUpdate";
import { logger } from "../utils/logger";

// ─── Telegram auto-webhook helper ─────────────────────────────────────────────
const registerTelegramWebhook = (token: string): void => {
  const backendUrl = process.env.BACKEND_URL || "";
  if (!backendUrl || !token) {
    logger.warn("registerTelegramWebhook: BACKEND_URL not set, skipping");
    return;
  }
  const webhookUrl = `${backendUrl}/webhook/telegram/${token}`;
  const body = JSON.stringify({ url: webhookUrl, drop_pending_updates: true });
  const options = {
    hostname: "api.telegram.org",
    port: 443,
    path: `/bot${token}/setWebhook`,
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }
  };
  const req = https.request(options, res => {
    let data = "";
    res.on("data", chunk => { data += chunk; });
    res.on("end", () => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.ok) {
          logger.info({ webhookUrl }, "Telegram webhook registered successfully");
        } else {
          logger.warn({ webhookUrl, result: parsed }, "Telegram setWebhook returned non-ok");
        }
      } catch (e) { /* ignore */ }
    });
  });
  req.on("error", err => logger.error({ err, webhookUrl }, "Failed to register Telegram webhook"));
  req.write(body);
  req.end();
};

interface WhatsappData {
  name: string;
  queueIds: number[];
  companyId: number;
  greetingMessage?: string;
  complationMessage?: string;
  outOfHoursMessage?: string;
  ratingMessage?: string;
  transferMessage?: string;
  status?: string;
  isDefault?: boolean;
  token?: string;
  channel?: string;
  telegramToken?: string;
  telegramBotName?: string;
  emailSmtpHost?: string;
  emailSmtpPort?: number;
  emailSmtpUser?: string;
  emailSmtpPass?: string;
  emailImapHost?: string;
  emailImapPort?: number;
  emailFrom?: string;
  instagramBusinessAccountId?: string;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;

  if (req.user.profile !== "admin") {
    return res.status(200).json([]);
  }

  const whatsapps = await ListWhatsAppsService({ companyId });

  return res.status(200).json(whatsapps);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const {
    name,
    status,
    isDefault,
    greetingMessage,
    complationMessage,
    outOfHoursMessage,
    ratingMessage,
    transferMessage,
    queueIds,
    token,
    channel,
    telegramToken,
    telegramBotName,
    emailSmtpHost,
    emailSmtpPort,
    emailSmtpUser,
    emailSmtpPass,
    emailImapHost,
    emailImapPort,
    emailFrom,
    instagramBusinessAccountId
  }: WhatsappData = req.body;
  const { companyId } = req.user;

  const { whatsapp, oldDefaultWhatsapp } = await CreateWhatsAppService({
    name,
    status,
    isDefault,
    greetingMessage,
    complationMessage,
    outOfHoursMessage,
    ratingMessage,
    transferMessage,
    queueIds,
    companyId,
    token,
    channel,
    telegramToken,
    telegramBotName,
    emailSmtpHost,
    emailSmtpPort,
    emailSmtpUser,
    emailSmtpPass,
    emailImapHost,
    emailImapPort,
    emailFrom,
    instagramBusinessAccountId
  });

  sendWhatsappUpdate(whatsapp);

  if (oldDefaultWhatsapp) {
    sendWhatsappUpdate(oldDefaultWhatsapp);
  }

  // Only start Baileys session for the WhatsApp (Baileys) channel
  if (!whatsapp.channel || whatsapp.channel === "whatsapp") {
    StartWhatsAppSession(whatsapp, companyId);
  }

  return res.status(200).json(whatsapp);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;
  const { session } = req.query;

  const whatsapp = await ShowWhatsAppService(whatsappId, {
    hideSession: session === "0"
  });

  if (whatsapp && whatsapp.companyId !== companyId) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  if (!whatsapp) {
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  // Auto-register Telegram webhook if this is a Telegram channel
  if (whatsapp.channel === "telegram" && whatsapp.telegramToken) {
    registerTelegramWebhook(whatsapp.telegramToken);
  }

  return res.status(200).json(whatsapp);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;
  const whatsappData = req.body;
  const { companyId } = req.user;
  const { whatsapp, oldDefaultWhatsapp } = await UpdateWhatsAppService({
    whatsappData,
    whatsappId,
    companyId
  });

  sendWhatsappUpdate(whatsapp);

  if (oldDefaultWhatsapp) {
    sendWhatsappUpdate(oldDefaultWhatsapp);
  }

  // Auto-register Telegram webhook on update too
  if (whatsapp.channel === "telegram" && whatsapp.telegramToken) {
    registerTelegramWebhook(whatsapp.telegramToken);
  }

  return res.status(200).json(whatsapp);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;
  const { closeTickets } = req.query;

  const io = getIO();

  const whatsapp = await ShowWhatsAppService(whatsappId);

  if (whatsapp && whatsapp.companyId !== companyId) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  if (!whatsapp) {
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  if (closeTickets === "true") {
    const closedTickets = (
      await Ticket.update(
        { status: "closed" },
        {
          where: {
            whatsappId,
            status: { [Op.or]: ["open", "pending"] }
          },
          returning: true
        }
      )
    )[1];

    closedTickets.forEach(ticket => {
      io.to(`company-${companyId}-mainchannel`).emit(
        `company-${companyId}-ticket`,
        {
          action: "delete",
          ticketId: ticket.id
        }
      );
    });
  } else {
    const openTickets: Ticket[] = await whatsapp.$get("tickets", {
      where: {
        status: { [Op.or]: ["open", "pending"] }
      }
    });

    if (openTickets.length > 0) {
      throw new AppError(
        "Não é possível remover conexão que contém tickets não resolvidos"
      );
    }
  }

  if (!whatsapp.channel || whatsapp.channel === "whatsapp") {
    await DeleteBaileysService(whatsappId);
    await cacheLayer.delFromPattern(`sessions:${whatsappId}:*`);
    removeWbot(+whatsappId);
  } else if (whatsapp.channel === "telegram" && whatsapp.telegramToken) {
    // Stop Telegram webhook
    try {
      const axios = require("axios");
      await axios.default.post(
        `https://api.telegram.org/bot${whatsapp.telegramToken}/deleteWebhook`
      );
    } catch (e) { /* ignore */ }
  } else if (whatsapp.channel === "email") {
    const { stopEmailPolling } = require("../services/EmailServices/EmailMessageListener");
    stopEmailPolling(+whatsappId);
  }

  await DeleteWhatsAppService(whatsappId);

  io.to(`company-${companyId}-admin`).emit(`company-${companyId}-whatsapp`, {
    action: "delete",
    whatsappId: +whatsappId
  });

  return res.status(200).json({ message: "Session disconnected." });
};
