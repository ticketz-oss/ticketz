import moment from "moment";
import { getIO } from "../../libs/socket";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import TicketTraking from "../../models/TicketTraking";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import ShowTicketService from "./ShowTicketService";
import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";
import Queue from "../../models/Queue";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import { GetTicketWbot } from "../../helpers/GetTicketWbot";
import { verifyMessage } from "../WbotServices/wbotMessageListener";
import formatBody from "../../helpers/Mustache";
import { getJidOf } from "../WbotServices/getJidOf";
import { websocketUpdateTicket } from "./UpdateTicketService";
import { incrementCounter } from "../CounterServices/IncrementCounter";

interface Request {
  ticketId: number;
  newUserId: number;
  reqUserId: number;
  companyId: number;
  queueId?: number | null; // Opcional: permite transferir e mudar de fila simultaneamente
}

interface Response {
  ticket: Ticket;
  oldUserId: number | undefined;
}

const TransferTicketService = async ({
  ticketId,
  newUserId,
  reqUserId,
  companyId,
  queueId
}: Request): Promise<Response> => {
  try {
    // 1. Validações iniciais
    if (!newUserId) {
      throw new AppError("ERR_NEW_USER_REQUIRED", 400);
    }

    // 2. Busca o ticket com validação de empresa
    const ticket = await ShowTicketService(ticketId, companyId);
    const oldUserId = ticket.userId;
    const oldQueueId = ticket.queueId;

    // 3. Valida se já está com o mesmo usuário
    if (ticket.userId === newUserId && (!queueId || ticket.queueId === queueId)) {
      throw new AppError("ERR_TICKET_ALREADY_ASSIGNED", 400);
    }

    // 4. Busca o novo usuário (destino)
    const newUser = await User.findOne({
      where: { id: newUserId, companyId }
    });

    if (!newUser) {
      throw new AppError("ERR_USER_NOT_FOUND", 404);
    }

    // 5. Valida permissões do usuário que está transferindo
    const reqUser = await User.findByPk(reqUserId);
    if (!reqUser) {
      throw new AppError("ERR_USER_NOT_FOUND", 404);
    }

    // Apenas admin pode transferir ticket de outro usuário
    if (ticket.userId && ticket.userId !== reqUserId && reqUser.profile !== "admin") {
      throw new AppError("ERR_NO_PERMISSION_TRANSFER", 403);
    }

    // 6. Valida fila se for fornecida
    let finalQueueId = queueId !== undefined ? queueId : ticket.queueId;
    if (finalQueueId && finalQueueId !== ticket.queueId) {
      const newQueue = await Queue.findByPk(finalQueueId);
      if (!newQueue || newQueue.companyId !== companyId) {
        throw new AppError("ERR_QUEUE_NOT_FOUND", 404);
      }
    }

    // 7. Atualiza o histórico (TicketTraking)
    const ticketTraking = await FindOrCreateATicketTrakingService({
      ticketId,
      companyId,
      whatsappId: ticket.whatsappId
    });

    // Se o ticket estava pendente e está sendo atribuído, marca como iniciado
    if (ticket.status === "pending" && !ticketTraking.startedAt) {
      ticketTraking.startedAt = moment().toDate();
      ticketTraking.userId = newUserId;
    }

    // Marca que foi transferido
    ticketTraking.userId = newUserId;
    if (finalQueueId !== ticket.queueId) {
      ticketTraking.queuedAt = moment().toDate();
    }
    await ticketTraking.save();

    // 8. Atualiza o ticket
    const updateData: any = {
      userId: newUserId
    };

    if (finalQueueId !== undefined) {
      updateData.queueId = finalQueueId;
    }

    // Se estava fechado e está sendo reaberto, muda status para "open"
    if (ticket.status === "closed") {
      updateData.status = "open";
    }

    await ticket.update(updateData);
    await ticket.reload();

    // 9. Incrementa contador de transferências
    await incrementCounter(companyId, "ticket-transfer");

    // 10. Envia notificação ao cliente (se configurado)
    const isGroup = ticket.contact?.isGroup || ticket.isGroup;
    if (
      !isGroup &&
      !ticket.chatbot &&
      !ticket.contact?.disableBot &&
      ticket.whatsapp?.status === "CONNECTED"
    ) {
      try {
        const systemTransferMessage = await GetCompanySetting(
          companyId,
          "transferMessage",
          ""
        );
        const transferMessage = 
          ticket.whatsapp.transferMessage || systemTransferMessage;

        if (transferMessage) {
          const wbot = await GetTicketWbot(ticket);
          const messageText = formatBody(transferMessage, ticket, newUser);
          
          const sentMessage = await wbot.sendMessage(getJidOf(ticket), {
            text: messageText
          });
          
          await verifyMessage(sentMessage, ticket, ticket.contact);
        }
      } catch (error) {
        logger.error(
          { error, ticketId },
          "Failed to send transfer notification to client"
        );
      }
    }

    // 11. Notificação via WebSocket
    websocketUpdateTicket(ticket, [
      `user-${oldUserId}`,
      `user-${newUserId}`,
      `queue-${oldQueueId}-notification`,
      `queue-${finalQueueId}-notification`
    ]);

    // Log da transferência
    logger.info({
      ticketId: ticket.id,
      oldUserId,
      newUserId,
      oldQueueId,
      newQueueId: finalQueueId,
      transferredBy: reqUserId
    }, "Ticket transferred successfully");

    return { ticket, oldUserId };

  } catch (error) {
    logger.error(
      { 
        error: error?.message, 
        ticketId, 
        newUserId, 
        reqUserId,
        stack: error?.stack 
      },
      "TransferTicketService error"
    );
    
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError("ERR_TICKET_TRANSFER_FAILED", 500);
  }
};

export default TransferTicketService;
