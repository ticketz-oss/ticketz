import { getIO } from "../../libs/socket";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";

interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  isGroup: boolean;
  email?: string;
  profilePicUrl?: string;
  companyId: number;
  extraInfo?: ExtraInfo[];
  channel?: string;
  disableBot?: boolean;
}

const CreateOrUpdateContactService = async ({
  name,
  number,
  profilePicUrl,
  isGroup,
  email = "",
  companyId,
  extraInfo = [],
  channel = "whatsapp",
  disableBot = false
}: Request): Promise<Contact> => {
  const io = getIO();
  let contact: Contact | null;

  try {
    contact = await Contact.create({
      name,
      number,
      profilePicUrl,
      email,
      isGroup,
      extraInfo,
      companyId,
      channel,
      disableBot
    });

    await contact.reload({
      include: ["tags", "extraInfo"]
    });

    io.to(`company-${companyId}-mainchannel`).emit(
      `company-${companyId}-contact`,
      {
        action: "create",
        contact
      }
    );
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
        contact.update({ profilePicUrl });

        io.to(`company-${companyId}-mainchannel`).emit(
          `company-${companyId}-contact`,
          {
            action: "update",
            contact
          }
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
