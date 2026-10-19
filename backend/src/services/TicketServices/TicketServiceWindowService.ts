import { Op } from "sequelize";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";

// A Meta so aceita texto livre nas 24h seguintes a ultima mensagem enviada
// pelo cliente. Fora disso, o unico caminho e um template aprovado.
export const SERVICE_WINDOW_HOURS = 24;

export interface ServiceWindow {
  open: boolean;
  lastInboundAt: Date | null;
  expiresAt: Date | null;
}

// O dado ja existe em Messages; nao vale uma coluna nova no Ticket so para
// isso, e a busca e coberta pelo indice de ticketId.
const GetTicketServiceWindowService = async (
  ticket: Ticket
): Promise<ServiceWindow> => {
  const lastInbound = await Message.findOne({
    where: {
      companyId: ticket.companyId,
      contactId: ticket.contactId,
      fromMe: false,
      isDeleted: { [Op.not]: true }
    },
    include: [
      {
        model: Ticket,
        as: "ticket",
        attributes: [],
        required: true,
        where: { companyId: ticket.companyId, whatsappId: ticket.whatsappId }
      }
    ],
    attributes: ["id", "createdAt"],
    order: [["createdAt", "DESC"]]
  });

  if (!lastInbound?.createdAt) {
    return { open: false, lastInboundAt: null, expiresAt: null };
  }

  const lastInboundAt = new Date(lastInbound.createdAt);
  const expiresAt = new Date(
    lastInboundAt.getTime() + SERVICE_WINDOW_HOURS * 60 * 60 * 1000
  );

  return {
    open: expiresAt.getTime() > Date.now(),
    lastInboundAt,
    expiresAt
  };
};

export default GetTicketServiceWindowService;
