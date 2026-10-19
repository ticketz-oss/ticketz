import express from "express";
import * as VoiceController from "../controllers/VoiceController";
import isAdmin from "../middleware/isAdmin";
import isAuth from "../middleware/isAuth";
import {
  voiceActionLimiter,
  voiceConnectionLimiter,
  voiceWebRTCLimiter
} from "../middleware/voiceRateLimit";

const voiceRoutes = express.Router();

voiceRoutes.get(
  "/voice/connections",
  isAuth,
  isAdmin,
  voiceConnectionLimiter,
  VoiceController.index
);
voiceRoutes.post(
  "/voice/connections/:whatsappId/pair",
  isAuth,
  isAdmin,
  voiceConnectionLimiter,
  VoiceController.pair
);
voiceRoutes.get(
  "/voice/calls/:callId/recording",
  isAuth,
  voiceActionLimiter,
  VoiceController.recording
);
voiceRoutes.delete(
  "/voice/connections/:whatsappId",
  isAuth,
  isAdmin,
  voiceConnectionLimiter,
  VoiceController.remove
);
voiceRoutes.post(
  "/voice/calls/:callId/accept",
  isAuth,
  voiceActionLimiter,
  VoiceController.accept
);
voiceRoutes.post(
  "/voice/calls/:callId/reject",
  isAuth,
  voiceActionLimiter,
  VoiceController.reject
);
voiceRoutes.post(
  "/voice/calls/:callId/end",
  isAuth,
  voiceActionLimiter,
  VoiceController.end
);
voiceRoutes.post(
  "/voice/calls/:callId/artifact",
  isAuth,
  voiceActionLimiter,
  VoiceController.artifact
);
voiceRoutes.post(
  "/voice/calls/:callId/webrtc",
  isAuth,
  voiceWebRTCLimiter,
  VoiceController.webrtc
);

export default voiceRoutes;
