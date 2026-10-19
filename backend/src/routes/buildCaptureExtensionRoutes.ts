import { Router } from "express";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";
import isSuper from "../middleware/isSuper";
import WhatsAppSessionController from "../controllers/WhatsAppSessionController";

const buildCaptureExtensionRoutes = Router();

buildCaptureExtensionRoutes.post(
  "/build-capture-extension",
  isAuth,
  isAdmin,
  isSuper,
  WhatsAppSessionController.buildCaptureExtension
);

export default buildCaptureExtensionRoutes;
