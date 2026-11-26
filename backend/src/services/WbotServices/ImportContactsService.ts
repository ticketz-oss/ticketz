import { getWbot } from "../../libs/wbot";
import Contact from "../../models/Contact";
import { logger } from "../../utils/logger";
import ShowBaileysService from "../BaileysServices/ShowBaileysService";
import CreateContactService from "../ContactServices/CreateContactService";
import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import {
  StaleBaileysSessionError,
  withActiveBaileysSession
} from "./BaileysSessionService";

const ImportContactsService = async (
  companyId: number,
  whatsappId: number
): Promise<void> => {
  const whatsapp = await Whatsapp.findOne({
    where: {
      id: whatsappId,
      companyId,
      channel: "whatsapp",
      status: "CONNECTED"
    }
  });

  if (!whatsapp) {
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  const wbot = getWbot(whatsapp.id);

  const baileysContacts = await ShowBaileysService(wbot.baileysSessionId);

  const phoneContactsList = baileysContacts.map(contact => ({
    id: contact.contactId,
    name: contact.payload?.name as string,
    notify: contact.payload?.notify as string
  }));

  if (Array.isArray(phoneContactsList)) {
    try {
      // eslint-disable-next-line no-restricted-syntax
      for (const { id, name, notify } of phoneContactsList) {
        if (!id || id === "status@broadcast" || id.includes("g.us")) {
          continue;
        }

        const number = id.replace(/\D/g, "");
        try {
          await withActiveBaileysSession(
            whatsappId,
            wbot.baileysSessionId,
            async (_, transaction) => {
              if (!wbot.isCurrent()) throw new StaleBaileysSessionError();
              const existingContact = await Contact.findOne({
                where: { number, companyId },
                transaction
              });
              if (existingContact) {
                existingContact.name = name || notify || number;
                await existingContact.save({ transaction });
              } else {
                await CreateContactService({
                  number,
                  name: name || notify || number,
                  companyId,
                  transaction
                });
              }
            }
          );
        } catch (error) {
          if (error instanceof StaleBaileysSessionError) throw error;
          logger.error(
            { name, number, companyId },
            `Could not save contact. Err: ${error}`
          );
        }
      }

      logger.debug(
        `Contacts imported successfully from WhatsApp for company ID: ${companyId}`
      );
    } catch (error) {
      logger.error(
        `Error importing contacts from WhatsApp for company ID: ${companyId} - ${error.message}`
      );
      throw error;
    }
  }
};

export default ImportContactsService;
