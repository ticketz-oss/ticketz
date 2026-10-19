import * as Yup from "yup";
import { Request, Response } from "express";
import { Op } from "sequelize";
import sequelize from "../database";
import { parse as csvParser, stringify } from "csv";
import fs from "fs";
import { getIO } from "../libs/socket";

import ListContactsService from "../services/ContactServices/ListContactsService";
import CreateContactService from "../services/ContactServices/CreateContactService";
import ShowContactService from "../services/ContactServices/ShowContactService";
import ShowTagService from "../services/TagServices/ShowService";
import UpdateContactService, {
  websocketUpdateContact
} from "../services/ContactServices/UpdateContactService";
import DeleteContactService from "../services/ContactServices/DeleteContactService";
import GetContactService from "../services/ContactServices/GetContactService";

import CheckContactNumber, {
  CheckNumberAndCreateContact,
  IOnWhatsapp
} from "../services/WbotServices/CheckNumber";
import AppError from "../errors/AppError";
import SimpleListService, {
  SearchContactParams
} from "../services/ContactServices/SimpleListService";
import ContactCustomField from "../models/ContactCustomField";
import RefreshContactPictureService from "../services/ContactServices/RefreshContactPictureService";

import { logger } from "../utils/logger";
import Contact from "../models/Contact";
import { GetCompanySetting } from "../helpers/CheckSettings";
import WhatsappLidMap from "../models/WhatsappLidMap";
import { verifyContact } from "../services/WbotServices/verifyContact";
import { getWbot } from "../libs/wbot";
import GetDefaultWhatsApp from "../helpers/GetDefaultWhatsApp";
import { csvDetectDelimiter } from "../helpers/csvDetectDelimiter";

export const updateExtraInfo = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const schema = Yup.object().shape({
    extraInfo: Yup.array()
      .of(
        Yup.object().shape({
          id: Yup.number().integer().positive().optional(),
          name: Yup.string().trim().max(100).required(),
          value: Yup.string().max(255).required()
        })
      )
      .required()
  });
  let payload: {
    extraInfo: Array<{ id?: number; name: string; value: string }>;
  };
  try {
    payload = await schema.validate(req.body, { stripUnknown: true });
  } catch (error) {
    throw new AppError((error as Error).message, 400);
  }
  const contact = await Contact.findOne({
    where: { id: req.params.contactId, companyId: req.user.companyId },
    include: ["extraInfo"]
  });
  if (!contact) throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  const oldIds = new Set(contact.extraInfo.map(field => field.id));
  const incomingIds = payload.extraInfo
    .filter(field => field.id)
    .map(field => field.id);
  if (
    new Set(incomingIds).size !== incomingIds.length ||
    incomingIds.some(id => !oldIds.has(id))
  ) {
    throw new AppError("ERR_INVALID_CONTACT_FIELD", 400);
  }
  await sequelize.transaction(async transaction => {
    await Promise.all(
      payload.extraInfo.map(async field => {
        if (field.id) {
          await ContactCustomField.update(
            { name: field.name.trim(), value: field.value },
            { where: { id: field.id, contactId: contact.id }, transaction }
          );
        } else {
          await ContactCustomField.create(
            {
              name: field.name.trim(),
              value: field.value,
              contactId: contact.id
            },
            { transaction }
          );
        }
      })
    );
    const removed = [...oldIds].filter(id => !incomingIds.includes(id));
    if (removed.length) {
      await ContactCustomField.destroy({
        where: { id: { [Op.in]: removed }, contactId: contact.id },
        transaction
      });
    }
  });
  await contact.reload({ include: ["extraInfo", "tags"] });
  websocketUpdateContact(contact);
  return res.json(contact);
};

export const refreshPicture = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const pictures = await RefreshContactPictureService(
    req.params.contactId,
    req.user.companyId
  );
  res.setHeader("Cache-Control", "no-store");
  return res.json(pictures);
};

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
  nickname?: string;
  birthdayDay?: number | null;
  birthdayMonth?: number | null;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { companyId } = req.user;

  const { contacts, count, hasMore } = await ListContactsService({
    searchParam,
    pageNumber,
    companyId,
    isGroup:
      req.query.isGroup === "true"
        ? true
        : req.query.isGroup === "false"
          ? false
          : undefined
  });

  return res.json({ contacts, count, hasMore });
};

