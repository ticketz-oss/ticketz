import AppError from "../../errors/AppError";
import { getIO } from "../../libs/socket";
import Contact from "../../models/Contact";
import { isValidBirthday } from "../ScheduleServices/recurrence";
import ContactCustomField from "../../models/ContactCustomField";
import { protectContactNameUpdate } from "./ContactNamePolicy";

interface ExtraInfo {
  id?: number;
  name: string;
  value: string;
}
interface ContactData {
  email?: string;
  number?: string;
  name?: string;
  extraInfo?: ExtraInfo[];
  disableBot?: boolean;
  language?: string;
  nickname?: string;
  birthdayDay?: number | null;
  birthdayMonth?: number | null;
}

interface Request {
  contactData: ContactData;
  contactId: string;
  companyId: number;
}

export function websocketUpdateContact(
  contact: Contact,
  moreChannels?: string[]
) {
  const io = getIO();
  let ioStack = io.to(`company-${contact.companyId}-mainchannel`);

  if (moreChannels) {
    moreChannels.forEach(channel => {
      ioStack = ioStack.to(channel);
    });
  }

  ioStack.emit(`company-${contact.companyId}-contact`, {
    action: "update",
    contact
  });
}

const UpdateContactService = async ({
  contactData,
  contactId,
  companyId
}: Request): Promise<Contact> => {
  const {
    email,
    name,
    number,
    extraInfo,
    disableBot,
    language,
    nickname,
    birthdayDay,
    birthdayMonth
  } = contactData;
  const normalizedBirthdayDay = birthdayDay ? Number(birthdayDay) : null;
  const normalizedBirthdayMonth = birthdayMonth ? Number(birthdayMonth) : null;
  if (!isValidBirthday(normalizedBirthdayDay, normalizedBirthdayMonth)) {
    throw new AppError("ERR_INVALID_BIRTHDAY", 400);
  }

  const contact = await Contact.findOne({
    where: { id: contactId },
    attributes: [
      "id",
      "name",
      "nameLocked",
      "isGroup",
      "number",
      "email",
      "companyId",
      "profilePicUrl",
      "language",
      "nickname",
      "birthdayDay",
      "birthdayMonth"
    ],
    include: ["tags", "extraInfo"]
  });

  if (contact?.companyId !== companyId) {
    throw new AppError("Não é possível alterar registros de outra empresa");
  }

  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  if (extraInfo) {
    const ownedIds = new Set(contact.extraInfo.map(field => field.id));
    const providedIds = extraInfo
      .filter(field => field.id)
      .map(field => field.id);
    if (
      new Set(providedIds).size !== providedIds.length ||
      providedIds.some(id => !ownedIds.has(id))
    ) {
      throw new AppError("ERR_INVALID_CONTACT_FIELD", 400);
    }
    await Promise.all(
      extraInfo.map(async (info: any) => {
        await ContactCustomField.upsert({ ...info, contactId: contact.id });
      })
    );

    await Promise.all(
      contact.extraInfo.map(async oldInfo => {
        const stillExists = extraInfo.findIndex(info => info.id === oldInfo.id);

        if (stillExists === -1) {
          await ContactCustomField.destroy({ where: { id: oldInfo.id } });
        }
      })
    );
  }

  try {
    await contact.update(
      protectContactNameUpdate(
        contact,
        {
          name,
          number,
          email,
          disableBot,
          language,
          nickname,
          birthdayDay: normalizedBirthdayDay,
          birthdayMonth: normalizedBirthdayMonth
        },
        "manual"
      )
    );
  } catch (e) {
    if (e.original?.constraint === "number_companyid_unique") {
      throw new AppError("ERR_DUPLICATED_CONTACT");
    }
    throw e;
  }

  await contact.reload({
    attributes: [
      "id",
      "name",
      "nameLocked",
      "number",
      "email",
      "profilePicUrl",
      "language",
      "nickname",
      "birthdayDay",
      "birthdayMonth"
    ],
    include: ["tags", "extraInfo"]
  });

  return contact;
};

export default UpdateContactService;
