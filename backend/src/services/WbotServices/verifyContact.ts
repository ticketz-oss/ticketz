import { Mutex } from "async-mutex";
import { Op } from "sequelize";
import { Session } from "../../libs/wbot";
import normalizePhone from "../../helpers/NormalizePhone";
import Contact from "../../models/Contact";
import CreateOrUpdateContactService, {
  updateContact
} from "../ContactServices/CreateOrUpdateContactService";
import MergeContactsService from "../ContactServices/MergeContactsService";
import WhatsappLidMap from "../../models/WhatsappLidMap";
import GetProfilePicUrl from "./GetProfilePicUrl";

const lidUpdateMutex = new Mutex();
const contactIncludes = ["tags", "extraInfo", "whatsappLidMap"];

interface IMe {
  name: string;
  id: string;
  lid?: string;
  jid?: string;
}

const getUniqueNumbers = (
  numbers: Array<string | null | undefined>
): string[] => [
  ...new Set(numbers.filter((value): value is string => !!value))
];

const getPreferredContact = (
  contacts: Contact[],
  preferredNumbers: string[]
): Contact | null => {
  for (let index = 0; index < preferredNumbers.length; index += 1) {
    const preferredNumber = preferredNumbers[index];
    const preferredContact = contacts.find(
      contact => contact.number === preferredNumber
    );

    if (preferredContact) {
      return preferredContact;
    }
  }

  if (contacts.length === 0) {
    return null;
  }

  return [...contacts].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();

    if (aTime !== bTime) {
      return aTime - bTime;
    }

    return a.id - b.id;
  })[0];
};

const getPhoneCandidates = (number: string): string[] => {
  const normalized = normalizePhone(number);

  return getUniqueNumbers([number, normalized.phone, normalized.wphone]);
};

const mergeContacts = async (
  contacts: Contact[],
  companyId: number,
  preferredWinner?: Contact
): Promise<Contact | null> => {
  if (contacts.length === 0) {
    return null;
  }

  const winner = await MergeContactsService(contacts, {
    companyId,
    preferredWinner
  });

  await winner.reload({ include: contactIncludes });

  return winner;
};

const getContactsByNumbers = async (
  companyId: number,
  numbers: string[]
): Promise<Contact[]> => {
  if (numbers.length === 0) {
    return [];
  }

  return Contact.findAll({
    where: {
      companyId,
      number: {
        [Op.in]: numbers
      }
    },
    include: contactIncludes
  });
};

async function getLid(msgContact: IMe, wbot: Session): Promise<string> {
  const lid: string =
    msgContact.lid || (msgContact.id.includes("@lid") ? msgContact.id : null);

  if (lid) {
    return lid;
  }

  const [ow] = await wbot.onWhatsApp(msgContact.id);
  if (!ow?.exists) {
    throw new Error("ERR_WAPP_CONTACT_NOT_FOUND");
  }

  return (ow.lid as string) || null;
}

