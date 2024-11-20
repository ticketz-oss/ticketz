import { getIO } from "../../libs/socket";
import Tag from "../../models/Tag";
import Ticket from "../../models/Ticket";
import TicketTag from "../../models/TicketTag";
import ShowTicketService from "../TicketServices/ShowTicketService";

interface Request {
  tags: Tag[];
  ticketId: number;
}

const SyncTags = async ({
  tags,
  ticketId
}: Request): Promise<Ticket | null> => {
  const ticket = await ShowTicketService(ticketId);

  const tagList = tags.map(t => ({ tagId: t.id, ticketId }));

  const io = getIO();

  await TicketTag.destroy({ where: { ticketId } });
  await TicketTag.bulkCreate(tagList);

  await ticket?.reload();

  io.to(`company-${ticket.companyId}-${ticket.status}`)
    .to(`company-${ticket.companyId}-notification`)
    .to(`queue-${ticket.queueId}-${ticket.status}`)
    .to(`queue-${ticket.queueId}-notification`)
    .to(ticketId.toString())
    .to(`user-${ticket?.userId}`)
    .emit(`company-${ticket.companyId}-ticket`, {
      action: "update",
      ticket
    });

  return ticket;
};

export default SyncTags;
