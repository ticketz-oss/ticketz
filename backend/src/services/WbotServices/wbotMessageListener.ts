import path from "path";
import * as Sentry from "@sentry/node";
import { isNil, head } from "lodash";

import {
  WASocket,
  extractMessageContent,
  getContentType,
  jidNormalizedUser,
  MessageUpsertType,
  proto,
  WAMessage,
  WAMessageStubType,
  WAMessageUpdate,
  Chat,
  Contact as WAContact,
  MediaType
} from "baileys";
import { Mutex } from "async-mutex";
import { Op } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import mime from "mime-types";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import Message from "../../models/Message";
import OldMessage from "../../models/OldMessage";

import { getIO } from "../../libs/socket";
import CreateMessageService, {
  MessageData
} from "../MessageServices/CreateMessageService";
import { logger } from "../../utils/logger";
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import UpdateTicketService, {
  UpdateTicketData
} from "../TicketServices/UpdateTicketService";
import formatBody from "../../helpers/Mustache";
import TicketTraking from "../../models/TicketTraking";
import UserRating from "../../models/UserRating";
import SendWhatsAppMessage from "./SendWhatsAppMessage";
import Queue from "../../models/Queue";
import QueueOption from "../../models/QueueOption";
import VerifyCurrentSchedule, {
  ScheduleResult
} from "../CompanyService/VerifyCurrentSchedule";
import Campaign from "../../models/Campaign";
import CampaignShipping from "../../models/CampaignShipping";
import { campaignQueue } from "../../queues/campaign";
import User from "../../models/User";
import Setting from "../../models/Setting";
import { cacheLayer } from "../../libs/cache";
import { debounce } from "../../helpers/Debounce";
import { getMessageFileOptions } from "./SendWhatsAppMedia";
import { makeRandomId } from "../../helpers/MakeRandomId";
import CheckSettings, { GetCompanySetting } from "../../helpers/CheckSettings";
import Whatsapp from "../../models/Whatsapp";
import { SimpleObjectCache } from "../../helpers/simpleObjectCache";
import { Session } from "../../libs/wbot";
import { checkCompanyCompliant } from "../../helpers/CheckCompanyCompliant";
import { transcriber } from "../../helpers/transcriber";
import { parseToMilliseconds } from "../../helpers/parseToMilliseconds";
import { randomValue } from "../../helpers/randomValue";

import {
  IntegrationMessage,
  IntegrationMessageMetadata,
  IntegrationMessageTypes,
  IntegrationServices
} from "../IntegrationServices/IntegrationServices";
import Integration from "../../models/Integration";
import IntegrationSession from "../../models/IntegrationSession";
import getFilenameFromUrl from "../../helpers/getFilenameFromUrl";
import { WorkerManager } from "../../worker_manager";
import {
  BaileysDownloaderTaskData,
  BaileysDownloadTaskResult
} from "../../workers/BaileysDownloader";
import { getPublicPath } from "../../helpers/GetPublicPath";
import ShowContactService from "../ContactServices/ShowContactService";

import { SubscriptionService } from "../../ticketzPro/services/subscriptionService";

export interface ImessageUpsert {
  messages: proto.IWebMessageInfo[];
  type: MessageUpsertType;
}

interface IMe {
  name: string;
  id: string;
}

type MessageHistorySet = {
  chats: Chat[];
  contacts: WAContact[];
  messages: proto.IWebMessageInfo[];
  isLatest?: boolean;
  progress?: number | null;
  syncType?: proto.HistorySync.HistorySyncType;
  peerDataRequestSessionId?: string;
};

const wbotMutex = new Mutex();
const ackMutex = new Mutex();

const groupContactCache = new SimpleObjectCache(1000 * 30, logger);
const contactCache = new SimpleObjectCache(1000 * 30, logger);
const outOfHoursCache = new SimpleObjectCache(1000 * 60 * 5, logger);

const integrationServices = IntegrationServices.getInstance();

const workerManager = WorkerManager.getInstance();

const getTypeMessage = (msg: proto.IWebMessageInfo): string => {
  return getContentType(msg.message);
};

const getTypeEditedMessage = (msg: proto.IMessage): string => {
  return getContentType(msg);
};

const subscriptionService = SubscriptionService.getInstance();

const getBodyButton = (msg: proto.IWebMessageInfo): string => {
  const buttonsMessage =
    msg?.message?.buttonsMessage ||
    msg?.message?.viewOnceMessage?.message?.buttonsMessage;

  if (msg.key.fromMe && buttonsMessage?.contentText) {
    let bodyMessage = `*${buttonsMessage?.contentText}*`;

    buttonsMessage?.buttons.forEach(button => {
      bodyMessage += `\n\n${button.buttonText?.displayText}`;
    });

    return bodyMessage;
  }

  const listMessage =
    msg?.message?.listMessage ||
    msg?.message?.viewOnceMessage?.message?.listMessage;

  if (listMessage) {
    let bodyMessage = `*${listMessage?.description}*`;
    listMessage?.sections.forEach(button => {
      button.rows.forEach(rows => {
        bodyMessage += `\n\n${rows.title}`;
      });
    });

    return bodyMessage;
  }

  return "";
};

const msgLocation = (
  image:
    | Uint8Array
    | ArrayBuffer
    | { valueOf(): ArrayBuffer | SharedArrayBuffer },
  latitude: number,
  longitude: number
) => {
  if (image) {
    const b64 = Buffer.from(image).toString("base64");

    const data = `data:image/png;base64, ${b64} | https://maps.google.com/maps?q=${latitude}%2C${longitude}&z=17&hl=pt-BR|${latitude}, ${longitude} `;
    return data;
  }
  return "";
};

export const getBodyFromTemplateMessage = (
  templateMessage: proto.Message.ITemplateMessage
) => {
  return (
    templateMessage.hydratedTemplate?.hydratedContentText ||
    templateMessage.interactiveMessageTemplate?.body ||
    "unsupported templateMessage"
  );
};

const getBodyMessage = (msg: proto.IWebMessageInfo): string | null => {
  try {
    const type = getTypeMessage(msg);

    const types = {
      conversation: msg?.message?.conversation,
      editedMessage:
        msg?.message?.editedMessage?.message?.protocolMessage?.editedMessage
          ?.conversation,
      imageMessage: msg.message?.imageMessage?.caption,
      videoMessage: msg.message?.videoMessage?.caption,
      extendedTextMessage: msg.message?.extendedTextMessage?.text,
      templateMessage:
        msg.message?.templateMessage &&
        getBodyFromTemplateMessage(msg.message.templateMessage),
      buttonsResponseMessage:
        msg.message?.buttonsResponseMessage?.selectedButtonId,
      templateButtonReplyMessage:
        msg.message?.templateButtonReplyMessage?.selectedId,
      messageContextInfo:
        msg.message?.buttonsResponseMessage?.selectedButtonId ||
        msg.message?.listResponseMessage?.title,
      buttonsMessage:
        getBodyButton(msg) ||
        msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId,
      viewOnceMessage:
        getBodyButton(msg) ||
        msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId,
      viewOnceMessageV2:
        msg.message?.viewOnceMessageV2?.message?.imageMessage?.caption || "",
      stickerMessage: "sticker",
      contactMessage:
        msg.message?.contactMessage?.vcard &&
        JSON.stringify({
          ticketzvCard: [
            {
              displayName: msg.message.contactMessage.displayName,
              vcard: msg.message.contactMessage.vcard
            }
          ]
        }),
      contactsArrayMessage:
        msg.message?.contactsArrayMessage &&
        JSON.stringify({
          ticketzvCard: msg.message.contactsArrayMessage.contacts
        }),
      // locationMessage: `Latitude: ${msg.message.locationMessage?.degreesLatitude} - Longitude: ${msg.message.locationMessage?.degreesLongitude}`,
      locationMessage: msgLocation(
        msg.message?.locationMessage?.jpegThumbnail,
        msg.message?.locationMessage?.degreesLatitude,
        msg.message?.locationMessage?.degreesLongitude
      ),
      liveLocationMessage: `Latitude: ${msg.message?.liveLocationMessage?.degreesLatitude} - Longitude: ${msg.message?.liveLocationMessage?.degreesLongitude}`,
      documentMessage: msg.message?.documentMessage?.caption,
      documentWithCaptionMessage:
        msg.message?.documentWithCaptionMessage?.message?.documentMessage
          ?.caption,
      audioMessage: "Áudio",
      listMessage:
        getBodyButton(msg) || msg.message?.listResponseMessage?.title,
      listResponseMessage:
        msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId,
      reactionMessage: msg.message?.reactionMessage?.text || "reaction"
    };

    const objKey = Object.keys(types).find(key => key === type);

    if (!objKey) {
      logger.warn({ type, msg }, "received unsupported message");
      return `unsupported message: ${type}`;
    }
    let body = types[type] || "";
    if (!body && type !== "imageMessage") {
      logger.debug({ body, key: msg?.key, type }, "Body is empty");
    }
    if (typeof body !== "string") {
      body = "unsupported body content";
    }
    return body;
  } catch (error) {
    Sentry.setExtra("Error getTypeMessage", { msg, BodyMsg: msg.message });
    Sentry.captureException(error);
    logger.error({ error, msg }, `getBodyMessage: error: ${error?.message}`);
    return null;
  }
};

