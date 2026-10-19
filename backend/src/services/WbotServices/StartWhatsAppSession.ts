import { initWASocket } from "../../libs/wbot";
import { assertRuntimeCompany } from "../../helpers/tenantRuntime";
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
  assertRuntimeCompany(companyId);
  assertRuntimeCompany(whatsapp.companyId);
  // Cloud API connections never own a Baileys socket, including direct
  // refresh/recovery callers that bypass the startup enumeration.
  if (whatsapp.apiMode === "official") return;
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
