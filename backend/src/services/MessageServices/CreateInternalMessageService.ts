import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { makeid } from "../WbotServices/wbotMessageListener";
import CreateMessageService, { MessageData } from "./CreateMessageService";

export async function CreateInternalMessageService(
  ticket: Ticket,
  body: string,
  userId: number = null
): Promise<Message> {
  const messageData: MessageData = {
    id: makeid(10),
    body,
    ticketId: ticket.id,
    fromMe: true,
    channel: "internal",
    userId
  };
  return CreateMessageService({ messageData, companyId: ticket.companyId });
}
