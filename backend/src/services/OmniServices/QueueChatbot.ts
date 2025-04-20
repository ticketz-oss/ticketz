import Contact from "../../models/Contact";
import Integration from "../../models/Integration";
import IntegrationSession from "../../models/IntegrationSession";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { logger } from "../../utils/logger";
import {
  IntegrationMessage,
  IntegrationMessageMetadata,
  IntegrationMessageTypes,
  IntegrationServices
} from "../IntegrationServices/IntegrationServices";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
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

export const checkIntegration = async (
  source: Message | Ticket,
  driver: OmniDriver
) => {
  const message = source instanceof Message ? source : null;
  const ticket = source instanceof Ticket ? source : null;

  if (!message && !ticket) {
    throw new Error("checkIntegration: Invalid source");
  }

  const contactId = message?.contactId || ticket.contactId;
  const contact =
    message?.contact || ticket?.contact || (await Contact.findByPk(contactId));

  const integrationSession = await IntegrationSession.findOne({
    where: {
      ticketId: message?.ticketId || ticket.id
    },
    include: [
      {
        model: Integration,
        as: "integration"
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

    return true;
  }
  return false;
};

async function startQueue(
  ticket: Ticket,
  driver: OmniDriver,
  message: Message
) {
  logger.debug("QueueChatbot:startQueue");

  if (!ticket.queue) {
    logger.debug("QueueChatbot:startQueue - No queue found");
    return;
  }

  const { queue } = ticket;

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
      firstMessage: message.body
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

export async function automationHandler(
  messages: Message[],
  driver: OmniDriver
) {
  logger.trace("QueueChatbot:automationHandler");

  const [firstMessage] = messages;
  const { ticket } = firstMessage;

  if (!firstMessage) {
    logger.debug("QueueChatbot:automationHandler - No messages found");
    return;
  }

  if (!ticket.chatbot) {
    await startQueue(ticket, driver, firstMessage);
  }
  await checkIntegration(firstMessage, driver);
}
