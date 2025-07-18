/*

   DO NOT REMOVE / NÃO REMOVER

   VERSÃO EM PORTUGUÊS MAIS ABAIXO

   PROPRIETARY CODE

   Author: Claudemir Todo Bom
   Email: claudemir@todobom.com
   
   If you had access to this code, you are not allowed to
   share, copy or distribute it. You are not allowed to use
   it in your projects, create your own projects based on
   it or use it in any way without a written authorization.
   
   CÓDIGO PROPRIETÁRIO

   Autor: Claudemir Todo Bom
   Email: claudemir@todobom.com

   Se você teve acesso a este código, não está autorizado a
   compartilhá-lo, copiá-lo ou distribuí-lo. Não está autorizado
   a utilizá-lo em seus projetos, criar projetos baseados nele
   ou utilizá-lo de qualquer forma sem autorização por escrito.
   
 */

import { Mutex } from "async-mutex";
import {
  Client,
  MessageSubscription,
  TextContent,
  ReplyContent,
  ReactionContent,
  FileContent,
  TemplateContent
} from "notificamehubsdk";
import { Op } from "sequelize";
import { getLinkPreview } from "link-preview-js";
import { Readable } from "stream";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import { IntegrationOptions } from "../IntegrationServices/IntegrationServices";
import {
  OmniDriver,
  OmniMessage,
  OmniSendMessageOptions
} from "../OmniServices/OmniServices";
import FindOrCreateTicketService, {
  FindOrCreateTicketOptions
} from "../TicketServices/FindOrCreateTicketService";
import CreateMessageService from "../MessageServices/CreateMessageService";
import { NgrokInstance } from "../../helpers/NgrokInstance";
import User from "../../models/User";
import downloadFile from "../../helpers/downloadFile";
import saveMediaToFile from "../../helpers/saveMediaFile";
import NotificamehubIdMapping from "../../models/NotificamehubIdMapping";
import { DebugException } from "../../helpers/DebugException";
import { makeRandomId } from "../../helpers/MakeRandomId";
import { getMimeByExtension } from "../../helpers/getMimeByExtension";
import {
  convertAudioToAac,
  convertAudioToOggOpus,
  MediaSource,
  ProcessedMedia
} from "../../helpers/mediaConversion";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import { verifyContact } from "../WbotServices/verifyContact";
import Queue from "../../models/Queue";

const contactMutex = new Mutex();
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

export type NotificamehubContentMedia = {
  id: string;
  link: string;
};

export type NotificamehubMessageReference = {
  providerMessageId: string;
};

export type NotificamehubReaction = {
  reaction?: string;
  emoji?: string;
  reaction_to?: NotificamehubMessageReference;
};

export type NotificamehubMessageContext = {
  from: string;
  id: string;
};

export type NotificamehubContent = {
  type:
    | "text"
    | "photo"
    | "image"
    | "video"
    | "audio"
    | "voice"
    | "document"
    | "comment"
    | "reaction";
  id?: string;
  text?: string;
  media?: NotificamehubContentMedia;
  fileUrl?: string;
  fileMimeType?: string;
  fileName?: string;
  caption?: string;
  item?: string;
  reaction?: NotificamehubReaction;
};

export type NotificamehubMessage = {
  type: string;
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
  context?: NotificamehubMessageContext;
};

export type NotificamehubPayload = {
  type: string;
  id: string;
  timestamp: string;
  subscriptionId: string;
  providerMessageId: string;
  channel: string;
  direction: "IN" | "OUT";
  message: NotificamehubMessage;
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
  PENDING: 1,
  SENT: 2,
  DELIVERED: 3,
  READ: 4
};

const defaultTypeMapping = {
  image: "image",
  audio: "audio",
  video: "video",
  default: "file"
};

const typeMappings = {
  telegram: {
    image: "photo",
    audio: "audio",
    video: "video",
    default: "file"
  },
  facebook: defaultTypeMapping,
  instagram: defaultTypeMapping,
  whatsapp: {
    image: "image",
    audio: "audio",
    video: "video",
    default: "document"
  },
  webchat: defaultTypeMapping
};

const audioMediaProcessors = {
  instagram: convertAudioToAac,
  whatsapp: convertAudioToAac,
  default: convertAudioToOggOpus
};

const chatbotChannels = [
  "whatsapp",
  "instagram",
  "facebook",
  "telegram",
  "webchat"
];

const ngrokInstance = NgrokInstance.getInstance();

function getBackendUrl() {
  return ngrokInstance.getUrl() || process.env.BACKEND_URL;
}

export type NotificamehubSession = {
  client: Client;
  hubChannel: string;
};

