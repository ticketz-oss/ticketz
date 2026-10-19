import express from "express";
import * as MetaWhatsAppWebhookController from "../controllers/MetaWhatsAppWebhookController";

const metaWhatsappWebhookRoutes = express.Router();

// Publicas de proposito: a seguranca e a assinatura HMAC (POST) e o verify
// token (GET), nao autenticacao de sessao do Ticketz.
metaWhatsappWebhookRoutes.get(
  "/webhooks/meta/whatsapp",
  MetaWhatsAppWebhookController.verify
);

metaWhatsappWebhookRoutes.post(
  "/webhooks/meta/whatsapp",
  MetaWhatsAppWebhookController.handle
);

export default metaWhatsappWebhookRoutes;