export async function verifyContact(
  msgContact: IMe,
  wbot: Session,
  companyId: number
): Promise<Contact> {
  let profilePicUrl: string;
  let profileHiresPictureUrl: string | undefined;
  const noPicture = `${process.env.FRONTEND_URL}/nopicture.png`;

  try {
    profilePicUrl =
      (wbot && (await GetProfilePicUrl(msgContact.id, "preview", wbot))) ||
      noPicture;
  } catch {
    profilePicUrl = noPicture;
  }

  try {
    profileHiresPictureUrl =
      (wbot && (await GetProfilePicUrl(msgContact.id, "image", wbot))) ||
      noPicture;
  } catch {
    profileHiresPictureUrl = null;
  }

  const jidNumber = msgContact.jid && msgContact.jid?.split("@")[0];
  const isLid = !jidNumber && msgContact.id.includes("@lid");
  const isGroup = msgContact.id.includes("@g.us");

  const rawNumber =
    jidNumber || (isLid ? msgContact.id : msgContact.id.split("@")[0]);
  const normalizedPhone = !isLid && !isGroup ? normalizePhone(rawNumber) : null;
  const number = normalizedPhone?.phone || rawNumber;
  const phoneCandidates = normalizedPhone
    ? getPhoneCandidates(rawNumber)
    : [number];

  const contactData = {
    name: msgContact?.name || number || msgContact.id.replace(/\D/g, ""),
    number,
    profilePicUrl,
    profileHiresPictureUrl,
    isGroup: msgContact.id.includes("g.us"),
    companyId
  };

  if (isGroup) {
    return CreateOrUpdateContactService(contactData);
  }

  return lidUpdateMutex.runExclusive(async () => {
    const phoneContacts = isLid
      ? []
      : await getContactsByNumbers(companyId, phoneCandidates);
    const preferredPhoneContact = getPreferredContact(phoneContacts, [
      contactData.number,
      rawNumber,
      ...(normalizedPhone ? [normalizedPhone.wphone] : [])
    ]);
    const foundContact = await mergeContacts(
      phoneContacts,
      companyId,
      preferredPhoneContact
    );

    if (isLid) {
      const partialLid = number.includes("@")
        ? number.substring(0, number.indexOf("@"))
        : null;
      const lidContacts = await getContactsByNumbers(
        companyId,
        getUniqueNumbers([number, partialLid])
      );
      const foundMappedContact = await WhatsappLidMap.findOne({
        where: {
          companyId,
          lid: number
        },
        include: [
          {
            model: Contact,
            as: "contact",
            include: ["tags", "extraInfo", "whatsappLidMap"]
          }
        ]
      });
      const preferredLidContact =
        getPreferredContact(lidContacts, [number, partialLid]) ||
        foundMappedContact?.contact ||
        null;
      const mergedLidContact = await mergeContacts(
        [
          ...lidContacts,
          ...(foundMappedContact?.contact ? [foundMappedContact.contact] : [])
        ],
        companyId,
        preferredLidContact
      );

      if (mergedLidContact) {
        return updateContact(mergedLidContact, {
          profilePicUrl: contactData.profilePicUrl,
          profileHiresPictureUrl: contactData.profileHiresPictureUrl
        });
      }
    } else if (wbot && foundContact) {
      const lid = await getLid(msgContact, wbot);
      const lidCandidates = lid
        ? getUniqueNumbers([
            lid,
            lid.includes("@") ? lid.substring(0, lid.indexOf("@")) : null
          ])
        : [];
      const lidContacts = await getContactsByNumbers(companyId, lidCandidates);
      const mappedContacts = lid
        ? await WhatsappLidMap.findAll({
            where: {
              companyId,
              lid
            },
            include: [
              {
                model: Contact,
                as: "contact",
                include: contactIncludes
              }
            ]
          })
        : [];
      const mergedContact = await mergeContacts(
        [
          foundContact,
          ...lidContacts,
          ...mappedContacts.map(lidMap => lidMap.contact)
        ],
        companyId,
        foundContact
      );
      let currentContact = mergedContact || foundContact;
      let currentLidMap = currentContact.whatsappLidMap;

      if (currentLidMap && lid !== currentLidMap.lid) {
        await WhatsappLidMap.destroy({
          where: { id: currentLidMap.id }
        });
        currentLidMap = null;
      }

      if (!currentLidMap && lid) {
        await WhatsappLidMap.create({
          companyId,
          lid,
          contactId: currentContact.id
        });
        await currentContact.reload({ include: contactIncludes });
      }

      return updateContact(currentContact, {
        number: contactData.number,
        profilePicUrl: contactData.profilePicUrl,
        profileHiresPictureUrl: contactData.profileHiresPictureUrl
      });
    } else {
      const lid = wbot && (await getLid(msgContact, wbot));

      if (lid) {
        const lidCandidates = getUniqueNumbers([
          lid,
          lid.includes("@") ? lid.substring(0, lid.indexOf("@")) : null
        ]);
        const lidContacts = await getContactsByNumbers(
          companyId,
          lidCandidates
        );
        const preferredLidContact = getPreferredContact(lidContacts, [
          contactData.number,
          rawNumber,
          ...lidCandidates
        ]);
        const lidContact = await mergeContacts(
          lidContacts,
          companyId,
          preferredLidContact
        );

        if (lidContact) {
          const existingLidMap = await WhatsappLidMap.findOne({
            where: {
              companyId,
              contactId: lidContact.id,
              lid
            }
          });

          if (!existingLidMap) {
            await WhatsappLidMap.create({
              companyId,
              lid,
              contactId: lidContact.id
            });
          }

          return updateContact(lidContact, {
            number: contactData.number,
            profilePicUrl: contactData.profilePicUrl,
            profileHiresPictureUrl: contactData.profileHiresPictureUrl
          });
        }
      }
    }

    return CreateOrUpdateContactService(contactData);
  });
}
