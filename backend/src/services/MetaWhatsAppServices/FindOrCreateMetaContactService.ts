import { Mutex } from "async-mutex";
import { Op } from "sequelize";
import normalizePhone from "../../helpers/NormalizePhone";
import Contact from "../../models/Contact";
import CreateOrUpdateContactService, {
  updateContact
} from "../ContactServices/CreateOrUpdateContactService";
import MergeContactsService from "../ContactServices/MergeContactsService";

interface Request {
  companyId: number;
  name: string;
  number: string;
}

const metaContactMutex = new Mutex();
const contactIncludes = ["tags", "extraInfo", "whatsappLidMap"];

const unique = (values: string[]): string[] => [...new Set(values)];

const FindOrCreateMetaContactService = async ({
  companyId,
  name,
  number
}: Request): Promise<Contact> =>
  metaContactMutex.runExclusive(async () => {
    const normalized = normalizePhone(number);
    const candidates = unique([number, normalized.phone, normalized.wphone]);
    const contacts = await Contact.findAll({
      where: {
        companyId,
        number: { [Op.in]: candidates }
      },
      include: contactIncludes
    });

    const preferredContact =
      contacts.find(contact => contact.number === normalized.phone) ||
      contacts.find(contact => contact.number === number) ||
      contacts.find(contact => contact.number === normalized.wphone) ||
      null;

    const contact = await MergeContactsService(contacts, {
      companyId,
      preferredWinner: preferredContact
    });

    if (contact) {
      return updateContact(
        contact,
        {
          name,
          number: normalized.phone,
          isGroup: false
        },
        "external"
      );
    }

    return CreateOrUpdateContactService({
      name,
      number: normalized.phone,
      companyId,
      channel: "whatsapp",
      isGroup: false,
      nameSource: "external"
    });
  });

export default FindOrCreateMetaContactService;
