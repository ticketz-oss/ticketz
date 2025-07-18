import { Request, Response } from "express";
import fs from "fs";
import { WAMessage } from "baileys";
import mime from "mime-types";
import AppError from "../errors/AppError";

import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
import { getIO } from "../libs/socket";
import Queue from "../models/Queue";
import User from "../models/User";
import Whatsapp from "../models/Whatsapp";

import ListMessagesService from "../services/MessageServices/ListMessagesService";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import DeleteWhatsAppMessage from "../services/WbotServices/DeleteWhatsAppMessage";
import SendWhatsAppMedia, {
  getMessageFileOptions,
  sendWhatsappFile
} from "../services/WbotServices/SendWhatsAppMedia";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
import CheckContactNumber from "../services/WbotServices/CheckNumber";
import EditWhatsAppMessage from "../services/WbotServices/EditWhatsAppMessage";

import { logger } from "../utils/logger";
import { MessageData } from "../helpers/SendMessage";
import Message from "../models/Message";
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import ForwardMessageService from "../services/MessageServices/ForwardMessageService";
import { getWbot } from "../libs/wbot";
import { verifyMessage } from "../services/WbotServices/wbotMessageListener";
import { CreateInternalMessageService } from "../services/MessageServices/CreateInternalMessageService";
import QuickMessage from "../models/QuickMessage";
import formatBody from "../helpers/Mustache";
import { OmniServices } from "../services/OmniServices/OmniServices";
import { getJidOf } from "../services/WbotServices/getJidOf";

type IndexQuery = {
  pageNumber: string;
  markAsRead: string;
};

