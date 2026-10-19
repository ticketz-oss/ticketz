import { createHash } from "crypto";
import { Op } from "sequelize";
import webpush, { PushSubscription as WebPushPayload } from "web-push";
import Message from "../../models/Message";
import User from "../../models/User";
import UserQueue from "../../models/UserQueue";
import WebPushSubscription from "../../models/WebPushSubscription";
import { logger } from "../../utils/logger";

export interface StoredSubscriptionInput {
  endpoint: string;
  expirationTime?: number | null;
  keys: { p256dh: string; auth: string };
}

interface NotificationPayload {
  title: string;
  body: string;
  status: string;
  icon?: string;
  ticketId: number;
  ticketUuid?: string;
}

let configured = false;

const configure = (): boolean => {
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  const subject =
    process.env.WEB_PUSH_SUBJECT || "mailto:contato@somosespaco.com.br";
  if (!publicKey || !privateKey) return false;
  if (!configured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  }
  return true;
};

export const webPushPublicKey = (): string | null =>
  configure() ? process.env.WEB_PUSH_PUBLIC_KEY : null;

export const subscriptionHash = (endpoint: string): string =>
  createHash("sha256").update(endpoint).digest("hex");

const subscriptionPayload = (record: WebPushSubscription): WebPushPayload => ({
  endpoint: record.endpoint,
  expirationTime: record.expirationTime,
  keys: { p256dh: record.p256dh, auth: record.auth }
});

const deactivateExpired = async (
  record: WebPushSubscription,
  error: unknown
): Promise<void> => {
  const statusCode = Number((error as { statusCode?: number })?.statusCode);
  if (statusCode === 404 || statusCode === 410) {
    await record.update({ active: false });
    return;
  }
  logger.warn(
    { err: error, subscriptionId: record.id },
    "Web Push notification failed"
  );
};

const deliver = async (
  subscriptions: WebPushSubscription[],
  payload: NotificationPayload
): Promise<void> => {
  if (!configure() || subscriptions.length === 0) return;
  const serialized = JSON.stringify(payload);
  await Promise.allSettled(
    subscriptions.map(async record => {
      try {
        await webpush.sendNotification(
          subscriptionPayload(record),
          serialized,
          {
            TTL: 120,
            urgency: "high",
            topic: `ticket-${payload.ticketId}`
          }
        );
      } catch (error) {
        await deactivateExpired(record, error);
      }
    })
  );
};

const mediaPreview = (message: Message): string => {
  const body = message.body?.trim();
  if (body && !body.startsWith('{"ticketzvCard"')) return body.slice(0, 240);
  switch (message.mediaType?.toLowerCase()) {
    case "image":
      return "📷 Foto";
    case "audio":
    case "ptt":
      return "🎤 Áudio";
    case "video":
      return "🎬 Vídeo";
    case "document":
      return "📎 Documento";
    case "sticker":
      return "Sticker";
    default:
      return "Você recebeu uma nova mensagem.";
  }
};

const ticketStatus = (status: string): string => {
  if (status === "open") return "Atendendo";
  if (status === "pending") return "Aguardando";
  return "Atendimento";
};

export const sendMessageWebPush = async (message: Message): Promise<void> => {
  if (!configure() || message.fromMe || message.isDeleted || !message.ticket)
    return;
  const ticket = message.ticket;
  const users = await User.findAll({
    where: { companyId: message.companyId },
    attributes: ["id", "profile"]
  });
  const queueMembers = ticket.queueId
    ? await UserQueue.findAll({
        where: { queueId: ticket.queueId },
        attributes: ["userId"]
      })
    : [];
  const queueUserIds = new Set(queueMembers.map(record => record.userId));
  const allowedUserIds = users
    .filter(user => {
      if (ticket.userId) return user.id === ticket.userId;
      if (ticket.isGroup) return true;
      if (ticket.queueId) return queueUserIds.has(user.id);
      return user.profile === "admin";
    })
    .map(user => user.id);
  if (allowedUserIds.length === 0) return;

  const subscriptions = await WebPushSubscription.findAll({
    where: {
      companyId: message.companyId,
      userId: { [Op.in]: allowedUserIds },
      active: true
    }
  });
  await deliver(subscriptions, {
    title: ticket.contact?.name || "Nova mensagem",
    body: mediaPreview(message),
    status: ticketStatus(ticket.status),
    icon: ticket.contact?.profilePicUrl || undefined,
    ticketId: ticket.id,
    ticketUuid: ticket.uuid
  });
};

export const sendTestWebPush = async (
  companyId: number,
  userId: number
): Promise<number> => {
  const subscriptions = await WebPushSubscription.findAll({
    where: { companyId, userId, active: true }
  });
  await deliver(subscriptions, {
    title: "Espaço Whats",
    body: "A ponte gratuita de notificações está funcionando.",
    status: "Teste do DEV",
    ticketId: 0
  });
  return subscriptions.length;
};
