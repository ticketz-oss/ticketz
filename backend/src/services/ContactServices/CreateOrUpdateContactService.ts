import { getIO } from "../../libs/socket";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import GroupQueue from "../../models/GroupQueue";
import {
  contactNameLockOnCreate,
  ContactNameSource,
  protectContactNameUpdate
} from "./ContactNamePolicy";

interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}

interface ContactData {
  name?: string;
  number?: string;
  isGroup?: boolean;
  email?: string;
  profilePicUrl?: string;
  profileHiresPictureUrl?: string;
  companyId?: number;
  extraInfo?: ExtraInfo[];
  channel?: string;
  disableBot?: boolean;
  language?: string;
  groupMode?: "conversation" | "ticket" | null;
  nameLocked?: boolean;
  nameSource?: ContactNameSource;
}

export const emitContact = async (
  contact: Contact,
  action: "create" | "update"
): Promise<void> => {
  const io = getIO();
  let recipients = contact.isGroup
    ? io.to(`company-${contact.companyId}-admin`)
    : io.to(`company-${contact.companyId}-mainchannel`);
  if (contact.isGroup) {
    const groupQueues = await GroupQueue.findAll({
      where: { groupContactId: contact.id },
      attributes: ["queueId"]
    });
    groupQueues.forEach(groupQueue => {
      recipients = recipients.to(`queue-${groupQueue.queueId}-notification`);
    });
  }
  recipients.emit(`company-${contact.companyId}-contact`, { action, contact });
};

export const updateContact = async (
  contact: Contact,
  contactData: ContactData,
  nameSource: ContactNameSource = "external"
) => {
  await contact.update(
    protectContactNameUpdate(contact, contactData, nameSource)
  );

  await emitContact(contact, "update");
  return contact;
};

const CreateOrUpdateContactService = async ({
  name,
  number,
  profilePicUrl,
  profileHiresPictureUrl,
  isGroup,
  email = "",
  companyId,
  extraInfo = [],
  channel = "whatsapp",
  disableBot = false,
  language,
  groupMode = isGroup ? "conversation" : null,
  nameSource = "external"
}: ContactData): Promise<Contact> => {
  let contact: Contact | null;

  try {
    contact = await Contact.create({
      name,
      number,
      profilePicUrl,
      profileHiresPictureUrl,
      email,
      isGroup,
      extraInfo,
      companyId,
      channel,
      disableBot,
      language,
      groupMode,
      nameLocked: contactNameLockOnCreate(nameSource, isGroup)
    });

    await contact.reload({
      include: ["tags", "extraInfo"]
    });

    await emitContact(contact, "create");
  } catch (createError) {
    if (createError.name === "SequelizeUniqueConstraintError") {
      contact = await Contact.findOne({
        where: {
          number,
          companyId
        },
        include: ["tags", "extraInfo"]
      });

      if (contact) {
        await updateContact(
          contact,
          {
            name,
            profilePicUrl,
            profileHiresPictureUrl,
            isGroup,
            groupMode: isGroup
              ? contact.groupMode || groupMode || "conversation"
              : contact.groupMode
          },
          nameSource
        );
      }
    } else {
      console.error("Error creating contact:", createError);
      throw createError;
    }
  }

  return contact;
};

export default CreateOrUpdateContactService;
