import TicketNote from "../../models/TicketNote";
import User from "../../models/User";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";

interface Params {
  contactId: number | string;
  companyId: number;
  ticketId?: number | string;
}

const FindNotesByContactIdAndTicketId = async ({
  contactId,
  companyId,
  ticketId
}: Params): Promise<TicketNote[]> => {
  const notes: TicketNote[] = await TicketNote.findAll({
    where: {
      contactId,
      ...(ticketId ? { ticketId } : {})
    },
    include: [
      { model: User, as: "user", attributes: ["id", "name", "email"] },
      { model: Contact, as: "contact", attributes: ["id", "name"] },
      {
        model: Ticket,
        as: "ticket",
        where: { companyId },
        required: true,
        attributes: ["id", "status", "createdAt"]
      }
    ],
    order: [["createdAt", "DESC"]]
  });

  return notes;
};

export default FindNotesByContactIdAndTicketId;
