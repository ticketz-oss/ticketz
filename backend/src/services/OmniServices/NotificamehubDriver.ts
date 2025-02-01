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
import {
  Client,
  MessageSubscription,
  TextContent,
  FileContent
} from "notificamehubsdk";
import { Op } from "sequelize";
import { getLinkPreview } from "link-preview-js";
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
import downloadFile from "../../helpers/downloadFile";
import saveMediaToFile from "../../helpers/saveMediaFile";
import NotificamehubIdMapping from "../../models/NotificamehubIdMapping";

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
  type: "text" | "photo" | "image" | "video" | "voice" | "document";
  text?: string;
  fileUrl?: string;
  fileMimeType?: string;
  fileName?: string;
  item?: string;
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
  providerMessageId?: string;
};

export type NotificamehubStatusMessage = {
  type: "MESSAGE_STATUS";
  messageId: string;
  subscriptionId: string;
  channel: string;
  timestamp: string;
  messageStatus: NotificamehubMessageStatus;
};

const statusAck = {
  REJECTED: -1,
  PENDING: 0,
  SENT: 1,
  DELIVERED: 2,
  READ: 3
};

const defaultTypeMapping = {
  image: "image",
  audio: "audio",
  video: "video",
  document: "file"
};

const typeMappings = {
  telegram: {
    image: "photo",
    audio: "audio",
    video: "video",
    document: "file"
  },
  facebook: defaultTypeMapping,
  instagram: defaultTypeMapping,
  webchat: defaultTypeMapping
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

function normalizeChannel(channel: string): string {
  if (channel.startsWith("whatsapp")) {
    return "whatsapp";
  }
  return channel.toLowerCase();
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
    const channel = normalizeChannel(message.channel);

    return contactMutex.runExclusive(async () => {
      return (
        (await Contact.findOne({
          where: {
            companyId: connection.companyId,
            channel,
            number: String(message.from)
          }
        })) ||
        Contact.create({
          companyId: connection.companyId,
          name:
            `${message.visitor.firstName} ${message.visitor.lastName}`.trim() ||
            message.visitor.name ||
            String(message.from),
          channel,
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
  async createMessages(ticket: Ticket, data: any): Promise<Message[]> {
    logger.debug("notificamehub:createMessage");

    const message = NotificamehubDriver.normalizeMessage(data);

    const newMessages = message.contents.map(async content => {
      // download file
      const file = content.fileUrl ? await downloadFile(content.fileUrl) : null;

      let mediaUrl;
      let thumbnailUrl;
      const finalContent = JSON.parse(JSON.stringify(content));

      if (file) {
        let overrideMimeType: string;
        let overrideFilename: string;

        if (
          message.channel === "instagram" &&
          content.fileName === "ig_messaging_cdn"
        ) {
          switch (content.type) {
            case "image":
            case "photo":
              overrideMimeType = "image/jpeg";
              overrideFilename = "instagram.jpg";
              break;
            case "voice":
              overrideMimeType = "audio/mp3";
              overrideFilename = "instagram.mp3";
              break;
            case "video":
              overrideMimeType = "video/mp4";
              overrideFilename = "instagram.mp4";
              break;
            default:
              break;
          }
        }

        const mimetype = overrideMimeType || content.fileMimeType;
        const filename = overrideFilename || content.fileName;

        finalContent.fileMimeType = mimetype;
        finalContent.fileName = filename;

        mediaUrl = await saveMediaToFile(
          {
            data: file,
            mimetype,
            filename
          },
          ticket
        );
      }

      if (content.type === "text" && content.item) {
        finalContent.itemPreview = await getLinkPreview(content.item);

        if (finalContent.itemPreview?.images?.length > 0) {
          thumbnailUrl = await saveMediaToFile(
            {
              data: await downloadFile(finalContent.itemPreview.images[0]),
              mimetype: "image/jpeg",
              filename:
                finalContent.itemPreview.images[0].split("/")?.pop() ||
                "image.jpeg"
            },
            ticket
          );
        }
      }

      return CreateMessageService({
        messageData: {
          id: message.id,
          contactId: ticket.contactId,
          ticketId: ticket.id,
          body: content.text || "",
          channel: ticket.contact.channel,
          mediaType: file
            ? finalContent.fileMimeType.split("/")[0] || "document"
            : "",
          mediaUrl,
          thumbnailUrl,
          dataJson: JSON.stringify(finalContent)
        },
        companyId: ticket.companyId
      });
    });

    return Promise.all(newMessages);
  }

  async sendMessage(ticket: Ticket, message: OmniMessage): Promise<Message[]> {
    logger.debug("notificamehub:sendMessage");

    const connection = await Whatsapp.findByPk(ticket.whatsappId);
    const client = this.sessions[connection.id];

    let textContent: TextContent;
    const promises = [];

    if (message.type === "text") {
      textContent = new TextContent(message.body);
    }

    const channel = client.setChannel(ticket.contact.channel);

    if (textContent)
      promises.push(
        messageMutex.runExclusive(async () => {
          const result = await channel.sendMessage(
            connection.qrcode,
            ticket.contact.number,
            textContent
          );
          logger.debug({ result }, "Message body sent");

          const sentMessage = await CreateMessageService({
            messageData: {
              id: result.id,
              contactId: ticket.contactId,
              ticketId: ticket.id,
              body: message.body,
              fromMe: true,
              channel: ticket.contact.channel,
              dataJson: JSON.stringify(message)
            },
            companyId: ticket.companyId
          });
          return sentMessage;
        })
      );

    if (["image", "audio", "video", "document"].includes(message.type)) {
      const fileContent = new FileContent(
        message.mediaUrl,
        typeMappings[ticket.contact.channel][message.type] || "file",
        message.fileName,
        message.fileName
      );
      promises.push(
        messageMutex.runExclusive(async () => {
          const result = await channel.sendMessage(
            connection.qrcode,
            ticket.contact.number,
            fileContent
          );
          logger.debug({ result }, "Message media sent");

          const sentMessage = await CreateMessageService({
            messageData: {
              id: result.id,
              contactId: ticket.contactId,
              ticketId: ticket.id,
              body: "",
              fromMe: true,
              channel: ticket.contact.channel,
              mediaType: message.mimetype.split("/")[0],
              mediaUrl: message.mediaUrl,
              dataJson: JSON.stringify(message)
            },
            companyId: ticket.companyId
          });
          return sentMessage;
        })
      );
    }

    return Promise.all(promises);
  }

  // eslint-disable-next-line class-methods-use-this
  async processStatus(data: NotificamehubStatusMessage): Promise<Message> {
    logger.debug("notificamehub:processStatus");
    logger.debug({ data }, "Status received");

    const messageInclude = [
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
        include: [
          {
            model: Whatsapp,
            as: "whatsapp",
            required: true,
            where: {
              qrcode: data.subscriptionId
            }
          }
        ]
      }
    ];

    let message: Message;
    await messageMutex.runExclusive(async () => {
      if (data?.messageStatus?.providerMessageId) {
        const notificamehubIdMapping = await NotificamehubIdMapping.findByPk(
          `${data.subscriptionId}:${data.messageStatus.providerMessageId}`,
          {
            include: [
              {
                model: Message,
                as: "message",
                include: messageInclude,
                where: {
                  ticketId: {
                    [Op.col]: "NotificamehubIdMapping.ticketId"
                  }
                }
              }
            ]
          }
        );
        if (notificamehubIdMapping) {
          message = notificamehubIdMapping.message;
        } else {
          message = await Message.findByPk(data.messageId, {
            include: messageInclude
          });

          if (message) {
            await NotificamehubIdMapping.create({
              id: `${data.subscriptionId}:${data.messageStatus.providerMessageId}`,
              messageId: message.id,
              ticketId: message.ticketId
            });
          }
        }
      } else {
        message = await Message.findByPk(data.messageId, {
          include: messageInclude
        });
      }
    });

    if (!message) {
      return null;
    }

    const ack = statusAck[data.messageStatus.code] || 1;
    return message.update(
      {
        ack
      },
      {
        where: {
          id: message.id,
          ack: { [Op.lt]: ack }
        }
      }
    );
  }
}
