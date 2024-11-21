import express from "express";
import isAuth from "../middleware/isAuth";

import * as TicketController from "../controllers/TicketController";
import apiTokenAuth from "../middleware/apiTokenAuth";

const ticketRoutes = express.Router();

ticketRoutes.get("/tickets", apiTokenAuth, isAuth, TicketController.index);

ticketRoutes.get("/ticket/kanban", isAuth, TicketController.kanban);

ticketRoutes.get(
  "/tickets/:ticketId",
  apiTokenAuth,
  isAuth,
  TicketController.show
);

ticketRoutes.get("/tickets/u/:uuid", isAuth, TicketController.showFromUUID);

ticketRoutes.post("/tickets", isAuth, TicketController.store);

ticketRoutes.put("/tickets/:ticketId", isAuth, TicketController.update);

ticketRoutes.delete("/tickets/:ticketId", isAuth, TicketController.remove);

export default ticketRoutes;
