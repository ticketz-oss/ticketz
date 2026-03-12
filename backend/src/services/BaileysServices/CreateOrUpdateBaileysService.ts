import { Contact } from "libzapitu-rf";
import BaileysContact from "../../models/BaileysContact";

interface Request {
  whatsappId: number;
  contacts?: Contact[];
}

const toRows = (whatsappId: number, contacts: Contact[]) => {
  const dedupedByJid = contacts.reduce((acc, contact) => {
    if (
      !contact?.id ||
      contact.id === "status@broadcast" ||
      contact.id.includes("g.us")
    ) {
      return acc;
    }

    acc.set(contact.id, contact);
    return acc;
  }, new Map<string, Contact>());

  return Array.from(dedupedByJid.values()).map(contact => ({
    whatsappId,
    contactId: contact.id,
    payload: contact as unknown as Record<string, unknown>
  }));
};

const createOrUpdateBaileysService = async ({
  whatsappId,
  contacts
}: Request): Promise<void> => {
  if (!contacts?.length) {
    return;
  }

  const rows = toRows(whatsappId, contacts);

  if (!rows.length) {
    return;
  }

  await BaileysContact.bulkCreate(rows, {
    updateOnDuplicate: ["payload", "updatedAt"]
  });
};

export default createOrUpdateBaileysService;
