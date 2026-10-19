import * as Yup from "yup";
import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import { head } from "lodash";
import fs from "fs";
import path from "path";

import ListService from "../services/AnnouncementService/ListService";
import ListForUserService from "../services/AnnouncementService/ListForUserService";
import CreateService from "../services/AnnouncementService/CreateService";
import ShowService from "../services/AnnouncementService/ShowService";
import UpdateService from "../services/AnnouncementService/UpdateService";
import DeleteService from "../services/AnnouncementService/DeleteService";
import FindService from "../services/AnnouncementService/FindService";

import Announcement from "../models/Announcement";

import AppError from "../errors/AppError";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
  status: string;
  priority: string;
  periodFrom: string;
  periodTo: string;
};

type StoreData = {
  priority: number;
  title: string;
  text: string;
  status: boolean;
  companyId: number;
  isGlobal?: boolean;
  startsAt?: string;
  endsAt?: string;
  audienceMode?: "ALL" | "SEGMENTED";
  profiles?: string[];
  userIds?: number[];
  queueIds?: number[];
  whatsappIds?: number[];
  mediaPath?: string;
  mediaName?: string;
};

type FindParams = {
  companyId: string;
};

/**
 * Announcements are now company scoped, so the notification must not carry the
 * record to every tenant. Clients receive only the signal and refetch, which
 * also keeps the per-user audience resolution on the server where it belongs.
 */
const notify = (record: Announcement, action: string): void => {
  const io = getIO();
  const payload = { action, id: String(record.id) };

  if (record.isGlobal) {
    io.emit("company-announcement", payload);
    return;
  }

  io.to(`company-${record.companyId}-mainchannel`).emit(
    "company-announcement",
    payload
  );
};

/**
 * An announcement can only be touched by a super user or by an admin of the
 * company that owns it — company scoping is not enforced by the route alone.
 */
const findManageable = async (
  id: string,
  req: Request
): Promise<Announcement> => {
  const record = await Announcement.findByPk(id);

  if (!record) {
    throw new AppError("ERR_NO_ANNOUNCEMENT_FOUND", 404);
  }

  if (record.companyId !== req.user.companyId && !req.user.isSuper) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  return record;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber, status, priority, periodFrom, periodTo } =
    req.query as IndexQuery;
  const { companyId } = req.user;

  const { records, count, hasMore } = await ListService({
    companyId: +companyId,
    isSuper: req.user.isSuper,
    searchParam,
    pageNumber,
    status,
    priority,
    periodFrom,
    periodTo
  });

  return res.json({ records, count, hasMore });
};

export const feed = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, id, profile } = req.user;
  const { pageNumber } = req.query as { pageNumber: string };

  const { records, count, hasMore } = await ListForUserService({
    companyId: +companyId,
    userId: +id,
    profile,
    pageNumber
  });

  return res.json({ records, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const data = req.body as StoreData;

  const schema = Yup.object().shape({
    title: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const record = await CreateService({
    ...data,
    isGlobal: req.user.isSuper ? !!data.isGlobal : false,
    companyId: +companyId
  });

  notify(record, "create");

  return res.status(200).json(record);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  await findManageable(id, req);

  const record = await ShowService(id);

  return res.status(200).json(record);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const data = req.body as StoreData;

  const schema = Yup.object().shape({
    title: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const { id } = req.params;

  const current = await findManageable(id, req);

  const record = await UpdateService({
    ...data,
    isGlobal: req.user.isSuper ? !!data.isGlobal : current.isGlobal,
    id: parseInt(id, 10),
    companyId: current.companyId
  });

  notify(record, "update");

  return res.status(200).json(record);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  const current = await findManageable(id, req);

  await DeleteService(id);

  notify(current, "delete");

  return res.status(200).json({ message: "Announcement deleted" });
};

export const findList = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const params = req.query as FindParams;
  const records: Announcement[] = await FindService(params);

  return res.status(200).json(records);
};

export const mediaUpload = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  const files = req.files as Express.Multer.File[];
  const file = head(files);

  const announcement = await findManageable(id, req);

  try {
    await announcement.update({
      mediaPath: file.filename,
      mediaName: file.originalname
    });
    await announcement.reload();

    notify(announcement, "update");

    return res.send({ mensagem: "Mensagem enviada" });
  } catch (err: any) {
    throw new AppError(err.message);
  }
};

export const deleteMedia = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  const announcement = await findManageable(id, req);

  try {
    if (announcement.mediaPath) {
      const filePath = path.resolve("public", announcement.mediaPath);
      const fileExists = fs.existsSync(filePath);
      if (fileExists) {
        fs.unlinkSync(filePath);
      }
    }

    await announcement.update({
      mediaPath: null,
      mediaName: null
    });
    await announcement.reload();

    notify(announcement, "update");

    return res.send({ mensagem: "Arquivo excluído" });
  } catch (err: any) {
    throw new AppError(err.message);
  }
};
