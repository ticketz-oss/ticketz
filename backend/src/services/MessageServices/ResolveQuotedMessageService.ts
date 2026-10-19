import AppError from "../../errors/AppError";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";

interface Request {
  quotedMsgId?: string;
  ticket: Ticket;
  companyId: number;
}

const ResolveQuotedMessageService = async ({
  quotedMsgId,
  ticket,
  companyId
}: Request): Promise<Message | undefined> => {
  if (!quotedMsgId) return undefined;

  const quotedMessage = await Message.findOne({
    where: { id: quotedMsgId, companyId },
    include: [
      {
        model: Ticket,
        as: "ticket",
        attributes: [
          "id",
          "companyId",
          "contactId",
          "whatsappId",
          "channel",
          "isGroup"
        ]
      }
    ]
  });

  const quotedTicket = quotedMessage?.ticket as Ticket | undefined;
  const sameConversation = ticket.isGroup
    ? quotedTicket?.id === ticket.id
    : Boolean(
        quotedTicket &&
        !quotedTicket.isGroup &&
        quotedTicket.id <= ticket.id &&
        quotedTicket.contactId === ticket.contactId &&
        quotedTicket.whatsappId === ticket.whatsappId &&
        quotedTicket.channel === ticket.channel
      );

  if (!quotedMessage || !sameConversation) {
    throw new AppError("ERR_QUOTED_MESSAGE_NOT_ALLOWED", 403);
  }

  return quotedMessage;
};

export default ResolveQuotedMessageService;
