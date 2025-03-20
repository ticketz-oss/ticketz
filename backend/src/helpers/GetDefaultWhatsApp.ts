import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";
import { logger } from "../utils/logger";

const GetDefaultWhatsApp = async (companyId: number): Promise<Whatsapp> => {
  let defaultWhatsapp = await Whatsapp.findOne({
    where: {
      isDefault: true,
      companyId,
      channel: "whatsapp",
      status: "CONNECTED"
    }
  });

  if (!defaultWhatsapp) {
    logger.info(
      "No default WhatsApp found, falling back to any connected WhatsApp"
    );
    defaultWhatsapp = await Whatsapp.findOne({
      where: {
        companyId,
        channel: "whatsapp",
        status: "CONNECTED"
      }
    });
  }

  if (!defaultWhatsapp) {
    throw new AppError("ERR_NO_DEF_WAPP_FOUND");
  }

  return defaultWhatsapp;
};

export default GetDefaultWhatsApp;
