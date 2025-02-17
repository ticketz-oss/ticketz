import { Router } from "express";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";
import WhatsAppSessionController from "../controllers/WhatsAppSessionController";

const whatsappSessionRoutes = Router();

whatsappSessionRoutes.post(
  "/whatsappsession/:whatsappId",
  isAuth,
  isAdmin,
  WhatsAppSessionController.store
);

whatsappSessionRoutes.put(
  "/whatsappsession/:whatsappId",
  isAuth,
  isAdmin,
  WhatsAppSessionController.update
);

whatsappSessionRoutes.delete(
  "/whatsappsession/:whatsappId",
  isAuth,
  isAdmin,
  WhatsAppSessionController.remove
);

whatsappSessionRoutes.get(
  "/whatsappsession/refresh/:whatsappId",
  isAuth,
  isAdmin,
  WhatsAppSessionController.refresh
);

export default whatsappSessionRoutes;
