import { Request, Response } from "express";

import { getIO } from "../libs/socket";
import AppError from "../errors/AppError";

import UpdateSettingService from "../services/SettingServices/UpdateSettingService";
import ListSettingsService from "../services/SettingServices/ListSettingsService";
import GetPublicSettingService from "../services/SettingServices/GetPublicSettingService";

type LogoRequest = {
  mode: string;
};

type PrivateFileRequest = {
  settingKey: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const settings = await ListSettingsService(req.user);

  return res.status(200).json(settings);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  
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

  const io = getIO();
  io.emit(`company-${companyId}-settings`, {
    action: "update",
    setting
  });

  return res.status(200).json(setting);
};

export const publicShow = async (req: Request, res: Response): Promise<Response> => {
  const { settingKey: key } = req.params;
  
  const settingValue = await GetPublicSettingService({ key });

  return res.status(200).json(settingValue);
};

export const storeLogo = async (req: Request, res: Response): Promise<Response> => {
  const file = req.file as Express.Multer.File;
  const { mode }: LogoRequest = req.body;
  const { companyId } = req.user;
  const validModes = [ "Light", "Dark", "Favicon" ];


  if ( validModes.indexOf(mode) === -1 ) {
    return res.status(406);
  }

  if (file && file.mimetype.startsWith("image/")) {
    
    const setting = await UpdateSettingService({
      key: `appLogo${mode}`,
      value: file.filename,
      companyId
    });
    
    return res.status(200).json(setting.value);
  }
  
  return res.status(406);
}

export const storePrivateFile = async (req: Request, res: Response): Promise<Response> => {
  const file = req.file as Express.Multer.File;
  const { settingKey }: PrivateFileRequest = req.body;
  const { companyId } = req.user;

  const setting = await UpdateSettingService({
    key: `_${settingKey}`,
    value: file.filename,
    companyId
  });
  
  return res.status(200).json(setting.value);
}
