import { Request, Response } from "express";

import AppError from "../errors/AppError";

import UpdateSettingService from "../services/SettingServices/UpdateSettingService";
import ListSettingsService from "../services/SettingServices/ListSettingsService";
import GetPublicSettingService from "../services/SettingServices/GetPublicSettingService";
import { GetSettingService } from "../services/SettingServices/GetSettingService";
import storeBrandingFile from "../helpers/brandingFiles";
import { promises as fs } from "fs";

type LogoRequest = {
  mode: string;
};

type PrivateFileRequest = {
  settingKey: string;
};

const publicFileValidators: Record<string, (mimetype: string) => boolean> = {
  loginSidePanelImage: (mimetype: string) => mimetype.startsWith("image/"),
  loginBackgroundContent: (mimetype: string) =>
    mimetype.startsWith("image/") || mimetype.startsWith("video/"),
  linkPreviewImage: (mimetype: string) => mimetype.startsWith("image/")
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const settings = await ListSettingsService(req.user);

  return res.status(200).json(settings);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { settingKey: key } = req.params;
  const { value } = req.body;
  const { companyId } = req.user;

  if (key.startsWith("_") && !req.user.isSuper) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const setting = await UpdateSettingService({
    key,
    value,
    companyId
  });

  return res.status(200).json(setting);
};

export const publicShow = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { settingKey: key } = req.params;
  const { slug } = req.query;

  const settingValue = await GetPublicSettingService({
    key,
    slug: typeof slug === "string" ? slug : undefined
  });

  return res.status(200).json(settingValue);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { settingKey: key } = req.params;

  const settingValue = await GetSettingService({ key, user: req.user });

  return res.status(200).json(settingValue);
};

export const storeLogo = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const file = req.file as Express.Multer.File;
  const { mode }: LogoRequest = req.body;
  const validModes = ["Light", "Dark", "Favicon"];

  if (validModes.indexOf(mode) === -1) {
    if (file?.path) await fs.unlink(file.path).catch(() => undefined);
    throw new AppError("ERR_INVALID_SETTING", 406);
  }

  if (file && file.mimetype.startsWith("image/")) {
    const key = `appLogo${mode}`;
    return salvarImagemBranding(req, res, key, file);
  }

  if (file?.path) await fs.unlink(file.path).catch(() => undefined);
  throw new AppError("ERR_INVALID_UPLOAD", 406);
};

export const storePrivateFile = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const file = req.file as Express.Multer.File;
  const { settingKey }: PrivateFileRequest = req.body;
  const { companyId } = req.user;

  const setting = await UpdateSettingService({
    key: `_${settingKey}`,
    value: file.filename,
    companyId
  });

  return res.status(200).json(setting.value);
};

export const storePublicFile = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const file = req.file as Express.Multer.File;
  const { settingKey }: PrivateFileRequest = req.body;

  if (!file || !settingKey) {
    if (file?.path) await fs.unlink(file.path).catch(() => undefined);
    throw new AppError("ERR_INVALID_UPLOAD", 406);
  }

  const validateMimetype = publicFileValidators[settingKey];

  if (!validateMimetype) {
    await fs.unlink(file.path).catch(() => undefined);
    throw new AppError("ERR_INVALID_SETTING", 406);
  }

  if (!validateMimetype(file.mimetype)) {
    await fs.unlink(file.path).catch(() => undefined);
    throw new AppError("ERR_INVALID_UPLOAD", 406);
  }

  return salvarImagemBranding(req, res, settingKey, file);
};

const salvarImagemBranding = async (
  req: Request,
  res: Response,
  key: string,
  file: Express.Multer.File
): Promise<Response> => {
  const { companyId } = req.user;
  const value = await storeBrandingFile(companyId, key, file);
  const setting = await UpdateSettingService({
    key,
    value,
    companyId,
    arquivoNovo: true
  });
  return res.status(200).json(setting.value);
};
