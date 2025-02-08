import Message from "../../models/Message";
import { logger } from "../../utils/logger";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import Contact from "../../models/Contact";
import Queue from "../../models/Queue";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import AppError from "../../errors/AppError";
import { getWbot } from "../../libs/wbot";
import {
  verifyMediaMessage,
  verifyMessage
} from "../WbotServices/wbotMessageListener";
import User from "../../models/User";

const ForwardMessageService = async (
  user: User,
  message: Message,
  contact: Contact,
  queue: Queue
): Promise<Message> => {
  const whatsapp =
    message.ticket.whatsapp || (await GetDefaultWhatsApp(contact.companyId));

  if (!whatsapp) {
    throw new AppError("ERR_NO_DEF_WAPP_FOUND", 404);
  }

  if (whatsapp.channel !== "whatsapp") {
    throw new AppError("ERR_INVALID_CHANNEL", 400);
  }

  const { ticket } = await FindOrCreateTicketService(
    contact,
    whatsapp.id,
    0,
    contact.companyId,
    undefined,
    true,
    queue
  );

  if (!ticket) {
    throw new Error("ERR_CREATING_TICKET");
  }

  if (whatsapp.channel === "whatsapp") {
    try {
      const wbot = await getWbot(whatsapp.id);
      const msg = JSON.parse(message.dataJson);
      const number = contact.isGroup
        ? `${contact.number}@g.us`
        : `${contact.number}@s.whatsapp.net`;

      const sentMessage = await wbot.sendMessage(number, {
        forward: msg
      });

      const newMessage = message.mediaUrl
        ? await verifyMediaMessage(
            sentMessage,
            ticket,
            ticket.contact,
            wbot,
            null,
            user.id
          )
        : await verifyMessage(sentMessage, ticket, ticket.contact, user.id);

      return newMessage;
    } catch (err) {
      logger.error(err);
      throw new AppError("ERR_SENDING_WAPP_MSG", 500);
    }
  }
  return null;
};

export default ForwardMessageService;
