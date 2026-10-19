import { Op, WhereOptions } from "sequelize";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import { isValidBirthday } from "../ScheduleServices/recurrence";
import ContactCustomField from "../../models/ContactCustomField";
import {
  contactNameLockOnCreate,
  ContactNameSource
} from "./ContactNamePolicy";

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
  nickname?: string;
  birthdayDay?: number | null;
  birthdayMonth?: number | null;
  nameSource?: ContactNameSource;
}

const CreateContactService = async ({
  name,
  number,
  email = "",
  companyId,
  extraInfo = [],
  disableBot = false,
  language,
  nickname = "",
  birthdayDay,
  birthdayMonth,
  nameSource = "manual"
}: Request): Promise<Contact> => {
  const normalizedBirthdayDay = birthdayDay ? Number(birthdayDay) : null;
  const normalizedBirthdayMonth = birthdayMonth ? Number(birthdayMonth) : null;
  if (!isValidBirthday(normalizedBirthdayDay, normalizedBirthdayMonth)) {
    throw new AppError("ERR_INVALID_BIRTHDAY", 400);
  }
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
      language,
      nickname,
      birthdayDay: normalizedBirthdayDay,
      birthdayMonth: normalizedBirthdayMonth,
      nameLocked: contactNameLockOnCreate(nameSource)
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
