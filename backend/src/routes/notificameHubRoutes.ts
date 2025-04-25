import express from "express";
import { OmniServices } from "../services/OmniServices/OmniServices";
import { logger } from "../utils/logger";

const notificameHubRoutes = express.Router();

notificameHubRoutes.post("/notificamehub/webhook/:channelId", (req, res) => {
  logger.debug("notificameHubRoutes:post");

  const omniServices = OmniServices.getInstance();

  if (req.body?.message?.from) {
    omniServices.messageHandler("notificamehub", req.body);
  }

  if (req.body?.messageStatus) {
    omniServices.messageStatusHandler("notificamehub", req.body);
  }

  res.send("OK");
});

export default notificameHubRoutes;
