import { join } from "path";
import fs from "fs";
import Ticket from "../../models/Ticket";
import AppError from "../../errors/AppError";
import TicketTraking from "../../models/TicketTraking";
import { logger } from "../../utils/logger";
import { getPublicPath } from "../../helpers/GetPublicPath";
import { S3Storage } from "../../helpers/S3Storage";

const fileStorage = S3Storage.getInstance();

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

  const relativePath = `media/${ticket.companyId}/${ticket.contactId}/${ticket.id}`;

  const ticketPath = join(getPublicPath(), relativePath);

  await ticket.destroy();

  // recursively remove ticket media folder
  (async () => {
    try {
      if (fs.existsSync(ticketPath)) {
        fs.rmSync(ticketPath, { recursive: true });
      }
    } catch (error) {
      logger.error(
        { path: ticketPath, error },
        `Error on remove ticket media folder: ${error.message}`
      );
    }
  })();

  await fileStorage.prepare();
  if (fileStorage.storage) {
    fileStorage.storage.deleteDirectory(relativePath).catch(error => {
      logger.error(
        { path: relativePath, error },
        `S3 Error on delete ticket media folder: ${error.message}`
      );
    });
  }

  return ticket;
};

export default DeleteTicketService;
