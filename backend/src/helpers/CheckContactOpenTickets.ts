import { Op, WhereOptions } from "sequelize";
import AppError from "../errors/AppError";
import Ticket from "../models/Ticket";

const CheckContactOpenTickets = async (
  contactId: number,
  whatsappId?: number,
  returnTicket = false
): Promise<Ticket> => {
  const where: WhereOptions<Ticket> = {
    contactId,
    status: { [Op.or]: ["open", "pending"] }
  };

  if (whatsappId) {
    where.whatsappId = whatsappId;
  }

  const ticket = await Ticket.findOne({
    where
  });

  if (ticket && !returnTicket) {
    throw new AppError("ERR_OTHER_OPEN_TICKET");
  }

  return ticket;
};

export default CheckContactOpenTickets;
