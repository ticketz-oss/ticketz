import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import Queue from "../../models/Queue";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";

interface Request {
  ticket: Ticket;
  whatsappId?: number;
  queueId?: number | null;
}

interface Response {
  whatsappId: number;
  connectionChanged: boolean;
  conflictingTicketId: number | null;
}

const ResolveTicketTransferService = async ({
  ticket,
  whatsappId,
  queueId
}: Request): Promise<Response> => {
  const targetWhatsappId =
    whatsappId === undefined ? ticket.whatsappId : Number(whatsappId);

  if (!Number.isInteger(targetWhatsappId) || targetWhatsappId <= 0) {
    throw new AppError("ERR_TICKET_INVALID_CONNECTION", 400);
  }

  const connectionChanged = targetWhatsappId !== ticket.whatsappId;
  let conflictingTicketId: number | null = null;

  const targetConnection = await Whatsapp.findOne({
    where: {
      id: targetWhatsappId,
      companyId: ticket.companyId,
      channel: ticket.channel || "whatsapp"
    },
    attributes: ["id", "status", "channel", "companyId"]
  });

  if (!targetConnection) {
    throw new AppError("ERR_TICKET_INVALID_CONNECTION", 400);
  }

  if (connectionChanged) {
    if (ticket.isGroup || ticket.contact?.isGroup) {
      throw new AppError("ERR_TICKET_GROUP_CONNECTION_TRANSFER", 400);
    }

    if (targetConnection.status !== "CONNECTED") {
      throw new AppError("ERR_TICKET_CONNECTION_NOT_CONNECTED", 400);
    }

    if (queueId === undefined || queueId === null) {
      throw new AppError("ERR_TICKET_TRANSFER_QUEUE_REQUIRED", 400);
    }

    const conflictingTicket = await Ticket.findOne({
      where: {
        id: { [Op.ne]: ticket.id },
        contactId: ticket.contactId,
        whatsappId: targetWhatsappId,
        status: { [Op.in]: ["open", "pending"] }
      },
      attributes: ["id"]
    });

    if (conflictingTicket) {
      // A contact can legitimately have pending conversations on more than
      // one connection. The explicit transfer must win: the caller closes
      // this destination ticket before moving the selected conversation so
      // incoming replies keep resolving to a single active ticket.
      conflictingTicketId = conflictingTicket.id;
    }
  }

  if (queueId !== undefined && queueId !== null) {
    const targetQueue = await Queue.findOne({
      where: { id: queueId, companyId: ticket.companyId },
      include: [
        {
          model: Whatsapp,
          as: "whatsapps",
          attributes: ["id"],
          through: { attributes: [] }
        }
      ]
    });

    if (!targetQueue) {
      throw new AppError("ERR_QUEUE_NOT_FOUND", 404);
    }

    if (
      targetQueue.whatsapps?.length > 0 &&
      !targetQueue.whatsapps.some(
        connection => connection.id === targetWhatsappId
      )
    ) {
      throw new AppError("ERR_QUEUE_NOT_AVAILABLE_FOR_CONNECTION", 400);
    }
  }

  return {
    whatsappId: targetWhatsappId,
    connectionChanged,
    conflictingTicketId
  };
};

export default ResolveTicketTransferService;