const getQuotedMessageId = (msg: proto.IWebMessageInfo) => {
  const body = extractMessageContent(msg.message)[
    Object.keys(msg?.message).values().next().value
  ];

  return body?.contextInfo?.stanzaId || msg?.message?.reactionMessage?.key?.id;
};

const getMeSocket = (wbot: Session): IMe => {
  return {
    id: jidNormalizedUser((wbot as WASocket).user.id),
    name: (wbot as WASocket).user.name
  };
};

const getSenderMessage = (
  msg: proto.IWebMessageInfo,
  wbot: Session
): string => {
  const me = getMeSocket(wbot);
  if (msg.key.fromMe) return me.id;

  const senderId =
    msg.participant || msg.key.participant || msg.key.remoteJid || undefined;

  return senderId && jidNormalizedUser(senderId);
};

const getContactMessage = async (msg: proto.IWebMessageInfo, wbot: Session) => {
  const isGroup = msg.key.remoteJid.includes("g.us");
  const rawNumber = msg.key.remoteJid.replace(/\D/g, "");
  return isGroup
    ? {
        id: getSenderMessage(msg, wbot),
        name: msg.pushName
      }
    : {
        id: msg.key.remoteJid,
        name: msg.key.fromMe ? rawNumber : msg.pushName
      };
};

const getUnpackedMessage = (msg: proto.IWebMessageInfo) => {
  return (
    msg.message?.documentWithCaptionMessage?.message ||
    msg.message?.ephemeralMessage?.message ||
    msg.message?.viewOnceMessage?.message ||
    msg.message?.viewOnceMessageV2?.message ||
    msg.message?.ephemeralMessage?.message ||
    msg.message?.templateMessage?.hydratedTemplate ||
    msg.message?.templateMessage?.hydratedFourRowTemplate ||
    msg.message?.templateMessage?.fourRowTemplate ||
    msg.message?.interactiveMessage?.header ||
    msg.message?.highlyStructuredMessage?.hydratedHsm?.hydratedTemplate ||
    msg.message
  );
};

const getMessageMedia = (message: proto.IMessage) => {
  return (
    message?.imageMessage ||
    message?.audioMessage ||
    message?.videoMessage ||
    message?.stickerMessage ||
    message?.documentMessage ||
    null
  );
};

export const normalizeThumbnailMediaType = (mimetype: string): MediaType => {
  const types = ["thumbnail-video", "thumbnail-image", "thumbnail-document"];
  const type = mimetype.split("/")[0];

  if (!types.includes(`thumbnail-${type}`)) {
    return "thumbnail-document";
  }

  return `thumbnail-${type}` as MediaType;
};

export const normalizeMediaType = (
  mimetype: string
): "audio" | "video" | "image" | "document" => {
  const types = ["audio", "video", "image", "document"];
  const type = mimetype.split("/")[0];

  if (!types.includes(type)) {
    return "document";
  }

  return type as "audio" | "video" | "image" | "document";
};

const verifyContact = async (
  msgContact: IMe,
  wbot: Session,
  companyId: number
): Promise<Contact> => {
  let profilePicUrl: string;
  let profileHiresPictureUrl = "";

  try {
    profilePicUrl = await wbot.profilePictureUrl(msgContact.id);
  } catch (e) {
    Sentry.captureException(e);
    profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
  }

  try {
    profileHiresPictureUrl = await wbot.profilePictureUrl(
      msgContact.id,
      "image"
    );
  } catch (e) {
    profileHiresPictureUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
  }

  const contactData = {
    name: msgContact?.name || msgContact.id.replace(/\D/g, ""),
    number: msgContact.id.substring(0, msgContact.id.indexOf("@")),
    profilePicUrl,
    profileHiresPictureUrl,
    isGroup: msgContact.id.includes("g.us"),
    companyId
  };

  const contact = CreateOrUpdateContactService(contactData);

  return contact;
};

const verifyQuotedMessage = async (
  msg: proto.IWebMessageInfo
): Promise<Message | null> => {
  if (!msg?.message) return null;
  const quoted = getQuotedMessageId(msg);

  if (!quoted) return null;

  const quotedMsg = await Message.findOne({
    where: { id: quoted }
  });

  if (!quotedMsg) return null;

  return quotedMsg;
};

const downloadMediaTasks: Map<string, Promise<boolean>> = new Map();

type DeferredPromise = {
  promise: Promise<boolean>;
  resolve: (value: boolean) => void;
  reject: (reason?: any) => void;
};

