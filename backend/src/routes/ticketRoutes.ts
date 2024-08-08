import express from "express";
import isAuth from "../middleware/isAuth";

import * as TicketController from "../controllers/TicketController";
import { checkSubscription } from "../ticketzPro/middleware/checkSubscription";

const ticketRoutes = express.Router();

ticketRoutes.get("/tickets", isAuth, checkSubscription, TicketController.index);

ticketRoutes.get("/ticket/kanban", isAuth, TicketController.kanban);

ticketRoutes.get(
  "/tickets/:ticketId",
  isAuth,
  checkSubscription,
  TicketController.show
);

ticketRoutes.get(
  "/tickets/u/:uuid",
  isAuth,
  checkSubscription,
  TicketController.showFromUUID
);

ticketRoutes.post(
  "/tickets",
  isAuth,
  checkSubscription,
  TicketController.store
);

ticketRoutes.put(
  "/tickets/:ticketId",
  isAuth,
  checkSubscription,
  TicketController.update
);

ticketRoutes.delete(
  "/tickets/:ticketId",
  isAuth,
  checkSubscription,
  TicketController.remove
);

export default ticketRoutes;
