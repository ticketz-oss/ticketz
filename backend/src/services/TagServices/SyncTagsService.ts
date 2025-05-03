import AppError from "../../errors/AppError";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import Contact from "../../models/Contact";
import ContactTag from "../../models/ContactTag";
import Tag from "../../models/Tag";
import Ticket from "../../models/Ticket";
import TicketTag from "../../models/TicketTag";
import ShowContactService from "../ContactServices/ShowContactService";
import { websocketUpdateContact } from "../ContactServices/UpdateContactService";
import ShowTicketService from "../TicketServices/ShowTicketService";
import { websocketUpdateTicket } from "../TicketServices/UpdateTicketService";

interface Request {
  tags: Tag[];
  ticketId?: number;
  contactId?: number;
  companyId?: number;
}

const SyncTicketTags = async ({
  tags,
  ticketId,
  companyId
}: Request): Promise<Ticket | null> => {
  const ticket = await ShowTicketService(ticketId);
  const tagsMode = await GetCompanySetting(companyId, "tagsMode", "ticket");

  if (["ticket", "both"].includes(tagsMode)) {
    const tagList = tags.map(t => ({ tagId: t.id, ticketId }));
    await TicketTag.destroy({ where: { ticketId } });
    await TicketTag.bulkCreate(tagList);
  } else if (tagsMode === "contact") {
    const tagList = tags.map(t => ({
      tagId: t.id,
      contactId: ticket.contactId
    }));
    await ContactTag.destroy({ where: { contactId: ticket.contactId } });
    await ContactTag.bulkCreate(tagList);
  }

  await ticket.reload();
  websocketUpdateTicket(ticket);

  return ticket;
};

const SyncContactTags = async ({
  tags,
  contactId,
  companyId
}: Request): Promise<Contact | null> => {
  const tagsMode = await GetCompanySetting(companyId, "tagsMode", "ticket");

  if (!["contact", "both"].includes(tagsMode)) {
    throw new AppError("ERR_INVALID_TAGMODE", 400);
  }

  const contact = await ShowContactService(contactId);

  const tagList = tags.map(t => ({ tagId: t.id, contactId }));

  await ContactTag.destroy({ where: { contactId } });
  await ContactTag.bulkCreate(tagList);

  await contact.reload();
  websocketUpdateContact(contact);

  return contact;
};

const SyncTags = async (req: Request): Promise<Ticket | Contact> => {
  if (req.ticketId) {
    return SyncTicketTags(req);
  }

  if (req.contactId) {
    return SyncContactTags(req);
  }

  throw new AppError("ERR_NO_TICKET_OR_CONTACT", 400);
};

export default SyncTags;
