import Mustache from "mustache";
import Ticket from "../models/Ticket";
import User from "../models/User";
import Contact from "../models/Contact";

type MustacheFormatProps = {
  body: string;
  ticket?: Ticket;
  contact?: Contact;
  currentUser?: User;
  customTags?: [string, string];
};

export const genGreeting = (): string => {
  const greetings = ["Boa madrugada", "Bom dia", "Boa tarde", "Boa noite"];
  const h = new Date().getHours();
  // eslint-disable-next-line no-bitwise
  return greetings[(h / 6) >> 0];
};

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

  contact = contact || ticket?.contact;

  const name = contact?.name || contact?.number || "{{name}}";
  const firstname = name.trim().split(" ")[0] || "{{firstname}}";
  const greeting = genGreeting();
  const queue = ticket?.queue?.name || "{{queue}}";
  const user = currentUser?.name || ticket?.user?.name || "{{user}}";
  const now = new Date();
  const protocol =
    (ticket &&
      `${now.toLocaleDateString("en-GB").replace(/\//g, "")}-${ticket.id}`) ||
    "{{protocol}}";
  const time = now.toLocaleTimeString("en-GB", { hour12: false });

  const view = {
    name,
    firstname,
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
    usuario: user
  };
  return Mustache.render(body, view, null, customTags);
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
    currentUser,
    customTags
  });
}

export default formatBody;