const createDeferred = (): DeferredPromise => {
  let resolve;
  let reject;
  const promise = new Promise<boolean>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

/**
 * @description: call UpdateTicketService to update ticket status, if ticketData have a queue id it will not run the chatbot
 * @params {Ticket} ticket - ticket to be updated
 * @params {UpdateTicketData} ticketData - data to be updated
 * @returns {Promise<Ticket>} - updated ticket
 */
async function updateTicket(
  ticket: Ticket,
  ticketData: UpdateTicketData
): Promise<Ticket> {
  await UpdateTicketService({
    ticketData,
    ticketId: ticket.id,
    companyId: ticket.companyId,
    dontRunChatbot: !!ticketData.queueId
  });
  await ticket.reload();
  return ticket;
}

export const verifyMediaMessage = async (
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact,
  _wbot = null,
  messageMedia = null,
  userId: number = null
): Promise<Message> => {
  const quotedMsg = await verifyQuotedMessage(msg);

  const body = getBodyMessage(msg);
  const unpackedMessage = getUnpackedMessage(msg);
  const msgMedia = getMessageMedia(unpackedMessage);

  const fileLimit =
    Number(await CheckSettings("downloadLimit", "15")) * 1024 * 1024;
  const overLimit = Number(msgMedia?.fileLength) > fileLimit;

  const messageData: MessageData = {
    id: msg.key.id,
    ticketId: ticket.id,
    userId,
    contactId: msg.key.fromMe ? undefined : contact.id,
    body: body || "",
    fromMe: msg.key.fromMe,
    read: msg.key.fromMe || ticket.id < 0,
    mediaType: msgMedia && (overLimit ? "overlimit" : "wait"),
    quotedMsgId: quotedMsg?.id,
    ack: msg.status,
    remoteJid: msg.key.remoteJid,
    participant: msg.key.participant,
    dataJson: JSON.stringify(msg),
    createdAt: msg.messageTimestamp
      ? new Date(Number(msg.messageTimestamp) * 1000)
      : undefined
  };

  if (userId) {
    messageData.userId = userId;
  }

  let filename = unpackedMessage?.documentMessage?.fileName || "";
  if (msgMedia) {
    if (!filename) {
      const ext = msgMedia.mimetype.split("/")[1].split(";")[0];
      filename = `${makeRandomId(5)}-${new Date().getTime()}.${ext}`;
    }
  }

  if (ticket.id > 0) {
    await ticket.update({
      lastMessage: body || filename ? `📎 ${filename}` : ""
    });
  }

  const newMessage = await CreateMessageService({
    messageData,
    companyId: ticket.companyId
  });

  if (ticket.id < 0) {
    return newMessage;
  }

  const io = getIO();

  if (!msg.key.fromMe && ticket.status === "closed") {
    await updateTicket(ticket, { status: "pending" });
    await ticket.reload({
      include: [
        { model: Queue, as: "queue" },
        { model: User, as: "user" },
        { model: Contact, as: "contact" }
      ]
    });

    io.to(`company-${ticket.companyId}-closed`)
      .to(`queue-${ticket.queueId}-closed`)
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "delete",
        ticket,
        ticketId: ticket.id
      });

    io.to(`company-${ticket.companyId}-${ticket.status}`)
      .to(`queue-${ticket.queueId}-${ticket.status}`)
      .to(ticket.id.toString())
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "update",
        ticket,
        ticketId: ticket.id
      });
  }

  const thumbnailMsg = messageMedia || msg?.message?.extendedTextMessage;

  if (thumbnailMsg?.thumbnailDirectPath) {
    const thumbnailDownloadData: BaileysDownloaderTaskData = {
      mediaKey: thumbnailMsg.mediaKey,
      directPath: thumbnailMsg.thumbnailDirectPath,
      mimetype: "image/jpeg",
      filename: `thumbnail-${makeRandomId(5)}-${new Date().getTime()}.jpg`,
      url: null,
      mediaType: msgMedia?.mimetype
        ? normalizeThumbnailMediaType(msgMedia.mimetype)
        : "thumbnail-link",
      companyId: ticket.companyId,
      ticketId: ticket.id,
      contactId: contact.id
    };

    workerManager
      .runTask("BaileysDownloader", thumbnailDownloadData)
      .then(async (result: BaileysDownloadTaskResult) => {
        await newMessage.update({
          thumbnailUrl: result.mediaUrl
        });
        io.to(ticket.id.toString()).emit(
          `company-${ticket.companyId}-thumbnail`,
          {
            action: "update",
            ticketId: ticket.id,
            messageId: newMessage.id,
            thumbnailUrl: newMessage.thumbnailUrl
          }
        );
      })
      .catch(error => {
        logger.error({ error }, "error downloading thumbnail");
      });
  }

  if (!msgMedia || overLimit) {
    return newMessage;
  }

  const mediaDownloadData: BaileysDownloaderTaskData = {
    mediaKey: msgMedia.mediaKey,
    directPath: msgMedia.directPath,
    mimetype: msgMedia.mimetype,
    filename,
    url: msgMedia.url,
    mediaType: unpackedMessage?.documentMessage
      ? "document"
      : normalizeMediaType(msgMedia.mimetype),
    companyId: ticket.companyId,
    ticketId: ticket.id,
    contactId: contact.id
  };

  const deferred = createDeferred();
  downloadMediaTasks.set(
    `media-${ticket.id}-${newMessage.id}`,
    deferred.promise
  );

  workerManager
    .runTask("BaileysDownloader", mediaDownloadData)
    .then(async (result: BaileysDownloadTaskResult) => {
      const mediaType = normalizeMediaType(msgMedia.mimetype);

      let transcriptionText: string;
      if (
        mediaType === "audio" &&
        (await GetCompanySetting(
          ticket.companyId,
          "audioTranscriptions",
          "disabled"
        )) === "enabled"
      ) {
        const apiKey = await GetCompanySetting(
          ticket.companyId,
          "openAiKey",
          null
        );
        const provider = await GetCompanySetting(
          ticket.companyId,
          "aiProvider",
          "openai"
        );

        if (apiKey) {
          const audioTranscription = await transcriber(
            result.mediaUrl.startsWith("http")
              ? result.mediaUrl
              : `${getPublicPath()}/${result.mediaUrl}`,
            { apiKey, provider },
            filename
          );
          if (audioTranscription) {
            transcriptionText = audioTranscription;
          }
        }
      }

      await newMessage.update({
        mediaUrl: result.mediaUrl,
        mediaType,
        body: transcriptionText || undefined
      });
      io.to(ticket.id.toString()).emit(`company-${ticket.companyId}-media`, {
        action: "update",
        ticketId: ticket.id,
        messageId: newMessage.id,
        mediaUrl: newMessage.mediaUrl,
        body: transcriptionText || undefined,
        mediaType
      });
      deferred.resolve(true);
      downloadMediaTasks.delete(`media-${ticket.id}-${newMessage.id}`);
    })
    .catch(error => {
      deferred.reject(error);
      downloadMediaTasks.delete(`media-${ticket.id}-${newMessage.id}`);
      logger.error({ error }, "error downloading media");
    });

  return newMessage;
};

export const verifyMessage = async (
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact,
  userId: number = null
): Promise<Message> => {
  const quotedMsg = await verifyQuotedMessage(msg);
  const body = getBodyMessage(msg);

  const messageData: MessageData = {
    id: msg.key.id,
    ticketId: ticket.id,
    userId,
    contactId: msg.key.fromMe ? undefined : contact.id,
    body,
    fromMe: msg.key.fromMe,
    mediaType: msg.message.reactionMessage ? "reactionMessage" : null,
    read: msg.key.fromMe || ticket.id < 0,
    quotedMsgId: quotedMsg?.id,
    ack: msg.status,
    remoteJid: msg.key.remoteJid,
    participant: msg.key.participant,
    dataJson: JSON.stringify(msg),
    isEdited: false,
    createdAt: msg.messageTimestamp
      ? new Date(Number(msg.messageTimestamp) * 1000)
      : undefined
  };

  if (userId) {
    messageData.userId = userId;
  }

  await ticket.update({
    lastMessage: body.substring(0, 255).replace(/\n/g, " ")
  });

  const newMesssage = await CreateMessageService({
    messageData,
    companyId: ticket.companyId
  });

  if (ticket.id < 0) {
    return newMesssage;
  }

  if (!msg.key.fromMe && ticket.status === "closed") {
    await updateTicket(ticket, { status: "pending" });
    await ticket.reload({
      include: [
        { model: Queue, as: "queue" },
        { model: User, as: "user" },
        { model: Contact, as: "contact" }
      ]
    });

    const io = getIO();

    io.to(`company-${ticket.companyId}-closed`)
      .to(`queue-${ticket.queueId}-closed`)
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "delete",
        ticket,
        ticketId: ticket.id
      });

    io.to(`company-${ticket.companyId}-${ticket.status}`)
      .to(`queue-${ticket.queueId}-${ticket.status}`)
      .to(ticket.id.toString())
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "update",
        ticket,
        ticketId: ticket.id
      });
  }

  return newMesssage;
};

const verifyEditedMessage = async (
  msg: proto.IMessage,
  ticket: Ticket,
  msgId: string
): Promise<Message> => {
  const editedType = getTypeEditedMessage(msg);

  let editedText: string;

  switch (editedType) {
    case "conversation": {
      editedText = msg.conversation;
      break;
    }
    case "extendedTextMessage": {
      editedText = msg.extendedTextMessage.text;
      break;
    }
    case "imageMessage": {
      editedText = msg.imageMessage.caption;
      break;
    }
    case "documentMessage": {
      editedText = msg.documentMessage.caption;
      break;
    }
    case "documentWithCaptionMessage": {
      editedText =
        msg.documentWithCaptionMessage.message.documentMessage.caption;
      break;
    }
    default: {
      return null;
    }
  }

  const editedMsg = await Message.findByPk(msgId);
  const messageData = {
    id: editedMsg.id,
    ticketId: editedMsg.ticketId,
    contactId: editedMsg.contactId,
    body: editedText,
    fromMe: editedMsg.fromMe,
    mediaType: editedMsg.mediaType,
    read: editedMsg.read,
    quotedMsgId: editedMsg.quotedMsgId,
    ack: editedMsg.ack,
    remoteJid: editedMsg.remoteJid,
    participant: editedMsg.participant,
    dataJson: editedMsg.dataJson,
    isEdited: true
  };

  const oldMessage = {
    messageId: messageData.id,
    body: editedMsg.body,
    ticketId: editedMsg.ticketId
  };

  await OldMessage.upsert(oldMessage);

  await ticket.update({
    lastMessage: messageData.body
  });

  const newMessage = await CreateMessageService({
    messageData,
    companyId: ticket.companyId
  });

  const io = getIO();

  io.to(ticket.status)
    .to(ticket.id.toString())
    .emit(`company-${ticket.companyId}-ticket`, {
      action: "update",
      ticket,
      ticketId: ticket.id
    });

  return newMessage;
};

