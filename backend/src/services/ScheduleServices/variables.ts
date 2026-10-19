import Mustache from "mustache";
import { DateTime } from "luxon";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import User from "../../models/User";
import CommemorativeDate from "../../models/CommemorativeDate";
import { genGreeting, mustacheValues } from "../../helpers/Mustache";

export const BUILT_IN_SCHEDULE_VARIABLES = [
  "nome",
  "primeiro_nome",
  "apelido",
  "email",
  "numero",
  "aniversario",
  "idioma",
  "saudacao",
  "atendente",
  "data_comemorativa",
  "data",
  "name",
  "firstname",
  "greeting",
  "user",
  "time",
  "hora",
  "usuario",
  "ms",
  "gretting"
];

export const normalizeVariableKey = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

export const extractVariables = (body: string): string[] => {
  const names = Mustache.parse(body || "")
    .filter(token => token[0] === "name" || token[0] === "&")
    .map(token => token[1]);
  return Array.from(new Set(names));
};

export const validateScheduleVariables = (
  body: string,
  customKeys: string[]
): string[] => {
  const allowed = new Set([
    ...BUILT_IN_SCHEDULE_VARIABLES,
    ...customKeys.map(key => `extra.${normalizeVariableKey(key)}`)
  ]);
  const unknown = extractVariables(body).filter(
    variable => !allowed.has(variable)
  );
  if (unknown.length) {
    throw new AppError("ERR_SCHEDULE_UNKNOWN_VARIABLE", 400);
  }
  return extractVariables(body);
};

type RenderOptions = {
  contact: Contact;
  currentUser?: User;
  commemorativeDate?: CommemorativeDate;
  occurrence?: Date;
  timezone?: string;
};

export const renderScheduleMessage = (
  body: string,
  {
    contact,
    currentUser,
    commemorativeDate,
    occurrence,
    timezone = "UTC"
  }: RenderOptions
): string => {
  const legacyValues = mustacheValues(null, contact, currentUser);
  const fullName = contact?.name || contact?.number || "";
  const firstName = fullName.trim().split(" ")[0] || "";
  const extra = (contact?.extraInfo || []).reduce(
    (result, field) => {
      result[normalizeVariableKey(field.name)] = field.value || "";
      return result;
    },
    {} as Record<string, string>
  );
  const birthday =
    contact?.birthdayDay && contact?.birthdayMonth
      ? `${String(contact.birthdayDay).padStart(2, "0")}/${String(
          contact.birthdayMonth
        ).padStart(2, "0")}`
      : "";
  const occurrenceDate = occurrence
    ? DateTime.fromJSDate(occurrence).setZone(timezone).toFormat("dd/LL/yyyy")
    : "";

  return Mustache.render(body, {
    ...Object.fromEntries(extractVariables(body).map(key => [key, ""])),
    ...legacyValues,
    nome: fullName,
    primeiro_nome: firstName,
    apelido: contact?.nickname || firstName,
    email: contact?.email || "",
    numero: contact?.number || "",
    aniversario: birthday,
    idioma: contact?.language || "",
    saudacao: genGreeting(contact),
    atendente: currentUser?.name || "",
    data_comemorativa: commemorativeDate?.name || "",
    data: occurrenceDate,
    extra
  });
};
