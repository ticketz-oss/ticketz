import { Agent } from "https";
import * as Sentry from "@sentry/node";
import { initWASocket } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import { wbotMessageListener } from "./wbotMessageListener";
import wbotMonitor from "./wbotMonitor";
import { logger } from "../../utils/logger";
import { sendWhatsappUpdate } from "../WhatsappService/SocketSendWhatsappUpdate";

import { createProxyAgent } from "../../helpers/createProxyAgent";

export const StartWhatsAppSession = async (
  whatsapp: Whatsapp,
  companyId: number,
  isRefresh = false
): Promise<void> => {
  await whatsapp.update({ status: "OPENING" });

  sendWhatsappUpdate(whatsapp);

  try {
    let proxy: Agent;
    if (whatsapp.proxyConfig?.enabled) {
      proxy = createProxyAgent(whatsapp.proxyConfig);
    }
    const wbot = await initWASocket(whatsapp, proxy || null, isRefresh);
    wbotMessageListener(wbot, companyId);
    wbotMonitor(wbot, whatsapp, companyId);
  } catch (err) {
    logger.error(err);
  }
};
