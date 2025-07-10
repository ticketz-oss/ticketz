import moment from "moment";
import { isNil } from "lodash";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import { getIO } from "../../libs/socket";
import Ticket from "../../models/Ticket";
import Queue from "../../models/Queue";
import ShowTicketService, { reloadTicketService } from "./ShowTicketService";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import { wbotReplyHandler } from "../WbotServices/wbotMessageListener";
import AppError from "../../errors/AppError";
import FindOrCreateTicketService from "./FindOrCreateTicketService";
import Whatsapp from "../../models/Whatsapp";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import { CreateInternalMessageService } from "../MessageServices/CreateInternalMessageService";
import User from "../../models/User";
import {
  IntegrationMessage,
  IntegrationServices
} from "../IntegrationServices/IntegrationServices";
import {
  getOmniReplyHandler,
  OmniServices
} from "../OmniServices/OmniServices";
import { logger } from "../../utils/logger";
import { incrementCounter } from "../CounterServices/IncrementCounter";
import { sendFormattedMessage } from "../../helpers/sendFormattedMessage";
import { checkIntegration, startQueue } from "../QueueService/ChatbotService";

const integrationServices = IntegrationServices.getInstance();
const omniServices = OmniServices.getInstance();

export interface UpdateTicketData {
  status?: string;
  userId?: number | null;
  queueId?: number | null;
  chatbot?: boolean;
  queueOptionId?: number;
  justClose?: boolean;
  annotation?: string;
}

interface Request {
  ticketData: UpdateTicketData;
  ticketId: number;
  reqUserId?: number;
  companyId?: number | undefined;
  dontRunChatbot?: boolean;
}

interface Response {
  ticket: Ticket;
  oldStatus: string;
  oldUserId: number | undefined;
}

export function websocketUpdateTicket(ticket: Ticket, moreChannels?: string[]) {
  const io = getIO();
  let ioStack = io
    .to(ticket.id.toString())
    .to(`user-${ticket?.userId}`)
    .to(`queue-${ticket.queueId}-notification`)
    .to(`queue-${ticket.queueId}-${ticket.status}`)
    .to(`company-${ticket.companyId}-notification`)
    .to(`company-${ticket.companyId}-${ticket.status}`);

  if (moreChannels) {
    moreChannels.forEach(channel => {
      ioStack = ioStack.to(channel);
    });
  }

  ioStack.emit(`company-${ticket.companyId}-ticket`, {
    action: "update",
    ticket
  });
}

