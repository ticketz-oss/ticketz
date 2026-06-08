import axios from "axios";
import AppError from "../../errors/AppError";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import Contact from "../../models/Contact";
import formatBody from "../../helpers/Mustache";
import User from "../../models/User";
import { getIO } from "../../libs/socket";
import { logger } from "../../utils/logger";

const GRAPH_API_URL = "https://graph.facebook.com/v22.0";

interface SendMetaMessageRequest {
  body: string;
  ticket: Ticket;
  userId?: number;
  quotedMsg?: Message;
}

interface SendMetaMediaRequest {
  media: Express.Multer.File;
  ticket: Ticket;
  caption?: string;
}

interface SendMetaTemplateRequest {
  ticket: Ticket;
  templateName: string;
  languageCode: string;
  components?: any[];
}

/**
 * Get Graph API headers for a connection
 */
function getHeaders(connection: Whatsapp) {
  const token = connection.tokenMeta;
  if (!token) throw new AppError("ERR_META_TOKEN_NOT_FOUND");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

/**
 * Get the recipient phone number in international format (without + or spaces)
 */
function getRecipientPhone(contact: Contact): string {
  let phone = contact.number.replace(/\D/g, "");
  // Remove @s.whatsapp.net if present
  phone = phone.replace(/@.*$/, "");
  return phone;
}

/**
 * Save outgoing message to database
 */
async function saveOutgoingMessage(
  messageId: string,
  body: string,
  ticket: Ticket,
  mediaType?: string,
  mediaUrl?: string
) {
  const io = getIO();

  const message = await Message.create({
    id: messageId,
    body,
    fromMe: true,
    read: true,
    mediaType: mediaType || "chat",
    mediaUrl: mediaUrl || null,
    ticketId: ticket.id,
    contactId: ticket.contactId,
    companyId: ticket.companyId
  });

  await ticket.update({ lastMessage: body });

  io.to(`company-${ticket.companyId}-open`)
    .to(`company-${ticket.companyId}-${ticket.id}`)
    .emit(`company-${ticket.companyId}-appMessage`, {
      action: "create",
      message,
      ticket,
      contact: ticket.contact
    });

  return message;
}

/**
 * Send a text message via Meta WhatsApp Business API
 */
export const SendMetaTextMessage = async ({
  body,
  ticket,
  userId,
  quotedMsg
}: SendMetaMessageRequest): Promise<void> => {
  const connection = await Whatsapp.findByPk(ticket.whatsappId);
  if (!connection) throw new AppError("ERR_WAPP_NOT_FOUND");
  if (!connection.phoneNumberId) throw new AppError("ERR_META_PHONE_NOT_CONFIGURED");

  const contact = await Contact.findByPk(ticket.contactId);
  if (!contact) throw new AppError("ERR_CONTACT_NOT_FOUND");

  const user = userId ? await User.findByPk(userId) : null;
  const formattedBody = formatBody(body, ticket, user);
  const recipientPhone = getRecipientPhone(contact);

  const payload: any = {
    messaging_product: "whatsapp",
    to: recipientPhone,
    type: "text",
    text: { body: formattedBody }
  };

  // Reply to specific message if quoting
  if (quotedMsg?.id) {
    payload.context = { message_id: quotedMsg.id };
  }

  try {
    const response = await axios.post(
      `${GRAPH_API_URL}/${connection.phoneNumberId}/messages`,
      payload,
      { headers: getHeaders(connection) }
    );

    const messageId = response.data?.messages?.[0]?.id || `meta_${Date.now()}`;
    await saveOutgoingMessage(messageId, formattedBody, ticket);

    logger.info(
      `Meta message sent: ticket=${ticket.id} to=${recipientPhone} msgId=${messageId}`
    );
  } catch (err) {
    logger.error(`Meta send error: ${err.response?.data?.error?.message || err.message}`);
    throw new AppError("ERR_SENDING_META_MSG");
  }
};

/**
 * Send media (image, audio, video, document) via Meta API
 */
export const SendMetaMediaMessage = async ({
  media,
  ticket,
  caption
}: SendMetaMediaRequest): Promise<void> => {
  const connection = await Whatsapp.findByPk(ticket.whatsappId);
  if (!connection) throw new AppError("ERR_WAPP_NOT_FOUND");
  if (!connection.phoneNumberId) throw new AppError("ERR_META_PHONE_NOT_CONFIGURED");

  const contact = await Contact.findByPk(ticket.contactId);
  if (!contact) throw new AppError("ERR_CONTACT_NOT_FOUND");

  const recipientPhone = getRecipientPhone(contact);
  const headers = getHeaders(connection);

  // Step 1: Upload media to Meta
  const FormData = require("form-data");
  const fs = require("fs");
  const formData = new FormData();
  formData.append("file", fs.createReadStream(media.path));
  formData.append("messaging_product", "whatsapp");
  formData.append("type", media.mimetype);

  let mediaId: string;
  try {
    const uploadRes = await axios.post(
      `${GRAPH_API_URL}/${connection.phoneNumberId}/media`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${connection.tokenMeta}`,
          ...formData.getHeaders()
        }
      }
    );
    mediaId = uploadRes.data.id;
  } catch (err) {
    logger.error(`Meta media upload error: ${err.response?.data?.error?.message || err.message}`);
    throw new AppError("ERR_META_MEDIA_UPLOAD");
  }

  // Step 2: Determine media type
  let metaType = "document";
  const mime = media.mimetype;
  if (mime.startsWith("image/")) metaType = "image";
  else if (mime.startsWith("video/")) metaType = "video";
  else if (mime.startsWith("audio/") || mime === "audio/ogg; codecs=opus") metaType = "audio";

  // Step 3: Send the media message
  const mediaPayload: any = {
    messaging_product: "whatsapp",
    to: recipientPhone,
    type: metaType,
    [metaType]: { id: mediaId }
  };

  // Add caption for image, video, document (not audio)
  if (caption && metaType !== "audio") {
    mediaPayload[metaType].caption = caption;
  }

  // Add filename for documents
  if (metaType === "document") {
    mediaPayload[metaType].filename = media.originalname;
  }

  try {
    const response = await axios.post(
      `${GRAPH_API_URL}/${connection.phoneNumberId}/messages`,
      mediaPayload,
      { headers }
    );

    const messageId = response.data?.messages?.[0]?.id || `meta_media_${Date.now()}`;
    await saveOutgoingMessage(
      messageId,
      caption || media.originalname,
      ticket,
      metaType,
      media.filename
    );

    logger.info(
      `Meta media sent: ticket=${ticket.id} type=${metaType} mediaId=${mediaId}`
    );
  } catch (err) {
    logger.error(`Meta media send error: ${err.response?.data?.error?.message || err.message}`);
    throw new AppError("ERR_SENDING_META_MEDIA");
  }
};

/**
 * Send a template message (HSM) via Meta API
 * Required for messages outside the 24h window and campaigns
 */
export const SendMetaTemplateMessage = async ({
  ticket,
  templateName,
  languageCode,
  components
}: SendMetaTemplateRequest): Promise<void> => {
  const connection = await Whatsapp.findByPk(ticket.whatsappId);
  if (!connection) throw new AppError("ERR_WAPP_NOT_FOUND");

  const contact = await Contact.findByPk(ticket.contactId);
  if (!contact) throw new AppError("ERR_CONTACT_NOT_FOUND");

  const recipientPhone = getRecipientPhone(contact);

  const payload: any = {
    messaging_product: "whatsapp",
    to: recipientPhone,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode || "pt_BR" }
    }
  };

  if (components?.length) {
    payload.template.components = components;
  }

  try {
    const response = await axios.post(
      `${GRAPH_API_URL}/${connection.phoneNumberId}/messages`,
      payload,
      { headers: getHeaders(connection) }
    );

    const messageId = response.data?.messages?.[0]?.id || `meta_tpl_${Date.now()}`;
    await saveOutgoingMessage(
      messageId,
      `[Template: ${templateName}]`,
      ticket
    );

    logger.info(
      `Meta template sent: ticket=${ticket.id} template=${templateName}`
    );
  } catch (err) {
    logger.error(`Meta template error: ${err.response?.data?.error?.message || err.message}`);
    throw new AppError("ERR_SENDING_META_TEMPLATE");
  }
};

/**
 * Download media from Meta API (for incoming messages)
 */
export const DownloadMetaMedia = async (
  mediaId: string,
  token: string
): Promise<{ data: Buffer; mimeType: string }> => {
  // Step 1: Get media URL
  const metaRes = await axios.get(`${GRAPH_API_URL}/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const mediaUrl = metaRes.data.url;
  const mimeType = metaRes.data.mime_type;

  // Step 2: Download binary
  const fileRes = await axios.get(mediaUrl, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: "arraybuffer"
  });

  return { data: Buffer.from(fileRes.data), mimeType };
};

/**
 * Mark message as read via Meta API
 */
export const MarkMetaMessageAsRead = async (
  phoneNumberId: string,
  token: string,
  messageId: string
): Promise<void> => {
  try {
    await axios.post(
      `${GRAPH_API_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId
      },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
  } catch (err) {
    logger.warn(`Meta read receipt failed: ${err.message}`);
  }
};
