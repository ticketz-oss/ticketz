import { Router } from "express";
import * as MetaWebhookController from "../controllers/MetaWebhookController";

const metaWebhookRoutes = Router();

// Webhook verification (GET) — no auth needed
metaWebhookRoutes.get("/webhook/meta", MetaWebhookController.verify);
// Incoming messages (POST) — no auth needed (signature verified via token)
metaWebhookRoutes.post("/webhook/meta", MetaWebhookController.receive);

// Instagram alternate endpoint (some Facebook App configurations use this)
metaWebhookRoutes.get("/webhook/instagram", MetaWebhookController.verify);
metaWebhookRoutes.post("/webhook/instagram", MetaWebhookController.receive);

export default metaWebhookRoutes;
