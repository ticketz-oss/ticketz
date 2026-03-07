/**
 * ValidateStatelessChannel
 *
 * Valida e ativa canais stateless (Telegram, WhatsApp Cloud API, Instagram, Email).
 * Esses canais não usam sessão Baileys — o status é CONNECTED quando a configuração
 * está correta e a API responde com sucesso.
 */

import axios from "axios";
import { logger } from "../utils/logger";
import Whatsapp from "../models/Whatsapp";
import { getIO } from "../libs/socket";

const GRAPH_API_URL = "https://graph.facebook.com/v19.0";

/**
 * Configura o webhook do Telegram com retry/backoff exponencial para evitar 429.
 */
async function setTelegramWebhookWithRetry(
  token: string,
  webhookUrl: string,
  maxRetries = 5
): Promise<boolean> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const resp = await axios.post(
        `https://api.telegram.org/bot${token}/setWebhook`,
        { url: webhookUrl, drop_pending_updates: true },
        { timeout: 10000 }
      );

      if (resp.data?.ok) {
        logger.info(
          { webhookUrl },
          "ValidateStatelessChannel: Telegram webhook set successfully"
        );
        return true;
      }

      const errCode = resp.data?.error_code;
      const retryAfter = resp.data?.parameters?.retry_after;

      if (errCode === 429) {
        const waitMs = ((retryAfter || 1) + attempt) * 1000;
        logger.warn(
          { attempt, waitMs, webhookUrl },
          "ValidateStatelessChannel: Telegram 429 rate limit — waiting before retry"
        );
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }

      logger.warn(
        { result: resp.data, webhookUrl },
        "ValidateStatelessChannel: Telegram setWebhook returned non-ok"
      );
      return false;
    } catch (err) {
      const waitMs = Math.pow(2, attempt) * 1000;
      logger.warn(
        { err, attempt, waitMs },
        "ValidateStatelessChannel: Telegram setWebhook error — retrying"
      );
      await new Promise(r => setTimeout(r, waitMs));
    }
  }

  logger.error(
    { webhookUrl },
    "ValidateStatelessChannel: Telegram setWebhook failed after all retries"
  );
  return false;
}

/**
 * Valida um canal Telegram: verifica token via getMe e configura o webhook.
 */
async function validateTelegram(whatsapp: Whatsapp): Promise<boolean> {
  const { telegramToken } = whatsapp;

  if (!telegramToken) {
    logger.warn(
      { id: whatsapp.id },
      "ValidateStatelessChannel: Telegram token not configured"
    );
    return false;
  }

  try {
    const meResp = await axios.get(
      `https://api.telegram.org/bot${telegramToken}/getMe`,
      { timeout: 10000 }
    );

    if (!meResp.data?.ok) {
      logger.warn(
        { id: whatsapp.id },
        "ValidateStatelessChannel: Telegram getMe failed — invalid token"
      );
      return false;
    }

    logger.info(
      { botName: meResp.data?.result?.username, id: whatsapp.id },
      "ValidateStatelessChannel: Telegram token valid"
    );

    // Configura webhook
    const backendUrl = process.env.BACKEND_URL?.replace(/\/$/, "");
    if (backendUrl) {
      const webhookUrl = `${backendUrl}/webhook/telegram/${telegramToken}`;
      await setTelegramWebhookWithRetry(telegramToken, webhookUrl);
    }

    return true;
  } catch (err) {
    logger.error(
      { err, id: whatsapp.id },
      "ValidateStatelessChannel: Telegram validation error"
    );
    return false;
  }
}

/**
 * Valida um canal WhatsApp Cloud API: verifica token e phone number ID via Graph API.
 */
async function validateWaCloud(whatsapp: Whatsapp): Promise<boolean> {
  const { facebookUserToken, facebookPageUserId } = whatsapp;

  if (!facebookUserToken || !facebookPageUserId) {
    logger.warn(
      { id: whatsapp.id },
      "ValidateStatelessChannel: WaCloud token or phone number ID not configured"
    );
    return false;
  }

  try {
    const resp = await axios.get(
      `${GRAPH_API_URL}/${facebookPageUserId}`,
      {
        headers: { Authorization: `Bearer ${facebookUserToken}` },
        timeout: 10000
      }
    );

    if (resp.data?.id) {
      logger.info(
        { phoneNumberId: facebookPageUserId, id: whatsapp.id },
        "ValidateStatelessChannel: WaCloud phone number ID valid"
      );
      return true;
    }

    return false;
  } catch (err) {
    logger.error(
      { err, id: whatsapp.id },
      "ValidateStatelessChannel: WaCloud validation error"
    );
    return false;
  }
}

