import express from "express";
import { OmniServices } from "../services/OmniServices/OmniServices";

const notificameHubRoutes = express.Router();

notificameHubRoutes.post("/notificamehub/webhook/:channelId", (req, res) => {
  const omniServices = OmniServices.getInstance();

  omniServices.messageHandler("notificamehub", req);

  res.send("OK");
});

export default notificameHubRoutes;
