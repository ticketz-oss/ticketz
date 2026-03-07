/**
 * SendWaCloudMessage
 *
 * Envia mensagens (texto, imagens, documentos, áudio, vídeo) pelo canal
 * WhatsApp Cloud API (Meta Graph API v19.0), de forma totalmente independente
 * do WhatsApp Baileys.
 *
 * Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api/messages
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
import { logger } from "../../utils/logger";

interface Request {
  body: string;
  ticket: Ticket;
  userId?: number;
  quotedMsg?: Message;
  media?: Express.Multer.File;
}

const GRAPH_API_URL = "https://graph.facebook.com/v19.0";

import saveMediaToFile from "../../helpers/saveMediaFile";

/**
 * Faz upload de uma mídia para a API do Meta e retorna o media_id.
 */
async function uploadMediaToMeta(
  filePath: string,
  mimeType: string,
  token: string,
  phoneNumberId: string
): Promise<string> {
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("file", fs.createReadStream(filePath), {
    contentType: mimeType,
    filename: path.basename(filePath)
  });
  form.append("type", mimeType);

  const resp = await axios.post(
    `${GRAPH_API_URL}/${phoneNumberId}/media`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    }
  );

  const mediaId = resp.data?.id;
  if (!mediaId) {
    throw new Error("Meta media upload returned no ID");
  }
  return mediaId;
}

/**
 * Normaliza o MIME type para os formatos aceitos pela Meta API.
 * Refs: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media
 */
function normalizeMimeType(mimeType: string): string {
  const lower = (mimeType || "").split(";")[0].trim().toLowerCase();
  const map: Record<string, string> = {
    // Áudio — Meta aceita: audio/aac, audio/mp4, audio/mpeg, audio/amr, audio/ogg, audio/opus
    "audio/mp3": "audio/mpeg",
    "audio/x-mp3": "audio/mpeg",
    "audio/x-mpeg": "audio/mpeg",
    "audio/webm": "audio/ogg",   // gravação no browser vem como webm/opus
    "audio/opus": "audio/ogg",
    "audio/wav": "audio/mpeg",
    "audio/x-wav": "audio/mpeg",
    // Video
    "video/webm": "video/mp4",
    "video/quicktime": "video/mp4",
    "video/x-msvideo": "video/mp4",
  };
  return map[lower] || mimeType;
}

/**
 * Determina o tipo de mensagem Cloud API baseado no MIME type.
 */
function getMsgTypeFromMime(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "document";
}

const SendWaCloudMessage = async ({
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

  const { facebookUserToken, facebookPageUserId: phoneNumberId } = whatsapp;

  if (!facebookUserToken || !phoneNumberId) {
    throw new AppError("ERR_WACLOUD_NOT_CONFIGURED");
  }

  const user = userId && (await User.findByPk(userId));
  const formattedBody = formatBody(body, ticket, user || null);

  // Monta o payload base
  let payload: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: ticket.contact.number
  };

  // Contexto de resposta (quote)
  if (quotedMsg) {
    const chatMessage = await Message.findOne({ where: { id: quotedMsg.id } });
    if (chatMessage) {
      payload.context = { message_id: chatMessage.id };
    }
  }

  let mediaType: string | null = null;
  let mediaUrl: string | null = null;

  if (media) {
    // Envio de mídia
    const rawMime = media.mimetype || "application/octet-stream";
    const mimeType = normalizeMimeType(rawMime);
    const waMediaType = getMsgTypeFromMime(mimeType);
    mediaType = waMediaType;

    try {
      const mediaId = await uploadMediaToMeta(
        media.path,
        mimeType,
        facebookUserToken,
        phoneNumberId
      );

      payload.type = waMediaType;
      payload[waMediaType] = {
        id: mediaId,
        caption: (waMediaType === "audio" || waMediaType === "sticker") ? undefined : (formattedBody || undefined),
        filename:
          waMediaType === "document" ? path.basename(media.originalname) : undefined
      };

      // Remove campos undefined
      if (!payload[waMediaType as string]["caption"]) {
        delete (payload[waMediaType as string] as any).caption;
      }
      if (!payload[waMediaType as string]["filename"]) {
        delete (payload[waMediaType as string] as any).filename;
      }

      const mediaData = {
        data: fs.readFileSync(media.path),
        mimetype: mimeType,
        filename: media.originalname
      };
      mediaUrl = await saveMediaToFile(mediaData, { destination: ticket });

    } finally {
      // O arquivo só é deletado do Controller posteriormente quando já não precisa mais.
    }
  } else {
    // Envio de texto
    payload.type = "text";
    payload.text = { preview_url: false, body: formattedBody };
  }

  let responseData: any = {};
  let messageId: string;

  try {
    const response = await axios.post(
      `${GRAPH_API_URL}/${phoneNumberId}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${facebookUserToken}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    responseData = response.data;
    messageId = responseData?.messages?.[0]?.id || `wacloud-${Date.now()}`;
  } catch (err: any) {
    Sentry.captureException(err);
    const apiError = err?.response?.data?.error;
    logger.error(
      { err, apiError, to: ticket.contact.number, phoneNumberId },
      "SendWaCloudMessage: Graph API error"
    );
    throw new AppError(
      `ERR_SENDING_WACLOUD_MSG: ${apiError?.message || err?.message || "unknown"}`,
      err?.response?.status || 500
    );
  }

  // Salva mensagem no banco
  const messageData = {
    id: messageId,
    ticketId: ticket.id,
    contactId: undefined,
    body: formattedBody,
    fromMe: true,
    read: true,
    mediaUrl: mediaUrl || null,
    mediaType: mediaType || null,
    quotedMsgId: quotedMsg?.id || undefined,
    ack: 1,
    channel: "whatsapp_cloud",
    dataJson: JSON.stringify(responseData)
  };

  await CreateMessageService({
    messageData,
    companyId: ticket.companyId
  });

  // Atualiza lastMessage usando model estático (evita problema de tipagem com includes)
  await Ticket.update(
    { lastMessage: formattedBody },
    { where: { id: ticket.id } }
  );
};

export default SendWaCloudMessage;
