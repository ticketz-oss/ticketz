import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { isValidMetaWebhookSignature } from "../services/MetaWhatsAppServices/MetaWebhookSignatureService";
import ProcessMetaWebhookEventService from "../services/MetaWhatsAppServices/ProcessMetaWebhookEventService";

// GET: handshake de verificacao, chamado pela Meta quando o webhook e salvo
// no App Dashboard (e ocasionalmente depois). Sem isAuth - a Meta nao manda
// nenhum token de sessao do Ticketz.
export const verify = (req: Request, res: Response): Response => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    typeof token === "string" &&
    !!process.env.META_WEBHOOK_VERIFY_TOKEN &&
    token === process.env.META_WEBHOOK_VERIFY_TOKEN
  ) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};

// POST: eventos reais (mensagens/status). Responde 200 imediatamente e
// processa em background - a Meta tem timeout curto e reenvia com backoff
// se nao receber 200 rapido.
export const handle = (req: Request, res: Response): Response => {
  const signature = req.headers["x-hub-signature-256"] as string | undefined;
  const rawBody = (req as any).rawBody as Buffer | undefined;

  if (!isValidMetaWebhookSignature(rawBody, signature)) {
    logger.warn("Rejected Meta webhook call with invalid signature");
    return res.sendStatus(403);
  }

  const payload = JSON.parse(rawBody.toString("utf8"));

  ProcessMetaWebhookEventService(payload).catch(err => {
    logger.error({ err }, "Unhandled error processing Meta webhook payload");
  });

  return res.sendStatus(200);
};
