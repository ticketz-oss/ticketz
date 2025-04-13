import Tag from "../../models/Tag";
import Ticket from "../../models/Ticket";
import TicketTag from "../../models/TicketTag";
import ShowTicketService from "../TicketServices/ShowTicketService";
import { websocketUpdateTicket } from "../TicketServices/UpdateTicketService";

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

  await TicketTag.destroy({ where: { ticketId } });
  await TicketTag.bulkCreate(tagList);

  await ticket.reload();
  websocketUpdateTicket(ticket);

  return ticket;
};

export default SyncTags;
