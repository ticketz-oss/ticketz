import { join } from "path";
import fs from "fs";
import Ticket from "../../models/Ticket";
import AppError from "../../errors/AppError";
import TicketTraking from "../../models/TicketTraking";
import { logger } from "../../utils/logger";
import { getPublicPath } from "../../helpers/GetPublicPath";

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
    tracking.save().catch(error => {
      logger.error(`Error on save tracking: ${error.message}`);
    });
  }

  const ticketPath = join(
    getPublicPath(),
    "media",
    `${ticket.companyId}/${ticket.contactId}/${ticket.id}`
  );

  await ticket.destroy();

  // recursively remove ticket media folder
  fs.rmSync(ticketPath, { recursive: true, force: true });

  return ticket;
};

export default DeleteTicketService;
