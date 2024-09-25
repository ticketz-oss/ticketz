import { Chat, Contact } from "@whiskeysockets/baileys";
import { isArray } from "lodash";
import Baileys from "../../models/Baileys";

interface Request {
  whatsappId: number;
  contacts?: Contact[];
  chats?: Chat[];
}

const createOrUpdateBaileysService = async ({
  whatsappId,
  contacts
}: Request): Promise<Baileys> => {
  const baileysExists = await Baileys.findOne({
    where: { whatsappId }
  });

  if (!contacts) {
    return baileysExists;
  }

  if (baileysExists) {
    const getContacts = [];

    const baileysContacts = baileysExists.contacts
      ? JSON.parse(baileysExists.contacts)
      : [];

    if (isArray(baileysContacts)) {
      getContacts.push(...baileysContacts);
    }

    getContacts.push(...contacts);
    getContacts.sort();
    getContacts.filter((v, i, a) => a.indexOf(v) === i);

    const newBaileys = await baileysExists.update({
      contacts: JSON.stringify(getContacts)
    });

    return newBaileys;
  }

  const baileys = await Baileys.create({
    whatsappId,
    contacts: JSON.stringify(contacts)
  });

  return baileys;
};

export default createOrUpdateBaileysService;
