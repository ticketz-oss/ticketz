import Whatsapp from "../models/Whatsapp";
import SendMetaReactionService from "../services/MetaWhatsAppServices/SendMetaReactionService";
import GetTicketServiceWindowService from "../services/TicketServices/TicketServiceWindowService";
import SendTicketTemplateService from "../services/MetaWhatsAppServices/SendTicketTemplateService";
import { Request, Response } from "express";
import fs from "fs";
import AppError from "../errors/AppError";

import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
import { getIO } from "../libs/socket";
import Queue from "../models/Queue";
import User from "../models/User";

import ListMessagesService from "../services/MessageServices/ListMessagesService";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import DeleteWhatsAppMessage from "../services/WbotServices/DeleteWhatsAppMessage";
import SendWhatsAppMedia from "../services/WbotServices/SendWhatsAppMedia";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
import EditWhatsAppMessage from "../services/WbotServices/EditWhatsAppMessage";

import { MessageData } from "../helpers/SendMessage";
import Message from "../models/Message";
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import OldMessage from "../models/OldMessage";
import ForwardMessageService from "../services/MessageServices/ForwardMessageService";
import { getWbot } from "../libs/wbot";
import { verifyMessage } from "../services/WbotServices/wbotMessageListener";
import { getJidOf } from "../services/WbotServices/getJidOf";
import { assertGroupAccess } from "../services/WhatsappGroupServices/GroupAccessService";
import { markGroupRead } from "../services/WhatsappGroupServices/GroupUnreadService";
import ShowContactService from "../services/ContactServices/ShowContactService";
import { verifyContact } from "../services/WbotServices/verifyContact";
import normalizeMediaCaption from "../helpers/normalizeMediaCaption";
import ResolveQuotedMessageService from "../services/MessageServices/ResolveQuotedMessageService";

type IndexQuery = {
  nextId?: string;
  markAsRead: string;
  minUpdatedAt?: string;
};

type ForwardData = {
  contactId: number;
  ticketId: number;
  messageId: string;
  queueId: number;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { nextId, markAsRead, minUpdatedAt } = req.query as IndexQuery;
  const { companyId, profile } = req.user;
  const queues: number[] = [];

  const requestedTicket = await Ticket.findOne({
    where: { id: ticketId, companyId },
    attributes: ["id", "isGroup"]
  });
  if (requestedTicket?.isGroup) {
    await assertGroupAccess(ticketId, req.user);
  }

  if (profile !== "admin" && !requestedTicket?.isGroup) {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Queue, as: "queues" }]
    });
    user.queues.forEach(queue => {
      queues.push(queue.id);
    });
  }

  const {
    count,
    messages,
    ticket,
    hasMore,
    nextId: responseNextId
  } = await ListMessagesService({
    nextId,
    ticketId,
    companyId,
    queues,
    minUpdatedAt
  });

  if (ticket.channel === "whatsapp" && markAsRead === "true") {
    if (ticket.isGroup && ticket.contact?.groupMode !== "ticket") {
      await markGroupRead(Number(ticketId), Number(req.user.id), companyId);
    } else {
      SetTicketMessagesAsRead(ticket);
    }
  }

  return res.json({ count, messages, ticket, hasMore, nextId: responseNextId });
};

