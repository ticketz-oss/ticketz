import {
  WAPrivacyCallValue,
  WAPrivacyGroupAddValue,
  WAPrivacyOnlineValue,
  WAPrivacyValue,
  WAReadReceiptsValue
} from "@whiskeysockets/baileys";
import { Request, Response } from "express";
import ShowPrivacyService from "../services/PrivacyService/ShowPrivacyService";
import Whatsapp from "../models/Whatsapp";
import AppError from "../errors/AppError";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import UpdatePrivacyWhatsapp from "../services/PrivacyService/UpdatePrivacyWhatsapp";

interface PrivacyData {
  readreceipts?: WAReadReceiptsValue;
  profile?: WAPrivacyValue;
  status?: WAPrivacyValue;
  online?: WAPrivacyOnlineValue;
  last?: WAPrivacyValue;
  groupadd?: WAPrivacyGroupAddValue;
  calladd?: WAPrivacyCallValue;
  // disappearing?: '86400' | '604800' | '7776000' | '0';
}
export const show = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  const whatsapp: Whatsapp = await ShowWhatsAppService(whatsappId, companyId);

  if (whatsapp) {
    const privacy: PrivacyData = await ShowPrivacyService(whatsappId);
    return res.status(200).json(privacy);
  }

  throw new AppError("ERR_NO_PRIVACY_FOUND", 404);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  const whatsapp: Whatsapp = await ShowWhatsAppService(whatsappId, companyId);

  if (whatsapp) {
    const privacyData: PrivacyData = req.body;
    const privacy: PrivacyData = await UpdatePrivacyWhatsapp(
      whatsapp.id,
      privacyData
    );
    return res.status(200).json(privacy);
  }

  throw new AppError("ERR_NO_PRIVACY_FOUND", 404);
};
