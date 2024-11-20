import Ticket from "../../models/Ticket";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import User from "../../models/User";
import Queue from "../../models/Queue";
import Tag from "../../models/Tag";
import Whatsapp from "../../models/Whatsapp";

const include = [
  {
    model: Contact,
    as: "contact",
    attributes: [
      "id",
      "name",
      "number",
      "email",
      "profilePicUrl",
      "presence",
      "disableBot"
    ],
    include: ["extraInfo"]
  },
  {
    model: User,
    as: "user",
    attributes: ["id", "name"]
  },
  {
    model: Queue,
    as: "queue",
    attributes: ["id", "name", "color"]
  },
  {
    model: Whatsapp,
    as: "whatsapp",
    attributes: ["name", "facebookUserToken", "facebookUserId"]
  },
  {
    model: Tag,
    as: "tags",
    attributes: ["id", "name", "color"]
  }
];

export const reloadTicketService = async ticket => {
  return ticket.reload({
    include
  });
};

const ShowTicketService = async (
  id: string | number,
  companyId: number = null
): Promise<Ticket> => {
  const ticket = await Ticket.findOne({
    where: {
      id
    },
    include
  });

  if (companyId && ticket?.companyId !== companyId) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  if (!ticket) {
    throw new AppError("ERR_NO_TICKET_FOUND", 404);
  }

  return ticket;
};

export default ShowTicketService;
