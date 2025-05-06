import AppError from "../../errors/AppError";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import Ticket from "../../models/Ticket";
import ShowContactService from "../ContactServices/ShowContactService";
import { getIO } from "../../libs/socket";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import Contact from "../../models/Contact";
import Queue from "../../models/Queue";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import Whatsapp from "../../models/Whatsapp";

interface Request {
  contactId: number;
  userId: number;
  companyId: number;
  queueId?: number;
  whatsappId?: number;
}

const CreateTicketService = async ({
  contactId,
  userId,
  queueId,
  whatsappId,
  companyId
}: Request): Promise<Ticket> => {
  const queue = await Queue.findByPk(queueId, {
    include: [
      {
        model: Whatsapp,
        as: "whatsapps"
      }
    ]
  });

  let queueWhatsapp: Whatsapp = null;
  const companyForceQueue =
    (await GetCompanySetting(companyId, "restrictTransferConnection", "")) ===
    "enabled";

  if (whatsappId) {
    queueWhatsapp =
      (await queue?.$get("whatsapp")) ||
      queue?.whatsapps.find(e => e.id === whatsappId);

    if (!queueWhatsapp) {
      const selectedWhatsapp = await Whatsapp.findByPk(whatsappId, {
        include: [
          {
            model: Queue,
            as: "queues"
          }
        ]
      });

      if (companyForceQueue && selectedWhatsapp.queues.length > 0) {
        throw new AppError("ERR_WAPP_NOT_FOUND", 404);
      }

      queueWhatsapp = selectedWhatsapp;
    }
  }

  if (!queueWhatsapp && queue?.whatsapps?.length) {
    queueWhatsapp = queue.whatsapps.find(e => e.status === "CONNECTED");
    if (!queueWhatsapp) {
      if (companyForceQueue) {
        throw new AppError("ERR_WAPP_NOT_FOUND", 404);
      }
    }
  }

  const defaultWhatsapp =
    queueWhatsapp || (await GetDefaultWhatsApp(companyId));

  await CheckContactOpenTickets(contactId, defaultWhatsapp.id);

  const { isGroup } = await ShowContactService(contactId, companyId);

  const ticket = await Ticket.create({
    contactId,
    companyId,
    queueId: queue?.id,
    whatsappId: defaultWhatsapp.id,
    status: "open",
    isGroup,
    userId
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

  await ticket.reload({
    include: [
      {
        model: Contact,
        as: "contact",
        include: ["tags", "extraInfo"]
      },
      "queue",
      "whatsapp",
      "user",
      "tags"
    ]
  });

  const io = getIO();

  io.to(ticket.id.toString()).emit("ticket", {
    action: "update",
    ticket
  });

  return ticket;
};

export default CreateTicketService;
