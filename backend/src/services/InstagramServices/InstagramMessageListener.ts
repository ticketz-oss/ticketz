import { logger } from "../../utils/logger";
import Contact from "../../models/Contact";
import Whatsapp from "../../models/Whatsapp";
import CreateMessageService from "../MessageServices/CreateMessageService";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import UpdateTicketService from "../TicketServices/UpdateTicketService";

export async function processInstagramWebhook(
  whatsapp: Whatsapp,
  entry: Record<string, unknown>
): Promise<void> {
  try {
    const messaging: any[] = (entry as any)?.messaging || [];

    for (const event of messaging) {
      const senderId: string = event?.sender?.id;
      if (!senderId) continue;

      // Ignore our own messages echoed back
      if (event.message?.is_echo) continue;

      const msgId: string = event.message?.mid || `ig-${Date.now()}`;
      const bodyText: string = event.message?.text || "[media]";

      // Find or create contact
      let contact = await Contact.findOne({
        where: { number: senderId, companyId: whatsapp.companyId }
      });
      if (!contact) {
        contact = await Contact.create({
          name: `Instagram ${senderId}`,
          number: senderId,
          email: "",
          companyId: whatsapp.companyId,
          channel: "instagram"
        });
      }

      const { ticket } = await FindOrCreateTicketService(
        contact,
        whatsapp.id,
        whatsapp.companyId,
        { incrementUnread: true }
      );

      const MessageModel = require("../../models/Message")
        .default as typeof import("../../models/Message").default;
      const existing = await MessageModel.findOne({ where: { id: msgId } });
      if (existing) continue;

      const messageData = {
        id: msgId,
        ticketId: ticket.id,
        contactId: contact.id,
        body: bodyText,
        fromMe: false,
        read: false,
        mediaUrl: null,
        mediaType: null,
        ack: 0,
        channel: "instagram"
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
  } catch (err) {
    logger.error({ err }, "processInstagramWebhook: error");
  }
}
