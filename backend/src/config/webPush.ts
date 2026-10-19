import webpush from "web-push";
import { logger } from "../utils/logger";

const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();

// O subject identifica quem envia para o push service (Apple, Google, Mozilla).
// Precisa ser uma URL https: ou um mailto:; sem ele a Apple rejeita o envio.
const subject =
  process.env.VAPID_SUBJECT?.trim() ||
  (process.env.EMAIL_ADDRESS ? `mailto:${process.env.EMAIL_ADDRESS}` : "") ||
  process.env.FRONTEND_URL?.trim() ||
  "";

const configured = Boolean(publicKey && privateKey && subject);

if (configured) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
  logger.info("Web Push habilitado");
} else if (publicKey || privateKey) {
  logger.warn(
    "Web Push desabilitado: defina VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY e VAPID_SUBJECT"
  );
}

export const isWebPushConfigured = (): boolean => configured;

export const getVapidPublicKey = (): string | null =>
  configured ? publicKey : null;

export default webpush;
