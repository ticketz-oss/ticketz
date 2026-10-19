import { Op } from "sequelize";
import { getMetaGraphApiClient, withAuth } from "./MetaGraphApiClient";
import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";
import Whatsapp from "../../models/Whatsapp";

// POST /{wabaId}/subscribed_apps - a partir daqui a Meta comeca a mandar
// eventos desse WABA para o webhook configurado no App.
export const SubscribeWabaWebhookService = async (
  wabaId: string,
  accessToken: string
): Promise<void> => {
  const callback = process.env.META_WEBHOOK_CALLBACK_URL?.trim();
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (callback) {
    let valid = false;
    try {
      const url = new URL(callback);
      valid =
        url.protocol === "https:" &&
        !url.username &&
        !url.password &&
        !!verifyToken;
    } catch {
      // Reject malformed configuration before making a Graph API request.
    }
    if (!valid) throw new AppError("ERR_META_WEBHOOK_CONFIG_INVALID", 503);
  }
  const client = getMetaGraphApiClient();

  try {
    await client.post(
      `/${wabaId}/subscribed_apps`,
      callback
        ? { override_callback_uri: callback, verify_token: verifyToken }
        : {},
      withAuth(accessToken)
    );
  } catch (err) {
    logger.error({ err, wabaId }, "Failed to subscribe Meta WABA webhook");
    throw new AppError("ERR_META_WEBHOOK_SUBSCRIBE_FAILED", 502);
  }
};

// DELETE /{wabaId}/subscribed_apps - usado ao desconectar uma conexao
// oficial (equivalente ao "logout" do Baileys pra esse modo).
//
// Recebe o id da conexao, e nao o token, de proposito: ShowWhatsAppService
// remove metaAccessToken do resultado, e era exatamente esse campo (ja vazio)
// que os dois chamadores passavam. A chamada falhava calada, a assinatura
// continuava de pe e a conexao "desconectada" seguia recebendo mensagem e
// reabrindo ticket.
export const UnsubscribeWabaWebhookService = async (
  whatsappId: number
): Promise<void> => {
  const connection = await Whatsapp.findByPk(whatsappId, {
    attributes: ["id", "metaWabaId", "metaAccessToken"]
  });

  if (!connection?.metaWabaId || !connection.metaAccessToken) {
    logger.warn(
      { whatsappId },
      "No Meta credentials available to unsubscribe the WABA webhook"
    );
    return;
  }

  // WABA subscriptions cover every number: disconnecting one tenant must
  // not stop delivery to another connection using the same business account.
  const otherConnections = await Whatsapp.count({
    where: {
      metaWabaId: connection.metaWabaId,
      apiMode: "official",
      status: { [Op.ne]: "DISCONNECTED" },
      id: { [Op.ne]: whatsappId }
    }
  });
  if (otherConnections > 0) return;

  const client = getMetaGraphApiClient();

  try {
    await client.delete(
      `/${connection.metaWabaId}/subscribed_apps`,
      withAuth(connection.metaAccessToken)
    );
  } catch (err) {
    logger.warn(
      { err, whatsappId },
      "Failed to unsubscribe Meta WABA webhook (continuing disconnect anyway)"
    );
  }
};