const verifyDeleteMessage = async (
  msg: proto.Message.IProtocolMessage,
  ticket: Ticket
) => {
  const message = await Message.findByPk(msg.key.id, {
    include: [
      "contact",
      {
        model: Ticket,
        include: [
          {
            model: Contact
          }
        ]
      }
    ]
  });

  if (!message) {
    return;
  }

  await message.update({
    isDeleted: true
  });

  const io = getIO();
  io.to(message.ticketId.toString())
    .to(message.ticket.status)
    .to("notification")
    .emit(`company-${ticket.companyId}-appMessage`, {
      action: "create",
      message,
      ticket: message.ticket,
      contact: message.ticket.contact
    });
};

const quickMessage = async (
  wbot: Session,
  ticket: Ticket,
  text: string,
  saveOnTicket = false
) => {
  const debouncedSentMessage = debounce(
    async () => {
      const sentMessage = await wbot.sendMessage(
        `${ticket.contact.number}@s.whatsapp.net"
        }`,
        {
          text: `\u200e${text}`
        }
      );
      if (saveOnTicket) {
        verifyMessage(sentMessage, ticket, ticket.contact);
      }
    },
    1000,
    ticket.id
  );
  debouncedSentMessage();
};

const isValidMsg = (msg: proto.IWebMessageInfo): boolean => {
  if (msg.key.remoteJid === "status@broadcast") return false;
  try {
    const msgType = getTypeMessage(msg);
    if (!msgType) {
      return false;
    }

    const ifType =
      msgType === "conversation" ||
      msgType === "editedMessage" ||
      msgType === "extendedTextMessage" ||
      msgType === "audioMessage" ||
      msgType === "videoMessage" ||
      msgType === "imageMessage" ||
      msgType === "documentMessage" ||
      msgType === "documentWithCaptionMessage" ||
      msgType === "stickerMessage" ||
      msgType === "buttonsResponseMessage" ||
      msgType === "buttonsMessage" ||
      msgType === "messageContextInfo" ||
      msgType === "locationMessage" ||
      msgType === "liveLocationMessage" ||
      msgType === "contactMessage" ||
      msgType === "voiceMessage" ||
      msgType === "mediaMessage" ||
      msgType === "contactsArrayMessage" ||
      msgType === "reactionMessage" ||
      msgType === "ephemeralMessage" ||
      msgType === "protocolMessage" ||
      msgType === "listResponseMessage" ||
      msgType === "listMessage" ||
      msgType === "templateMessage" ||
      msgType === "viewOnceMessage" ||
      msgType === "viewOnceMessageV2";

    if (!ifType) {
      logger.warn(`#### Nao achou o type em isValidMsg: ${msgType}
${JSON.stringify(msg?.message)}`);
      Sentry.setExtra("Mensagem", { BodyMsg: msg.message, msg, msgType });
      Sentry.captureException(new Error("Novo Tipo de Mensagem em isValidMsg"));
    }

    return !!ifType;
  } catch (error) {
    Sentry.setExtra("Error isValidMsg", { msg });
    Sentry.captureException(error);
    return false;
  }
};

const emojiNumberOption = (number: number): string => {
  const numEmojis = [
    "0️⃣",
    "1️⃣",
    "2️⃣",
    "3️⃣",
    "4️⃣",
    "5️⃣",
    "6️⃣",
    "7️⃣",
    "8️⃣",
    "9️⃣",
    "🔟"
  ];

  return number <= 10 ? numEmojis[number] : `[ ${number} ]`;
};

const sendMenu = async (
  wbot: Session,
  ticket: Ticket,
  currentOption: Queue | QueueOption,
  sendBackToMain = true
) => {
  const message =
    currentOption instanceof Queue
      ? (currentOption as Queue).greetingMessage
      : (currentOption as QueueOption).message;

  const botText = async () => {
    const showNumericIcons =
      currentOption.options.length <= 10 &&
      (await GetCompanySetting(
        ticket.companyId,
        "showNumericIcons",
        "disabled"
      )) === "enabled";

    let options = "";

    currentOption.options.forEach(option => {
      options += showNumericIcons
        ? `${emojiNumberOption(Number(option.option))} - `
        : `*[ ${option.option} ]* - `;
      options += `${option.title}\n`;
    });

    if (sendBackToMain) {
      options += showNumericIcons
        ? "\n#️⃣ - Voltar Menu Inicial"
        : "\n*[ # ]* - Voltar Menu Inicial";
    }

    const textMessage = {
      text: formatBody(`${message}\n\n${options}`, ticket)
    };

    const sendMsg = await wbot.sendMessage(
      `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      textMessage
    );

    await verifyMessage(sendMsg, ticket, ticket.contact);
  };

  botText();
};

const getTicketJid = (ticket: Ticket) => {
  return `${ticket.contact.number}@${
    ticket.isGroup ? "g.us" : "s.whatsapp.net"
  }`;
};

export const wbotReplyHandler = async (
  wbot: Session,
  ticket: Ticket,
  reply: IntegrationMessage
) => {
  const customTags: [string, string] = ["<<", ">>"];
  if (!reply?.content && !reply?.mediaUrl) {
    await new Promise(resolve => {
      setTimeout(resolve, 500);
    });
    await wbot.sendPresenceUpdate("composing", getTicketJid(ticket));
    return;
  }

  await ticket.reload({
    include: ["queue", "user", "contact"]
  });

  let fileName = null;

  if (reply.mediaUrl) {
    fileName =
      (await getFilenameFromUrl(reply.mediaUrl)) ||
      reply.mediaUrl.split("/").pop() ||
      "file.unkown";
  }

  if (reply.type === "image" && reply.mediaUrl) {
    await wbot.sendPresenceUpdate("composing", getTicketJid(ticket));
    await wbot
      .sendMessage(getTicketJid(ticket), {
        image: { url: reply.mediaUrl },
        caption: formatBody(reply.content, ticket, null, customTags)
      })
      .then(async sentMessage => {
        await verifyMediaMessage(sentMessage, ticket, ticket.contact);
      })
      .catch(error => {
        logger.error(
          { error },
          `Error sending integration reply: ${error.message}`
        );
      });
    return;
  }

  if (reply.type === "audio" && reply.mediaUrl) {
    await wbot.sendPresenceUpdate("recording", getTicketJid(ticket));
    await wbot
      .sendMessage(getTicketJid(ticket), {
        audio: { url: reply.mediaUrl },
        ptt: true,
        caption: formatBody(reply.content, ticket, null, customTags)
      })
      .then(async sentMessage => {
        await verifyMediaMessage(sentMessage, ticket, ticket.contact);
      })
      .catch(error => {
        logger.error(
          { error },
          `Error sending integration reply: ${error.message}`
        );
      });
    return;
  }

  if (reply.type === "video" && reply.mediaUrl) {
    await wbot.sendPresenceUpdate("composing", getTicketJid(ticket));
    await wbot
      .sendMessage(getTicketJid(ticket), {
        video: { url: reply.mediaUrl },
        caption: formatBody(reply.content, ticket, null, customTags)
      })
      .then(async sentMessage => {
        await verifyMediaMessage(sentMessage, ticket, ticket.contact);
      })
      .catch(error => {
        logger.error(
          { error },
          `Error sending integration reply: ${error.message}`
        );
      });
    return;
  }

  if (reply.type === "gif" && reply.mediaUrl) {
    await wbot.sendPresenceUpdate("composing", getTicketJid(ticket));
    await wbot
      .sendMessage(getTicketJid(ticket), {
        video: { url: reply.mediaUrl },
        gifPlayback: true,
        caption: formatBody(reply.content, ticket, null, customTags)
      })
      .then(async sentMessage => {
        await verifyMediaMessage(sentMessage, ticket, ticket.contact);
      })
      .catch(error => {
        logger.error(
          { error },
          `Error sending integration reply: ${error.message}`
        );
      });
    return;
  }

  if (reply.type === "document" && reply.mediaUrl) {
    await wbot.sendPresenceUpdate("composing", getTicketJid(ticket));
    await wbot
      .sendMessage(getTicketJid(ticket), {
        document: { url: reply.mediaUrl },
        caption: formatBody(reply.content, ticket, null, customTags),
        fileName,
        mimetype: mime.lookup(fileName) || "application/octet-stream"
      })
      .then(async sentMessage => {
        await verifyMediaMessage(sentMessage, ticket, ticket.contact);
      })
      .catch(error => {
        logger.error(
          { error },
          `Error sending integration reply: ${error.message}`
        );
      });
    return;
  }

  await wbot.sendPresenceUpdate("composing", getTicketJid(ticket));
  await wbot
    .sendMessage(getTicketJid(ticket), {
      text: formatBody(reply.content, ticket, null, customTags)
    })
    .then(async sentMessage => {
      await verifyMessage(sentMessage, ticket, ticket.contact);
    })
    .catch(error => {
      logger.error(
        { error },
        `Error sending integration reply: ${error.message}`
      );
    });
};

export const startQueue = async (
  wbot: Session,
  ticket: Ticket,
  queue: Queue = null,
  sendBackToMain = true,
  firstMessage: string = null
) => {
  if (!queue) {
    queue = await Queue.findByPk(ticket.queueId, {
      include: [
        {
          model: QueueOption,
          as: "options",
          where: { parentId: null },
          required: false
        }
      ],
      order: [["options", "option", "ASC"]]
    });
  }

  const { companyId, contact } = ticket;
  let chatbot = false;

  const integration = await Integration.findOne({
    where: {
      queueId: queue.id
    }
  });

  if (integration) {
    const integrationMetadata: IntegrationMessageMetadata = {
      channel: "whatsapp",
      from: ticket.contact || (await Contact.findByPk(ticket.contactId)),
      ticketId: ticket.id,
      firstMessage
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
      async (t, r) => {
        await wbotReplyHandler(wbot, t, r);
      }
    );

    if (reply?.content) {
      const sentMessage = await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        {
          text: reply.content
        }
      );
      await verifyMessage(sentMessage, ticket, contact);
    }
    return;
  }

  if (queue?.options) {
    chatbot = queue.options.length > 0;
  }
  await UpdateTicketService({
    ticketData: { queueId: queue.id, chatbot, status: "pending" },
    ticketId: ticket.id,
    companyId: ticket.companyId,
    dontRunChatbot: true
  });

  // do not process queue if company is not compliant with payments
  if (!(await checkCompanyCompliant(companyId))) {
    return;
  }

  let filePath = null;
  let optionsMsg = null;

  if (queue.mediaPath) {
    filePath = path.resolve("public", queue.mediaPath);
    optionsMsg = await getMessageFileOptions(queue.mediaName, filePath);
  }

  /* Tratamento para envio de mensagem quando a fila está fora do expediente */
  let currentSchedule: ScheduleResult;

  const scheduleType = await GetCompanySetting(
    companyId,
    "scheduleType",
    "disabled"
  );

  if (scheduleType === "queue") {
    currentSchedule = await VerifyCurrentSchedule(ticket.companyId, queue.id);

    if (
      !isNil(currentSchedule) &&
      (!currentSchedule || currentSchedule.inActivity === false)
    ) {
      outOfHoursCache.set(`ticket-${ticket.id}`, true);
      const outOfHoursMessage =
        queue.outOfHoursMessage?.trim() ||
        "Estamos fora do horário de expediente";
      const sentMessage = await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        {
          text: formatBody(outOfHoursMessage, ticket)
        }
      );
      await verifyMessage(sentMessage, ticket, contact);
      const outOfHoursAction = await GetCompanySetting(
        companyId,
        "outOfHoursAction",
        "pending"
      );
      await UpdateTicketService({
        ticketData: {
          queueId: queue.id,
          chatbot: false,
          status: outOfHoursAction
        },
        ticketId: ticket.id,
        companyId: ticket.companyId
      });
      return;
    }
  }

  if (queue.options.length === 0) {
    if (queue.greetingMessage?.trim()) {
      const body = formatBody(`\u200e${queue.greetingMessage.trim()}`, ticket);

      if (filePath) {
        optionsMsg.caption = body;
      } else {
        const sentMessage = await wbot.sendMessage(
          `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          {
            text: body
          }
        );
        await verifyMessage(sentMessage, ticket, contact);
        return;
      }
    }

    if (filePath) {
      const sentMediaMessage = await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        { ...optionsMsg }
      );
      await verifyMediaMessage(sentMediaMessage, ticket, contact);
    }
  } else {
    if (filePath) {
      const sentMediaMessage = await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        { ...optionsMsg }
      );
      await verifyMediaMessage(sentMediaMessage, ticket, contact);
    }
    sendMenu(wbot, ticket, queue, sendBackToMain);
  }
};

