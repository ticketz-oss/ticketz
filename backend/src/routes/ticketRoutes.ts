import express from "express";
import isAuth from "../middleware/isAuth";

import * as TicketController from "../controllers/TicketController";
import isCompliant from "../middleware/isCompliant";
import apiTokenAuth from "../middleware/apiTokenAuth";

import { checkSubscription } from "../ticketzPro/middleware/checkSubscription";

const ticketRoutes = express.Router();

ticketRoutes.get(
  "/tickets",
  apiTokenAuth,
  isAuth,
  checkSubscription,
  isCompliant,
  TicketController.index
);

ticketRoutes.get(
  "/tickets/:ticketId",
  apiTokenAuth,
  isAuth,
  checkSubscription,
  isCompliant,
  TicketController.show
);

ticketRoutes.get(
  "/tickets/u/:uuid",
  isAuth,
  checkSubscription,
  isCompliant,
  TicketController.showFromUUID
);

ticketRoutes.post(
  "/tickets",
  isAuth,
  checkSubscription,
  isCompliant,
  TicketController.store
);

ticketRoutes.put(
  "/tickets/:ticketId",
  apiTokenAuth,
  isAuth,
  checkSubscription,
  isCompliant,
  TicketController.update
);

ticketRoutes.delete(
  "/tickets/:ticketId",
  isAuth,
  checkSubscription,
  isCompliant,
  TicketController.remove
);

export default ticketRoutes;
