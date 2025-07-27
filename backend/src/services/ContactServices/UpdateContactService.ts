import AppError from "../../errors/AppError";
import { getIO } from "../../libs/socket";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";

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
  const { email, name, number, extraInfo, disableBot, language } = contactData;

  const contact = await Contact.findOne({
    where: { id: contactId },
    attributes: [
      "id",
      "name",
      "number",
      "email",
      "companyId",
      "profilePicUrl",
      "language"
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

  await contact.update({
    name,
    number,
    email,
    disableBot,
    language
  });

  await contact.reload({
    attributes: ["id", "name", "number", "email", "profilePicUrl", "language"],
    include: ["tags", "extraInfo"]
  });

  return contact;
};

export default UpdateContactService;
