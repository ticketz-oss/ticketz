import { Op } from "sequelize";
import axios from "axios";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import { getIO } from "../../libs/socket";
import { logger } from "../../utils/logger";
import FindOrCreateTicketServiceMeta from "../TicketServices/FindOrCreateTicketServiceMeta";
import {
  DownloadMetaMedia,
  MarkMetaMessageAsRead
} from "./SendMetaMessage";
import { dispatchWebhook, WEBHOOK_EVENTS } from "../IntegrationServices/WebhookDispatcherService";

import path from "path";
import fs from "fs";

const MEDIA_DIR = path.resolve(__dirname, "..", "..", "..", "public");

/**
 * Find the Whatsapp connection matching the incoming phoneNumberId
 */
async function findConnectionByPhoneNumberId(
  phoneNumberId: string
): Promise<Whatsapp | null> {
  return Whatsapp.findOne({
    where: { phoneNumberId, channel: "meta" }
  });
}

/**
 * Find or create a contact from incoming Meta message
 */
async function findOrCreateContact(
  waContact: { wa_id: string; profile?: { name?: string } },
  companyId: number
): Promise<Contact> {
  const phone = waContact.wa_id.replace(/\D/g, "");
  const name = waContact.profile?.name || phone;

  let contact = await Contact.findOne({
    where: {
      number: { [Op.or]: [phone, phone.replace(/^55(\d{2})9/, "55$1")] },
      companyId
    }
  });

  if (!contact) {
    contact = await Contact.create({
      name,
      number: phone,
      isGroup: false,
      companyId
    });

    logger.info(`Meta: new contact created: ${name} (${phone})`);

    // Dispatch webhook
    try {
      await dispatchWebhook(companyId, WEBHOOK_EVENTS.CONTACT_CREATED, {
        contactId: contact.id,
        name,
        number: phone
      });
    } catch {}
  } else if (name !== phone && contact.name !== name) {
    await contact.update({ name });
  }

  return contact;
}

/**
 * Save media from incoming message to disk
 */
async function saveMediaToDisk(
  mediaId: string,
  token: string,
  originalFilename?: string
): Promise<{ filename: string; mediaType: string }> {
  const { data, mimeType } = await DownloadMetaMedia(mediaId, token);

  // Determine extension
  const extMap: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "audio/ogg": ".ogg",
    "audio/mpeg": ".mp3",
    "audio/ogg; codecs=opus": ".ogg",
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx"
  };

  const ext = extMap[mimeType] || ".bin";
  const filename = `${Date.now()}_meta${ext}`;
  const filepath = path.join(MEDIA_DIR, filename);

  // Ensure directory exists
  if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
  }

  fs.writeFileSync(filepath, new Uint8Array(data));

  // Determine media type
  let mediaType = "document";
  if (mimeType.startsWith("image/")) mediaType = "image";
  else if (mimeType.startsWith("video/")) mediaType = "video";
  else if (mimeType.startsWith("audio/")) mediaType = "audio";

  return { filename, mediaType };
}

/**
 * Process a single incoming message from Meta webhook
 */
