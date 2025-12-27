import axios from "axios";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";

export interface DisconnectWebhookPayload {
  whatsappId: number;
  whatsappName: string;
  status: string;
  companyId: number;
  reason?: string;
}

const buildPayload = (
  whatsapp: Whatsapp,
  status: string,
  reason?: string
): DisconnectWebhookPayload => ({
  whatsappId: whatsapp.id,
  whatsappName: whatsapp.name,
  companyId: whatsapp.companyId,
  status,
  reason
});

const SendDisconnectWebhookService = async (
  whatsapp: Whatsapp,
  status: string,
  reason?: string
): Promise<void> => {
  const webhookUrl = process.env.DISCONNECT_WEBHOOK_URL;

  if (!webhookUrl) {
    return;
  }

  const payload = buildPayload(whatsapp, status, reason);

  try {
    await axios.post(webhookUrl, payload, {
      timeout: 5000
    });
  } catch (error) {
    logger.warn({ error, payload }, "Failed to send disconnect webhook");
  }
};

export default SendDisconnectWebhookService;
