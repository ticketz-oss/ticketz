import { Router } from "express";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isSuper";
import * as WhatsappStatusAdminController from "../controllers/WhatsappStatusAdminController";

const routes = Router();

routes.get(
  "/whatsapp-status/availability",
  isAuth,
  WhatsappStatusAdminController.availability
);

routes.get(
  "/whatsapp-status/admin/companies",
  isAuth,
  isSuper,
  WhatsappStatusAdminController.companies
);

routes.put(
  "/whatsapp-status/admin/companies/:companyId",
  isAuth,
  isSuper,
  WhatsappStatusAdminController.update
);

export default routes;