const verifyQueue = async (
  wbot: Session,
  msg: proto.IWebMessageInfo | null,
  ticket: Ticket,
  contact: Contact,
  ignoreMessage = false
) => {
  const { queues, greetingMessage } = await ShowWhatsAppService(
    wbot.id!,
    ticket.companyId
  );

  const firstMessage = msg ? getBodyMessage(msg) : null;

  if (queues.length === 1) {
    await startQueue(wbot, ticket, head(queues), false, firstMessage);
    return;
  }

  const showNumericIcons =
    queues.length <= 10 &&
    (await GetCompanySetting(
      ticket.companyId,
      "showNumericIcons",
      "disabled"
    )) === "enabled";

  const selectedOption = Number(firstMessage);
  const choosenQueue = selectedOption ? queues[+selectedOption - 1] : null;

  const botText = async () => {
    let options = "";

    queues.forEach((queue, index) => {
      options += showNumericIcons
        ? `${emojiNumberOption(index + 1)} - `
        : `*[ ${index + 1} ]* - `;
      options += `${queue.name}\n`;
    });

    const textMessage = {
      text: formatBody(`${greetingMessage}\n\n${options}`, ticket)
    };

    const sendMsg = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      textMessage
    );

    await verifyMessage(sendMsg, ticket, ticket.contact);
  };

  const chatbotAutoExit =
    (await GetCompanySetting(
      ticket.companyId,
      "chatbotAutoExit",
      "disabled"
    )) === "enabled";

  if (!ignoreMessage && choosenQueue) {
    await startQueue(wbot, ticket, choosenQueue);
  } else if (!ignoreMessage && !choosenQueue && chatbotAutoExit) {
    await updateTicket(ticket, { chatbot: false });
    const whatsapp = await Whatsapp.findByPk(ticket.whatsappId);
    if (whatsapp.transferMessage) {
      const body = formatBody(`\u200e${whatsapp.transferMessage}`, ticket);
      await SendWhatsAppMessage({ body, ticket });
    }
  } else {
    botText();
    await updateTicket(ticket, {
      chatbot: true
    });
  }
};

const handleRating = async (
  rate: number,
  ticket: Ticket,
  ticketTraking: TicketTraking,
  wbot: Session
) => {
  const whatsapp = await ShowWhatsAppService(
    ticket.whatsappId,
    ticket.companyId
  );

  let finalRate = rate;

  if (rate < 1) {
    finalRate = 1;
  }
  if (rate > 5) {
    finalRate = 5;
  }

  await UserRating.create({
    ticketId: ticketTraking.ticketId,
    companyId: ticketTraking.companyId,
    userId: ticketTraking.userId,
    rate: finalRate
  });

  const complationMessage =
    whatsapp.complationMessage.trim() || "Atendimento finalizado";

  const text = formatBody(`\u200e${complationMessage}`, ticket);
  const jid = `${ticket.contact.number}@${
    ticket.isGroup ? "g.us" : "s.whatsapp.net"
  }`;

  wbot
    .sendMessage(jid, {
      text
    })
    .then(
      () => {
        ticketTraking.update({
          rated: true
        });
      },
      e => logger.error({ e }, "error sending message")
    );
};

export const checkIntegration = async (
  source: Message | Ticket,
  wbot: Session
) => {
  const message = source instanceof Message ? source : null;
  const ticket = source instanceof Ticket ? source : null;

  if (!message && !ticket) {
    throw new Error("checkIntegration: Invalid source");
  }

  const contactId = message?.contactId || ticket.contactId;
  const contact = await ShowContactService(contactId);

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
      if (message.mediaType === "wait") {
        const mediaPromise = downloadMediaTasks.get(
          `media-${message.ticketId}-${message.id}`
        );
        if (mediaPromise) {
          await mediaPromise;
        }
        await message.reload();
      }
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
      async (t, r) => {
        await wbotReplyHandler(wbot, t, r);
      }
    );

    return true;
  }
  return false;
};

