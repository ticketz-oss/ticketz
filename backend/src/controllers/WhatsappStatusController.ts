import fs from "fs";
import { Request, Response } from "express";
import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";
import { StatusAudienceMode, StatusKind } from "../models/WhatsappStatusPost";
import * as StatusPostService from "../services/WhatsappStatusServices/StatusPostService";
import { serializeStatusPost } from "../services/WhatsappStatusServices/StatusSocket";
import { previewAudience } from "../services/WhatsappStatusServices/StatusAudienceService";
import {
  removeStatusMedia,
  resolveStatusMediaPath,
  storeStatusMedia
} from "../services/WhatsappStatusServices/StatusMediaService";
import { getStatusProvider } from "../services/WhatsappStatusServices/providers/index";

const KINDS: StatusKind[] = ["text", "image", "video"];
const AUDIENCE_MODES: StatusAudienceMode[] = [
  "connection_contacts",
  "contact_list"
];
const MAX_IDEMPOTENCY_KEY = 80;

const invalidInput = () => new AppError("ERR_STATUS_INVALID_INPUT", 400);
const notFound = () => new AppError("ERR_STATUS_NOT_FOUND", 404);

// Multipart fields arrive as strings: "" means null, absent means "not sent".
const intField = (value: unknown): number | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed)) throw invalidInput();
  return parsed;
};

const stringField = (value: unknown): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") throw invalidInput();
  return value;
};

const enumField = <T extends string>(
  value: unknown,
  allowed: readonly T[]
): T | undefined => {
  if (value === undefined || value === "") return undefined;
  if (!allowed.includes(value as T)) throw invalidInput();
  return value as T;
};

const idParam = (value: string): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw notFound();
  return id;
};

const removeTempFile = (file?: Express.Multer.File): void => {
  if (file?.path) fs.promises.unlink(file.path).catch(() => undefined);
};

// Only the fields the client actually sent, so updates stay partial.
const parsePostFields = (
  body: Record<string, unknown>
): StatusPostService.UpdateStatusPostInput => {
  const fields: StatusPostService.UpdateStatusPostInput = {
    whatsappId: intField(body.whatsappId),
    kind: enumField(body.kind, KINDS),
    body: stringField(body.body),
    backgroundColor: stringField(body.backgroundColor),
    font: intField(body.font),
    audienceMode: enumField(body.audienceMode, AUDIENCE_MODES),
    contactListId: intField(body.contactListId)
  };
  Object.keys(fields).forEach(key => {
    if (fields[key] === undefined) delete fields[key];
  });
  return fields;
};

// Moves the multer temp file into company storage; storeStatusMedia always
// deletes the temp file. A file sent with a text post is rejected.
const storeUpload = async (
  companyId: number,
  kind: StatusKind | undefined,
  file?: Express.Multer.File
): Promise<{ mediaPath: string; mediaMime: string } | null> => {
  if (!file) return null;
  if (kind !== "image" && kind !== "video") {
    removeTempFile(file);
    throw new AppError("ERR_STATUS_MEDIA_INVALID", 400);
  }
  return storeStatusMedia(companyId, kind, file.path);
};

const discardStoredMedia = async (
  companyId: number,
  media: { mediaPath: string } | null,
  keptPath?: string | null
): Promise<void> => {
  if (!media || media.mediaPath === keptPath) return;
  await removeStatusMedia(companyId, media.mediaPath).catch(() => undefined);
};

export const listConnections = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  // Whatsapps has no phone-number column; `number` stays null for the client.
  const connections = await Whatsapp.findAll({
    where: { companyId },
    attributes: ["id", "name", "apiMode", "status"],
    order: [["name", "ASC"]]
  });

  return res.json(
    connections.map(connection => ({
      id: connection.id,
      name: connection.name,
      number: null,
      apiMode: connection.apiMode,
      status: connection.status,
      capabilities: getStatusProvider(connection).capabilities(connection)
    }))
  );
};

export const connectionCapabilities = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const capabilities = await StatusPostService.getCapabilities(
    companyId,
    idParam(req.params.whatsappId)
  );
  return res.json(capabilities);
};

export const audiencePreview = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const whatsappId = intField(req.query.whatsappId);
  const audienceMode = enumField(req.query.audienceMode, AUDIENCE_MODES);
  if (!whatsappId || !audienceMode) throw invalidInput();

  const connection = await Whatsapp.findOne({
    where: { id: whatsappId, companyId },
    attributes: ["id"]
  });
  if (!connection) throw notFound();

  const preview = await previewAudience({
    companyId,
    whatsappId,
    audienceMode,
    contactListId: intField(req.query.contactListId) ?? null
  });
  return res.json(preview);
};

