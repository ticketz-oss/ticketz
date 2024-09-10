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
}

const CreateTicketService = async ({
  contactId,
  status,
  userId,
  queueId,
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
  if (queue.whatsapps.length) {
    queueWhatsapp = queue.whatsapps.find(e => e.status === "CONNECTED");
    if (!queueWhatsapp) {
      const companyForceQueue =
        (await GetCompanySetting(
          companyId,
          "restrictTransferConnection",
          ""
        )) === "enabled";
      if (companyForceQueue) {
        throw new AppError("ERR_WAPP_NOT_FOUND", 404);
      }
    }
  }

  const defaultWhatsapp =
    queueWhatsapp || (await GetDefaultWhatsApp(companyId));

  await CheckContactOpenTickets(contactId, queueId);

  const { isGroup } = await ShowContactService(contactId, companyId);

  const [{ id }] = await Ticket.findOrCreate({
    where: {
      contactId,
      companyId
    },
    defaults: {
      contactId,
      companyId,
      whatsappId: defaultWhatsapp.id,
      status,
      isGroup,
      userId
    }
  });

  await Ticket.update(
    {
      companyId,
      queueId,
      userId,
      whatsappId: defaultWhatsapp.id,
      status: "open"
    },
    { where: { id } }
  );

  const ticket = await Ticket.findByPk(id, { include: ["contact", "queue"] });

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
