import express from "express";
import { logger } from "../utils/logger";

const notificameHubRoutes = express.Router();

notificameHubRoutes.post("/notificamehub/webhook/:channelId", (req, res) => {
  logger.debug({ body: req.body }, "Webhook received");
  res.send("OK");
});

export default notificameHubRoutes;
