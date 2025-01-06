import { Request, Response } from "express";
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

import { sendFacebookMessageMedia } from "../services/FacebookServices/sendFacebookMessageMedia";
import sendFaceMessage from "../services/FacebookServices/sendFacebookMessage";
import { logger } from "../utils/logger";
import { MessageData } from "../helpers/SendMessage";

import {
  verifyMediaMessage,
  verifyMessage
} from "../services/WbotServices/wbotMessageListener";
import { CreateInternalMessageService } from "../services/MessageServices/CreateInternalMessageService";
import QuickMessage from "../models/QuickMessage";
import formatBody from "../helpers/Mustache";

type IndexQuery = {
  pageNumber: string;
  markAsRead: string;
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
  const medias = req.files as Express.Multer.File[];
  const { companyId } = req.user;

  const ticket = await ShowTicketService(ticketId, companyId);
  const { channel } = ticket;
  const user = await User.findByPk(Number(req.user.id));

  if (channel === "whatsapp") {
    SetTicketMessagesAsRead(ticket);
  }

  if (internal) {
    await CreateInternalMessageService(
      ticket,
      body,
      Number(req.user.id) || null
    );
    return res.send();
  }

  if (medias) {
    if (channel === "whatsapp") {
      let first = body && true;
      await Promise.all(
        medias.map(async (media: Express.Multer.File) => {
          const caption = first
            ? formatBody(body, ticket.contact, ticket, user)
            : null;
          first = false;
          const message = await SendWhatsAppMedia({
            media,
            ticket,
            caption,
            ptt
          });
          verifyMediaMessage(
            message,
            ticket,
            ticket.contact,
            null,
            Number(req.user.id) || null
          );
        })
      );
    }

    if (["facebook", "instagram"].includes(channel)) {
      await Promise.all(
        medias.map(async (media: Express.Multer.File) => {
          await sendFacebookMessageMedia({ media, ticket });
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

    const caption = formatBody(body, ticket.contact, ticket, user);

    const msgFileOptions = { ...fileOptions, caption };
    const message = await sendWhatsappFile(ticket, msgFileOptions);
    verifyMediaMessage(
      message,
      ticket,
      ticket.contact,
      null,
      Number(req.user.id) || null
    );
  } else {
    if (["facebook", "instagram"].includes(channel)) {
      console.log(
        `Checking if ${ticket.contact.number} is a valid ${channel} contact`
      );
      await sendFaceMessage({ body, ticket, quotedMsg });
    }

    if (channel === "whatsapp") {
      const message = await SendWhatsAppMessage({
        body,
        ticket,
        quotedMsg,
        user
      });
      verifyMessage(
        message,
        ticket,
        ticket.contact,
        Number(req.user.id) || null
      );
    }
  }

  return res.send();
};

export const edit = async (req: Request, res: Response): Promise<Response> => {
  const { messageId } = req.params;
  const { companyId } = req.user;
  const { body }: MessageData = req.body;

  const { ticketId, message } = await EditWhatsAppMessage({
    messageId,
    companyId,
    userId: Number(req.user.id) || null,
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
    const { body, linkPreview } = messageData;
    const saveOnTicket = !!messageData.saveOnTicket;

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
                number,
                body:
                  (Array.isArray(body) ? body[i] : body) || media.originalname,
                mediaPath: media.path,
                saveOnTicket
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
          data: {
            number,
            body,
            linkPreview,
            saveOnTicket
          }
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
