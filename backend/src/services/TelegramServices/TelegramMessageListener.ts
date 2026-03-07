import { logger } from "../../utils/logger";
import Contact from "../../models/Contact";
import Whatsapp from "../../models/Whatsapp";
import Message from "../../models/Message";
import CreateMessageService from "../MessageServices/CreateMessageService";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import axios from "axios";

export async function processTelegramUpdate(
  whatsapp: Whatsapp,
  update: Record<string, unknown>
): Promise<void> {
  try {
    const msg: any = (update as any)?.message || (update as any)?.edited_message;
    if (!msg) return;

    const chat = msg?.chat;
    const chatId = String(chat?.id);
    const messageId = String(msg?.message_id);
    const from = msg?.from;
    const contactName = from?.first_name
      ? `${from.first_name}${from.last_name ? " " + from.last_name : ""}`
      : chatId;

    let bodyText = msg?.text || msg?.caption || "";
    let mediaUrl: string | null = null;
    let mediaType: string | null = null;

    // For media, get the file URL from Telegram and store it
    const fileInfo =
      msg?.photo?.[msg.photo.length - 1] ||
      msg?.document ||
      msg?.audio ||
      msg?.voice ||
      msg?.video ||
      msg?.sticker ||
      null;

    if (fileInfo) {
      try {
        const fileResp = await axios.get(
          `https://api.telegram.org/bot${whatsapp.telegramToken}/getFile?file_id=${fileInfo.file_id}`
        );
        const filePath = fileResp.data?.result?.file_path;
        if (filePath) {
          mediaUrl = `https://api.telegram.org/file/bot${whatsapp.telegramToken}/${filePath}`;
          const ext = filePath.split(".").pop() || "bin";
          const mimeGuess = msg?.document?.mime_type || `application/${ext}`;
          mediaType = mimeGuess.split("/")[0];
          if (!bodyText) bodyText = `📎 ${fileInfo.file_name || filePath.split("/").pop()}`;
        }
      } catch (mediaErr) {
        logger.warn({ mediaErr }, "processTelegramUpdate: could not get media url");
      }
    }

    if (!bodyText && !mediaUrl) return;

    // Find or create contact — channel is determined by session, not contact
    let contact = await Contact.findOne({
      where: { number: chatId, companyId: whatsapp.companyId }
    });
    if (!contact) {
      contact = await Contact.create({
        name: contactName,
        number: chatId,
        email: "",
        companyId: whatsapp.companyId,
        channel: "telegram"
      });
    } else if (contact.name !== contactName) {
      await contact.update({ name: contactName });
    }

    const { ticket } = await FindOrCreateTicketService(
      contact,
      whatsapp.id,
      whatsapp.companyId,
      { incrementUnread: true }
    );

    const msgDbId = `tg-${messageId}-${whatsapp.id}`;
    const existing = await Message.findOne({ where: { id: msgDbId } });
    if (existing) return;

    const messageData = {
      id: msgDbId,
      ticketId: ticket.id,
      contactId: contact.id,
      body: bodyText,
      fromMe: false,
      read: false,
      mediaUrl,
      mediaType,
      ack: 0,
      channel: "telegram"
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
  } catch (err) {
    logger.error({ err }, "processTelegramUpdate: error");
  }
}
