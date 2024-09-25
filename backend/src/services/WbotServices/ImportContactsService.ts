import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import Contact from "../../models/Contact";
import { logger } from "../../utils/logger";
import ShowBaileysService from "../BaileysServices/ShowBaileysService";
import CreateContactService from "../ContactServices/CreateContactService";
import AppError from "../../errors/AppError";

const ImportContactsService = async (companyId: number): Promise<void> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(companyId);
  const wbot = getWbot(defaultWhatsapp.id);

  const baileys = await ShowBaileysService(wbot.id);

  let phoneContactsList = null;

  try {
    phoneContactsList = baileys.contacts && JSON.parse(baileys.contacts);
  } catch (error) {
    logger.warn(
      { baileys },
      `Could not get whatsapp contacts from database. Err: ${error}`
    );
    throw new AppError("Could not get whatsapp contacts from database.", 500);
  }

  if (Array.isArray(phoneContactsList)) {
    const processContacts = async contactsList => {
      contactsList.forEach(async ({ id, name, notify }) => {
        if (id === "status@broadcast" || id.includes("g.us")) return;
        const number = id.replace(/\D/g, "");

        const existingContact = await Contact.findOne({
          where: { number, companyId }
        });

        if (existingContact) {
          // Atualiza o nome do contato existente
          existingContact.name = name || notify || number;
          await existingContact.save();
        } else {
          // Criar um novo contato
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
      });
    };

    processContacts(phoneContactsList).then(
      () => {
        logger.debug(
          `Contacts imported successfully from WhatsApp for company ID: ${companyId}`
        );
      },
      error => {
        logger.error(
          `Error importing contacts from WhatsApp for company ID: ${companyId} - ${error.message}`
        );
      }
    );
  }
};

export default ImportContactsService;
