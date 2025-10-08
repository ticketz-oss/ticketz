import { Mutex } from "async-mutex";
import { Op } from "sequelize";
import { Session } from "../../libs/wbot";
import Contact from "../../models/Contact";
import CreateOrUpdateContactService, {
  updateContact
} from "../ContactServices/CreateOrUpdateContactService";
import WhatsappLidMap from "../../models/WhatsappLidMap";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import GetProfilePicUrl from "./GetProfilePicUrl";

const lidUpdateMutex = new Mutex();

interface IMe {
  name: string;
  id: string;
  lid?: string;
  jid?: string;
}

async function checkAndDedup(contact: Contact, lid: string): Promise<void> {
  const lidContact = await Contact.findOne({
    where: {
      companyId: contact.companyId,
      number: {
        [Op.or]: [lid, lid.substring(0, lid.indexOf("@"))]
      }
    }
  });

  if (!lidContact) {
    return;
  }

  await Message.update(
    { contactId: contact.id },
    {
      where: {
        contactId: lidContact.id,
        companyId: contact.companyId
      }
    }
  );

  const notClosedTickets = await Ticket.findAll({
    where: {
      contactId: lidContact.id,
      status: {
        [Op.not]: "closed"
      }
    }
  });

  // eslint-disable-next-line no-restricted-syntax
  for (const ticket of notClosedTickets) {
    // eslint-disable-next-line no-await-in-loop
    await UpdateTicketService({
      ticketData: { status: "closed", justClose: true },
      ticketId: ticket.id,
      companyId: ticket.companyId
    });
  }

  await Ticket.update(
    { contactId: contact.id },
    {
      where: {
        contactId: lidContact.id,
        companyId: contact.companyId
      }
    }
  );

  await lidContact.destroy();
}

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
  const noPicture = `${process.env.FRONTEND_URL}/nopicture.png`;

  try {
    profilePicUrl =
      (await GetProfilePicUrl(msgContact.id, "preview", wbot)) || noPicture;
  } catch (error) {
    profilePicUrl = noPicture;
  }

  const jidNumber =
    msgContact.jid && msgContact.jid?.substring(0, msgContact.jid.indexOf("@"));
  const isLid = !jidNumber && msgContact.id.includes("@lid");
  const isGroup = msgContact.id.includes("@g.us");

  const number =
    jidNumber ||
    (isLid
      ? msgContact.id
      : msgContact.id.substring(0, msgContact.id.indexOf("@")));

  const contactData = {
    name: msgContact?.name || msgContact.id.replace(/\D/g, ""),
    number,
    profilePicUrl,
    isGroup: msgContact.id.includes("g.us"),
    companyId
  };

  if (isGroup) {
    return CreateOrUpdateContactService(contactData);
  }

  return lidUpdateMutex.runExclusive(async () => {
    const foundContact = await Contact.findOne({
      where: {
        companyId,
        number
      },
      include: ["tags", "extraInfo", "whatsappLidMap"]
    });

    if (isLid) {
      if (foundContact) {
        return updateContact(foundContact, {
          profilePicUrl: contactData.profilePicUrl
        });
      }

      const foundMappedContact = await WhatsappLidMap.findOne({
        where: {
          companyId,
          lid: number
        },
        include: [
          {
            model: Contact,
            as: "contact",
            include: ["tags", "extraInfo"]
          }
        ]
      });

      if (foundMappedContact) {
        return updateContact(foundMappedContact.contact, {
          profilePicUrl: contactData.profilePicUrl
        });
      }

      const partialLidContact = await Contact.findOne({
        where: {
          companyId,
          number: number.substring(0, number.indexOf("@"))
        },
        include: ["tags", "extraInfo"]
      });

      if (partialLidContact) {
        return updateContact(partialLidContact, {
          number: contactData.number,
          profilePicUrl: contactData.profilePicUrl
        });
      }
    } else if (foundContact) {
      const lid = await getLid(msgContact, wbot);
      let recreateLidMap = false;
      if (
        foundContact.whatsappLidMap &&
        lid !== foundContact.whatsappLidMap.lid
      ) {
        await WhatsappLidMap.destroy({
          where: { id: foundContact.whatsappLidMap.id }
        });
        recreateLidMap = true;
      }
      if (recreateLidMap || !foundContact.whatsappLidMap) {
        if (lid) {
          await checkAndDedup(foundContact, lid);
          await WhatsappLidMap.create({
            companyId,
            lid,
            contactId: foundContact.id
          });
        }
      }
      return updateContact(foundContact, {
        profilePicUrl: contactData.profilePicUrl
      });
    } else {
      const lid = await getLid(msgContact, wbot);

      if (lid) {
        const lidContact = await Contact.findOne({
          where: {
            companyId,
            number: {
              [Op.or]: [lid, lid.substring(0, lid.indexOf("@"))]
            }
          },
          include: ["tags", "extraInfo"]
        });

        if (lidContact) {
          await WhatsappLidMap.create({
            companyId,
            lid,
            contactId: lidContact.id
          });
          return updateContact(lidContact, {
            number: contactData.number,
            profilePicUrl: contactData.profilePicUrl
          });
        }
      }
    }

    return CreateOrUpdateContactService(contactData);
  });
}
