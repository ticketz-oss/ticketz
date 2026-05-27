import { Transaction } from "sequelize";
import sequelize from "../../database";
import CampaignShipping from "../../models/CampaignShipping";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import ContactTag from "../../models/ContactTag";
import Message from "../../models/Message";
import Schedule from "../../models/Schedule";
import Ticket from "../../models/Ticket";
import TicketNote from "../../models/TicketNote";
import WhatsappLidMap from "../../models/WhatsappLidMap";

type MergeContactsCallback = (
  winner: Contact,
  loser: Contact,
  transaction: Transaction
) => Promise<void>;

interface MergeContactsOptions {
  companyId: number;
  preferredWinner?: Contact;
  resolveWinner?: (contacts: Contact[]) => Promise<Contact> | Contact;
  prepareLoser?: (winner: Contact, loser: Contact) => Promise<void>;
  mergeRelatedData?: MergeContactsCallback;
}

const getOldestContact = (contacts: Contact[]): Contact => {
  const sorted = [...contacts].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();

    if (aTime !== bTime) {
      return aTime - bTime;
    }

    return a.id - b.id;
  });

  return sorted[0];
};

const mergeContactTags = async (
  winner: Contact,
  loser: Contact,
  transaction: Transaction
): Promise<void> => {
  const loserTags = await ContactTag.findAll({
    where: { contactId: loser.id },
    transaction
  });

  for (let index = 0; index < loserTags.length; index += 1) {
    const loserTag = loserTags[index];
    const existing = await ContactTag.findOne({
      where: {
        contactId: winner.id,
        tagId: loserTag.tagId
      },
      transaction
    });

    if (!existing) {
      await ContactTag.create(
        {
          contactId: winner.id,
          tagId: loserTag.tagId
        },
        { transaction }
      );
    }
  }

  await ContactTag.destroy({
    where: { contactId: loser.id },
    transaction
  });
};

const moveWhatsappLidMaps = async (
  winner: Contact,
  loser: Contact,
  companyId: number,
  transaction: Transaction
): Promise<void> => {
  const lidMaps = await WhatsappLidMap.findAll({
    where: {
      companyId,
      contactId: loser.id
    },
    transaction
  });

  for (let index = 0; index < lidMaps.length; index += 1) {
    const lidMap = lidMaps[index];
    const existing = await WhatsappLidMap.findOne({
      where: {
        companyId,
        lid: lidMap.lid
      },
      transaction
    });

    if (!existing) {
      await lidMap.update({ contactId: winner.id }, { transaction });
      continue;
    }

    if (existing.contactId !== winner.id) {
      await existing.update({ contactId: winner.id }, { transaction });
    }

    if (existing.id === lidMap.id) {
      continue;
    }

    await lidMap.destroy({ transaction });
  }
};

const mergeContactsInTransaction = async (
  contacts: Contact[],
  {
    companyId,
    preferredWinner,
    resolveWinner,
    mergeRelatedData
  }: Omit<MergeContactsOptions, "prepareLoser">,
  transaction: Transaction
): Promise<Contact> => {
  if (contacts.length === 1) {
    return contacts[0];
  }

  const winner = preferredWinner
    ? contacts.find(contact => contact.id === preferredWinner.id) ||
      preferredWinner
    : resolveWinner
      ? await resolveWinner(contacts)
      : getOldestContact(contacts);

  const losers = contacts.filter(contact => contact.id !== winner.id);

  for (let index = 0; index < losers.length; index += 1) {
    const loser = losers[index];

    await Message.update(
      { contactId: winner.id },
      {
        where: {
          contactId: loser.id,
          companyId
        },
        transaction
      }
    );

    await Ticket.update(
      { contactId: winner.id },
      {
        where: {
          contactId: loser.id,
          companyId
        },
        transaction
      }
    );

    await TicketNote.update(
      { contactId: winner.id },
      {
        where: { contactId: loser.id },
        transaction
      }
    );

    await Schedule.update(
      { contactId: winner.id },
      {
        where: { contactId: loser.id },
        transaction
      }
    );

    await CampaignShipping.update(
      { contactId: winner.id },
      {
        where: { contactId: loser.id },
        transaction
      }
    );

    await ContactCustomField.update(
      { contactId: winner.id },
      {
        where: { contactId: loser.id },
        transaction
      }
    );

    await mergeContactTags(winner, loser, transaction);
    await moveWhatsappLidMaps(winner, loser, companyId, transaction);

    if (mergeRelatedData) {
      await mergeRelatedData(winner, loser, transaction);
    }

    await loser.destroy({ transaction });
  }

  return winner;
};

const MergeContactsService = async (
  contacts: Contact[],
  options: MergeContactsOptions
): Promise<Contact | null> => {
  const uniqueContacts = contacts.filter(
    (contact, index, currentContacts) =>
      contact &&
      currentContacts.findIndex(
        currentContact => currentContact.id === contact.id
      ) === index
  );

  if (uniqueContacts.length === 0) {
    return null;
  }

  if (uniqueContacts.length === 1) {
    return uniqueContacts[0];
  }

  const winner = options.preferredWinner
    ? uniqueContacts.find(
        contact => contact.id === options.preferredWinner.id
      ) || options.preferredWinner
    : options.resolveWinner
      ? await options.resolveWinner(uniqueContacts)
      : getOldestContact(uniqueContacts);

  const losers = uniqueContacts.filter(contact => contact.id !== winner.id);

  if (options.prepareLoser) {
    for (let index = 0; index < losers.length; index += 1) {
      await options.prepareLoser(winner, losers[index]);
    }
  }

  return sequelize.transaction(transaction =>
    mergeContactsInTransaction(
      uniqueContacts,
      {
        ...options,
        preferredWinner: winner
      },
      transaction
    )
  );
};

export default MergeContactsService;
