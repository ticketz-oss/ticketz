import Mustache from "mustache";
import Ticket from "../models/Ticket";
import User from "../models/User";

export const greeting = (): string => {
  const greetings = ["Boa madrugada", "Bom dia", "Boa tarde", "Boa noite"];
  const h = new Date().getHours();
  // eslint-disable-next-line no-bitwise
  return greetings[(h / 6) >> 0];
};

export function formatBody(
  body: string,
  ticket?: Ticket,
  user?: User,
  customTags: [string, string] = null
): string {
  if (!body || (!ticket && !user)) {
    return body;
  }

  let ms = "";

  const Hr = new Date();

  const dd: string = `0${Hr.getDate()}`.slice(-2);
  const mm: string = `0${Hr.getMonth() + 1}`.slice(-2);
  const yy: string = Hr.getFullYear().toString();
  const hh: number = Hr.getHours();
  const min: string = `0${Hr.getMinutes()}`.slice(-2);
  const ss: string = `0${Hr.getSeconds()}`.slice(-2);

  if (hh >= 6) {
    ms = "Bom dia";
  }
  if (hh > 11) {
    ms = "Boa tarde";
  }
  if (hh > 17) {
    ms = "Boa noite";
  }
  if (hh > 23 || hh < 6) {
    ms = "Boa madrugada";
  }

  const setor =
    ticket?.queueId === undefined || ticket.queueId === null
      ? ""
      : ticket.queue.name;

  const usuario =
    ticket?.userId === undefined || ticket.userId === null
      ? ""
      : ticket.user.name;

  const protocol = `${yy}${mm}${dd}-${ticket.id}`;

  const hora = `${hh}:${min}:${ss}`;

  const view = {
    name: ticket.contact?.name.trim() || "",
    firstname: ticket.contact?.name.trim().split(" ")[0] || "",
    gretting: greeting(),
    ms,
    protocol,
    hora,
    fila: setor,
    usuario,
    user: user?.name || ticket?.user?.name || "{{username}}",
    queue: ticket?.queue?.name || "{{queue}}",
    ticket: ticket?.id
  };
  return Mustache.render(body, view, null, customTags);
}

export default formatBody;
