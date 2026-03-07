/**
 * SendTelegramMessage
 *
 * Envia mensagens (texto, imagens, documentos, áudio, vídeo) pelo canal
 * Telegram Bot API, de forma totalmente independente do WhatsApp Baileys.
 *
 * Documentação: https://core.telegram.org/bots/api
 */

import axios from "axios";
import fs from "fs";
import path from "path";
import * as Sentry from "@sentry/node";
import FormData from "form-data";
import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import Message from "../../models/Message";
import User from "../../models/User";
import CreateMessageService from "../MessageServices/CreateMessageService";
import formatBody from "../../helpers/Mustache";
import saveMediaToFile from "../../helpers/saveMediaFile";
import { logger } from "../../utils/logger";

interface Request {
  body: string;
  ticket: Ticket;
  userId?: number;
  quotedMsg?: Message;
  media?: Express.Multer.File;
}

/**
 * Determina o endpoint e o campo do form baseado no MIME type.
 */
function getTelegramMediaInfo(mimeType: string, filename: string): { method: string; field: string } {
  if (mimeType.startsWith("image/") && !mimeType.includes("gif")) {
    return { method: "sendPhoto", field: "photo" };
  }
  if (mimeType.startsWith("video/") || mimeType.includes("gif")) {
    return { method: "sendVideo", field: "video" };
  }
  if (mimeType.startsWith("audio/") || mimeType.includes("ogg") || mimeType.includes("mpeg")) {
    // Áudio OGG/Opus (voz) → sendVoice.  Outros áudios → sendAudio
    if (mimeType.includes("ogg") || mimeType.includes("opus")) {
      return { method: "sendVoice", field: "voice" };
    }
    return { method: "sendAudio", field: "audio" };
  }
  return { method: "sendDocument", field: "document" };
}

const SendTelegramMessage = async ({
  body,
  ticket,
  userId,
  quotedMsg,
  media
}: Request): Promise<void> => {
  const { whatsapp } = ticket;

  if (!whatsapp) {
    throw new AppError("ERR_WAPP_NOT_FOUND");
  }

  const { telegramToken } = whatsapp;
  if (!telegramToken) {
    throw new AppError("ERR_TELEGRAM_NOT_CONFIGURED");
  }

  const chatId = ticket.contact.number;
  const user = userId && (await User.findByPk(userId));
  const formattedBody = formatBody(body, ticket, user || null);

  const BASE_URL = `https://api.telegram.org/bot${telegramToken}`;

  // ID de mensagem para resposta (quote)
  let replyToMessageId: number | undefined;
  if (quotedMsg) {
    const chatMessage = await Message.findOne({ where: { id: quotedMsg.id } });
    if (chatMessage?.dataJson) {
      try {
        const parsed = JSON.parse(chatMessage.dataJson);
        replyToMessageId = parsed?.message_id;
      } catch (_) {}
    }
  }

  let result: any = null;
  let mediaType: string | null = null;
  let mediaUrl: string | null = null;
  let sentBody = formattedBody;

  try {
    if (media) {
      const mimeType = media.mimetype || "application/octet-stream";
      const { method, field } = getTelegramMediaInfo(mimeType, media.originalname);
      mediaType = field;

      const form = new FormData();
      form.append("chat_id", chatId);
      form.append(field, fs.createReadStream(media.path), {
        filename: media.originalname || path.basename(media.path),
        contentType: mimeType
      });

      if (formattedBody && field !== "voice") {
        form.append("caption", formattedBody);
      }
      if (replyToMessageId) {
        form.append("reply_to_message_id", String(replyToMessageId));
      }

      const resp = await axios.post(`${BASE_URL}/${method}`, form, {
        headers: form.getHeaders(),
        timeout: 60000
      });

      result = resp.data?.result;
    } else {
      // Envio de texto
      const payload: Record<string, unknown> = {
        chat_id: chatId,
        text: formattedBody,
        parse_mode: "HTML"
      };
      if (replyToMessageId) {
        payload.reply_to_message_id = replyToMessageId;
      }

      const resp = await axios.post(`${BASE_URL}/sendMessage`, payload, {
        timeout: 30000
      });

      result = resp.data?.result;
    }

    if (media) {
      const mediaData = {
        data: fs.readFileSync(media.path),
        mimetype: media.mimetype || "application/octet-stream",
        filename: media.originalname
      };
      mediaUrl = await saveMediaToFile(mediaData, { destination: ticket });
    }

  } catch (err: any) {
    Sentry.captureException(err);
    const tgError = err?.response?.data;
    logger.error(
      { err, tgError, chatId, botName: whatsapp.name },
      "SendTelegramMessage: Telegram API error"
    );
    throw new AppError(
      `ERR_SENDING_TELEGRAM_MSG: ${tgError?.description || err?.message || "unknown"}`,
      err?.response?.status || 500
    );
  } finally {
    // Media is deleted later in MessageController
  }

  const messageId = result?.message_id
    ? `tg-${result.message_id}-${whatsapp.id}`
    : `tg-${Date.now()}-${whatsapp.id}`;

  const messageData = {
    id: messageId,
    ticketId: ticket.id,
    contactId: undefined,
    body: sentBody,
    fromMe: true,
    read: true,
    mediaUrl: mediaUrl,
    mediaType: mediaType || null,
    quotedMsgId: quotedMsg?.id || undefined,
    ack: 1,
    channel: "telegram",
    dataJson: JSON.stringify(result)
  };

  await CreateMessageService({
    messageData,
    companyId: ticket.companyId
  });

  // Atualiza lastMessage usando model estático (evita problema de tipagem com includes)
  await Ticket.update(
    { lastMessage: sentBody },
    { where: { id: ticket.id } }
  );
};

export default SendTelegramMessage;
