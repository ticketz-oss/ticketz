import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactList from "../../models/ContactList";
import ContactListItem from "../../models/ContactListItem";
import Ticket from "../../models/Ticket";
import { StatusAudienceMode } from "../../models/WhatsappStatusPost";
import { getJidOf } from "../WbotServices/getJidOf";

export type AudienceInput = {
  companyId: number;
  whatsappId: number;
  audienceMode: StatusAudienceMode;
  contactListId?: number | null;
};

type AudienceEntry = { jid: string; name: string };
type AudienceSource = { name: string; number: string };

const PREVIEW_SAMPLE_SIZE = 5;

const maxAudience = (): number => {
  const value = Number(process.env.WHATSAPP_STATUS_MAX_AUDIENCE);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 5000;
};

// Contacts of the company (never groups) that have at least one ticket on
// this connection, i.e. people who actually talked to this WhatsApp number.
const connectionContacts = async ({
  companyId,
  whatsappId
}: AudienceInput): Promise<AudienceSource[]> =>
  Contact.findAll({
    attributes: ["id", "name", "number", "isGroup"],
    where: { companyId, isGroup: false },
    include: [
      {
        model: Ticket,
        attributes: [],
        required: true,
        where: { whatsappId, companyId }
      }
    ],
    order: [["name", "ASC"]]
  });

const contactListItems = async ({
  companyId,
  contactListId
}: AudienceInput): Promise<AudienceSource[]> => {
  const list = contactListId
    ? await ContactList.findOne({ where: { id: contactListId, companyId } })
    : null;
  if (!list) {
    throw new AppError("ERR_STATUS_NOT_FOUND", 404);
  }

  return ContactListItem.findAll({
    attributes: ["id", "name", "number"],
    where: { contactListId, companyId, isWhatsappValid: true },
    order: [["name", "ASC"]]
  });
};

const resolveAudience = async (
  input: AudienceInput
): Promise<AudienceEntry[]> => {
  const sources =
    input.audienceMode === "contact_list"
      ? await contactListItems(input)
      : await connectionContacts(input);

  const seen = new Set<string>();
  const entries: AudienceEntry[] = [];
  sources.forEach(source => {
    let jid: string;
    try {
      // Sources are never groups, so the number alone yields the user JID.
      jid = getJidOf(source.number);
    } catch {
      return;
    }
    if (seen.has(jid)) return;
    seen.add(jid);
    entries.push({ jid, name: source.name });
  });

  if (!entries.length) {
    throw new AppError("ERR_STATUS_AUDIENCE_EMPTY", 400);
  }
  if (entries.length > maxAudience()) {
    throw new AppError("ERR_STATUS_AUDIENCE_TOO_LARGE", 400);
  }

  return entries;
};

export const resolveAudienceJids = async (
  input: AudienceInput
): Promise<string[]> => (await resolveAudience(input)).map(entry => entry.jid);

export const previewAudience = async (
  input: AudienceInput
): Promise<{ count: number; sample: string[] }> => {
  const entries = await resolveAudience(input);
  return {
    count: entries.length,
    sample: entries
      .map(entry => entry.name)
      .filter(Boolean)
      .slice(0, PREVIEW_SAMPLE_SIZE)
  };
};
