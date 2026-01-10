import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import AppError from "../errors/AppError";

import CreateService from "../services/TagServices/CreateService";
import ListService from "../services/TagServices/ListService";
import UpdateService from "../services/TagServices/UpdateService";
import ShowService from "../services/TagServices/ShowService";
import DeleteService from "../services/TagServices/DeleteService";
import SimpleListService from "../services/TagServices/SimpleListService";
import SyncTagService from "../services/TagServices/SyncTagsService";

type IndexQuery = {
  searchParam?: string;
  pageNumber?: string | number;
  kanban?: number;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { pageNumber, searchParam } = req.query as IndexQuery;
  const { companyId } = req.user;

  console.log(searchParam);

  const { tags, count, hasMore } = await ListService({
    searchParam,
    pageNumber,
    companyId
  });

  return res.json({ tags, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { name, color, kanban } = req.body;
  const { companyId } = req.user;

  const tag = await CreateService({
    name,
    color,
    kanban: kanban || null,
    companyId
  });

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit("tag", {
    action: "create",
    tag
  });

  return res.status(200).json(tag);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { tagId } = req.params;

  const tag = await ShowService(Number(tagId), req.user.companyId);

  return res.status(200).json(tag);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.user.profile !== "admin" && req.user.profile !== "supervisor") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const { tagId } = req.params;
  const { companyId } = req.user;
  const tagData = req.body;

  const tag = await UpdateService({ tagData, id: Number(tagId), companyId });

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit("tag", {
    action: "update",
    tag
  });

  return res.status(200).json(tag);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tagId } = req.params;
  const { companyId } = req.user;

  await DeleteService(Number(tagId), companyId);

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit("tag", {
    action: "delete",
    tagId
  });

  return res.status(200).json({ message: "Tag deleted" });
};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam } = req.query as IndexQuery;
  const { companyId } = req.user;

  // console.log(searchParam);
  const tags = await SimpleListService({ searchParam, companyId });

  return res.json(tags);
};

export const syncTags = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const data = req.body;
  const { companyId } = req.user;

  const tags = await SyncTagService({ ...data, companyId });

  return res.json(tags);
};
