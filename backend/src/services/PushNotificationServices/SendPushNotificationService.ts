import { Op } from "sequelize";
import webpush, { isWebPushConfigured } from "../../config/webPush";
import PushSubscription from "../../models/PushSubscription";
import { logger } from "../../utils/logger";

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  // Agrupa notificações do mesmo ticket: o service worker substitui a anterior
  // em vez de empilhar uma por mensagem recebida.
  tag?: string;
  url?: string;
}

interface Request {
  userIds: number[];
  companyId: number;
  payload: PushPayload;
}

// Push services respondem 404/410 quando a inscrição foi revogada (PWA
// desinstalado, dados do navegador limpos). Nesse caso a linha é lixo e
// precisa sair da tabela, senão o envio seguinte repete o mesmo erro.
const GONE_STATUS_CODES = [404, 410];

const SendPushNotificationService = async ({
  userIds,
  companyId,
  payload
}: Request): Promise<void> => {
  if (!isWebPushConfigured() || !userIds.length) {
    return;
  }

  const subscriptions = await PushSubscription.findAll({
    where: {
      companyId,
      userId: { [Op.in]: userIds }
    }
  });

  if (!subscriptions.length) {
    return;
  }

  const body = JSON.stringify(payload);
  const staleIds: number[] = [];

  await Promise.all(
    subscriptions.map(async subscription => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth }
          },
          body,
          // Sem TTL o push service pode descartar a mensagem se o aparelho
          // estiver offline no instante do envio.
          { TTL: 60 * 60 * 12, urgency: "high" }
        );
      } catch (error) {
        const statusCode = error?.statusCode;
        if (GONE_STATUS_CODES.includes(statusCode)) {
          staleIds.push(subscription.id);
          return;
        }
        logger.warn(
          { subscription: subscription.id, statusCode },
          "falha ao enviar push notification"
        );
      }
    })
  );

  if (staleIds.length) {
    await PushSubscription.destroy({ where: { id: { [Op.in]: staleIds } } });
    logger.debug(
      { count: staleIds.length },
      "inscrições de push expiradas removidas"
    );
  }
};

export default SendPushNotificationService;
