import { Contact } from "libzapitu-rf";
import BaileysSessionContact from "../../models/BaileysSessionContact";
import {
  StaleBaileysSessionError,
  withActiveBaileysSession
} from "../WbotServices/BaileysSessionService";

interface Request {
  whatsappId: number;
  sessionId: string;
  isCurrent: () => boolean;
  contacts?: Contact[];
}

const toRows = (sessionId: string, contacts: Contact[]) => {
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
    sessionId,
    contactId: contact.id,
    payload: contact as unknown as Record<string, unknown>
  }));
};

const createOrUpdateBaileysService = async ({
  whatsappId,
  sessionId,
  isCurrent,
  contacts
}: Request): Promise<void> => {
  if (!contacts?.length) {
    return;
  }

  const rows = toRows(sessionId, contacts);

  if (!rows.length) {
    return;
  }

  await withActiveBaileysSession(
    whatsappId,
    sessionId,
    async (_, transaction) => {
      if (!isCurrent()) throw new StaleBaileysSessionError();
      await BaileysSessionContact.bulkCreate(rows, {
        updateOnDuplicate: ["payload", "updatedAt"],
        transaction
      });
    }
  );
};

export default createOrUpdateBaileysService;
