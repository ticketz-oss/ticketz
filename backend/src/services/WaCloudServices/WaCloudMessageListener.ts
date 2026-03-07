import { logger } from "../../utils/logger";
import Contact from "../../models/Contact";
import Whatsapp from "../../models/Whatsapp";
import Message from "../../models/Message";
import CreateMessageService from "../MessageServices/CreateMessageService";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import saveMediaToFile from "../../helpers/saveMediaFile";
import Ticket from "../../models/Ticket";

const GRAPH_API_URL = "https://graph.facebook.com/v19.0";

// Map de tipo WaCloud -> extensão de arquivo padrão
const TYPE_EXT_MAP: Record<string, string> = {
  image: ".jpg",
  video: ".mp4",
  audio: ".ogg",
  document: ".bin",
  sticker: ".webp"
};

// Map de tipo WaCloud -> MIME type para o frontend
const TYPE_MIME_MAP: Record<string, string> = {
  image: "image/jpeg",
  video: "video/mp4",
  audio: "audio/ogg",
  document: "application/octet-stream",
  sticker: "image/webp"
};

/**
 * Obtém a URL de download da mídia a partir do media_id da Meta.
 */
async function getMetaMediaInfo(
  mediaId: string,
  token: string
): Promise<{ url: string; mimeType: string } | null> {
  try {
    const resp = await axios.get(`${GRAPH_API_URL}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return {
      url: resp.data?.url || null,
      mimeType: resp.data?.mime_type || null
    };
  } catch {
    return null;
  }
}

/**
 * Baixa a mídia da Meta CDN (URL autenticada) e salva usando saveMediaToFile.
 * Retorna o mediaUrl nativo do sistema (ex: "media/1/1/hash/file.ext").
 */
async function downloadMetaMedia(
  mediaId: string,
  token: string,
  msgType: string,
  mimeTypeFromMeta: string | null,
  filenameFromMeta: string | null,
  ticket: Ticket
): Promise<{ mediaUrl: string; mimeType: string } | null> {
  try {
    const info = await getMetaMediaInfo(mediaId, token);
    if (!info?.url) return null;

    // Determinar extensão baseada no MIME da Meta
    let ext = TYPE_EXT_MAP[msgType] || ".bin";
    const mime = mimeTypeFromMeta || info.mimeType || TYPE_MIME_MAP[msgType] || "application/octet-stream";

    if (filenameFromMeta) {
      const parsedExt = path.extname(filenameFromMeta);
      if (parsedExt) {
        ext = parsedExt;
      }
    } else if (mime) {
      const mimeToExt: Record<string, string> = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "video/mp4": ".mp4",
        "video/3gpp": ".3gp",
        "audio/ogg": ".ogg",
        "audio/mpeg": ".mp3",
        "audio/mp4": ".m4a",
        "audio/aac": ".aac",
        "audio/amr": ".amr",
        "audio/opus": ".ogg",
        "application/pdf": ".pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx"
      };
      ext = mimeToExt[mime.split(";")[0].trim()] || ext;
    }

    let finalName = filenameFromMeta || `${Date.now()}${ext}`;
    // Limpar o nome do arquivo para não ter caracteres inválidos se usar o original do Meta
    finalName = finalName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    
    // Adicionar um timestamp caso o arquivo venha so com o nome
    const filename = `${Date.now()}_${finalName}`;

    // Download em buffer para usar com saveMediaToFile
    const response = await axios.get(info.url, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "arraybuffer"
    });

    const buffer = Buffer.from(response.data);

    const media = {
      data: buffer,
      mimetype: mime,
      filename
    };

    const mediaUrl = await saveMediaToFile(media, { destination: ticket });

    return { mediaUrl, mimeType: mime };
  } catch (err) {
    logger.error({ err }, "WaCloud: downloadMetaMedia failed");
    return null;
  }
}

export async function processWaCloudWebhook(
  whatsapp: Whatsapp,
  entry: Record<string, unknown>
): Promise<void> {
  try {
    const changes: any[] = (entry as any)?.changes || [];
    for (const change of changes) {
      const value = change?.value;
      if (!value) continue;

      const messages: any[] = value?.messages || [];
      const metaContacts: any[] = value?.contacts || [];

      for (const msg of messages) {
        const from: string = msg.from;
        const msgId: string = msg.id;
        const type: string = msg.type;

        // Resolve contact name
        const waContact = metaContacts.find((c: any) => c.wa_id === from);
        const contactName = waContact?.profile?.name || from;

        // Find or create contact — channel is determined by session, not contact
        let contact = await Contact.findOne({
          where: { number: from, companyId: whatsapp.companyId }
        });
        if (!contact) {
          contact = await Contact.create({
            name: contactName,
            number: from,
            email: "",
            companyId: whatsapp.companyId,
            channel: "whatsapp_cloud"
          });
        } else if (contact.name !== contactName && contactName !== from) {
          await contact.update({ name: contactName });
        }

        // Find or create ticket
        const { ticket } = await FindOrCreateTicketService(
          contact,
          whatsapp.id,
          whatsapp.companyId,
          { incrementUnread: true }
        );

        let bodyText = "";
        let mediaUrl: string | null = null;
        let mediaType: string | null = null;

        if (type === "text") {
          bodyText = msg.text?.body || "";
        } else if (["image", "video", "audio", "document", "sticker"].includes(type)) {
          const mediaObj = msg[type];
          const mediaId = mediaObj?.id;
          const mimeTypeFromMeta = mediaObj?.mime_type || null;
          const filenameFromMeta = mediaObj?.filename || null;

          if (mediaId) {
            bodyText = mediaObj?.caption || `📎 [${type}]`;

            // Baixar a mídia e salvar localmente usando o helper
            const downloaded = await downloadMetaMedia(
              mediaId,
              whatsapp.facebookUserToken,
              type,
              mimeTypeFromMeta,
              filenameFromMeta,
              ticket
            );

            if (downloaded) {
              mediaUrl = downloaded.mediaUrl;
              let mt = downloaded.mimeType.split("/")[0];
              if (!["audio", "video", "image"].includes(mt)) {
                mt = "document";
              }
              // Force WaCloud document type as document
              if (type === "document") mt = "document";
              mediaType = mt;
            }
          }
        } else if (type === "location") {
          bodyText = `📍 Lat: ${msg.location?.latitude}, Lng: ${msg.location?.longitude}`;
        } else if (type === "button") {
          bodyText = msg.button?.text || msg.button?.payload || "";
        } else if (type === "interactive") {
          bodyText =
            msg.interactive?.button_reply?.title ||
            msg.interactive?.list_reply?.title ||
            "";
        } else {
          bodyText = `[${type}]`;
        }

        // Check duplicate
        const existing = await Message.findOne({ where: { id: msgId } });
        if (existing) continue;

        const messageData = {
          id: msgId,
          ticketId: ticket.id,
          contactId: contact.id,
          body: bodyText,
          fromMe: false,
          read: false,
          mediaUrl,
          mediaType,
          ack: 0,
          channel: "whatsapp_cloud"
        };

        await CreateMessageService({
          messageData,
          companyId: whatsapp.companyId
        });

        await ticket.update({ lastMessage: bodyText });

        if (ticket.status === "closed") {
          await UpdateTicketService({
            ticketData: { status: "pending" },
            ticketId: ticket.id,
            companyId: whatsapp.companyId
          });
        }
      }
    }
  } catch (err) {
    logger.error({ err }, "processWaCloudWebhook: error");
  }
}
