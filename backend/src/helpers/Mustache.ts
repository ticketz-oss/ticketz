import Mustache from "mustache";
import Ticket from "../models/Ticket";
import User from "../models/User";

export const genGreeting = (): string => {
  const greetings = ["Boa madrugada", "Bom dia", "Boa tarde", "Boa noite"];
  const h = new Date().getHours();
  // eslint-disable-next-line no-bitwise
  return greetings[(h / 6) >> 0];
};

export function formatBody(
  body: string,
  ticket?: Ticket,
  currentUser?: User,
  customTags: [string, string] = null
): string {
  if (!body || (!ticket && !currentUser)) {
    return body;
  }

  const name = ticket?.contact?.name || ticket?.contact?.number || "{{name}}";
  const firstname = name.trim().split(" ")[0] || "{{firstname}}";
  const greeting = genGreeting();
  const queue = ticket?.queue?.name || "{{queue}}";
  const user = currentUser?.name || ticket?.user?.name || "{{user}}";
  const now = new Date();
  const protocol = `${now.toLocaleDateString("en-GB").replace(/\//g, "")}-${
    ticket.id
  }`;
  const hora = now.toLocaleTimeString("en-GB", { hour12: false });

  const view = {
    name,
    firstname,
    greeting,
    gretting: greeting,
    ms: greeting,
    protocol,
    hora,
    fila: queue,
    usuario: user,
    user,
    queue,
    ticket: ticket?.id
  };
  return Mustache.render(body, view, null, customTags);
}

export default formatBody;
