import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import FindOrCreateTicketService from "./FindOrCreateTicketService";

interface Result {
  ticket: Ticket;
  justCreated: boolean;
}

// A Cloud API deve obedecer exatamente a mesma regra de ciclo de atendimento
// das conexoes comuns. A implementacao antiga reabria qualquer ticket fechado,
// mesmo antigo, preservando fila e estado do chatbot; por isso uma nova
// conversa podia ir direto para a fila anterior e nunca exibir o menu.
const FindOrCreateTicketServiceMeta = async (
  contact: Contact,
  whatsappId: number,
  _unreadMessages: number,
  companyId: number,
  channel: string
): Promise<Result> => {
  const result = await FindOrCreateTicketService(
    contact,
    whatsappId,
    companyId,
    { incrementUnread: true }
  );

  if (result.ticket.channel !== channel) {
    await result.ticket.update({ channel });
  }

  return result;
};

export default FindOrCreateTicketServiceMeta;
