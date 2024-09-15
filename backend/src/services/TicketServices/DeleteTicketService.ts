import Ticket from "../../models/Ticket";
import AppError from "../../errors/AppError";
import TicketTraking from "../../models/TicketTraking";

const DeleteTicketService = async (id: string): Promise<Ticket> => {
  const ticket = await Ticket.findOne({
    where: { id }
  });

  if (!ticket) {
    throw new AppError("ERR_NO_TICKET_FOUND", 404);
  }

  const tracking = await TicketTraking.findOne({
    where: { ticketId: ticket.id }
  });

  if (tracking) {
    tracking.finishedAt = new Date();
    tracking.save();
  }

  await tracking.save();

  await ticket.destroy();

  return ticket;
};

export default DeleteTicketService;
