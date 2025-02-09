import AppError from "../../errors/AppError";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import Ticket from "../../models/Ticket";
import ShowContactService from "../ContactServices/ShowContactService";
import { getIO } from "../../libs/socket";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";

interface Request {
  contactId: number;
  userId: number;
  companyId: number;
  queueId?: number;
}

const CreateTicketService = async ({
  contactId,
  userId,
  queueId,
  companyId
}: Request): Promise<Ticket> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(companyId);

  await CheckContactOpenTickets(contactId, defaultWhatsapp.id);

  const { isGroup } = await ShowContactService(contactId, companyId);

  const { id } = await Ticket.create({
    contactId,
    companyId,
    queueId,
    whatsappId: defaultWhatsapp.id,
    status: "open",
    isGroup,
    userId
  });

  const ticket = await Ticket.findByPk(id, {
    include: ["contact", "queue", "whatsapp", "user"]
  });

  if (!ticket) {
    throw new AppError("ERR_CREATING_TICKET");
  }

  await FindOrCreateATicketTrakingService({
    ticketId: ticket.id,
    companyId: ticket.companyId,
    whatsappId: ticket.whatsappId,
    userId: ticket.userId
  });

  const io = getIO();

  io.to(ticket.id.toString()).emit("ticket", {
    action: "update",
    ticket
  });

  return ticket;
};

export default CreateTicketService;
