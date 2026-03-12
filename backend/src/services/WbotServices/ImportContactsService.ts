import { getWbot } from "../../libs/wbot";
import Contact from "../../models/Contact";
import { logger } from "../../utils/logger";
import ShowBaileysService from "../BaileysServices/ShowBaileysService";
import CreateContactService from "../ContactServices/CreateContactService";
import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";

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

  const baileysContacts = await ShowBaileysService(wbot.id);

  const phoneContactsList = baileysContacts.map(contact => ({
    id: contact.contactId,
    name: contact.payload?.name as string,
    notify: contact.payload?.notify as string
  }));

  if (Array.isArray(phoneContactsList)) {
    try {
      for (const { id, name, notify } of phoneContactsList) {
        if (!id || id === "status@broadcast" || id.includes("g.us")) {
          continue;
        }

        const number = id.replace(/\D/g, "");
        const existingContact = await Contact.findOne({
          where: { number, companyId }
        });

        if (existingContact) {
          existingContact.name = name || notify || number;
          await existingContact.save();
          continue;
        }

        try {
          await CreateContactService({
            number,
            name: name || notify || number,
            companyId
          });
        } catch (error) {
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
    }
  }
};

export default ImportContactsService;
