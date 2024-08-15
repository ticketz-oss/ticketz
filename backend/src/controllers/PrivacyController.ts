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
    if (await UpdatePrivacyWhatsapp(whatsapp.id, privacyData, true)) {
      return res.status(200).json(true);
    }
  }

  throw new AppError("ERR_NO_PRIVACY_FOUND", 404);
};
