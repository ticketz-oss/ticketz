import { head } from "lodash";
import XLSX from "xlsx";
import ContactListItem from "../../models/ContactListItem";
import CheckContactNumber from "../WbotServices/CheckNumber";
import { logger } from "../../utils/logger";

export async function ImportContacts(
  contactListId: number,
  companyId: number,
  file: Express.Multer.File | undefined
) {
  const workbook = XLSX.readFile(file?.path as string);
  const worksheet = head(Object.values(workbook.Sheets)) as any;
  const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 0 });
  const contacts = rows.map(row => {
    const name = row.name || row.nome || row.Nome;

    const number = String(
      row.number || row.numero || row["número"] || row.Numero || row["Número"]
    ).replace(/\D/g, "");

    const email = row.email || row["e-mail"] || row.Email || row["E-mail"];

    delete row.name;
    delete row.number;
    delete row.email;
    delete row.nome;
    delete row.Nome;
    delete row.numero;
    delete row["número"];
    delete row["Número"];
    delete row["E-mail"];
    delete row["e-mail"];

    const extraInfo = { ...row };

    return { name, number, email, extraInfo, contactListId, companyId };
  });

  const contactList: ContactListItem[] = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const contact of contacts) {
    if (!contact.number) {
      // eslint-disable-next-line no-continue
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    const [newContact, created] = await ContactListItem.findOrCreate({
      where: {
        number: contact.number,
        contactListId: contact.contactListId
      },
      defaults: contact
    });

    if (!created) {
      // eslint-disable-next-line no-await-in-loop
      await newContact.update(contact);
    } else {
      contactList.push(newContact);
    }
  }

  if (contactList) {
    // eslint-disable-next-line no-restricted-syntax
    for (const newContact of contactList) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const response = await CheckContactNumber(newContact.number, companyId);
        newContact.isWhatsappValid = response.exists;
        const number = response.jid.replace(/\D/g, "");
        newContact.number = number;
        // eslint-disable-next-line no-await-in-loop
        await newContact.save();
      } catch (e) {
        logger.error(`Número de contato inválido: ${newContact.number}`);
      }
    }
  }

  return contactList;
}