const handleChartbot = async (
  ticket: Ticket,
  msg: WAMessage,
  newMessage: Message,
  wbot: Session,
  dontReadTheFirstQuestion = false
) => {
  if (!subscriptionService.isValid()) {
    return;
  }

  const queue = await Queue.findByPk(ticket.queueId, {
    include: [
      {
        model: QueueOption,
        as: "options",
        where: { parentId: null }
      }
    ],
    order: [["options", "option", "ASC"]]
  });

  if (await checkIntegration(newMessage, wbot)) {
    return;
  }

  const messageBody = getBodyMessage(msg);

  if (messageBody === "#") {
    // voltar para o menu inicial
    await updateTicket(ticket, {
      queueOptionId: null,
      chatbot: false,
      queueId: null
    });
    await verifyQueue(wbot, msg, ticket, ticket.contact);
    return;
  }

  // voltar para o menu anterior
  if (!isNil(queue) && !isNil(ticket.queueOptionId) && messageBody === "#") {
    const option = await QueueOption.findByPk(ticket.queueOptionId);
    await ticket.update({ queueOptionId: option?.parentId });

    // escolheu uma opção
  } else if (!isNil(queue) && !isNil(ticket.queueOptionId)) {
    const count = await QueueOption.count({
      where: { parentId: ticket.queueOptionId }
    });
    let option: QueueOption = null;
    if (count === 1) {
      option = await QueueOption.findOne({
        where: { parentId: ticket.queueOptionId }
      });
    } else {
      option = await QueueOption.findOne({
        where: {
          option: messageBody || "",
          parentId: ticket.queueOptionId
        }
      });
    }
    if (option) {
      await ticket.update({ queueOptionId: option?.id });
      // if (option.mediaPath !== null && option.mediaPath !== "")  {

      //   const filePath = path.resolve("public", option.mediaPath);

      //   const optionsMsg = await getMessageOptions(option.mediaName, filePath);

      //   let sentMessage = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, { ...optionsMsg });

      //   await verifyMediaMessage(sentMessage, ticket, ticket.contact);
      // }
    }

    // não linha a primeira pergunta
  } else if (
    !isNil(queue) &&
    isNil(ticket.queueOptionId) &&
    !dontReadTheFirstQuestion
  ) {
    const option = queue?.options.find(o => o.option === messageBody);
    if (option) {
      await ticket.update({ queueOptionId: option?.id });
    } else if (
      (await GetCompanySetting(
        ticket.companyId,
        "chatbotAutoExit",
        "disabled"
      )) === "enabled"
    ) {
      // message didn't identified an option and company setting to exit chatbot
      await updateTicket(ticket, { chatbot: false });
      const whatsapp = await Whatsapp.findByPk(ticket.whatsappId);
      if (whatsapp.transferMessage) {
        const body = formatBody(`${whatsapp.transferMessage}`, ticket);
        await SendWhatsAppMessage({ body, ticket });
      }
    } else {
      await sendMenu(wbot, ticket, queue);
    }
  }

  await ticket.reload();

  if (!isNil(queue) && !isNil(ticket.queueOptionId)) {
    const currentOption = await QueueOption.findByPk(ticket.queueOptionId, {
      include: [
        {
          model: Queue,
          as: "forwardQueue",
          include: [
            {
              model: QueueOption,
              as: "options",
              where: { parentId: null },
              required: false
            }
          ]
        },
        {
          model: QueueOption,
          as: "options",
          required: false
        }
      ],
      order: [
        [
          Sequelize.cast(
            Sequelize.col("forwardQueue.options.option"),
            "INTEGER"
          ),
          "ASC"
        ],
        [Sequelize.cast(Sequelize.col("options.option"), "INTEGER"), "ASC"]
      ]
    });

    let filePath = null;
    let optionsMsg = null;
    if (currentOption.mediaPath !== null && currentOption.mediaPath !== "") {
      filePath = path.resolve("public", currentOption.mediaPath);
      optionsMsg = await getMessageFileOptions(
        currentOption.mediaName,
        filePath
      );
    }

    if (currentOption.exitChatbot || currentOption.forwardQueueId) {
      const text = formatBody(`${currentOption.message.trim()}`, ticket);

      if (filePath) {
        optionsMsg.caption = text || undefined;
        const sentMessage = await wbot.sendMessage(
          `${ticket.contact.number}@${
            ticket.isGroup ? "g.us" : "s.whatsapp.net"
          }`,
          { ...optionsMsg }
        );
        await verifyMediaMessage(sentMessage, ticket, ticket.contact);
      } else if (text) {
        const sendMsg = await wbot.sendMessage(
          `${ticket.contact.number}@${
            ticket.isGroup ? "g.us" : "s.whatsapp.net"
          }`,
          { text }
        );
        await verifyMessage(sendMsg, ticket, ticket.contact);
      }

      if (currentOption.exitChatbot) {
        await updateTicket(ticket, {
          chatbot: false,
          queueOptionId: null
        });
      } else if (currentOption.forwardQueueId) {
        await updateTicket(ticket, {
          queueOptionId: null,
          chatbot: false,
          queueId: currentOption.forwardQueueId
        });
        await startQueue(wbot, ticket, currentOption.forwardQueue);
        await checkIntegration(newMessage, wbot);
      }
      return;
    }

    if (filePath) {
      const sentMessage = await wbot.sendMessage(
        `${ticket.contact.number}@${
          ticket.isGroup ? "g.us" : "s.whatsapp.net"
        }`,
        { ...optionsMsg }
      );
      await verifyMediaMessage(sentMessage, ticket, ticket.contact);
    }

    if (currentOption.options.length > -1) {
      sendMenu(wbot, ticket, currentOption);
    }
  }
};

