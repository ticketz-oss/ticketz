/*

   DO NOT REMOVE / NÃO REMOVER

   VERSÃO EM PORTUGUÊS MAIS ABAIXO

   
   BASIC LICENSE INFORMATION:

   Author: Claudemir Todo Bom
   Email: claudemir@todobom.com
   
   Licensed under the AGPLv3 as stated on LICENSE.md file
   
   Any work that uses code from this file is obligated to 
   give access to its source code to all of its users (not only
   the system's owner running it)
   
   EXCLUSIVE LICENSE to use on closed source derived work can be
   purchased from the author and put at the root of the source
   code tree as proof-of-purchase.



   INFORMAÇÕES BÁSICAS DE LICENÇA

   Autor: Claudemir Todo Bom
   Email: claudemir@todobom.com

   Licenciado sob a licença AGPLv3 conforme arquivo LICENSE.md
    
   Qualquer sistema que inclua este código deve ter o seu código
   fonte fornecido a todos os usuários do sistema (não apenas ao
   proprietário da infraestrutura que o executa)
   
   LICENÇA EXCLUSIVA para uso em produto derivado em código fechado
   pode ser adquirida com o autor e colocada na raiz do projeto
   como prova de compra. 
   
 */

import { Mutex } from "async-mutex";
import { Client, MessageSubscription, TextContent } from "notificamehubsdk";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import { IntegrationOptions } from "../IntegrationServices/IntegrationServices";
import { OmniDriver, OmniMessage } from "./OmniServices";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import CreateMessageService from "../MessageServices/CreateMessageService";
import { NgrokInstance } from "../../helpers/NgrokInstance";
import User from "../../models/User";

const contactMutex = new Mutex();
const ticketMutex = new Mutex();
const messageMutex = new Mutex();

export type NotificamehubVisitor = {
  name: string;
  firstName: string;
  lastName: string;
  picture: string;
};

export type NotificamehubGroup = {
  id: string;
  name: string;
};

export type NotificamehubContent = {
  type: "text" | "photo";
  text?: string;
  fileUrl?: string;
  fileMimeType?: string;
  fileName?: string;
};

export type NotificamehubMessage = {
  id: string;
  from: string;
  to: string;
  direction: "IN" | "OUT";
  channel: string;
  visitor: NotificamehubVisitor;
  group: NotificamehubGroup;
  isGroup: boolean;
  contents: NotificamehubContent[];
  timestamp: string;
};

export type NotificamehubMessageStatus = {
  timestamp: string;
  code: "SENT";
  description: string;
};

export type NotificamehubStatusMessage = {
  type: "MESSAGE_STATUS";
  messageId: string;
  subscriptionId: string;
  channel: string;
  timestamp: string;
  messageStatus: NotificamehubMessageStatus;
};

async function initializeWebhook(whatsapp: Whatsapp): Promise<Client> {
  let session: { hubToken: string; hubChannel: string };
  try {
    session = JSON.parse(whatsapp.session);
  } catch (e) {
    throw new Error("ERR_INVALID_SESSION");
  }

  const { hubToken, hubChannel: channel } = session;
  if (!hubToken || !channel) {
    throw new Error("ERR_INVALID_SESSION");
  }

  const client = new Client(hubToken);

  const backendUrl =
    NgrokInstance.getInstance().getUrl() || process.env.BACKEND_URL;

  const url = `${backendUrl}/notificamehub/webhook/${channel}`;

  const subscription = new MessageSubscription(
    {
      url
    },
    {
      channel
    }
  );

  client
    .createSubscription(subscription)
    .then((response: any) => {
      logger.info({ response }, `Webhook subscribed to url: ${url}`);
    })
    .catch((error: any) => {
      logger.error(error, "Error subscribing to webhook");
    });

  await Whatsapp.update(
    {
      status: "CONNECTED",
      qrcode: channel
    },
    {
      where: {
        id: whatsapp.id
      }
    }
  );

  return client;
}

export class NotificamehubDriver implements OmniDriver {
  private name = "notificamehub";

  private description = "Notificamehub";

  private sessions = {};

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  // eslint-disable-next-line class-methods-use-this
  initialize(): void {
    // do nothing
  }

