import Message from "../../models/Message";
import { logger } from "../../utils/logger";
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
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import CreateTicketService from "../TicketServices/CreateTicketService";
import { getJidOf } from "../WbotServices/getJidOf";

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

  let ticket = await CheckContactOpenTickets(contact.id, whatsapp.id, true);

  if (ticket && ticket.userId !== user.id) {
    throw new AppError("ERR_OTHER_OPEN_TICKET", 400);
  }

  if (!ticket) {
    ticket = await CreateTicketService({
      contactId: contact.id,
      userId: user.id,
      companyId: contact.companyId,
      queueId: queue?.id
    });
  }

  if (!ticket) {
    throw new AppError("ERR_CREATING_TICKET", 500);
  }

  if (whatsapp.channel === "whatsapp") {
    try {
      const wbot = getWbot(whatsapp.id);
      const msg = JSON.parse(message.dataJson);

      const sentMessage = await wbot.sendMessage(getJidOf(contact), {
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
