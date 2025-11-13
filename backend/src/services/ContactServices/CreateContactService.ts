import { Op, WhereOptions } from "sequelize";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";

interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  email?: string;
  profilePicUrl?: string;
  companyId: number;
  extraInfo?: ExtraInfo[];
  disableBot?: boolean;
  language?: string;
}

const CreateContactService = async ({
  name,
  number,
  email = "",
  companyId,
  extraInfo = [],
  disableBot = false,
  language
}: Request): Promise<Contact> => {
  const where: WhereOptions = { number, companyId };

  if (number.startsWith("55") && number.length === 13 && number[4] === "9") {
    const brEightDigitsNumber = `${number.slice(0, 4)}${number.slice(5)}`;
    where.number = {
      [Op.or]: [number, brEightDigitsNumber]
    };
  } else if (number.startsWith("55") && number.length === 12) {
    const brNineDigitsNumber = `${number.slice(0, 4)}9${number.slice(4)}`;
    where.number = {
      [Op.or]: [number, brNineDigitsNumber]
    };
  }

  const numberExists = await Contact.findOne({
    where
  });

  if (numberExists) {
    throw new AppError("ERR_DUPLICATED_CONTACT");
  }

  const contact = await Contact.create(
    {
      name,
      number,
      email,
      extraInfo,
      companyId,
      disableBot,
      language
    },
    {
      include: ["extraInfo"]
    }
  );

  await contact.reload({
    include: ["tags", "extraInfo"]
  });

  return contact;
};

export default CreateContactService;
