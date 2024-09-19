import moment from "moment";
import * as Sentry from "@sentry/node";
import { isNil } from "lodash";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import { getIO } from "../../libs/socket";
import Ticket from "../../models/Ticket";
import Queue from "../../models/Queue";
import ShowTicketService from "./ShowTicketService";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import { verifyMessage } from "../WbotServices/wbotMessageListener";
import sendFaceMessage from "../FacebookServices/sendFacebookMessage";
import AppError from "../../errors/AppError";
import FindOrCreateTicketService from "./FindOrCreateTicketService";
import { logger } from "../../utils/logger";
import Whatsapp from "../../models/Whatsapp";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import { CreateInternalMessageService } from "../MessageServices/CreateInternalMessageService";
import User from "../../models/User";

interface TicketData {
  status?: string;
  userId?: number | null;
  queueId?: number | null;
  chatbot?: boolean;
  queueOptionId?: number;
  justClose?: boolean;
  annotation?: string;
}

interface Request {
  ticketData: TicketData;
  ticketId: number;
  reqUserId?: number;
  companyId?: number | undefined;
  tokenData?:
    | {
        id: string;
        username: string;
        profile: string;
        companyId: number;
        iat: number;
        exp: number;
      }
    | undefined;
}

interface Response {
  ticket: Ticket;
  oldStatus: string;
  oldUserId: number | undefined;
}