const UpdateTicketService = async ({
  ticketData,
  ticketId,
  reqUserId,
  companyId,
  dontRunChatbot
}: Request): Promise<Response> => {
  try {
    if (!companyId && !reqUserId) {
      throw new Error("Need reqUserId or companyId");
    }

    const user = reqUserId ? await User.findByPk(reqUserId) : null;

    if (reqUserId) {
      if (!user) {
        throw new AppError("User not found", 404);
      }
      companyId = user.companyId;
    }
    const { justClose, annotation } = ticketData;
    let { status } = ticketData;
    const { queueId, userId } = ticketData;
    let queueOptionId: number | null = ticketData.queueOptionId || null;

    if (ticketId < 1 && status === "open") {
      throw new AppError("ERR_BAD_REQUEST", 400);
    }

    const io = getIO();

    const userRatingSetting = await GetCompanySetting(
      companyId,
      "userRating",
      "disabled"
    );

    let ticket = await ShowTicketService(ticketId, companyId);

    const isFromChatbot = ticket.chatbot || ticketData.chatbot || false;
    let chatbot: boolean | null = ticketData.chatbot || false;

    const isGroup = ticket.contact?.isGroup || ticket.isGroup;

    if (user && ticket.status !== "pending") {
      if (user.profile !== "admin" && ticket.userId !== user.id) {
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

    if (status === "open" && !isFromChatbot) {
      try {
        await SetTicketMessagesAsRead(ticket);
      } catch (err) {
        logger.error(
          { ticketId, message: err?.message },
          "Could not set messages as read."
        );
      }
    }

    const oldStatus = ticket.status;
    const oldUserId = ticket.user?.id;
    const oldQueueId = ticket.queueId;

    const requestUser = reqUserId ? await User.findByPk(reqUserId) : null;

    // only admin can accept pending tickets that have no queue
    if (!oldQueueId && userId && oldStatus === "pending" && status === "open") {
      const acceptUser = await User.findByPk(userId);
      if (acceptUser.profile !== "admin") {
        throw new AppError("ERR_NO_PERMISSION", 403);
      }
    }

    if (oldStatus === "closed") {
      await CheckContactOpenTickets(ticket.contactId, ticket.whatsappId);
      chatbot = null;
      queueOptionId = null;
    }

    if (status !== undefined && ["closed"].indexOf(status) > -1) {
      if (!ticketTraking.finishedAt) {
        ticketTraking.finishedAt = moment().toDate();
        ticketTraking.whatsappId = ticket.whatsappId;
        ticketTraking.userId = ticket.userId;
      }

      if (
        userRatingSetting === "enabled" &&
        ticket.userId &&
        !isGroup &&
        !ticket.contact.disableBot
      ) {
        if (!ticketTraking.ratingAt && !justClose) {
          if (ticket.whatsapp && ticket.channel === "whatsapp") {
            const ratingTxt =
              ticket.whatsapp.ratingMessage?.trim() ||
              "Por favor avalie nosso atendimento";
            const bodyRatingMessage = `${ratingTxt}\n\n*Digite uma nota de 1 a 5*\n\nEnvie *\`!\`* para retornar ao atendimento`;

            await sendFormattedMessage(bodyRatingMessage, ticket);

            ticketTraking.ratingAt = moment().toDate();
            await ticketTraking.save();
          }

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
      }

      if (
        !isGroup &&
        !ticket.contact.disableBot &&
        !justClose &&
        ticket.whatsapp?.complationMessage.trim()
      ) {
        await sendFormattedMessage(
          ticket.whatsapp.complationMessage.trim(),
          ticket
        );
      }
    }

    if (queueId !== undefined && queueId !== null && !ticketTraking.startedAt) {
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
        const restrictTransferConnection =
          !isGroup &&
          ((await GetCompanySetting(
            companyId,
            "restrictTransferConnection",
            ""
          )) === "enabled" ||
            ticket.whatsapp?.restrictToQueues);

        const transferToNewTicket =
          !isGroup &&
          !isFromChatbot &&
          ((await GetCompanySetting(companyId, "transferToNewTicket", "")) ===
            "enabled" ||
            ticket.whatsapp?.transferToNewTicket);

        // let oldTicket: Ticket = null;
        let newWhatsapp: Whatsapp = null;

        if (
          restrictTransferConnection &&
          (queue.whatsappId || queue.whatsapps.length)
        ) {
          const isSameConnection =
            queue.whatsappId === ticket.whatsappId ||
            queue.whatsapps.find(e => e.id === ticket.whatsappId);

          if (!isSameConnection) {
            newWhatsapp =
              (await queue.$get("whatsapp")) ||
              queue.whatsapps.find(e => e.status === "CONNECTED");

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

          const { ticket: newTicket } = await FindOrCreateTicketService(
            contact,
            newWhatsapp?.id || ticket.whatsappId,
            companyId,
            { doNotReopen: true, incrementUnread: true }
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
      }
    }

    if (annotation) {
      CreateInternalMessageService(ticket, annotation, reqUserId);
    }

    // if accepting a ticket make sure there is no integration session on it
    if (status === "open" && oldStatus !== status) {
      await integrationServices.endAllSessions(ticket);
    }

    if (ticket.chatbot && !chatbot) {
      ticketTraking.chatbotendAt = moment().toDate();
    }

    await ticket.update({
      status,
      queueId,
      userId,
      whatsappId: ticket.whatsappId,
      chatbot,
      queueOptionId
    });

    if (oldStatus !== status) {
      if (oldStatus === "closed" && status === "open") {
        await incrementCounter(companyId, "ticket-reopen");
      } else if (status === "open") {
        await incrementCounter(companyId, "ticket-accept");
      } else if (status === "closed") {
        await incrementCounter(companyId, "ticket-close");
      } else if (status === "pending" && oldQueueId !== queueId) {
        await incrementCounter(companyId, "ticket-transfer");
      }
    }

    await reloadTicketService(ticket);

    status = ticket.status;

    if (status !== undefined && ["pending"].indexOf(status) > -1) {
      if (!ticketTraking.startedAt) {
        ticketTraking.whatsappId = ticket.whatsappId;
        ticketTraking.queuedAt = moment().toDate();
        ticketTraking.startedAt = null;
        ticketTraking.userId = null;
      }
      io.to(`company-${companyId}-mainchannel`).emit(
        `company-${companyId}-ticket`,
        {
          action: "removeFromList",
          ticketId: ticket?.id
        }
      );
    }

    if (status !== undefined && ["open"].indexOf(status) > -1) {
      if (!ticketTraking.startedAt) {
        ticketTraking.startedAt = moment().toDate();
        ticketTraking.ratingAt = null;
        ticketTraking.rated = false;
        ticketTraking.whatsappId = ticket.whatsappId;
        ticketTraking.userId = ticket.userId;
      }
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

    ticketTraking.save();

    if (
      !dontRunChatbot &&
      !ticket.userId &&
      ticket.queueId &&
      ticket.queueId !== oldQueueId
    ) {
      await integrationServices.endAllSessions(ticket);

      const omniDriver = omniServices.getOmniDriver(ticket);

      const wbot = !omniDriver ? await GetTicketWbot(ticket) : null;
      const replyHandler = omniDriver
        ? getOmniReplyHandler(omniDriver)
        : async (t: Ticket, r: IntegrationMessage) =>
            wbotReplyHandler(wbot, t, r);

      if (omniDriver?.allowChatbot(ticket) || !omniDriver) {
        await startQueue(replyHandler, ticket);
        await ticket.reload();
        await checkIntegration(ticket, replyHandler);
      }
    }

    if (
      !isGroup &&
      !ticket.chatbot &&
      !ticket.contact.disableBot &&
      !isFromChatbot &&
      !dontRunChatbot
    ) {
      let accepted = false;
      if (
        ticket.userId &&
        ticket.status === "open" &&
        ticket.userId !== oldUserId
      ) {
        const acceptedMessage = await GetCompanySetting(
          companyId,
          "ticketAcceptedMessage",
          ""
        );

        if (acceptedMessage) {
          const acceptUser = await User.findByPk(userId);
          await sendFormattedMessage(acceptedMessage, ticket, {
            user: acceptUser
          });
          accepted = true;
        }
      }

      if (
        !accepted &&
        oldQueueId &&
        ticket.queueId &&
        oldQueueId !== ticket.queueId &&
        ticket.whatsapp
      ) {
        const systemTransferMessage = await GetCompanySetting(
          companyId,
          "transferMessage",
          ""
        );
        const transferMessage =
          ticket.whatsapp.transferMessage || systemTransferMessage;

        if (transferMessage) {
          await sendFormattedMessage(transferMessage, ticket);
        }
      }
    }

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

    websocketUpdateTicket(ticket, [`user-${oldUserId}`]);

    return { ticket, oldStatus, oldUserId };
  } catch (err) {
    logger.error({ message: err?.message }, "UpdateTicketService");
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError("Error updating ticket", 500, err);
  }
};

/**
 * @description: call UpdateTicketService to update ticket status, if ticketData have a queue id or parameter dontRunChatbot is true it will not run the chatbot
 * @params {Ticket} ticket - ticket to be updated
 * @params {UpdateTicketData} ticketData - data to be updated
 * @params {boolean} dontRunChatbot - if true, it will not run the chatbot
 * @returns {Promise<Ticket>} - updated ticket
 */
export async function updateTicket(
  ticket: Ticket,
  ticketData: UpdateTicketData,
  dontRunChatbot = false
): Promise<Ticket> {
  await UpdateTicketService({
    ticketData,
    ticketId: ticket.id,
    companyId: ticket.companyId,
    dontRunChatbot: dontRunChatbot || !!ticketData.queueId
  });
  await ticket.reload();
  return ticket;
}

export default UpdateTicketService;
