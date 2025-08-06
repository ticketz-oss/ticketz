import { initWASocket } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import { wbotMessageListener } from "./wbotMessageListener";
import wbotMonitor from "./wbotMonitor";
import { logger } from "../../utils/logger";
import { sendWhatsappUpdate } from "../WhatsappService/SocketSendWhatsappUpdate";

export const StartWhatsAppSession = async (
  whatsapp: Whatsapp,
  companyId: number,
  isRefresh = false
): Promise<void> => {
  await whatsapp.update({ status: "OPENING" });

  sendWhatsappUpdate(whatsapp);

  try {
    const wbot = await initWASocket(whatsapp, null, isRefresh);
    wbotMessageListener(wbot, companyId);
    wbotMonitor(wbot, whatsapp, companyId);
  } catch (err) {
    logger.error(err);
  }
};