async function initializeWebhook(
  whatsapp: Whatsapp
): Promise<NotificamehubSession> {
  let session: { hubToken: string; hubChannel: string };
  try {
    session = JSON.parse(whatsapp.session);
  } catch (e) {
    throw new Error("ERR_INVALID_SESSION");
  }

  const { hubToken, hubChannel } = session;
  if (!hubToken || !hubChannel) {
    throw new Error("ERR_INVALID_SESSION");
  }

  const client = new Client(hubToken);

  const url = `${getBackendUrl()}/notificamehub/webhook/${hubChannel}`;

  const subscription = new MessageSubscription(
    {
      url
    },
    {
      channel: hubChannel
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
      qrcode: hubChannel
    },
    {
      where: {
        id: whatsapp.id
      }
    }
  );

  return { client, hubChannel };
}

function normalizeChannel(channel: string): string {
  if (channel.startsWith("whatsapp")) {
    return "whatsapp";
  }
  return channel.toLowerCase();
}

function checkSupportedPayload(data: NotificamehubPayload): void {
  if (
    ["facebook"].includes(data.channel) &&
    data.message.contents[0].type === "comment"
  ) {
    throw new DebugException(
      "notificamehub: facebook comments is unsupported yet"
    );
  }

  if (
    ["facebook"].includes(data.channel) &&
    data.message.contents[0].type === "reaction"
  ) {
    throw new DebugException(
      "notificamehub: facebook reactions is unsupported yet"
    );
  }
}

async function downloadAndSaveMedia(url: string, companyId: number) {
  const parsedUrl = new URL(url);
  const filename = parsedUrl.pathname.split("/").pop().split("?").shift();
  const mimetype = getMimeByExtension(filename.split(".").pop());
  const data = await downloadFile(url);

  if (!data) {
    return null;
  }

  return saveMediaToFile(
    {
      data,
      mimetype,
      filename
    },
    null,
    null,
    companyId
  );
}

