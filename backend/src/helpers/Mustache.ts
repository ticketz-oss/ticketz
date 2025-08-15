import Mustache from "mustache";
import Ticket from "../models/Ticket";
import User from "../models/User";
import Contact from "../models/Contact";
import ContactListItem from "../models/ContactListItem";
import { _t } from "../services/TranslationServices/i18nService";
import Company from "../models/Company";

type MustacheFormatProps = {
  body: string;
  ticket?: Ticket;
  contact?: Contact | ContactListItem;
  currentUser?: User;
  customTags?: [string, string];
};

export const genGreeting = (
  lngSource: Ticket | Contact | Company | string
): string => {
  const greetings = [
    _t("Hello", lngSource),
    _t("Good morning", lngSource),
    _t("Good afternoon", lngSource),
    _t("Good evening", lngSource)
  ];
  const h = new Date().getHours();
  // eslint-disable-next-line no-bitwise
  return greetings[(h / 6) >> 0];
};

export function mustacheValues(
  ticket: Ticket,
  contact: Contact | ContactListItem,
  currentUser: User
): Record<string, any> {
  contact = contact || ticket?.contact;

  const name = contact?.name || contact?.number || "{{name}}";
  const firstname = name.trim().split(" ")[0] || "{{firstname}}";
  const greeting = genGreeting(
    ticket ||
      ((contact as Contact)?.language !== undefined
        ? (contact as Contact)
        : (contact as ContactListItem)?.company)
  );
  const queue = ticket?.queue?.name || "{{queue}}";
  const user = currentUser?.name || ticket?.user?.name || "{{user}}";
  const email = contact?.email || "{{email}}";
  const now = new Date();
  const protocol =
    (ticket &&
      `${now.toISOString().split("T")[0].replace(/-/g, "")}-${ticket.id}`) ||
    "{{protocol}}";
  const time = now.toLocaleTimeString("en-GB", { hour12: false });

  let extraInfo: any;

  if (contact instanceof ContactListItem) {
    extraInfo = {}; // contact.extraInfo;
  } else if (contact && contact.extraInfo) {
    extraInfo = contact.extraInfo.reduce((acc, field) => {
      acc[field.name] = field.value;
      return acc;
    }, {});
  }

  const view = {
    ...extraInfo,
    name,
    firstname,
    email,
    greeting,
    queue,
    protocol,
    user,
    time,
    ticket: ticket?.id || "{{ticket}}",
    gretting: greeting,
    ms: greeting,
    hora: time,
    fila: queue,
    usuario: user,
    extraInfo
  };

  return view;
}

function placeholderVariables(template: string): Record<string, string> {
  const tokens = Mustache.parse(template);

  const placeholder: Record<string, string> = {};

  tokens.forEach(token => {
    if (token[0] === "name") {
      placeholder[token[1]] = `{{${token[1]}}}`;
    }
  });

  return placeholder;
}

export function mustacheFormat({
  body,
  ticket,
  contact,
  currentUser,
  customTags = null
}: MustacheFormatProps): string {
  if (!body || (!ticket && !contact && !currentUser)) {
    return body;
  }

  const view = mustacheValues(ticket, contact, currentUser);

  return Mustache.render(
    body,
    { ...placeholderVariables(body), ...view },
    null,
    customTags
  );
}

export function formatBody(
  body: string,
  ticket?: Ticket,
  currentUser?: User,
  customTags: [string, string] = null
): string {
  return mustacheFormat({
    body,
    ticket,
    contact: ticket?.contact,
    currentUser,
    customTags
  });
}

export default formatBody;
