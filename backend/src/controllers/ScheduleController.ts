import { Request, Response } from "express";
import fs from "fs";
import { Op, WhereOptions } from "sequelize";
import { getIO } from "../libs/socket";
import AppError from "../errors/AppError";
import Contact from "../models/Contact";
import ScheduleDelivery from "../models/ScheduleDelivery";
import Company from "../models/Company";
import CreateService, {
  SchedulePayload
} from "../services/ScheduleServices/CreateService";
import ListService from "../services/ScheduleServices/ListService";
import UpdateService from "../services/ScheduleServices/UpdateService";
import ShowService from "../services/ScheduleServices/ShowService";
import DeleteService from "../services/ScheduleServices/DeleteService";
import {
  BUILT_IN_SCHEDULE_VARIABLES,
  normalizeVariableKey
} from "../services/ScheduleServices/variables";
import { customFieldNames } from "../services/ScheduleServices/audience";
import PreviewService from "../services/ScheduleServices/PreviewService";
import CheckSettings from "../helpers/CheckSettings";
import { normalizeVisualMedia } from "../helpers/mediaConversion";
import SendNowService from "../services/ScheduleServices/SendNowService";

const prepareMedia = async (
  file?: Express.Multer.File
): Promise<Express.Multer.File | undefined> => {
  if (!file) return undefined;
  const allowedImages = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif"
  ];
  if (
    !allowedImages.includes(file.mimetype) &&
    !file.mimetype.startsWith("video/")
  ) {
    fs.unlinkSync(file.path);
    throw new AppError("ERR_SCHEDULE_INVALID_MEDIA", 400);
  }
  const limitMb = Number(await CheckSettings("uploadLimit", "15"));
  if (file.size > limitMb * 1024 * 1024) {
    fs.unlinkSync(file.path);
    throw new AppError("ERR_FILESIZE_OVER_LIMIT", 400);
  }
  try {
    const normalized = await normalizeVisualMedia(file);
    if (normalized.size > limitMb * 1024 * 1024) {
      if (fs.existsSync(normalized.path)) fs.unlinkSync(normalized.path);
      throw new AppError("ERR_FILESIZE_OVER_LIMIT", 400);
    }
    return normalized;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw new AppError("ERR_SCHEDULE_MEDIA_CONVERSION", 400);
  }
};

type ScheduleRequestPayload = Partial<SchedulePayload> & {
  removeMedia?: boolean;
};

type ScheduleIndexQuery = {
  contactId?: string;
  userId?: string;
  pageNumber?: string;
  searchParam?: string;
  kind?: string;
  status?: string;
  periodFrom?: string;
  periodTo?: string;
};

const requestPayload = (req: Request): ScheduleRequestPayload => {
  if (typeof req.body.payload === "string") {
    try {
      return JSON.parse(req.body.payload);
    } catch {
      throw new AppError("ERR_SCHEDULE_INVALID_PAYLOAD", 400);
    }
  }
  return req.body;
};

const withFile = (
  payload: ScheduleRequestPayload,
  file?: Express.Multer.File
): ScheduleRequestPayload =>
  file
    ? {
        ...payload,
        mediaPath: file.filename,
        mediaName: file.originalname,
        mediaType: file.mimetype
      }
    : payload;

