import express from "express";
import isAuth from "../middleware/isAuth";

import * as TicketController from "../controllers/TicketController";
import isCompliant from "../middleware/isCompliant";
import apiTokenAuth from "../middleware/apiTokenAuth";

const ticketRoutes = express.Router();

ticketRoutes.get(
  "/tickets",
  apiTokenAuth,
  isAuth,
  isCompliant,
  TicketController.index
);

ticketRoutes.get(
  "/tickets/:ticketId",
  apiTokenAuth,
  isAuth,
  isCompliant,
  TicketController.show
);

ticketRoutes.get(
  "/tickets/u/:uuid",
  isAuth,
  isCompliant,
  TicketController.showFromUUID
);

ticketRoutes.post("/tickets", isAuth, isCompliant, TicketController.store);

ticketRoutes.put(
  "/tickets/:ticketId",
  apiTokenAuth,
  isAuth,
  isCompliant,
  TicketController.update
);

ticketRoutes.delete(
  "/tickets/:ticketId",
  isAuth,
  isCompliant,
  TicketController.remove
);

export default ticketRoutes;
