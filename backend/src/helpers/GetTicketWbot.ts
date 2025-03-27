import { getWbot, Session } from "../libs/wbot";
import GetDefaultWhatsApp from "./GetDefaultWhatsApp";
import Ticket from "../models/Ticket";

const GetTicketWbot = async (ticket: Ticket): Promise<Session> => {
  if (!ticket.whatsappId) {
    const defaultWhatsapp = await GetDefaultWhatsApp(ticket.companyId);

    await ticket.$set("whatsapp", defaultWhatsapp);
  }

  const whatsapp = ticket.whatsapp || (await ticket.$get("whatsapp"));

  if (whatsapp.channel !== "whatsapp") {
    return null;
  }

  const wbot = getWbot(ticket.whatsappId);

  return wbot;
};

export default GetTicketWbot;