const UpdateTicketService = async ({
  ticketData,
  ticketId,
  tokenData,
  companyId,
  reqUserId
}: Request): Promise<Response> => {
  try {
    if (!companyId && !tokenData) {
      throw new Error("Need companyId or tokenData");
    }
    if (tokenData) {
      companyId = tokenData.companyId;
    }
    const { justClose, annotation } = ticketData;
    let { status } = ticketData;
    const { queueId, userId } = ticketData;
    let chatbot: boolean | null = ticketData.chatbot || false;
    let queueOptionId: number | null = ticketData.queueOptionId || null;

    const io = getIO();

    const userRatingSetting = await GetCompanySetting(
      companyId,
      "userRating",
      "disabled"
    );

    let ticket = await ShowTicketService(ticketId, companyId);

    if (tokenData && ticket.status !== "pending") {
      if (
        tokenData.profile !== "admin" &&
        ticket.userId !== parseInt(tokenData.id, 10)
      ) {
        throw new AppError(
          "Apenas o usuário ativo do ticket ou o Admin podem fazer alterações no ticket"
        );
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

    const requestUser = reqUserId ? await User.findByPk(reqUserId) : null;

    if (oldStatus === "closed") {
      await CheckContactOpenTickets(ticket.contact.id, ticket.queueId);
      chatbot = null;
      queueOptionId = null;
    }

    if (status !== undefined && ["closed"].indexOf(status) > -1) {
      const { complationMessage, ratingMessage } = await ShowWhatsAppService(
        ticket.whatsappId,
        companyId
      );

      if (
        userRatingSetting === "enabled" &&
        ticket.userId &&
        !ticket.contact.isGroup &&
        !ticket.contact.disableBot
      ) {
        if (ticketTraking.ratingAt == null && !justClose) {
          const ratingTxt =
            ratingMessage?.trim() || "Por favor avalie nosso atendimento";
          const bodyRatingMessage = `\u200e${ratingTxt}\n\n*Digite uma nota de 1 a 5*\n\nEnvie *\`!\`* para retornar ao atendimento`;

          if (ticket.channel === "whatsapp") {
            await SendWhatsAppMessage({ body: bodyRatingMessage, ticket });
          }

          if (["facebook", "instagram"].includes(ticket.channel)) {
            console.log(
              `Checking if ${ticket.contact.number} is a valid ${ticket.channel} contact`
            );
            await sendFaceMessage({ body: bodyRatingMessage, ticket });
          }

          await ticketTraking.update({
            ratingAt: moment().toDate()
          });

          await ticket.update({
            chatbot: null,
            queueOptionId: null,
            status: "closed"
          });

          await ticket.reload();

          io.to(`company-${ticket.companyId}-open`)
            .to(`queue-${ticket.queueId}-open`)
            .to(ticketId.toString())
            .emit(`company-${ticket.companyId}-ticket`, {
              action: "delete",
              ticketId: ticket.id
            });

          io.to(`company-${ticket.companyId}-closed`)
            .to(`queue-${ticket.queueId}-closed`)
            .to(ticket.id.toString())
            .emit(`company-${ticket.companyId}-ticket`, {
              action: "update",
              ticket,
              ticketId: ticket.id
            });

          return { ticket, oldStatus, oldUserId };
        }
        ticketTraking.ratingAt = moment().toDate();
        ticketTraking.rated = false;
      }

      if (
        !ticket.contact.isGroup &&
        !ticket.contact.disableBot &&
        !isNil(complationMessage) &&
        complationMessage !== ""
      ) {
        const body = `\u200e${complationMessage}`;

        if (ticket.channel === "whatsapp" && !ticket.isGroup) {
          const sentMessage = await SendWhatsAppMessage({ body, ticket });

          await verifyMessage(sentMessage, ticket, ticket.contact);
        }

        if (["facebook", "instagram"].includes(ticket.channel)) {
          console.log(
            `Checking if ${ticket.contact.number} is a valid ${ticket.channel} contact`
          );
          await sendFaceMessage({ body, ticket });
        }
      }

      ticketTraking.finishedAt = moment().toDate();
      ticketTraking.whatsappId = ticket.whatsappId;
      ticketTraking.userId = ticket.userId;
    }

    if (queueId !== undefined && queueId !== null) {
      ticketTraking.queuedAt = moment().toDate();
    }

    if (oldQueueId !== queueId && !isNil(oldQueueId) && !isNil(queueId)) {
      const queue = await Queue.findByPk(queueId, {
        include: [
          {
            model: Whatsapp,
            as: "whatsapps"
          }
        ]
      });

      if (ticket.channel === "whatsapp") {
        const whatsapp = await ShowWhatsAppService(
          ticket.whatsappId,
          companyId
        );

        const restrictTransferConnection =
          (await GetCompanySetting(
            companyId,
            "restrictTransferConnection",
            ""
          )) === "enabled" || whatsapp.restrictToQueues;

        const transferToNewTicket =
          (await GetCompanySetting(companyId, "transferToNewTicket", "")) ===
            "enabled" || whatsapp.transferToNewTicket;

        // let oldTicket: Ticket = null;
        let newWhatsapp: Whatsapp = null;

        if (restrictTransferConnection && queue.whatsapps.length) {
          const isSameConnection = queue.whatsapps.find(
            e => e.id === whatsapp.id
          );

          if (!isSameConnection) {
            newWhatsapp = queue.whatsapps.find(e => e.status === "CONNECTED");

            if (!newWhatsapp) {
              throw new AppError("ERR_WAPP_NOT_FOUND", 404);
            }
          }
        }

        if (transferToNewTicket) {
          await ticket.update({
            status: "closed"
          });
          await ticket.reload();
          io.to(`company-${companyId}-mainchannel`).emit(
            `company-${companyId}-ticket`,
            {
              action: "removeFromList",
              ticketId: ticket?.id
            }
          );

          const { contact } = ticket;

          // oldTicket = ticket;

          const newTicket = await FindOrCreateTicketService(
            contact,
            newWhatsapp?.id || whatsapp.id,
            1,
            companyId,
            null,
            true
          );

          if (!newTicket) {
            logger.error(
              { contact: ticket.contact, whatsapp: newWhatsapp },
              "Error creating new ticket"
            );
            throw new AppError("ERR_INTERNAL_ERROR", 500);
          }

          CreateInternalMessageService(
            ticket,
            `Transferido para o ticket #${newTicket.id}`
          );
          CreateInternalMessageService(
            newTicket,
            `Transferido a partir do ticket #${ticket.id} ${
              requestUser ? `por ${requestUser.name}` : ""
            }`
          );

          ticket = newTicket;
        } else if (newWhatsapp) {
          await ticket.update({
            whatsappId: newWhatsapp.id
          });
          await ticket.reload();
        }

        if (!ticket.contact.isGroup) {
          const wbot = await GetTicketWbot(ticket);
          const queueChangedMessage = await wbot.sendMessage(
            `${ticket.contact.number}@${
              ticket.isGroup ? "g.us" : "s.whatsapp.net"
            }`,
            {
              text: `\u200e${
                whatsapp.transferMessage ||
                "Você foi transferido, em breve iremos iniciar seu atendimento."
              }`
            }
          );
          await verifyMessage(queueChangedMessage, ticket, ticket.contact);
        }
      }

      if (["facebook", "instagram"].includes(ticket.channel)) {
        console.log(
          `Checking if ${ticket.contact.number} is a valid ${ticket.channel} contact`
        );
        await sendFaceMessage({
          body: "\u200eVocê foi transferido, em breve iremos iniciar seu atendimento.",
          ticket
        });
      }
    }

    if (annotation) {
      CreateInternalMessageService(ticket, annotation, reqUserId);
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
      io.to(`company-${companyId}-mainchannel`).emit(
        `company-${companyId}-ticket`,
        {
          action: "removeFromList",
          ticketId: ticket?.id
        }
      );
    }

    if (status !== undefined && ["open"].indexOf(status) > -1) {
      ticketTraking.update({
        startedAt: moment().toDate(),
        ratingAt: null,
        rated: false,
        whatsappId: ticket.whatsappId,
        userId: ticket.userId
      });
      io.to(`company-${companyId}-mainchannel`).emit(
        `company-${companyId}-ticket`,
        {
          action: "removeFromList",
          ticketId: ticket?.id
        }
      );

      io.to(`company-${companyId}-mainchannel`).emit(
        `company-${companyId}-ticket`,
        {
          action: "updateUnread",
          ticketId: ticket?.id
        }
      );
    }

    await ticketTraking.save();

    if (justClose && status === "closed") {
      io.to(`company-${companyId}-mainchannel`).emit(
        `company-${companyId}-ticket`,
        {
          action: "removeFromList",
          ticketId: ticket?.id
        }
      );
    } else if (ticket.status === "closed" && ticket.status !== oldStatus) {
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
  return null;
};

export default UpdateTicketService;
