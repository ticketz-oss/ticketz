import { Router } from "express";
import isAuth from "../middleware/isAuth";
import isCompliant from "../middleware/isCompliant";
import * as WhatsappGroupController from "../controllers/WhatsappGroupController";

const routes = Router();

routes.get(
  "/whatsapp-groups",
  isAuth,
  isCompliant,
  WhatsappGroupController.index
);
routes.get(
  "/whatsapp-groups/unread-count",
  isAuth,
  isCompliant,
  WhatsappGroupController.unreadCount
);
routes.get(
  "/whatsapp-groups/:ticketId/participants",
  isAuth,
  isCompliant,
  WhatsappGroupController.participants
);
routes.put(
  "/whatsapp-groups/:ticketId",
  isAuth,
  isCompliant,
  WhatsappGroupController.update
);
routes.post(
  "/whatsapp-groups/:ticketId/read",
  isAuth,
  isCompliant,
  WhatsappGroupController.read
);

export default routes;