export const listPosts = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const filters: { whatsappId?: number; active?: boolean } = {};
  const whatsappId = intField(req.query.whatsappId);
  if (whatsappId) filters.whatsappId = whatsappId;
  if (req.query.active === "true" || req.query.active === "1") {
    filters.active = true;
  } else if (req.query.active === "false" || req.query.active === "0") {
    filters.active = false;
  }

  const posts = await StatusPostService.listPosts(companyId, filters);
  return res.json(posts.map(post => serializeStatusPost(post)));
};

export const createPost = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const idempotencyKey = req.get("Idempotency-Key")?.trim();
  if (!idempotencyKey || idempotencyKey.length > MAX_IDEMPOTENCY_KEY) {
    removeTempFile(req.file);
    throw new AppError("ERR_STATUS_IDEMPOTENCY_REQUIRED", 400);
  }

  let fields: StatusPostService.UpdateStatusPostInput;
  try {
    fields = parsePostFields(req.body || {});
  } catch (err) {
    removeTempFile(req.file);
    throw err;
  }

  const media = await storeUpload(companyId, fields.kind, req.file);
  try {
    const post = await StatusPostService.createPost(
      companyId,
      Number(req.user.id),
      {
        whatsappId: fields.whatsappId,
        kind: fields.kind,
        body: fields.body ?? null,
        backgroundColor: fields.backgroundColor ?? null,
        font: fields.font ?? null,
        audienceMode: fields.audienceMode,
        contactListId: fields.contactListId ?? null,
        idempotencyKey,
        media
      }
    );
    // A repeated idempotency key returns the original post: drop the copy.
    await discardStoredMedia(companyId, media, post.mediaPath);
    return res.status(201).json(serializeStatusPost(post));
  } catch (err) {
    await discardStoredMedia(companyId, media);
    throw err;
  }
};

export const updatePost = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  let id: number;
  let fields: StatusPostService.UpdateStatusPostInput;
  try {
    id = idParam(req.params.id);
    fields = parsePostFields(req.body || {});
  } catch (err) {
    removeTempFile(req.file);
    throw err;
  }

  let media: { mediaPath: string; mediaMime: string } | null = null;
  if (req.file) {
    let { kind } = fields;
    if (!kind) {
      try {
        ({ kind } = await StatusPostService.showPost(companyId, id));
      } catch (err) {
        removeTempFile(req.file);
        throw err;
      }
    }
    media = await storeUpload(companyId, kind, req.file);
  }

  try {
    const post = await StatusPostService.updatePost(companyId, id, {
      ...fields,
      ...(media ? { media } : {})
    });
    return res.json(serializeStatusPost(post));
  } catch (err) {
    await discardStoredMedia(companyId, media);
    throw err;
  }
};

export const publishPost = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const id = idParam(req.params.id);
  const raw = req.body?.scheduledAt;

  let scheduledAt: Date | null = null;
  if (raw !== undefined && raw !== null && raw !== "") {
    scheduledAt = typeof raw === "string" ? new Date(raw) : null;
    if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
      throw new AppError("ERR_STATUS_SCHEDULE_INVALID", 400);
    }
  }

  const post = await StatusPostService.publishPost(companyId, id, {
    scheduledAt
  });
  return res.json(serializeStatusPost(post));
};

export const cancelPost = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const post = await StatusPostService.cancelPost(
    companyId,
    idParam(req.params.id)
  );
  return res.json(serializeStatusPost(post));
};

export const showMedia = async (req: Request, res: Response): Promise<void> => {
  const { companyId } = req.user;
  const post = await StatusPostService.showPost(
    companyId,
    idParam(req.params.id)
  );
  if (!post.mediaPath || !post.mediaMime) throw notFound();

  const absolutePath = resolveStatusMediaPath(companyId, post.mediaPath);

  if (req.query.download === "1" || req.query.download === "true") {
    const extension = post.mediaMime === "video/mp4" ? "mp4" : "jpg";
    res.attachment(`status-${post.id}.${extension}`);
  }
  // Set after attachment(), which would otherwise guess from the file name.
  res.setHeader("Content-Type", post.mediaMime);
  res.setHeader("Cache-Control", "private, no-store");

  await new Promise<void>((resolve, reject) => {
    res.sendFile(absolutePath, err => {
      if (!err) return resolve();
      if (res.headersSent) return resolve();
      return reject(notFound());
    });
  });
};
