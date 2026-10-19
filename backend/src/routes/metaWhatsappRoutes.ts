import express from "express";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";
import isSuper from "../middleware/isSuper";
import * as MetaWhatsAppController from "../controllers/MetaWhatsAppController";

const metaWhatsappRoutes = express.Router();

metaWhatsappRoutes.get(
  "/whatsapp/meta/config",
  isAuth,
  MetaWhatsAppController.getConfig
);

metaWhatsappRoutes.post(
  "/whatsapp/:whatsappId/meta/connect",
  isAuth,
  isAdmin,
  MetaWhatsAppController.connect
);

metaWhatsappRoutes.get(
  "/whatsapp/:whatsappId/meta/onboarding",
  isAuth,
  isAdmin,
  MetaWhatsAppController.getOnboardingStatus
);

// Bypass temporario do Embedded Signup - so pra quem tem acesso de
// plataforma (isSuper), nunca pro admin comum da empresa.
metaWhatsappRoutes.post(
  "/whatsapp/:whatsappId/meta/manual-connect",
  isAuth,
  isSuper,
  MetaWhatsAppController.manualConnect
);

export default metaWhatsappRoutes;
