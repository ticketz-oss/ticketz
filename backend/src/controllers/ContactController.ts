import * as Yup from "yup";
import { Request, Response } from "express";
import { parse as csvParser, stringify } from "csv";
import fs from "fs";
import { getIO } from "../libs/socket";

import ListContactsService from "../services/ContactServices/ListContactsService";
import CreateContactService from "../services/ContactServices/CreateContactService";
import ShowContactService from "../services/ContactServices/ShowContactService";
import UpdateContactService from "../services/ContactServices/UpdateContactService";
import DeleteContactService from "../services/ContactServices/DeleteContactService";
import GetContactService from "../services/ContactServices/GetContactService";

import CheckContactNumber from "../services/WbotServices/CheckNumber";
import AppError from "../errors/AppError";
import SimpleListService, {
  SearchContactParams
} from "../services/ContactServices/SimpleListService";
import ContactCustomField from "../models/ContactCustomField";

import { logger } from "../utils/logger";
import Contact from "../models/Contact";
import { GetCompanySetting } from "../helpers/CheckSettings";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

type IndexGetContactQuery = {
  name: string;
  number: string;
};

interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}
interface ContactData {
  name: string;
  number: string;
  email?: string;
  isGroup?: boolean;
  extraInfo?: ExtraInfo[];
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { companyId } = req.user;

  const { contacts, count, hasMore } = await ListContactsService({
    searchParam,
    pageNumber,
    companyId
  });

  return res.json({ contacts, count, hasMore });
};

export const getContact = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { name, number } = req.body as IndexGetContactQuery;
  const { companyId } = req.user;

  const contact = await GetContactService({
    name,
    number,
    companyId
  });

  return res.status(200).json(contact);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const newContact: ContactData = req.body;
  newContact.number = newContact.number.replace("-", "").replace(" ", "");

  const schema = Yup.object().shape({
    name: Yup.string().required(),
    number: Yup.string()
      .required()
      .matches(/^\d+$/, "Invalid number format. Only numbers is allowed.")
  });

  try {
    await schema.validate(newContact);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  if (!newContact.isGroup) {
    const validNumber = await CheckContactNumber(newContact.number, companyId);
    const number = validNumber.jid.replace(/\D/g, "");
    newContact.number = number;
  }

  /**
   * Código desabilitado por demora no retorno
   */
  // const profilePicUrl = await GetProfilePicUrl(validNumber.jid, companyId);

  const contact = await CreateContactService({
    ...newContact,
    // profilePicUrl,
    companyId
  });

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit(
    `company-${companyId}-contact`,
    {
      action: "create",
      contact
    }
  );

  return res.status(200).json(contact);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { contactId } = req.params;
  const { companyId } = req.user;

  const contact = await ShowContactService(contactId, companyId);

  return res.status(200).json(contact);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const contactData: ContactData = req.body;
  const { companyId } = req.user;

  const schema = Yup.object().shape({
    name: Yup.string(),
    number: Yup.string().matches(/^\d+(@lid)?$/, "ERR_CHECK_NUMBER")
  });

  try {
    await schema.validate(contactData);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  if (!contactData.isGroup && contactData.number.match(/^\d+$/)) {
    const validNumber = await CheckContactNumber(contactData.number, companyId);
    const number = validNumber.jid.replace(/\D/g, "");
    contactData.number = number;
  }

  const { contactId } = req.params;

  const contact = await UpdateContactService({
    contactData,
    contactId,
    companyId
  });

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit(
    `company-${companyId}-contact`,
    {
      action: "update",
      contact
    }
  );

  return res.status(200).json(contact);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { contactId } = req.params;
  const { companyId } = req.user;

  await ShowContactService(contactId, companyId);

  await DeleteContactService(contactId);

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit(
    `company-${companyId}-contact`,
    {
      action: "delete",
      contactId
    }
  );

  return res.status(200).json({ message: "Contact deleted" });
};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const { name } = req.query as unknown as SearchContactParams;
  const { companyId } = req.user;

  const contacts = await SimpleListService({ name, companyId });

  return res.json(contacts);
};

export const storeTag = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { contactId } = req.params;
  const { tagId } = req.body;
  const { companyId } = req.user;

  const tagsMode = await GetCompanySetting(companyId, "tagsMode", "ticket");

  if (!["contact", "both"].includes(tagsMode)) {
    throw new AppError("ERR_INVALID_TAGMODE", 400);
  }

  const contact = await ShowContactService(contactId, companyId);

  await contact.$add("tags", tagId);

  return res.status(200).json({ message: "Tag added to contact" });
};

export const removeTag = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { contactId, tagId } = req.params;
  const { companyId } = req.user;

  const tagsMode = await GetCompanySetting(companyId, "tagsMode", "ticket");

  if (!["contact", "both"].includes(tagsMode)) {
    throw new AppError("ERR_INVALID_TAGMODE", 400);
  }

  const contact = await ShowContactService(contactId, companyId);

  await contact.$remove("tags", tagId);

  return res.status(200).json({ message: "Tag removed from contact" });
};

export const importCsv = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const { file } = req;

  if (!file) {
    throw new AppError("ERR_NO_FILE", 400);
  }

  const parser = csvParser(
    { delimiter: ",", columns: true },
    async (err, data) => {
      if (err) {
        throw new AppError("ERR_INVALID_CSV", 400);
      }

      data.forEach(async (record: any) => {
        let extraInfo;
        try {
          extraInfo = JSON.parse(record.ExtraInfo);
        } catch (error) {
          extraInfo = [];
        }

        const contact = {
          companyId,
          name: record.name || record.Name,
          number: record.number || record.Number,
          email: record.email || record.Email,
          extraInfo
        };

        Object.keys(record).forEach((key: string) => {
          if (
            key !== "name" &&
            key !== "number" &&
            key !== "email" &&
            key !== "Name" &&
            key !== "Number" &&
            key !== "Email" &&
            key !== "ExtraInfo" &&
            record[key]
          ) {
            contact.extraInfo.push({
              name: key,
              value: record[key]
            });
          }
        });

        try {
          const newContact = await CreateContactService(contact);
          const io = getIO();
          io.to(`company-${companyId}-mainchannel`).emit(
            `company-${companyId}-contact`,
            {
              action: "update",
              contact: newContact
            }
          );
        } catch (error) {
          logger.error({ contact }, `Error creating contact: ${error.message}`);
        }
      });
    }
  );

  const readable = fs.createReadStream(file.path);

  parser.on("end", () => {
    readable.destroy();
    fs.unlinkSync(file.path);
  });

  readable.pipe(parser);

  return res.status(200).json({ message: "Contacts being imported" });
};

export const exportCsv = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;

  const contacts = await Contact.findAll({
    where: {
      companyId,
      channel: "whatsapp",
      isGroup: false
    },
    include: [
      {
        model: ContactCustomField,
        as: "extraInfo"
      }
    ]
  });

  const records = contacts.map((contact: any) => {
    const extraInfo = contact.extraInfo.map((info: any) => ({
      name: info.name,
      value: info.value
    }));

    return {
      Name: contact.name,
      Number: contact.number,
      Email: contact.email || "",
      ExtraInfo: JSON.stringify(extraInfo)
    };
  });

  stringify(records, { header: true }, (err, output) => {
    if (err) {
      throw new AppError("ERR_GENERATING_CSV", 500);
    }

    res.setHeader("Content-disposition", "attachment; filename=contacts.csv");
    res.set("Content-Type", "text/csv");
    res.status(200).send(output);
  });

  return res;
};
