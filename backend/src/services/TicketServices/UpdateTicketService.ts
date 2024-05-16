import moment from "moment";
import * as Sentry from "@sentry/node";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import { getIO } from "../../libs/socket";
import Ticket from "../../models/Ticket";
import Setting from "../../models/Setting";
import Queue from "../../models/Queue";
import ShowTicketService from "./ShowTicketService";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import { verifyMessage } from "../WbotServices/wbotMessageListener";
import { isNil } from "lodash";
import sendFaceMessage from "../FacebookServices/sendFacebookMessage";
import AppError from "../../errors/AppError";

interface TicketData {
  status?: string;
  userId?: number | null;
  queueId?: number | null;
  chatbot?: boolean;
  queueOptionId?: number;
  justClose?: boolean;
}

interface Request {
  ticketData: TicketData;
  ticketId: number;
  companyId?: number | undefined;
  tokenData?: {
      id: string;
      username: string;
      profile: string;
      companyId: number;
      iat: number;
      exp: number;
    } | undefined;
}

interface Response {
  ticket: Ticket;
  oldStatus: string;
  oldUserId: number | undefined;
}

const   UpdateTicketService = async ({
  ticketData,
  ticketId,
  tokenData,
  companyId,
}: Request): Promise<Response> => {
  try {
    if (!companyId && !tokenData) {
      throw new Error("Need companyId or tokenData");
    }
    if (tokenData) {
      companyId = tokenData.companyId;
    }
    let { status, justClose } = ticketData;
    let { queueId, userId } = ticketData;
    let chatbot: boolean | null = ticketData.chatbot || false;
    let queueOptionId: number | null = ticketData.queueOptionId || null;

    const io = getIO();

    const key = "userRating";
    const setting = await Setting.findOne({
      where: {
        companyId,
        key
      }
    });

    const ticket = await ShowTicketService(ticketId, companyId);
    
    if (tokenData && ticket.status !== "pending") {
      if (tokenData.profile !== "admin" && ticket.userId !== parseInt(tokenData.id)) {
        throw new AppError("Apenas o usuário ativo do ticket ou o Admin podem fazer alterações no ticket");
      }
    }
    
    const ticketTraking = await FindOrCreateATicketTrakingService({
      ticketId,
      companyId,
      whatsappId: ticket.whatsappId
    });

    if (ticket.channel === "whatsapp") {
      SetTicketMessagesAsRead(ticket);
    }

    const oldStatus = ticket.status;
    const oldUserId = ticket.user?.id;
    const oldQueueId = ticket.queueId;

    if (oldStatus === "closed") {
      await CheckContactOpenTickets(ticket.contact.id);
      chatbot = null;
      queueOptionId = null;
    }

    if (status !== undefined && ["closed"].indexOf(status) > -1) {
      const { complationMessage, ratingMessage } = await ShowWhatsAppService(
        ticket.whatsappId,
        companyId
      );

      if (setting?.value === "enabled") {
        if (ticketTraking.ratingAt == null && !justClose) {

          const ratingTxt = ratingMessage?.trim() || "";
          let bodyRatingMessage = `\u200e${ratingTxt}\n\n`;
          bodyRatingMessage +=
            "Digite de 1 à 3 para qualificar nosso atendimento:\n*1* - _Insatisfeito_\n*2* - _Satisfeito_\n*3* - _Muito Satisfeito_\n\n";

          if (ticket.channel === "whatsapp") {
            await SendWhatsAppMessage({ body: bodyRatingMessage, ticket });
          }

          if (["facebook", "instagram"].includes(ticket.channel)) {
            console.log(`Checking if ${ticket.contact.number} is a valid ${ticket.channel} contact`)
            await sendFaceMessage({ body: bodyRatingMessage, ticket });
          }

          await ticketTraking.update({
            ratingAt: moment().toDate()
          });


          io.to(`company-${ticket.companyId}-open`)
            .to(`queue-${ticket.queueId}-open`)
            .to(ticketId.toString())
            .emit(`company-${ticket.companyId}-ticket`, {
              action: "delete",
              ticketId: ticket.id
            });

          return { ticket, oldStatus, oldUserId };
        }
        ticketTraking.ratingAt = moment().toDate();
        ticketTraking.rated = false;
      }

      if (!isNil(complationMessage) && complationMessage !== "") {
        const body = `\u200e${complationMessage}`;
        
        if (ticket.channel === "whatsapp" && !ticket.isGroup) {
          const sentMessage = await SendWhatsAppMessage({ body, ticket });

          await verifyMessage(sentMessage, ticket, ticket.contact );
        }


        if (["facebook", "instagram"].includes(ticket.channel)) {
          console.log(`Checking if ${ticket.contact.number} is a valid ${ticket.channel} contact`)
          await sendFaceMessage({ body, ticket });
        }
      }

      ticketTraking.finishedAt = moment().toDate();
      ticketTraking.whatsappId = ticket.whatsappId;
      ticketTraking.userId = ticket.userId;

      queueId = null;
      userId = null;
    }

    if (queueId !== undefined && queueId !== null) {
      ticketTraking.queuedAt = moment().toDate();
    }

    if (oldQueueId !== queueId && !isNil(oldQueueId) && !isNil(queueId)) {
      const queue = await Queue.findByPk(queueId);
      if (ticket.channel === "whatsapp") {
        const wbot = await GetTicketWbot(ticket);
        const { transferMessage } = await ShowWhatsAppService(
          ticket.whatsappId,
          companyId
        );

        if(transferMessage){
          const queueChangedMessage = await wbot.sendMessage(
            `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"
            }`,
            {
              text: `\u200e${transferMessage}`
            }
          );
          await verifyMessage(queueChangedMessage, ticket, ticket.contact);
        }else{
          const queueChangedMessage = await wbot.sendMessage(
            `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"
            }`,
            {
              text: "\u200eVocê foi transferido, em breve iremos iniciar seu atendimento."
            }
          );
          await verifyMessage(queueChangedMessage, ticket, ticket.contact);
        }


      }

      if (["facebook", "instagram"].includes(ticket.channel)) {
        console.log(`Checking if ${ticket.contact.number} is a valid ${ticket.channel} contact`)
        await sendFaceMessage({ body: "\u200eVocê foi transferido, em breve iremos iniciar seu atendimento.", ticket });
      }
    }

    await ticket.update({
      status,
      queueId,
      userId,
      whatsappId: ticket.whatsappId,
      chatbot,
      queueOptionId
    });

    await ticket.reload();
    
    status = ticket.status;

    if (status !== undefined && ["pending"].indexOf(status) > -1) {
      ticketTraking.update({
        whatsappId: ticket.whatsappId,
        queuedAt: moment().toDate(),
        startedAt: null,
        userId: null
      });
      io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-ticket`, {
        action: "removeFromList",
        ticketId: ticket?.id
      });
    }

    if (status !== undefined && ["open"].indexOf(status) > -1) {
      ticketTraking.update({
        startedAt: moment().toDate(),
        ratingAt: null,
        rated: false,
        whatsappId: ticket.whatsappId,
        userId: ticket.userId
      });
      io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-ticket`, {
        action: "removeFromList",
        ticketId: ticket?.id
      });

      io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-ticket`, {
        action: "updateUnread",
        ticketId: ticket?.id
      });
    }

    await ticketTraking.save();

    if (justClose && status == 'closed') {
      io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-ticket`, {
        action: "removeFromList",
        ticketId: ticket?.id
      });

    } else
      if (ticket.status === "closed" && ticket.status !== oldStatus) {
        io.to(`company-${companyId}-${oldStatus}`)
          .to(`queue-${ticket.queueId}-${oldStatus}`)
          .to(`user-${oldUserId}`)
          .emit(`company-${companyId}-ticket`, {
            action: "removeFromList",
            ticketId: ticket.id
          });
      }

    io.to(`company-${companyId}-${ticket.status}`)
      .to(`company-${companyId}-notification`)
      .to(`queue-${ticket.queueId}-${ticket.status}`)
      .to(`queue-${ticket.queueId}-notification`)
      .to(ticketId.toString())
      .to(`user-${ticket?.userId}`)
      .to(`user-${oldUserId}`)
      .emit(`company-${companyId}-ticket`, {
        action: "update",
        ticket
      });

    return { ticket, oldStatus, oldUserId };
  } catch (err) {
    Sentry.captureException(err);
  }
};

export default UpdateTicketService;