const handleMessage = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
  companyId: number,
  queueId?: number
): Promise<void> => {
  if (!isValidMsg(msg)) return;

  if (msg.message?.ephemeralMessage) {
    msg.message = msg.message.ephemeralMessage.message;
  }

  try {
    let msgContact: IMe;
    let groupContact: Contact | undefined;

    const isGroup = msg.key.remoteJid?.endsWith("@g.us");

    if (isGroup) {
      const msgIsGroupBlock = await Setting.findOne({
        where: {
          companyId,
          key: "CheckMsgIsGroup"
        }
      });

      if (!msgIsGroupBlock || msgIsGroupBlock.value === "enabled") {
        return;
      }
    }

    const bodyMessage = getBodyMessage(msg);
    const msgType = getTypeMessage(msg);

    const unpackedMessage =
      msgType !== "templateMessage" && getUnpackedMessage(msg);
    const messageMedia = unpackedMessage && getMessageMedia(unpackedMessage);
    if (msg.key.fromMe) {
      if (bodyMessage?.startsWith("\u200e")) return;

      if (
        !messageMedia &&
        msgType !== "conversation" &&
        msgType !== "extendedTextMessage" &&
        msgType !== "vcard"
      )
        return;
      msgContact = await getContactMessage(msg, wbot);
    } else {
      msgContact = await getContactMessage(msg, wbot);
    }

    if (isGroup) {
      groupContact = await wbotMutex.runExclusive(async () => {
        let result = groupContactCache.get(msg.key.remoteJid);
        if (!result) {
          const groupMetadata = await wbot.groupMetadata(msg.key.remoteJid);
          const msgGroupContact = {
            id: groupMetadata.id,
            name: groupMetadata.subject
          };
          result = await verifyContact(msgGroupContact, wbot, companyId);
          groupContactCache.set(msg.key.remoteJid, result);
        }
        return result;
      });
    }

    const whatsapp = await ShowWhatsAppService(wbot.id!, companyId);
    const contact = await verifyContact(msgContact, wbot, companyId);

    let unreadMessages = 0;

    if (msg.key.fromMe) {
      await cacheLayer.set(`contacts:${contact.id}:unreads`, "0");
    } else {
      const unreads = await cacheLayer.get(`contacts:${contact.id}:unreads`);
      unreadMessages = +unreads + 1;
      await cacheLayer.set(
        `contacts:${contact.id}:unreads`,
        `${unreadMessages}`
      );
    }

    const lastMessage = await Message.findOne({
      where: {
        contactId: contact.id,
        companyId,
        "$ticket.whatsappId$": whatsapp.id
      },
      include: ["ticket"],
      order: [["createdAt", "DESC"]]
    });

    const complationMessage =
      whatsapp.complationMessage.trim() || "Atendimento finalizado";

    if (
      lastMessage &&
      unreadMessages === 0 &&
      complationMessage &&
      formatBody(complationMessage, lastMessage.ticket).trim().toLowerCase() ===
        lastMessage?.body.trim().toLowerCase()
    ) {
      return;
    }

    if (!msg.key.fromMe && !contact.isGroup) {
      const userRatingEnabled =
        (await GetCompanySetting(companyId, "userRating", "")) === "enabled";

      const ticketTracking =
        userRatingEnabled &&
        (await TicketTraking.findOne({
          where: {
            whatsappId: whatsapp.id,
            rated: false,
            expired: false,
            ratingAt: { [Op.not]: null }
          },
          include: [
            {
              model: Ticket,
              where: {
                status: "closed",
                contactId: contact.id
              },
              include: [
                {
                  model: Contact
                },
                {
                  model: User
                },
                {
                  model: Queue
                }
              ]
            }
          ]
        }));

      if (ticketTracking) {
        try {
          /**
           * Tratamento para avaliação do atendente
           */

          logger.debug(
            { ticketTracking },
            `start handling tracking rating for ticket ${ticketTracking.ticketId}`
          );

          const rate = Number(bodyMessage);

          if (Number.isFinite(rate)) {
            logger.debug(
              `received rate ${rate} for ticket ${ticketTracking.ticketId}`
            );
            handleRating(rate, ticketTracking.ticket, ticketTracking, wbot);
            return;
          }
          if (bodyMessage.trim() === "!") {
            // abort rating and reopen ticket
            logger.debug(
              `ticket ${ticketTracking.ticketId} reopen by contact request`
            );
            ticketTracking.update({
              ratingAt: null
            });
            updateTicket(ticketTracking.ticket, {
              status: "open",
              userId: ticketTracking.userId
            });
            quickMessage(
              wbot,
              ticketTracking.ticket,
              "Atendimento reaberto",
              true
            );
            return;
          }
          // expire rating
          logger.debug(
            `tracking of ticket ${ticketTracking.ticketId} expired by wrong rate ${bodyMessage}`
          );
          ticketTracking.update({
            expired: true
          });
          quickMessage(wbot, ticketTracking.ticket, "Avaliação cancelada");
          if (bodyMessage.length < 10) {
            // short message just stop the processing
            return;
          }
        } catch (e) {
          Sentry.captureException(e);
          console.log(e);
        }
      }
    }

    const scheduleType = await GetCompanySetting(
      companyId,
      "scheduleType",
      "disabled"
    );

    const outOfHoursAction = await GetCompanySetting(
      companyId,
      "outOfHoursAction",
      "pending"
    );
    let currentSchedule: ScheduleResult = null;

    if (scheduleType === "company") {
      currentSchedule = await VerifyCurrentSchedule(companyId);
    }

    let defaultQueue: Queue;

    if (
      (msg.key.fromMe ||
        contact.disableBot ||
        currentSchedule?.inActivity === false) &&
      !contact.isGroup &&
      whatsapp.queues.length === 1
    ) {
      defaultQueue = await Queue.findByPk(whatsapp.queues[0].id);
    }

    const findOnly = [
      "reactionMessage",
      "stickerMessage",
      "editedMessage",
      "protocolMessage"
    ].includes(msgType);

    const { ticket, justCreated } = await FindOrCreateTicketService(
      contact,
      wbot.id!,
      unreadMessages,
      companyId,
      {
        groupContact,
        findOnly,
        queue: queueId
          ? (await Queue.findByPk(queueId)) || defaultQueue
          : defaultQueue
      }
    );

    if (!ticket) {
      return;
    }

    const ticketMessages = await Message.findAll({
      where: {
        ticketId: ticket.id
      }
    });

    const isNewTicket = ticketMessages.length === 0;

    const integrationSession = await IntegrationSession.findOne({
      where: {
        ticketId: ticket.id
      }
    });

    // voltar para o menu inicial

    if (
      bodyMessage === "#" &&
      ticket.chatbot &&
      !isGroup &&
      !integrationSession
    ) {
      await updateTicket(ticket, {
        queueOptionId: null,
        chatbot: false,
        queueId: null
      });

      if (!subscriptionService.isValid()) {
        return;
      }

      await verifyQueue(wbot, msg, ticket, ticket.contact, true);
      return;
    }

    let newMessage: Message = null;

    if (
      messageMedia ||
      msg?.message?.extendedTextMessage?.thumbnailDirectPath
    ) {
      newMessage = await verifyMediaMessage(
        msg,
        ticket,
        contact,
        wbot,
        messageMedia
      );
    } else if (
      msg.message?.editedMessage?.message?.protocolMessage?.editedMessage
    ) {
      // message edited by Whatsapp App
      await verifyEditedMessage(
        msg.message.editedMessage.message.protocolMessage.editedMessage,
        ticket,
        msg.message.editedMessage.message.protocolMessage.key.id
      );
    } else if (msg.message?.protocolMessage?.editedMessage) {
      // message edited by Whatsapp Web
      await verifyEditedMessage(
        msg.message.protocolMessage.editedMessage,
        ticket,
        msg.message.protocolMessage.key.id
      );
    } else if (msg.message?.protocolMessage?.type === 0) {
      await verifyDeleteMessage(msg.message.protocolMessage, ticket);
    } else {
      newMessage = await verifyMessage(msg, ticket, contact);
    }

    if (!subscriptionService.isValid()) {
      return;
    }

    if (isGroup || contact.disableBot) {
      return;
    }

    try {
      if (!msg.key.fromMe && scheduleType) {
        const isOpenOnline =
          ticket.status === "open" && ticket.user.socketSessions.length > 0;

        const avoidResend =
          !isOpenOnline && outOfHoursCache.get(`ticket-${ticket.id}`);

        if (scheduleType === "company" && !isOpenOnline) {
          if (
            !isNil(currentSchedule) &&
            (!currentSchedule || currentSchedule.inActivity === false)
          ) {
            if (!avoidResend) {
              outOfHoursCache.set(`ticket-${ticket.id}`, true);
              const outOfHoursMessage =
                whatsapp.outOfHoursMessage.trim() ||
                "Estamos fora do horário de expediente";
              const sentMessage = await wbot.sendMessage(
                `${ticket.contact.number}@${
                  ticket.isGroup ? "g.us" : "s.whatsapp.net"
                }`,
                {
                  text: formatBody(outOfHoursMessage, ticket)
                }
              );
              await verifyMessage(sentMessage, ticket, ticket.contact);
            }
            if (ticket.status !== "open") {
              await UpdateTicketService({
                ticketData: { chatbot: false, status: outOfHoursAction },
                ticketId: ticket.id,
                companyId: ticket.companyId
              });
            }
            return;
          }
        }

        if (
          scheduleType === "queue" &&
          ticket.queueId !== null &&
          !isOpenOnline
        ) {
          currentSchedule = await VerifyCurrentSchedule(
            companyId,
            ticket.queueId
          );
          const queue = await Queue.findByPk(ticket.queueId);

          if (
            !isNil(currentSchedule) &&
            (!currentSchedule || currentSchedule.inActivity === false)
          ) {
            if (!avoidResend) {
              outOfHoursCache.set(`ticket-${ticket.id}`, true);
              const outOfHoursMessage =
                queue.outOfHoursMessage?.trim() ||
                "Estamos fora do horário de expediente";
              const sentMessage = await wbot.sendMessage(
                `${ticket.contact.number}@${
                  ticket.isGroup ? "g.us" : "s.whatsapp.net"
                }`,
                {
                  text: formatBody(outOfHoursMessage, ticket)
                }
              );
              await verifyMessage(sentMessage, ticket, ticket.contact);
            }
            if (ticket.status !== "open") {
              await UpdateTicketService({
                ticketData: { chatbot: false, status: outOfHoursAction },
                ticketId: ticket.id,
                companyId: ticket.companyId
              });
            }
            return;
          }
        }
      }
    } catch (e) {
      Sentry.captureException(e);
      console.log(e);
    }

    if (
      !ticket.queue &&
      !isGroup &&
      !msg.key.fromMe &&
      !ticket.userId &&
      whatsapp.queues.length >= 1
    ) {
      await verifyQueue(wbot, msg, ticket, ticket.contact, isNewTicket);
    }

    const dontReadTheFirstQuestion = isNewTicket || ticket.queue === null;

    await ticket.reload();

    if (
      justCreated &&
      !whatsapp?.queues?.length &&
      !ticket.userId &&
      !isGroup &&
      !msg.key.fromMe
    ) {
      const message = await Message.findOne({
        where: {
          ticketId: ticket.id,
          fromMe: true
        },
        order: [["createdAt", "DESC"]]
      });

      if (message && message.body.includes(whatsapp.greetingMessage)) {
        return;
      }

      if (whatsapp.greetingMessage) {
        const debouncedSentMessage = debounce(
          async () => {
            await wbot.sendMessage(
              `${ticket.contact.number}@${
                ticket.isGroup ? "g.us" : "s.whatsapp.net"
              }`,
              {
                text: formatBody(`${whatsapp.greetingMessage}`, ticket)
              }
            );
          },
          1000,
          ticket.id
        );
        debouncedSentMessage();
        return;
      }
    }

    if (ticket.chatbot && !msg.key.fromMe) {
      await handleChartbot(
        ticket,
        msg,
        newMessage,
        wbot,
        dontReadTheFirstQuestion
      );
    }
  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
    logger.error(`Error handling whatsapp message: Err: ${err}`);
  }
};

