import express from "express";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";

import * as WhatsAppController from "../controllers/WhatsAppController";
import * as PrivacyController from "../controllers/PrivacyController";

const whatsappRoutes = express.Router();

whatsappRoutes.get("/whatsapp/", isAuth, WhatsAppController.index);

whatsappRoutes.post("/whatsapp/", isAuth, isAdmin, WhatsAppController.store);

whatsappRoutes.get(
  "/whatsapp/:whatsappId",
  isAuth,
  isAdmin,
  WhatsAppController.show
);

whatsappRoutes.put(
  "/whatsapp/:whatsappId",
  isAuth,
  isAdmin,
  WhatsAppController.update
);

whatsappRoutes.delete(
  "/whatsapp/:whatsappId",
  isAuth,
  isAdmin,
  WhatsAppController.remove
);

whatsappRoutes.get(
  "/whatsapp/privacy/:whatsappId",
  isAuth,
  isAdmin,
  PrivacyController.show
);
whatsappRoutes.put(
  "/whatsapp/privacy/:whatsappId",
  isAuth,
  isAdmin,
  PrivacyController.update
);

export default whatsappRoutes;
