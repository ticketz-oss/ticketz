import { Op, WhereOptions } from "sequelize";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import AppError from "../../errors/AppError";
import { isValidBirthday } from "./recurrence";

export type ScheduleKind = "ONCE" | "BIRTHDAY" | "COMMEMORATIVE";
export type AudienceMode = "ALL" | "SELECTED";

export const eligibleContactWhere = (
  companyId: number,
  kind: ScheduleKind,
  contactIds?: number[]
): WhereOptions => ({
  companyId,
  channel: "whatsapp",
  isGroup: false,
  number: { [Op.regexp]: "^[0-9]{8,20}$" },
  ...(kind === "BIRTHDAY"
    ? {
        birthdayDay: { [Op.not]: null },
        birthdayMonth: { [Op.not]: null }
      }
    : {}),
  ...(contactIds?.length ? { id: { [Op.in]: contactIds } } : {})
});

export const resolveAudience = async ({
  companyId,
  kind,
  audienceMode,
  contactIds = []
}: {
  companyId: number;
  kind: ScheduleKind;
  audienceMode: AudienceMode;
  contactIds?: number[];
}): Promise<Contact[]> => {
  if (audienceMode === "SELECTED" && !contactIds.length) {
    throw new AppError("ERR_SCHEDULE_RECIPIENT_REQUIRED", 400);
  }
  const foundContacts = await Contact.findAll({
    where: eligibleContactWhere(
      companyId,
      kind,
      audienceMode === "SELECTED" ? contactIds : undefined
    ),
    include: [{ model: ContactCustomField, as: "extraInfo" }],
    order: [["name", "ASC"]]
  });
  const contacts =
    kind === "BIRTHDAY"
      ? foundContacts.filter(contact =>
          isValidBirthday(contact.birthdayDay, contact.birthdayMonth)
        )
      : foundContacts;
  if (
    audienceMode === "SELECTED" &&
    contacts.length !== new Set(contactIds).size
  ) {
    throw new AppError("ERR_SCHEDULE_INVALID_RECIPIENT", 400);
  }
  if (!contacts.length)
    throw new AppError("ERR_SCHEDULE_NO_ELIGIBLE_RECIPIENTS", 400);
  return contacts;
};

export const customFieldNames = async (
  companyId: number
): Promise<string[]> => {
  const rows = await ContactCustomField.findAll({
    attributes: ["name"],
    include: [
      { model: Contact, as: "contact", attributes: [], where: { companyId } }
    ],
    group: ["ContactCustomField.name"],
    order: [["name", "ASC"]]
  });
  return rows.map(row => row.name);
};
