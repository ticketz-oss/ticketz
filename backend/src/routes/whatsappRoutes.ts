import express from "express";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";
import apiTokenAuth from "../middleware/apiTokenAuth";

import * as WhatsAppController from "../controllers/WhatsAppController";
import * as PrivacyController from "../controllers/PrivacyController";

const whatsappRoutes = express.Router();

whatsappRoutes.get(
  "/whatsapp/",
  apiTokenAuth,
  isAuth,
  WhatsAppController.index
);

whatsappRoutes.post(
  "/whatsapp/",
  apiTokenAuth,
  isAuth,
  isAdmin,
  WhatsAppController.store
);

whatsappRoutes.get(
  "/whatsapp/:whatsappId",
  apiTokenAuth,
  isAuth,
  isAdmin,
  WhatsAppController.show
);

whatsappRoutes.put(
  "/whatsapp/:whatsappId",
  apiTokenAuth,
  isAuth,
  isAdmin,
  WhatsAppController.update
);

whatsappRoutes.delete(
  "/whatsapp/:whatsappId",
  apiTokenAuth,
  isAuth,
  isAdmin,
  WhatsAppController.remove
);

whatsappRoutes.get(
  "/whatsapp/privacy/:whatsappId",
  apiTokenAuth,
  isAuth,
  isAdmin,
  PrivacyController.show
);
whatsappRoutes.put(
  "/whatsapp/privacy/:whatsappId",
  apiTokenAuth,
  isAuth,
  isAdmin,
  PrivacyController.update
);

export default whatsappRoutes;
