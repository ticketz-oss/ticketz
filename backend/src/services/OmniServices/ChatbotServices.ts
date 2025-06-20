import { GetCompanySetting } from "../../helpers/CheckSettings";
import formatBody from "../../helpers/Mustache";
import Contact from "../../models/Contact";
import Integration from "../../models/Integration";
import IntegrationSession from "../../models/IntegrationSession";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import ShowContactService from "../ContactServices/ShowContactService";
import {
  IntegrationMessage,
  IntegrationMessageMetadata,
  IntegrationMessageTypes,
  IntegrationServices
} from "../IntegrationServices/IntegrationServices";
import ShowTicketService from "../TicketServices/ShowTicketService";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import { OmniDriver } from "./OmniServices";

const integrationServices = IntegrationServices.getInstance();

async function replyHandler(
  ticket: Ticket,
  reply: IntegrationMessage,
  driver: OmniDriver
) {
  if (ticket && reply) {
    await driver.sendMessage(ticket, {
      type: reply.type === "gif" ? "image" : reply.type,
      body: reply.content || undefined,
      mediaUrl: reply.mediaUrl || undefined
    });
  }
}

async function showConnectionMenu(
  driver: OmniDriver,
  ticket: Ticket,
  connection: Whatsapp
) {
  let body = `${formatBody(connection.greetingMessage, ticket)}\n\n`;

  connection.queues.forEach((q, i) => {
    body += `${i + 1} - ${q.name}\n`;
  });

  await driver.sendMessage(ticket, {
    type: "text",
    body
  });
}

async function startQueueMenu(
  driver: OmniDriver,
  ticket: Ticket,
  connection: Whatsapp
) {
  logger.debug("QueueChatbot:handleQueueMenu");

  await showConnectionMenu(driver, ticket, connection);

  await UpdateTicketService({
    ticketData: { status: "pending", chatbot: true },
    ticketId: ticket.id,
    companyId: ticket.companyId,
    dontRunChatbot: true
  });
}

async function handleQueueMenu(
  driver: OmniDriver,
  ticket: Ticket,
  connection: Whatsapp,
  message: Message,
  firstIteration = false
) {
  logger.debug("QueueChatbot:handleQueueMenu");

  const selected = Number(message?.body);

  if (selected > 0 && connection.queues[selected - 1]) {
    await UpdateTicketService({
      ticketData: { queueId: connection.queues[selected - 1].id },
      ticketId: ticket.id,
      companyId: ticket.companyId
    });
    await ticket.reload();
    return;
  }

  if (
    !firstIteration &&
    (await GetCompanySetting(
      ticket.companyId,
      "chatbotAutoExit",
      "disabled"
    )) === "enabled"
  ) {
    await UpdateTicketService({
      ticketData: { chatbot: false, status: "pending" },
      ticketId: ticket.id,
      companyId: ticket.companyId,
      dontRunChatbot: true
    });
    await ticket.reload();
  }
}

export const checkIntegration = async (
  source: Message | Ticket,
  driver: OmniDriver,
  firstIteration?: boolean
) => {
  const message = source instanceof Message ? source : null;
  const ticket =
    source instanceof Ticket
      ? source
      : message && (await ShowTicketService(message.ticketId));

  if (!ticket) {
    throw new Error("checkIntegration: Invalid source");
  }

  if (!ticket.chatbot) {
    return;
  }

  const { contactId } = ticket;
  const contact = await ShowContactService(contactId);

  const integrationSession = await IntegrationSession.findOne({
    where: {
      ticketId: ticket.id
    },
    include: [
      "integration",
      {
        model: Ticket,
        as: "ticket",
        include: ["contact", "whatsapp"]
      }
    ],
    order: [["id", "DESC"]]
  });

  if (integrationSession) {
    let integrationMessage: IntegrationMessage = null;
    const metadata: IntegrationMessageMetadata = {
      channel: "whatsapp",
      from: contact.toJSON(),
      ticketId: integrationSession.ticketId
    };

    if (message) {
      metadata.customPayload = JSON.parse(message.dataJson);
      integrationMessage = { type: "text" };
      const messagedetails = {
        id: message.id,
        body: message.body,
        mediaType: message.mediaType,
        messageMedia: message.mediaUrl
      };
      logger.debug({ messagedetails }, "Integration message details");
      integrationMessage.content = message.body;
      integrationMessage.type =
        (message.mediaType as IntegrationMessageTypes) || "text";
      if (message.mediaUrl) {
        integrationMessage.mediaUrl = message.mediaUrl;
      }
    }

    await integrationServices.continueSession(
      integrationSession,
      integrationMessage,
      metadata,
      async (t, r) => replyHandler(t, r, driver)
    );

    return;
  }

  const connection = await ShowWhatsAppService(ticket.whatsappId);

  if (!connection) {
    logger.error("checkIntegration: No connection found for ticket", ticket.id);
    return;
  }

  if (connection.queues.length > 1) {
    await handleQueueMenu(
      driver,
      ticket,
      connection,
      message,
      !!firstIteration
    );
  }
};

async function startQueue(
  ticket: Ticket,
  driver: OmniDriver,
  message: Message
) {
  logger.debug("QueueChatbot:startQueue");

  const { queue } = ticket;

  if (!queue) {
    const connection = await ShowWhatsAppService(ticket.whatsappId);

    if (!connection) {
      logger.error(
        "QueueChatbot:startQueue - No connection found for ticket",
        ticket.id
      );
      return;
    }

    if (connection.queues.length > 1) {
      await startQueueMenu(driver, ticket, connection);
      return;
    }

    logger.debug("QueueChatbot:startQueue - No queue found");
    return;
  }

  const integration = await Integration.findOne({
    where: {
      queueId: queue.id
    }
  });

  if (integration) {
    const integrationMetadata: IntegrationMessageMetadata = {
      channel: ticket.contact.channel,
      from: ticket.contact || (await Contact.findByPk(ticket.contactId)),
      ticketId: ticket.id,
      firstMessage: message?.body || undefined
    };

    await UpdateTicketService({
      ticketData: { queueId: queue.id, chatbot: true, status: "pending" },
      ticketId: ticket.id,
      companyId: ticket.companyId,
      dontRunChatbot: true
    });

    await ticket.reload();

    const { message: reply } = await integrationServices.startSession(
      integration,
      ticket,
      null,
      integrationMetadata,
      async (t, r) => replyHandler(t, r, driver)
    );

    if (reply) {
      await replyHandler(ticket, reply, driver);
    }
  }
}

export async function chatbotHandler(
  driver: OmniDriver,
  ticket: Ticket,
  message?: Message
) {
  logger.trace("QueueChatbot:automationHandler");

  const firstIteration = !ticket.chatbot;
  if (firstIteration) {
    await startQueue(ticket, driver, message);
  }
  await checkIntegration(message || ticket, driver, firstIteration);
}