const handleMsgAck = async (msg: WAMessage, ack: number) => {
  if (!ack) return;

  const io = getIO();

  try {
    const messageToUpdate = await Message.findByPk(msg.key.id, {
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
        }
      ]
    });

    if (!messageToUpdate || ack <= messageToUpdate.ack) return;

    await messageToUpdate.update({ ack });
    io.to(messageToUpdate.ticketId.toString()).emit(
      `company-${messageToUpdate.companyId}-appMessage`,
      {
        action: "update",
        message: messageToUpdate
      }
    );
  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Error handling message ack. Err: ${err}`);
  }
};

const verifyRecentCampaign = async (
  message: proto.IWebMessageInfo,
  companyId: number
) => {
  if (!message.key.fromMe) {
    const number = message.key.remoteJid.replace(/\D/g, "");
    const campaigns = await Campaign.findAll({
      where: { companyId, status: "EM_ANDAMENTO", confirmation: true }
    });
    if (campaigns) {
      const ids = campaigns.map(c => c.id);
      const campaignShipping = await CampaignShipping.findOne({
        where: { campaignId: { [Op.in]: ids }, number, confirmation: null }
      });

      if (campaignShipping) {
        await campaignShipping.update({
          confirmedAt: new Date(),
          confirmation: true
        });
        await campaignQueue.add(
          "DispatchConfirmedCampaign",
          {
            campaignShippingId: campaignShipping.id,
            campaignId: campaignShipping.campaignId
          },
          {
            delay: parseToMilliseconds(randomValue(0, 10))
          }
        );
        return true;
      }
    }
  }
  return false;
};

const filterMessages = (msg: WAMessage): boolean => {
  // receiving edited message
  if (msg.message?.protocolMessage?.editedMessage) return true;
  // receiving message deletion info
  if (msg.message?.protocolMessage?.type === 0) return true;
  // ignore other protocolMessages
  if (msg.message?.protocolMessage) return false;

  if (
    [
      WAMessageStubType.REVOKE,
      WAMessageStubType.E2E_DEVICE_CHANGED,
      WAMessageStubType.E2E_IDENTITY_CHANGED,
      WAMessageStubType.CIPHERTEXT
    ].includes(msg.messageStubType)
  )
    return false;

  return true;
};

const wbotMessageListener = async (
  wbot: Session,
  companyId: number
): Promise<void> => {
  try {
    wbot.ev.on("messages.upsert", async (messageUpsert: ImessageUpsert) => {
      logger.trace({ messageUpsert }, "wbotMessageListener: messages.upsert");
      const messages = messageUpsert.messages
        .filter(filterMessages)
        .map(msg => msg);

      if (!messages) return;

      messages.forEach(async (message: proto.IWebMessageInfo) => {
        if (!message?.message) {
          logger.warn(
            { message },
            "wbotMessageListener: messages.upsert without supported content"
          );
          return;
        }
        const messageExists = await Message.count({
          where: { id: message.key.id!, companyId }
        });

        if (!messageExists) {
          if (await verifyRecentCampaign(message, companyId)) {
            return;
          }
          await handleMessage(message, wbot, companyId);
        }
      });
    });

    wbot.ev.on("messages.update", (messageUpdate: WAMessageUpdate[]) => {
      logger.trace({ messageUpdate }, "wbotMessageListener: messages.update");
      if (messageUpdate.length === 0) return;
      messageUpdate.forEach(async (message: WAMessageUpdate) => {
        (wbot as WASocket)!.readMessages([message.key]);

        await ackMutex.runExclusive(async () => {
          handleMsgAck(message, message.update.status);
        });
      });
    });

    wbot.ev.on("messaging-history.set", async (history: MessageHistorySet) => {
      if (history.syncType !== proto.HistorySync.HistorySyncType.ON_DEMAND) {
        const resumeCounters = {
          chats: history.chats.length,
          contacts: history.contacts.length,
          messages: history.messages.length,
          isLatest: history.isLatest,
          syncType: history.syncType
        };
        logger.debug(
          { resumeCounters },
          "ignoring not  ON_DEMAND history sync"
        );
        return;
      }

      const tickets = {};

      let oldestMessage: proto.IWebMessageInfo = null;

      const processHistoryMessage = async (msg: proto.IWebMessageInfo) => {
        if (!msg?.message) return;

        if (
          !oldestMessage ||
          msg.messageTimestamp < oldestMessage.messageTimestamp
        ) {
          oldestMessage = msg;
        }

        if (!tickets[msg.key.remoteJid]) {
          logger.debug(
            { contacts: history.contacts, remoteJid: msg.key.remoteJid },
            "checking contacts"
          );
          const chat = history.contacts.find(c => c?.id === msg.key.remoteJid);
          const chatContact: IMe = {
            id: chat?.id || msg.key.remoteJid,
            name: chat?.name || ""
          };
          const contact = await wbotMutex.runExclusive(async () => {
            let result: Contact = contactCache.get(chatContact.id);
            if (!result) {
              result = await verifyContact(chatContact, wbot, companyId);
              contactCache.set(chatContact.id, result);
            }
            return result;
          });
          const whatsapp = await ShowWhatsAppService(wbot.id!, companyId);
          const { ticket } = await FindOrCreateTicketService(
            contact,
            whatsapp.id,
            0,
            companyId,
            { history: true, timestamp: Number(msg.messageTimestamp) }
          );
          tickets[msg.key.remoteJid] = ticket;
        }
        const ticket = tickets[msg.key.remoteJid];

        const contact = await wbotMutex.runExclusive(async () => {
          const msgContact = await getContactMessage(msg, wbot);
          let result: Contact = contactCache.get(msgContact.id);
          if (!result) {
            result = await verifyContact(msgContact, wbot, companyId);
            contactCache.set(msgContact.id, result);
          }
          return result;
        });

        const msgType = getTypeMessage(msg);

        const unpackedMessage =
          msgType !== "templateMessage" && getUnpackedMessage(msg);
        const messageMedia =
          unpackedMessage && getMessageMedia(unpackedMessage);

        if (
          messageMedia ||
          msg?.message?.extendedTextMessage?.thumbnailDirectPath
        ) {
          verifyMediaMessage(msg, ticket, contact, wbot, messageMedia).catch(
            err => {
              logger.error({ msg, err }, "Error handling media message");
            }
          );
        } else {
          verifyMessage(msg, ticket, contact).catch(err => {
            logger.error({ msg, err }, "Error handling message");
          });
        }
      };

      await history.messages.reduce(async (prevPromise, item) => {
        await prevPromise;
        return processHistoryMessage(item);
      }, Promise.resolve());

      if (!history.isLatest && oldestMessage) {
        const limitDays = parseInt(
          await CheckSettings("fetchHistoryLimitDays", "365"),
          10
        );

        // avoid using moment
        const now = new Date();
        const limitDate = new Date(now.setDate(now.getDate() - limitDays));
        const oldestDate = new Date(
          Number(oldestMessage.messageTimestamp) * 1000
        );

        if (oldestDate < limitDate) {
          logger.debug(
            { oldestDate, limitDate, oldestMessage },
            "History limit reached"
          );
          return;
        }

        const result = await wbot.fetchMessageHistory(
          500,
          oldestMessage.key,
          oldestMessage.messageTimestamp
        );

        logger.debug({ result }, "Requested more message history");
      }
    });
  } catch (error) {
    Sentry.captureException(error);
    logger.error(`Error handling wbot message listener. Err: ${error}`);
  }
};

export { wbotMessageListener, handleMessage };
