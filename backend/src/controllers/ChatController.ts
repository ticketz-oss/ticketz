import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import CreateService from "../services/ChatService/CreateService";
import ListService from "../services/ChatService/ListService";
import ShowFromUuidService from "../services/ChatService/ShowFromUuidService";
import DeleteService from "../services/ChatService/DeleteService";
import FindMessages from "../services/ChatService/FindMessages";
import UpdateService from "../services/ChatService/UpdateService";

import AppError from "../errors/AppError";
import Chat from "../models/Chat";
import CreateMessageService from "../services/ChatService/CreateMessageService";
import User from "../models/User";
import ChatUser from "../models/ChatUser";

type IndexQuery = {
  pageNumber: string;
  searchParam?: string;
  companyId: string | number;
  ownerId?: number;
};

type StoreData = {
  users: { id: number; name?: string }[];
  title: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { pageNumber, searchParam } = req.query as unknown as IndexQuery;
  const ownerId = +req.user.id;

  const { records, count, hasMore } = await ListService({
    ownerId,
    pageNumber,
    searchParam
  });

  return res.json({ records, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const ownerId = +req.user.id;
  const data = req.body as StoreData;

  const record = await CreateService({
    ...data,
    ownerId,
    companyId
  });

  const io = getIO();

  record.users.forEach(user => {
    io.emit(`company-${companyId}-chat-user-${user.userId}`, {
      action: "create",
      record
    });
  });

  return res.status(200).json(record);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const data = req.body;
  const { id } = req.params;

  const record = await UpdateService({
    ...data,
    id: +id
  });

  const io = getIO();

  record.users.forEach(user => {
    io.emit(`company-${companyId}-chat-user-${user.userId}`, {
      action: "update",
      record
    });
  });

  return res.status(200).json(record);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const record = await ShowFromUuidService(id);

  if (
    !record ||
    record.companyId !== req.user.companyId ||
    !(await ChatUser.count({
      where: { chatId: record.id, userId: +req.user.id }
    }))
  ) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }
  return res.status(200).json(record);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  const { companyId } = req.user;

  await DeleteService(id);

  const io = getIO();
  io.emit(`company-${companyId}-chat`, {
    action: "delete",
    id
  });

  return res.status(200).json({ message: "Chat deleted" });
};

export const saveMessage = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const medias = req.files as Express.Multer.File[];
  const { companyId } = req.user;
  const { message } = req.body;
  const { id } = req.params;
  const senderId = +req.user.id;
  const chatId = +id;

  let newMessage = null;
  const novasMensagens = [];

  if (medias?.length) {
    await Promise.all(
      medias.map(async (media: Express.Multer.File) => {
        newMessage = await CreateMessageService({
          chatId,
          senderId,
          message: typeof message === "string" ? message.trim() : "",
          mediaPath: media.filename,
          mediaName: media.originalname,
          mediaType: media.mimetype.split("/")[0]
        });
        novasMensagens.push(newMessage);
      })
    );
  } else {
    newMessage = await CreateMessageService({
      chatId,
      senderId,
      message
    });
    novasMensagens.push(newMessage);
  }

  const chat = await Chat.findByPk(chatId, {
    include: [
      { model: User, as: "owner" },
      { model: ChatUser, as: "users" }
    ]
  });

  const chatUsersChannels = chat.users.map(user => `user-${user.userId}`);

  const io = getIO();
  novasMensagens
    .sort((a, b) => a.id - b.id)
    .forEach(mensagem => {
      io.to(chatUsersChannels).emit(`company-${companyId}-chat-${chatId}`, {
        action: "new-message",
        newMessage: mensagem,
        chat
      });

      io.to(chatUsersChannels).emit(`company-${companyId}-chat`, {
        action: "new-message",
        newMessage: mensagem,
        chat
      });
    });
  return res.json(newMessage);
};

export const checkAsRead = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const { userId } = req.body;
  const { id } = req.params;

  const chatUser = await ChatUser.findOne({ where: { chatId: id, userId } });
  await chatUser.update({ unreads: 0 });

  const chat = await Chat.findByPk(id, {
    include: [
      { model: User, as: "owner" },
      { model: ChatUser, as: "users" }
    ]
  });

  const chatUsersChannels = chat.users.map(user => `user-${user.userId}`);

  const io = getIO();
  io.to(chatUsersChannels).emit(`company-${companyId}-chat-${id}`, {
    action: "update",
    chat
  });

  io.to(chatUsersChannels).emit(`company-${companyId}-chat`, {
    action: "update",
    chat
  });

  return res.json(chat);
};

export const messages = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { pageNumber } = req.query as unknown as IndexQuery;
  const { id: chatId } = req.params;
  const ownerId = +req.user.id;

  const { records, count, hasMore } = await FindMessages({
    chatId,
    ownerId,
    pageNumber
  });

  return res.json({ records, count, hasMore });
};