export const index = async (req: Request, res: Response): Promise<Response> => {
  const {
    contactId,
    userId,
    pageNumber,
    searchParam,
    kind,
    status,
    periodFrom,
    periodTo
  } = req.query as ScheduleIndexQuery;
  const { companyId } = req.user;
  const result = await ListService({
    searchParam,
    contactId,
    userId,
    pageNumber,
    companyId,
    kind,
    status,
    periodFrom,
    periodTo
  });
  return res.json(result);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  req.file = await prepareMedia(req.file);
  const { companyId } = req.user;
  const payload = withFile(requestPayload(req), req.file);
  try {
    const schedule = await CreateService({
      ...payload,
      companyId,
      userId: Number(req.user.id)
    } as SchedulePayload);
    getIO()
      .to(`company-${companyId}-mainchannel`)
      .emit(`company-${companyId}-schedule`, { action: "create", schedule });
    return res.status(201).json(schedule);
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    throw error;
  }
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const schedule = await ShowService(req.params.scheduleId, req.user.companyId);
  return res.json(schedule);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  req.file = await prepareMedia(req.file);
  const existing = await ShowService(req.params.scheduleId, req.user.companyId);
  const raw = requestPayload(req);
  const scheduleData = withFile(
    {
      ...raw,
      mediaPath: raw.removeMedia ? null : existing.mediaPath,
      mediaName: raw.removeMedia ? null : existing.mediaName,
      mediaType: raw.removeMedia ? null : existing.mediaType
    },
    req.file
  );
  try {
    const schedule = await UpdateService({
      scheduleData,
      id: req.params.scheduleId,
      companyId: req.user.companyId
    });
    if ((req.file || raw.removeMedia) && existing.mediaPath) {
      const oldPath = `${process.cwd()}/public/${existing.mediaPath}`;
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    getIO()
      .to(`company-${req.user.companyId}-mainchannel`)
      .emit(`company-${req.user.companyId}-schedule`, {
        action: "update",
        schedule
      });
    return res.json(schedule);
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    throw error;
  }
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await DeleteService(req.params.scheduleId, req.user.companyId);
  getIO()
    .to(`company-${req.user.companyId}-mainchannel`)
    .emit(`company-${req.user.companyId}-schedule`, {
      action: "delete",
      scheduleId: req.params.scheduleId
    });
  return res.status(204).send();
};

export const sendNow = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const schedule = await SendNowService(
    req.params.scheduleId,
    req.user.companyId
  );
  getIO()
    .to(`company-${req.user.companyId}-mainchannel`)
    .emit(`company-${req.user.companyId}-schedule`, {
      action: "update",
      schedule
    });
  return res.json(schedule);
};

export const variables = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const custom = await customFieldNames(req.user.companyId);
  const company = await Company.findByPk(req.user.companyId, {
    attributes: ["timezone", "schedules"]
  });
  return res.json({
    builtIn: BUILT_IN_SCHEDULE_VARIABLES.filter(
      key => !["name", "firstname"].includes(key)
    ),
    custom: custom.map(name => ({
      name,
      key: `extra.${normalizeVariableKey(name)}`
    })),
    timezone: company?.timezone || company?.schedules?.timezone || null
  });
};

export const preview = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const result = await PreviewService({
    ...(req.body as SchedulePayload),
    companyId: req.user.companyId,
    userId: Number(req.user.id)
  });
  return res.json(result);
};

export const deliveries = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const schedule = await ShowService(req.params.scheduleId, req.user.companyId);
  const pageNumber = Number(req.query.pageNumber || 1);
  const limit = 20;
  const offset = (pageNumber - 1) * limit;
  const where: WhereOptions<ScheduleDelivery> = { scheduleId: schedule.id };
  const deliveryStatus = String(req.query.status || "");
  if (
    ["PENDING", "QUEUED", "SENT", "ERROR", "SKIPPED"].includes(deliveryStatus)
  ) {
    where.status = deliveryStatus as ScheduleDelivery["status"];
  }
  if (req.query.searchParam) {
    const searchParam = String(req.query.searchParam);
    where[Op.or] = [
      { contactName: { [Op.iLike]: `%${searchParam}%` } },
      { contactNumber: { [Op.like]: `%${searchParam}%` } }
    ];
  }
  const { count, rows } = await ScheduleDelivery.findAndCountAll({
    where,
    include: [
      { model: Contact, as: "contact", attributes: ["id", "name", "number"] }
    ],
    limit,
    offset,
    order: [["createdAt", "DESC"]]
  });
  return res.json({
    deliveries: rows,
    count,
    hasMore: count > offset + rows.length
  });
};
