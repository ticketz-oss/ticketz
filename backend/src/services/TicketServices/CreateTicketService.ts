import AppError from "../../errors/AppError";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import Ticket from "../../models/Ticket";
import ShowContactService from "../ContactServices/ShowContactService";
import { getIO } from "../../libs/socket";
import Queue from "../../models/Queue";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import Whatsapp from "../../models/Whatsapp";

interface Request {
  contactId: number;
  status: string;
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
    queueWhatsapp = queue?.whatsapps.find(e => e.id === whatsappId);

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

  await CheckContactOpenTickets(contactId, queueId, defaultWhatsapp.id);

  const { isGroup } = await ShowContactService(contactId, companyId);

  const { id } = await Ticket.create({
    contactId,
    isGroup,
    companyId,
    queueId: queue?.id,
    userId,
    whatsappId: defaultWhatsapp.id,
    status: "open"
  });

  const ticket = await Ticket.findByPk(id, {
    include: ["contact", "queue", "whatsapp"]
  });

  if (!ticket) {
    throw new AppError("ERR_CREATING_TICKET");
  }

  const io = getIO();

  io.to(ticket.id.toString()).emit("ticket", {
    action: "update",
    ticket
  });

  return ticket;
};

export default CreateTicketService;