type ForwardData = {
  contactId: number;
  ticketId: number;
  messageId: string;
  queueId: number;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { pageNumber, markAsRead } = req.query as IndexQuery;
  const { companyId, profile } = req.user;
  const queues: number[] = [];

  const user = await User.findByPk(req.user.id, {
    include: [{ model: Queue, as: "queues" }]
  });

  if (profile !== "admin") {
    user.queues.forEach(queue => {
      queues.push(queue.id);
    });
  }

  const { count, messages, ticket, hasMore } = await ListMessagesService({
    pageNumber,
    ticketId,
    companyId,
    queues,
    user
  });

  if (ticket.channel === "whatsapp" && markAsRead === "true") {
    SetTicketMessagesAsRead(ticket);
  }

  return res.json({ count, messages, ticket, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { body, quotedMsg, internal, ptt, quickMessageMediaId }: MessageData =
    req.body;
  const { companyId } = req.user;
  const userId = Number(req.user.id) || null;

  const ticket = await ShowTicketService(ticketId, companyId);
  const { channel } = ticket;
  const user = await User.findByPk(Number(req.user.id));

  SetTicketMessagesAsRead(ticket);

  if (internal) {
    await CreateInternalMessageService(
      ticket,
      body,
      Number(req.user.id) || null
    );
    return res.send();
  }

  if (ticket.whatsapp.channel !== "whatsapp") {
    const omniServices = OmniServices.getInstance();
    return omniServices.sendMessageFromRequest(ticket, req, res);
  }

  const medias = req.files as Express.Multer.File[];
  if (medias) {
    if (channel === "whatsapp") {
      let first = body && true;
      await Promise.all(
        medias.map(async (media: Express.Multer.File) => {
          const caption = first ? formatBody(body, ticket, user) : null;
          first = false;
          await SendWhatsAppMedia({
            media,
            ticket,
            userId,
            caption,
            ptt
          });
          fs.unlinkSync(media.path);
        })
      );
    }
  } else if (quickMessageMediaId) {
    const quickMessage = await QuickMessage.findByPk(quickMessageMediaId);

    if (!quickMessage) {
      throw new AppError("ERR_UNKNOWN", 404);
    }

    const { mediaPath, mediaName } = quickMessage;

    const fileOptions = await getMessageFileOptions(
      mediaName || "file",
      mediaPath
    );

    const mediaInfo = {
      mediaUrl: mediaPath,
      mimetype: mime.lookup(mediaPath) || "application/octet-stream",
      filename: mediaName
    };

    const caption = formatBody(body, ticket, user);

    const msgFileOptions = { ...fileOptions, caption };
    sendWhatsappFile(ticket, userId, mediaInfo, msgFileOptions);
  } else {
    await SendWhatsAppMessage({ body, ticket, userId, quotedMsg });
  }

  return res.send();
};

export const react = async (req: Request, res: Response): Promise<Response> => {
  const { messageId } = req.params;
  const { companyId } = req.user;
  const { ticketId, emoji } = req.body;

  const message = await Message.findOne({
    where: {
      id: messageId,
      ticketId
    }
  });

  if (!message) {
    throw new AppError("ERR_MESSAGE_NOT_FOUND", 404);
  }

  const ticket = await ShowTicketService(ticketId, companyId);

  if (ticket.whatsapp.channel !== "whatsapp") {
    const omniServices = OmniServices.getInstance();
    return omniServices.sendMessageFromRequest(ticket, req, res);
  }

  const wbot = getWbot(ticket.whatsappId);

  if (!wbot) {
    throw new AppError("ERR_WHATSAPP_NOT_FOUND", 500);
  }

  const msg = JSON.parse(message.dataJson);

  const sentMessage = await wbot.sendMessage(getJidOf(ticket), {
    react: {
      text: emoji,
      key: msg.key
    }
  });

  if (!sentMessage) {
    throw new AppError("ERR_WHATSAPP_MESSAGE_NOT_SENT", 500);
  }

  await verifyMessage(sentMessage, ticket, ticket.contact);
  return res.send();
};

export const edit = async (req: Request, res: Response): Promise<Response> => {
  const { messageId } = req.params;
  const { companyId } = req.user;
  const userId = Number(req.user.id) || null;
  const { body }: MessageData = req.body;

  const { ticketId, message } = await EditWhatsAppMessage({
    messageId,
    companyId,
    userId,
    body
  });

  const io = getIO();
  io.to(ticketId.toString()).emit(`company-${companyId}-appMessage`, {
    action: "update",
    message
  });

  return res.send();
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { messageId } = req.params;
  const { companyId } = req.user;

  const message = await DeleteWhatsAppMessage(messageId);

  const io = getIO();
  io.to(message.ticketId.toString()).emit(`company-${companyId}-appMessage`, {
    action: "update",
    message
  });

  return res.send();
};

export const forward = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { contactId, ticketId, messageId, queueId }: ForwardData = req.body;
  const { companyId } = req.user;

  const user = await User.findByPk(req.user.id, {
    include: [{ model: Queue, as: "queues" }]
  });

  if (user.profile !== "admin" && !user.queues.find(q => q.id === queueId)) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  const message = await Message.findOne({
    where: {
      id: messageId,
      ticketId
    },
    include: [
      {
        model: Ticket,
        as: "ticket",
        include: [
          {
            model: Whatsapp,
            as: "whatsapp"
          }
        ]
      },
      {
        model: Contact,
        as: "contact"
      }
    ]
  });

  if (!message) {
    throw new AppError("ERR_MESSAGE_NOT_FOUND", 404);
  }

  const contact = await Contact.findByPk(contactId);

  if (!contact) {
    throw new AppError("ERR_CONTACT_NOT_FOUND", 404);
  }

  const queue = await Queue.findByPk(queueId);

  if (!queue) {
    throw new AppError("ERR_QUEUE_NOT_FOUND", 404);
  }

  if (
    message.companyId !== companyId ||
    contact.companyId !== companyId ||
    queue.companyId !== companyId
  ) {
    throw new AppError("ERR_ACCESS_DENIED", 403);
  }

  await ForwardMessageService(user, message, contact, queue);

  return res.send();
};

export const send = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const messageData: MessageData = req.body;
  const medias = req.files as Express.Multer.File[];

  if (messageData.number === undefined) {
    throw new AppError("ERR_SYNTAX", 400);
  }
  const whatsapp = await Whatsapp.findByPk(whatsappId);

  if (!whatsapp) {
    throw new AppError("ERR_WHATSAPP_NOT_FOUND", 404);
  }

  try {
    let { number } = messageData;
    const { body } = messageData;

    if (!number.includes("@")) {
      const numberToTest = messageData.number;

      const { companyId } = whatsapp;

      const CheckValidNumber = await CheckContactNumber(
        numberToTest,
        companyId,
        whatsapp
      );
      number = CheckValidNumber.jid.replace(/\D/g, "");
    }

    if (medias) {
      await Promise.all(
        medias.map(async (media: Express.Multer.File, i) => {
          await req.app.get("queues").messageQueue.add(
            "SendMessage",
            {
              whatsappId,
              data: {
                ...messageData,
                number,
                caption: (Array.isArray(body) ? body[i] : body) || undefined,
                mediaPath: media.path
              }
            },
            { removeOnComplete: true, attempts: 3 }
          );
        })
      );
    } else {
      req.app.get("queues").messageQueue.add(
        "SendMessage",
        {
          whatsappId,
          data: { ...messageData, number }
        },

        { removeOnComplete: false, attempts: 3 }
      );
    }

    return res.send({ mensagem: "Message added to queue" });
  } catch (err) {
    const error = { errType: typeof err, serialized: JSON.stringify(err), err };
    if (err?.message) {
      console.error(error, `MessageController.send: ${err.message}`);
    } else {
      logger.error(
        error,
        "MessageController.send: Failed to put message on queue"
      );
    }
    throw new AppError("ERR_INTERNAL_ERROR", 500);
  }
};

export const history = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const contactId = Number(req.params.contactId);
  const whatsappId = Number(req.params.whatsappId);

  // get oldest message from contact
  const oldMessage = await Message.findOne({
    include: [
      {
        model: Ticket,
        as: "ticket",
        where: {
          contactId,
          whatsappId
        }
      }
    ],
    order: [["createdAt", "ASC"]]
  });

  const msg: WAMessage = JSON.parse(oldMessage?.dataJson);

  const wbot = getWbot(whatsappId);
  const result = await wbot.fetchMessageHistory(
    500,
    msg.key,
    msg.messageTimestamp
  );

  return res.status(200).json(result);
};