export const historyByMessageId = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { messageId } = req.params;
  const { companyId } = req.user;

  const message = await Message.findOne({
    where: {
      id: messageId,
      companyId
    },
    attributes: ["id"],
    include: [
      {
        model: Ticket,
        as: "ticket",
        attributes: [
          "id",
          "companyId",
          "status",
          "userId",
          "queueId",
          "isGroup"
        ]
      }
    ]
  });

  if (!message) {
    throw new AppError("ERR_MESSAGE_NOT_FOUND", 404);
  }

  const ticket = message.ticket as Ticket;

  if (ticket.isGroup) {
    await assertGroupAccess(ticket.id, req.user);
  }

  if (ticket.companyId !== companyId) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const oldMessages = await OldMessage.findAll({
    where: {
      messageId
    },
    order: [["createdAt", "ASC"]]
  });

  return res.json({ oldMessages });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { body, quotedMsg, quotedMsgId } = req.body as MessageData & {
    quotedMsgId?: string;
  };
  const medias = req.files as Express.Multer.File[];
  const { companyId } = req.user;
  const userId = Number(req.user.id) || null;

  const ticket = await ShowTicketService(ticketId, companyId);
  if (ticket.isGroup) {
    await assertGroupAccess(ticketId, req.user);
    if (ticket.contact?.groupMode !== "ticket") {
      await markGroupRead(Number(ticketId), Number(req.user.id), companyId);
    }
  }
  const safeQuotedMsg = await ResolveQuotedMessageService({
    quotedMsgId: quotedMsgId || quotedMsg?.id,
    ticket,
    companyId
  });
  const { channel } = ticket;
  if (
    channel === "whatsapp" &&
    !ticket.isGroup &&
    ticket.whatsapp?.apiMode === "official"
  ) {
    const window = await GetTicketServiceWindowService(ticket);
    if (!window.open) throw new AppError("ERR_META_WINDOW_CLOSED", 403);
  }
  if (channel === "whatsapp") {
    await SetTicketMessagesAsRead(ticket);
    if (!ticket.isGroup && ticket.whatsapp?.apiMode !== "official") {
      const contact = await ShowContactService(ticket.contactId, companyId);
      if (!contact.number.includes("@") && !contact.whatsappLidMap) {
        await verifyContact(
          { id: `${contact.number}@s.whatsapp.net`, name: contact.name },
          getWbot(ticket.whatsappId),
          companyId
        );
        await ticket.reload();
      }
    }
  }

  if (medias) {
    if (channel === "whatsapp") {
      const caption = normalizeMediaCaption(body);
      await Promise.all(
        medias.map(async (media: Express.Multer.File) => {
          await SendWhatsAppMedia({ media, ticket, caption });
          fs.unlinkSync(media.path);
        })
      );
    }
  } else if (channel === "whatsapp") {
    await SendWhatsAppMessage({
      body,
      ticket,
      userId,
      quotedMsg: safeQuotedMsg
    });
  }

  return res.send();
};

// Unico caminho aceito pela Meta para iniciar conversa ou reengajar fora da
// janela de 24h.
export const storeTemplate = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId } = req.params;
  const { name, language, parameters } = req.body;
  const { companyId } = req.user;
  const userId = Number(req.user.id) || null;

  const ticket = await ShowTicketService(ticketId, companyId);

  if (ticket.isGroup) {
    throw new AppError("ERR_META_TEMPLATE_ON_GROUP", 400);
  }

  await SendTicketTemplateService({
    ticket,
    name,
    language,
    parameters: Array.isArray(parameters) ? parameters : [],
    userId
  });

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
  if (ticket.isGroup) {
    await assertGroupAccess(ticketId, req.user);
  }
  if (ticket.whatsapp?.apiMode === "official") {
    await SendMetaReactionService({
      connection: await Whatsapp.findByPk(ticket.whatsappId),
      ticket,
      messageId,
      emoji,
      userId: Number(req.user.id) || null
    });
    return res.send();
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

  const original = await Message.findOne({
    where: { id: messageId, companyId },
    include: [{ model: Ticket, as: "ticket", attributes: ["id", "isGroup"] }]
  });
  if (original?.ticket?.isGroup) {
    await assertGroupAccess(original.ticket.id, req.user);
  }

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

  const original = await Message.findOne({
    where: { id: messageId, companyId },
    include: [{ model: Ticket, as: "ticket", attributes: ["id", "isGroup"] }]
  });
  if (original?.ticket?.isGroup) {
    await assertGroupAccess(original.ticket.id, req.user);
  }

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

  const sourceTicket = await Ticket.findOne({
    where: { id: ticketId, companyId },
    attributes: ["id", "isGroup"]
  });
  if (sourceTicket?.isGroup) {
    await assertGroupAccess(sourceTicket.id, req.user);
  }

  if (
    user.profile !== "admin" &&
    queueId &&
    !user.queues.find(q => q.id === queueId)
  ) {
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
      "contact"
    ]
  });

  if (!message) {
    throw new AppError("ERR_MESSAGE_NOT_FOUND", 404);
  }

  const contact = await Contact.findByPk(contactId);

  if (!contact) {
    throw new AppError("ERR_CONTACT_NOT_FOUND", 404);
  }

  const queue = queueId && (await Queue.findByPk(queueId));

  if (queueId && !queue) {
    throw new AppError("ERR_QUEUE_NOT_FOUND", 404);
  }

  if (
    message.companyId !== companyId ||
    contact.companyId !== companyId ||
    (queue && queue.companyId !== companyId)
  ) {
    throw new AppError("ERR_ACCESS_DENIED", 403);
  }

  await ForwardMessageService(user, message, contact, queue);

  return res.send();
};
