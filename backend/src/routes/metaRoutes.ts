import express from "express";
import * as MetaWebhookController from "../controllers/MetaWebhookController";

const metaRoutes = express.Router();

// Webhook verification (Meta sends GET to verify the endpoint)
metaRoutes.get("/webhook/meta", MetaWebhookController.verify);

// Receive incoming messages and status updates
metaRoutes.post("/webhook/meta", MetaWebhookController.receive);

export default metaRoutes;
