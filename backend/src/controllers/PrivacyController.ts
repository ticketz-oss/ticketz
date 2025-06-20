import { Request, Response } from "express";
import ShowPrivacyService from "../services/PrivacyService/ShowPrivacyService";
import Whatsapp from "../models/Whatsapp";
import AppError from "../errors/AppError";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import UpdatePrivacyWhatsapp from "../services/PrivacyService/UpdatePrivacyWhatsapp";

interface PrivacyData {
  readreceipts?: "all" | "none";
  profile?: "all" | "contacts" | "contact_blacklist" | "none";
  status?: "all" | "contacts" | "contact_blacklist" | "none";
  online?: "all" | "match_last_seen";
  last?: "all" | "contacts" | "contact_blacklist" | "none";
  groupadd?: "all" | "contacts" | "contact_blacklist";
  calladd?: "all" | "known";
  disappearing?: "86400" | "604800" | "7776000" | "0";
  whatsappId?: number;
}

function checkWhatsapp(whatsapp: Whatsapp) {
  if (!whatsapp) {
    throw new AppError("ERR_NOT_FOUND", 404);
  }

  if (whatsapp.status !== "CONNECTED") {
    throw new AppError("ERR_NOT_CONNECTED", 404);
  }

  if (whatsapp.channel !== "whatsapp") {
    throw new AppError("ERR_NOT_APPLICABLE", 404);
  }
}

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;

  const whatsapp: Whatsapp = await ShowWhatsAppService(whatsappId);

  checkWhatsapp(whatsapp);

  const privacy: PrivacyData = await ShowPrivacyService(whatsappId);
  return res.status(200).json(privacy);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;

  const whatsapp: Whatsapp = await ShowWhatsAppService(whatsappId);

  checkWhatsapp(whatsapp);

  const privacyData: PrivacyData = req.body;
  await UpdatePrivacyWhatsapp(whatsapp.id, privacyData, true);
  return res.status(200).json(true);
};