export const selection = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const searchParam = String(req.query.searchParam || "").trim();
  const pageNumber = Number(req.query.pageNumber || 1);
  const ids = String(req.query.ids || "")
    .split(",")
    .map(Number)
    .filter(Boolean);
  const limit = 25;
  const where: any = {
    companyId,
    channel: "whatsapp",
    isGroup: false,
    number: { [Op.regexp]: "^[0-9]{8,20}$" }
  };
  if (ids.length) where.id = { [Op.in]: ids };
  else if (searchParam) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${searchParam}%` } },
      { nickname: { [Op.iLike]: `%${searchParam}%` } },
      { number: { [Op.like]: `%${searchParam}%` } }
    ];
  }
  const { count, rows } = await Contact.findAndCountAll({
    where,
    attributes: [
      "id",
      "name",
      "nickname",
      "number",
      "email",
      "birthdayDay",
      "birthdayMonth"
    ],
    limit: ids.length ? undefined : limit,
    offset: ids.length ? undefined : (pageNumber - 1) * limit,
    order: [["name", "ASC"]]
  });
  return res.json({
    contacts: rows,
    count,
    hasMore: ids.length ? false : count > pageNumber * limit
  });
};

export const findOrInsertContact = async (
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

  let contact: Contact;
  if (!newContact.isGroup) {
    contact = await CheckNumberAndCreateContact(
      newContact.number,
      newContact.name,
      companyId
    );
  } else {
    contact = await CreateContactService({
      ...newContact,
      companyId
    });
  }

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

  let checked: IOnWhatsapp;
  if (!contactData.isGroup && contactData.number.match(/^\d+$/)) {
    // Em conexao oficial nao ha como verificar o numero, e o retorno e null:
    // o cadastro segue sem normalizar o JID em vez de falhar.
    checked = await CheckContactNumber(contactData.number, companyId);
    if (checked) {
      contactData.number = checked.jid.replace(/\D/g, "");
    }
  }

  const { contactId } = req.params;

  const contact = await UpdateContactService({
    contactData,
    contactId,
    companyId
  });

  if (checked) {
    await WhatsappLidMap.destroy({
      where: { contactId: contact.id }
    });
    const defaultWhatsapp = await GetDefaultWhatsApp(companyId);
    const wbot = getWbot(defaultWhatsapp.id);
    await verifyContact(
      { id: checked.jid, lid: checked.lid, name: contact.name },
      wbot,
      companyId
    );
  }

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

  const tag = await ShowTagService(Number(tagId), companyId);
  await contact.$add("tags", tag.id);

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

  const tag = await ShowTagService(Number(tagId), companyId);
  await contact.$remove("tags", tag.id);

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

  let delimiter = ",";
  try {
    const firstLine = fs.readFileSync(file.path, "utf8").split("\n")[0];
    delimiter = firstLine.includes(";") ? ";" : ",";
  } catch (error) {
    throw new AppError("ERR_INVALID_CSV", 400);
  }

  const parser = csvParser({ delimiter, columns: true }, async (err, data) => {
    if (err) {
      throw new AppError("ERR_INVALID_CSV", 400);
    }

    data.forEach(async (record: any) => {
      let extraInfo: any[];
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
        nickname:
          record.nickname ||
          record.Nickname ||
          record.apelido ||
          record.Apelido ||
          "",
        birthdayDay: null as number | null,
        birthdayMonth: null as number | null,
        extraInfo
      };

      const birthday =
        record.birthday ||
        record.Birthday ||
        record.aniversario ||
        record.Aniversario;
      const birthdayMatch = /^(\d{1,2})\/(\d{1,2})$/.exec(birthday || "");
      if (birthdayMatch) {
        contact.birthdayDay = Number(birthdayMatch[1]);
        contact.birthdayMonth = Number(birthdayMatch[2]);
      }

      Object.keys(record).forEach((key: string) => {
        if (
          key !== "name" &&
          key !== "number" &&
          key !== "email" &&
          key !== "Name" &&
          key !== "Number" &&
          key !== "Email" &&
          key !== "nickname" &&
          key !== "Nickname" &&
          key !== "apelido" &&
          key !== "Apelido" &&
          key !== "birthday" &&
          key !== "Birthday" &&
          key !== "aniversario" &&
          key !== "Aniversario" &&
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
  });

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
      Nickname: contact.nickname || "",
      Birthday:
        contact.birthdayDay && contact.birthdayMonth
          ? `${String(contact.birthdayDay).padStart(2, "0")}/${String(
              contact.birthdayMonth
            ).padStart(2, "0")}`
          : "",
      ExtraInfo: JSON.stringify(extraInfo)
    };
  });

  stringify(
    records,
    { header: true, delimiter: csvDetectDelimiter(req) },
    (err, output) => {
      if (err) {
        throw new AppError("ERR_GENERATING_CSV", 500);
      }

      res.setHeader("Content-disposition", "attachment; filename=contacts.csv");
      res.set("Content-Type", "text/csv");
      res.status(200).send(output);
    }
  );

  return res;
};