async function downloadProfileImage(
  message: NotificamehubMessage,
  companyId: number
) {
  const mediaFile = await downloadFile(message.visitor.picture);

  if (!mediaFile) {
    return null;
  }
  return saveMediaToFile(
    {
      data: mediaFile,
      mimetype: "image/jpeg",
      filename: `${message.from || makeRandomId(10)}-profile.jpeg`
    },
    null,
    null,
    companyId
  );
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
        },
        {
          name: "hubDefaultTemplate",
          title: "Default Message Template",
          description: "Default template name for first contact messages",
          type: "text",
          required: false
        }
      ]
    };
  }

  private static normalizeMessage(
    data: NotificamehubPayload
  ): NotificamehubMessage {
    const message = data?.message;

    if (!message) {
      logger.error({ data }, "Invalid notificamehub data");
      throw new Error("Invalid notificamehub data");
    }

    return message;
  }

  // eslint-disable-next-line class-methods-use-this
  async getConnection(data: NotificamehubPayload): Promise<Whatsapp> {
    const message = NotificamehubDriver.normalizeMessage(data);

    checkSupportedPayload(data);

    const whatsapp = await Whatsapp.findOne({
      where: {
        qrcode: message.direction === "OUT" ? message.from : message.to
      },
      include: ["queues"]
    });

    return whatsapp;
  }

  // eslint-disable-next-line class-methods-use-this
  async getMessageText(data: NotificamehubPayload): Promise<string> {
    logger.debug("notificamehub:getMessageText");

    const message = NotificamehubDriver.normalizeMessage(data);

    if (message.direction === "OUT") {
      return null;
    }

    if (!message.contents || message.contents.length === 0) {
      return null;
    }

    const content = message.contents[0];

    if (content?.type === "text") {
      return content.text || null;
    }

    return null;
  }

  // eslint-disable-next-line class-methods-use-this
  async allowChatbot(ticket: Ticket): Promise<boolean> {
    logger.debug("notificamehub:allowChatbot");

    const channel = ticket.contact?.channel;

    if (!chatbotChannels.includes(channel)) {
      return false;
    }

    if (channel === "instagram") {
      return !ticket.contact.number.startsWith("post:");
    }

    return true;
  }

  async startService(connection: Whatsapp): Promise<void> {
    const session = await initializeWebhook(connection);

    this.sessions[connection.id] = session;
  }

  // eslint-disable-next-line class-methods-use-this
  async findOrCreateContact(
    connection: Whatsapp,
    data: NotificamehubPayload,
    forcePoster = false
  ): Promise<Contact> {
    logger.debug("notificamehub:findOrCreateContact");

    if (data.direction === "OUT") {
      throw new DebugException(
        "notificamehub:findOrCreateContact: Invalid direction"
      );
    }

    const message = NotificamehubDriver.normalizeMessage(data);
    const channel = normalizeChannel(message.channel);

    let contactAddress = String(message.from);
    let contactImageUrl: string;
    const fullName =
      `${message.visitor.firstName} ${message.visitor.lastName}`.trim();
    let name = fullName || message.visitor.name || String(message.from);
    let email: string;

    if (
      !forcePoster &&
      message.channel === "instagram" &&
      message.contents[0]?.type === "comment"
    ) {
      const postId = message.contents[0].media.id;
      const mediaLink = message.contents[0].media.link;
      contactAddress = `post:${postId}`;
      const postPreview: any = await getLinkPreview(mediaLink);
      contactImageUrl = postPreview?.images?.[0];
      name =
        postPreview?.title || `Instagram Post id: ${postId} at ${mediaLink}`;
    } else {
      email = `@${message.visitor.name}` || undefined;
    }

    return contactMutex.runExclusive(async () => {
      if (channel === "whatsapp") {
        try {
          const defaultWhatsapp = await GetDefaultWhatsApp(
            connection.companyId
          );
          const wbot = getWbot(defaultWhatsapp.id);
          if (wbot) {
            return verifyContact(
              { name, id: `${contactAddress}@s.whatsapp.net` },
              wbot,
              connection.companyId
            );
          }
        } catch (error) {
          logger.debug(
            { message: error.message, companyId: connection.companyId },
            "notificamehub:findOrCreateContact: Unable to check contact on whatsapp - falling back"
          );
        }
      }

      return (
        (await Contact.findOne({
          where: {
            companyId: connection.companyId,
            channel,
            number: contactAddress
          }
        })) ||
        Contact.create({
          companyId: connection.companyId,
          name,
          channel,
          number: contactAddress,
          email,
          profilePicUrl: contactImageUrl
            ? await downloadAndSaveMedia(contactImageUrl, connection.companyId)
            : await downloadProfileImage(message, connection.companyId)
        })
      );
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async findOrCreateTicket(
    contact: Contact,
    connection: Whatsapp,
    options: FindOrCreateTicketOptions = {}
  ): Promise<{ ticket: Ticket; justCreated: boolean }> {
    logger.debug("notificamehub:findOrCreateTicket");

    return FindOrCreateTicketService(
      contact,
      connection.id,
      connection.companyId,
      options
    );
  }

  // eslint-disable-next-line class-methods-use-this
  async startTicket(ticket: Ticket): Promise<void> {
    logger.debug("notificamehub:startTicket");

    const connection = await Whatsapp.findByPk(ticket.whatsappId);

    if (!connection) {
      throw new Error("notificamehub:startTicket: Connection not found");
    }

    const { hubWhatsappTemplate } = JSON.parse(connection.session || "{}");
    if (!hubWhatsappTemplate) {
      throw new Error(
        "notificamehub:startTicket: Hub Whatsapp Template not found"
      );
    }

    const contact = await Contact.findByPk(ticket.contactId);

    if (contact.channel !== "whatsapp") {
      return;
    }

    const { client } = this.sessions[connection.id];

    if (!client) {
      return;
    }

    const user = await User.findByPk(ticket.userId);

    const channel = client.setChannel(contact.channel);

    const parameters = {
      name: contact.name || contact.number,
      user: user?.name || "Atendant",
      protocol: `${ticket.createdAt
        .toISOString()
        .split("T")[0]
        .replace(/[^0-9]/g, "")}-${ticket.id}`
    };

    const content = new TemplateContent({
      name: hubWhatsappTemplate,
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              parameter_name: "name",
              text: parameters.name
            },
            {
              type: "text",
              parameter_name: "user",
              text: parameters.user
            },
            {
              type: "text",
              parameter_name: "protocol",
              text: parameters.protocol
            }
          ]
        }
      ],
      language: {
        code: "pt_BR"
      }
    });

    if (content) {
      messageMutex.runExclusive(async () => {
        const result = await channel.sendMessage(
          connection.qrcode,
          contact.number,
          content
        );
        if (!result) {
          logger.error(
            { channel: connection.qrcode, ticket, contact, content },
            "Failed to send message"
          );
          throw new Error("Failed to send message");
        }

        logger.debug({ result }, "Message body sent");

        await ticket.update({
          lastMessage: `template: ${hubWhatsappTemplate}`
        });

        await CreateMessageService({
          messageData: {
            id: `template:${hubWhatsappTemplate}${makeRandomId(10)}`,
            contactId: ticket.contactId,
            ticketId: ticket.id,
            body: `*template:* ${hubWhatsappTemplate}\n*protocol:* ${parameters.protocol}\n*name:* ${parameters.name}`,
            fromMe: true,
            channel: "internal",
            dataJson: JSON.stringify(result)
          },
          companyId: ticket.companyId
        });
      });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async createMessages(
    ticket: Ticket,
    data: NotificamehubPayload
  ): Promise<Message[]> {
    logger.debug("notificamehub:createMessage");

    let posterContactId: number;

    if (
      ticket.contact.number.startsWith("post:") &&
      ticket.contact.channel === "instagram"
    ) {
      const posterContact = await this.findOrCreateContact(
        ticket.whatsapp,
        data,
        true
      );
      const ticketUsername = ticket.contact.name.split(" ")[0];
      if (posterContact.email === ticketUsername) {
        throw new DebugException(
          "notificamehub:createMessage: Ignoring Instagram reply from post owner"
        );
      }
      posterContactId = posterContact.id;
    }

    const message = NotificamehubDriver.normalizeMessage(data);

    const newMessages = message.contents.map(async content => {
      // download file
      let file: Buffer | Readable;
      if (content.fileUrl) {
        if (message.channel === "whatsapp_business_account") {
          const { client, hubChannel } = this.sessions[ticket.whatsappId];
          const fileContent = new FileContent(
            content.fileUrl,
            content.fileMimeType.split("/").pop() || "binary"
          );
          const channel = await client.setChannel("whatsapp");
          const fileData = await channel.downloadMedia(
            hubChannel,
            "whatsapp",
            fileContent
          );

          file = Buffer.from(fileData, "binary");
        } else {
          file = await downloadFile(content.fileUrl);
        }
      }

      let mediaUrl: string;
      let thumbnailUrl: string;
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

        const mimetype =
          overrideMimeType ||
          content.fileMimeType ||
          "application/octet-stream";

        const filename =
          overrideFilename ||
          content.fileName ||
          `${new Date().getTime()}.${mimetype
            .split(";")
            .shift()
            .split("/")
            .pop()}`;

        finalContent.fileMimeType = mimetype;
        finalContent.fileName = filename;

        mediaUrl = await saveMediaToFile(
          {
            data: file,
            mimetype,
            filename
          },
          ticket.companyId,
          ticket.id
        );
      }

      const contentLinkPreviewURL =
        (content.type === "text" && content.item) || content.media?.link;

      if (contentLinkPreviewURL?.startsWith("https")) {
        finalContent.itemPreview = await getLinkPreview(contentLinkPreviewURL);

        if (finalContent.itemPreview?.images?.length > 0) {
          const filename =
            finalContent.itemPreview.images[0]
              .split("/")
              ?.pop()
              .split("?")
              ?.shift() || "image.jpeg";
          const fileExtension = filename.split(".").pop();

          thumbnailUrl = await saveMediaToFile(
            {
              data: await downloadFile(finalContent.itemPreview.images[0]),
              mimetype: getMimeByExtension(fileExtension),
              filename
            },
            ticket.companyId,
            ticket.id
          );
        }
      }

      const providerQuotedMsgId =
        content.reaction?.reaction_to?.providerMessageId ||
        message.context?.id ||
        undefined;

      const quotedMsg = await NotificamehubIdMapping.findOne({
        where: {
          id: `${message.to}:${providerQuotedMsgId}`
        }
      });

      const quotedMsgId = quotedMsg?.messageId || undefined;

      const mediaType =
        content.type !== "text"
          ? content.type.replace(/^reaction$/, "reactionMessage")
          : undefined;

      const body =
        content.text ||
        content.caption ||
        content.reaction?.emoji ||
        mediaType ||
        "";

      await ticket.update({
        lastMessage: body.substring(0, 255).replace(/\n/g, " ")
      });

      return CreateMessageService({
        messageData: {
          id: message.id,
          quotedMsgId,
          contactId: posterContactId || ticket.contactId,
          ticketId: ticket.id,
          body,
          channel: ticket.contact.channel,
          mediaType,
          mediaUrl,
          thumbnailUrl,
          dataJson: JSON.stringify(finalContent)
        },
        companyId: ticket.companyId
      }).then(newMessage => {
        NotificamehubIdMapping.create({
          id: `${message.to}:${newMessage.id}`,
          messageId: data.providerMessageId,
          ticketId: ticket.id
        }).catch(error => {
          logger.error(
            {
              error: error.message,
              messageId: message.id,
              ticketId: ticket.id,
              connectionId: ticket.whatsappId
            },
            "notificamehub:createMessage: Error creating NotificamehubIdMapping"
          );
        });
        return newMessage;
      });
    });

    return Promise.all(newMessages);
  }

  async sendMessage(
    ticket: Ticket,
    message: OmniMessage,
    options: OmniSendMessageOptions
  ): Promise<Message[]> {
    logger.debug("notificamehub:sendMessage");

    const connection = await Whatsapp.findByPk(ticket.whatsappId);

    if (!this.sessions[connection.id]) {
      await this.startService(connection);
      if (!this.sessions[connection.id]) {
        throw new Error("notificamehub:sendMessage: Session not initialized");
      }
    }

    let content: TextContent | ReplyContent | ReactionContent;
    const promises = [];

    let { number } = ticket.contact;
    if (
      ticket.contact.channel === "instagram" &&
      ticket.contact.number.startsWith("post:")
    ) {
      if (!message.quotedMsg) {
        throw new DebugException(
          "notificamehub:sendMessage: Instagram post without quoted message"
        );
      }
      const quotedData = JSON.parse(message.quotedMsg.dataJson);
      if (!quotedData.id) {
        throw new DebugException(
          "notificamehub:sendMessage: Instagram post without quoted message id"
        );
      }
      number = quotedData.id;
      content = new ReplyContent(number, message.body);
    }

    const quotedMappingMsg =
      message.quotedMsg?.id &&
      (await NotificamehubIdMapping.findOne({
        where: {
          id: `${connection.qrcode}:${message.quotedMsg.id}`
        }
      }));

    if (!content) {
      if (message.type === "text") {
        content = new TextContent(message.body.replace(/'/g, '"'));
      } else if (message.type === "reaction" && quotedMappingMsg) {
        content = new ReactionContent({
          message_id: quotedMappingMsg.messageId,
          emoji: message.body
        });
      }
    }

    const { client } = this.sessions[connection.id];
    const channel = client.setChannel(ticket.contact.channel);

    if (content) {
      promises.push(
        messageMutex.runExclusive(async () => {
          const result = await channel.sendMessage(
            connection.qrcode,
            number,
            content
          );
          if (!result) {
            logger.error(
              { channel: connection.qrcode, number, content },
              "Failed to send message"
            );
            throw new Error("Failed to send message");
          }

          logger.debug({ result }, "Message body sent");

          if (options?.dontSaveOnTicket) {
            return null;
          }

          await ticket.update({
            lastMessage: message.body
          });

          const sentMessage = await CreateMessageService({
            messageData: {
              id: result.id,
              contactId: ticket.contactId,
              ticketId: ticket.id,
              userId: message.userId,
              body: message.body,
              mediaType:
                message.type === "reaction" ? "reactionMessage" : undefined,
              quotedMsgId: message.quotedMsg?.id || undefined,
              fromMe: true,
              channel: ticket.contact.channel,
              dataJson: JSON.stringify(message)
            },
            companyId: ticket.companyId
          });
          return sentMessage;
        })
      );
    }

    if (["image", "audio", "video", "document"].includes(message.type)) {
      const fileContent = new FileContent(
        message.mediaUrl.startsWith("https://")
          ? message.mediaUrl
          : `${getBackendUrl()}/public/${message.mediaUrl}`,
        typeMappings[ticket.contact.channel][message.type] ||
          typeMappings[ticket.contact.channel].default ||
          "file",
        message.body || message.type,
        message.fileName
      );
      promises.push(
        messageMutex.runExclusive(async () => {
          const result = await channel.sendMessage(
            connection.qrcode,
            ticket.contact.number,
            fileContent
          );

          if (!result) {
            logger.error(
              { channel: connection.qrcode, number, content },
              "Failed to send message"
            );
            throw new Error("Failed to send message");
          }

          logger.debug({ result }, "Message media sent");

          const mediaType = message.mimetype?.split("/")[0] || message.type;

          await ticket.update({
            lastMessage: message.body || mediaType || ""
          });

          const sentMessage = await CreateMessageService({
            messageData: {
              id: result.id,
              contactId: ticket.contactId,
              ticketId: ticket.id,
              userId: message.userId,
              body: message.body || "",
              quotedMsgId: message.quotedMsg?.id || undefined,
              fromMe: true,
              channel: ticket.contact.channel,
              mediaType,
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
        model: Queue,
        as: "queue",
        required: false,
        attributes: ["id", "name", "color"]
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

  // eslint-disable-next-line class-methods-use-this
  getMediaProcessor(
    type: string,
    channel: string
  ): (media: MediaSource) => Promise<ProcessedMedia> {
    const processor =
      audioMediaProcessors[channel] || audioMediaProcessors.default;

    if (type === "audio") {
      return processor;
    }

    return null;
  }
}