/**
 * Valida um canal Instagram: verifica token de acesso via Graph API.
 */
async function validateInstagram(whatsapp: Whatsapp): Promise<boolean> {
  const { facebookUserToken, facebookPageUserId } = whatsapp;

  if (!facebookUserToken || !facebookPageUserId) {
    logger.warn(
      { id: whatsapp.id },
      "ValidateStatelessChannel: Instagram token or page ID not configured"
    );
    return false;
  }

  try {
    const resp = await axios.get(
      `${GRAPH_API_URL}/${facebookPageUserId}/instagram_accounts`,
      {
        headers: { Authorization: `Bearer ${facebookUserToken}` },
        params: { fields: "id,username" },
        timeout: 10000
      }
    );

    if (resp.data?.data?.length > 0 || resp.status === 200) {
      logger.info(
        { pageId: facebookPageUserId, id: whatsapp.id },
        "ValidateStatelessChannel: Instagram page ID valid"
      );
      return true;
    }

    return false;
  } catch (err) {
    logger.error(
      { err, id: whatsapp.id },
      "ValidateStatelessChannel: Instagram validation error"
    );
    return false;
  }
}

/**
 * Valida um canal Email: verifica configuração SMTP básica.
 */
async function validateEmail(whatsapp: Whatsapp): Promise<boolean> {
  const { emailSmtpHost, emailSmtpPort, emailSmtpUser, emailSmtpPass } =
    whatsapp;

  if (!emailSmtpHost || !emailSmtpPort || !emailSmtpUser || !emailSmtpPass) {
    logger.warn(
      { id: whatsapp.id },
      "ValidateStatelessChannel: Email SMTP not fully configured"
    );
    return false;
  }

  // Validação básica de configuração (sem conectar ao SMTP por ora)
  logger.info(
    { host: emailSmtpHost, port: emailSmtpPort, id: whatsapp.id },
    "ValidateStatelessChannel: Email configured"
  );
  return true;
}

/**
 * Emite evento websocket para atualizar o status da conexão no frontend.
 */
function emitWhatsappUpdate(whatsapp: Whatsapp): void {
  try {
    const io = getIO();
    io.to(`company-${whatsapp.companyId}-admin`).emit(
      `company-${whatsapp.companyId}-whatsappSession`,
      {
        action: "update",
        session: whatsapp
      }
    );
  } catch (err) {
    logger.warn(
      { err },
      "ValidateStatelessChannel: could not emit websocket update"
    );
  }
}

/**
 * Valida e conecta um canal stateless.
 * Atualiza o status do Whatsapp no banco de dados para CONNECTED ou DISCONNECTED.
 *
 * @returns true se o canal foi validado com sucesso
 */
export async function validateAndConnectStatelessChannel(
  whatsapp: Whatsapp
): Promise<boolean> {
  let isValid = false;

  switch (whatsapp.channel) {
    case "telegram":
      isValid = await validateTelegram(whatsapp);
      break;
    case "whatsapp_cloud":
      isValid = await validateWaCloud(whatsapp);
      break;
    case "instagram":
      isValid = await validateInstagram(whatsapp);
      break;
    case "email":
      isValid = await validateEmail(whatsapp);
      break;
    default:
      logger.warn(
        { channel: whatsapp.channel, id: whatsapp.id },
        "ValidateStatelessChannel: unknown stateless channel"
      );
      return false;
  }

  const newStatus = isValid ? "CONNECTED" : "DISCONNECTED";
  await whatsapp.update({ status: newStatus });
  await whatsapp.reload();

  if (whatsapp.channel === "email") {
    const { startEmailPolling, stopEmailPolling } = require("../services/EmailServices/EmailMessageListener");
    if (isValid) {
      startEmailPolling(whatsapp);
    } else {
      stopEmailPolling(whatsapp.id);
    }
  }

  emitWhatsappUpdate(whatsapp);

  logger.info(
    { channel: whatsapp.channel, id: whatsapp.id, status: newStatus },
    "ValidateStatelessChannel: channel status updated"
  );

  return isValid;
}