  // eslint-disable-next-line class-methods-use-this
  getOptions(): IntegrationOptions {
    return {
      fields: [
        {
          name: "hubToken",
          title: "Hub Token",
          description: "Token to access the Notificamehub API",
          type: "text",
          required: true
        },
        {
          name: "channelId",
          title: "Channel ID",
          description: "Channel ID to access the Notificamehub API",
          type: "text",
          required: true
        }
      ]
    };
  }

  private static normalizeMessage(data: any): NotificamehubMessage {
    const message = data?.message || data?.body?.message;

    if (!message) {
      logger.error({ body: data?.body || data }, "Invalid notificamehub data");
      throw new Error("Invalid notificamehub data");
    }

    return message;
  }

  // eslint-disable-next-line class-methods-use-this
  async getConnection(data: any): Promise<Whatsapp> {
    const message = NotificamehubDriver.normalizeMessage(data);

    const whatsapp = await Whatsapp.findOne({
      where: {
        qrcode: message.to
      }
    });

    return whatsapp;
  }

  async startService(connection: Whatsapp): Promise<void> {
    const client = await initializeWebhook(connection);

    this.sessions[connection.id] = client;
  }

  // eslint-disable-next-line class-methods-use-this
  async findOrCreateContact(connection: Whatsapp, data: any): Promise<Contact> {
    logger.debug("notificamehub:findOrCreateContact");

    const message = NotificamehubDriver.normalizeMessage(data);

    return contactMutex.runExclusive(async () => {
      return (
        (await Contact.findOne({
          where: {
            companyId: connection.companyId,
            channel: message.channel,
            number: message.from
          }
        })) ||
        Contact.create({
          companyId: connection.companyId,
          name: message.visitor.name || message.from,
          channel: message.channel,
          number: message.from
        })
      );
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async findOrCreateTicket(
    contact: Contact,
    connection: Whatsapp
  ): Promise<{ ticket: Ticket; justCreated: boolean }> {
    logger.debug("notificamehub:findOrCreateTicket");

    return ticketMutex.runExclusive(async () => {
      return FindOrCreateTicketService(
        contact,
        connection.id,
        1,
        connection.companyId
      );
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async createMessage(ticket: Ticket, data: any): Promise<Message> {
    logger.debug("notificamehub:createMessage");

    const message = NotificamehubDriver.normalizeMessage(data);

    return CreateMessageService({
      messageData: {
        id: message.id,
        contactId: ticket.contactId,
        ticketId: ticket.id,
        body: message.contents[0]?.text || "empty message",
        channel: ticket.contact.channel
      },
      companyId: ticket.companyId
    });
  }

  async sendMessage(ticket: Ticket, message: OmniMessage): Promise<Message> {
    logger.debug("notificamehub:sendMessage");

    const connection = await Whatsapp.findByPk(ticket.whatsappId);
    const client = this.sessions[connection.id];

    let messageContent: TextContent;
    if (message.type === "text") {
      messageContent = new TextContent(message.body);
    }

    const channel = client.setChannel(ticket.contact.channel);

    if (!messageContent) {
      throw new Error("Invalid message data");
    }

    return messageMutex.runExclusive(async () => {
      const result = await channel.sendMessage(
        connection.qrcode,
        ticket.contact.number,
        messageContent
      );
      logger.debug({ result }, "Message sent");

      return CreateMessageService({
        messageData: {
          id: result.id,
          contactId: ticket.contactId,
          ticketId: ticket.id,
          body: message.body,
          fromMe: true,
          channel: ticket.contact.channel
        },
        companyId: ticket.companyId
      });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async processStatus(data: NotificamehubStatusMessage): Promise<Message> {
    logger.debug("notificamehub:processStatus");
    logger.debug({ data }, "Status received");

    const connection = await Whatsapp.findOne({
      where: {
        qrcode: data.subscriptionId
      }
    });

    if (!connection) {
      throw new Error("ERR_INVALID_SESSION");
    }

    await messageMutex.runExclusive(async () => {
      // just wait other mutexes
    });

    const message = await Message.findOne({
      where: {
        id: data.messageId
      },
      include: [
        "contact",
        {
          model: User,
          attributes: { exclude: ["passwordHash"] },
          required: false
        },
        {
          model: Message,
          as: "quotedMsg",
          include: ["contact"]
        },
        {
          model: Ticket,
          as: "ticket",
          required: true,
          where: {
            whatsappId: connection.id
          }
        }
      ]
    });
    message.ack = 2;
    return message.save();
  }
}