async function processIncomingMessage(
  connection: Whatsapp,
  waMessage: any,
  waContact: any
) {
  const io = getIO();
  const companyId = connection.companyId;

  // Find or create contact
  const contact = await findOrCreateContact(waContact, companyId);

  // Find or create ticket
  const ticket = await FindOrCreateTicketServiceMeta(
    contact,
    connection.id,
    1, // unreadMessages
    companyId,
    "meta"
  );

  // Determine message body and media
  const msgType = waMessage.type;
  let body = "";
  let mediaUrl = null;
  let mediaType = "chat";

  switch (msgType) {
    case "text":
      body = waMessage.text?.body || "";
      break;

    case "image":
    case "video":
    case "audio":
    case "document":
    case "sticker":
      try {
        const mediaId = waMessage[msgType]?.id;
        if (mediaId) {
          const saved = await saveMediaToDisk(mediaId, connection.tokenMeta);
          mediaUrl = saved.filename;
          mediaType = saved.mediaType;
        }
        body = waMessage[msgType]?.caption || `[${msgType}]`;
      } catch (err) {
        logger.error(`Meta media download error: ${err.message}`);
        body = `[${msgType} - erro ao baixar]`;
      }
      break;

    case "location":
      body = `📍 Localização: ${waMessage.location?.latitude}, ${waMessage.location?.longitude}`;
      break;

    case "contacts":
      const vcard = waMessage.contacts?.[0];
      body = `👤 Contato: ${vcard?.name?.formatted_name || "Desconhecido"} - ${vcard?.phones?.[0]?.phone || "sem número"}`;
      break;

    case "reaction":
      body = `${waMessage.reaction?.emoji || "👍"}`;
      mediaType = "reaction";
      break;

    case "button":
      body = waMessage.button?.text || "[botão]";
      break;

    case "interactive":
      body =
        waMessage.interactive?.button_reply?.title ||
        waMessage.interactive?.list_reply?.title ||
        "[interativo]";
      break;

    default:
      body = `[${msgType}]`;
  }

  // Check if message already exists (deduplication)
  const existingMsg = await Message.findOne({
    where: { id: waMessage.id }
  });
  if (existingMsg) return;

  // Save message
  const message = await Message.create({
    id: waMessage.id,
    body,
    fromMe: false,
    read: false,
    mediaType,
    mediaUrl,
    ticketId: ticket.id,
    contactId: contact.id,
    companyId,
    dataJson: JSON.stringify(waMessage)
  });

  await ticket.update({
    lastMessage: body,
    unreadMessages: ticket.unreadMessages + 1
  });

  // Emit socket event
  io.to(`company-${companyId}-open`)
    .to(`company-${companyId}-${ticket.id}`)
    .to(`company-${companyId}-pending`)
    .emit(`company-${companyId}-appMessage`, {
      action: "create",
      message,
      ticket,
      contact
    });

  // Mark as read on Meta's side
  try {
    await MarkMetaMessageAsRead(
      connection.phoneNumberId,
      connection.tokenMeta,
      waMessage.id
    );
  } catch {}

  // Dispatch webhook to N8N
  try {
    await dispatchWebhook(companyId, WEBHOOK_EVENTS.MESSAGE_RECEIVED, {
      ticketId: ticket.id,
      messageId: message.id,
      body,
      contactId: contact.id,
      contactName: contact.name,
      contactNumber: contact.number
    });
  } catch {}

  logger.info(
    `Meta message received: ticket=${ticket.id} from=${contact.number} type=${msgType}`
  );
}

/**
 * Process status updates (sent, delivered, read, failed)
 */
async function processStatusUpdate(status: any) {
  const messageId = status.id;
  const statusValue = status.status; // sent, delivered, read, failed

  try {
    const message = await Message.findByPk(messageId);
    if (message) {
      if (statusValue === "read") {
        await message.update({ read: true });
      } else if (statusValue === "failed") {
        const errorMsg = status.errors?.[0]?.message || "Unknown error";
        logger.error(`Meta message failed: msgId=${messageId} error=${errorMsg}`);
        await message.update({
          body: `${message.body} [FALHA: ${errorMsg}]`
        });
      }
    }
  } catch (err) {
    logger.error(`Meta status update error: ${err.message}`);
  }
}

/**
 * Main webhook handler - processes the entire webhook payload
 */
export async function handleMetaWebhook(payload: any): Promise<void> {
  if (payload.object !== "whatsapp_business_account") return;

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== "messages") continue;

      const value = change.value;
      const phoneNumberId = value?.metadata?.phone_number_id;

      if (!phoneNumberId) continue;

      // Find connection
      const connection = await findConnectionByPhoneNumberId(phoneNumberId);
      if (!connection) {
        logger.warn(`Meta webhook: no connection for phoneNumberId=${phoneNumberId}`);
        continue;
      }

      // Process messages
      const contacts = value.contacts || [];
      const messages = value.messages || [];

      for (const msg of messages) {
        const waContact = contacts.find(
          (c: any) => c.wa_id === msg.from
        ) || { wa_id: msg.from };

        try {
          await processIncomingMessage(connection, msg, waContact);
        } catch (err) {
          logger.error(`Meta message processing error: ${err.message}`);
        }
      }

      // Process status updates
      const statuses = value.statuses || [];
      for (const status of statuses) {
        try {
          await processStatusUpdate(status);
        } catch (err) {
          logger.error(`Meta status processing error: ${err.message}`);
        }
      }
    }
  }
}
