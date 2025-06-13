import express from "express";
import isAuth from "../middleware/isAuth";

import * as TicketTagController from "../controllers/TicketTagController";
import apiTokenAuth from "../middleware/apiTokenAuth";

const ticketTagRoutes = express.Router();

ticketTagRoutes.put(
  "/ticket-tags/:ticketId/:tagId",
  apiTokenAuth,
  isAuth,
  TicketTagController.store
);

ticketTagRoutes.delete(
  "/ticket-tags/:ticketId/:tagId",
  apiTokenAuth,
  isAuth,
  TicketTagController.remove
);

ticketTagRoutes.delete(
  "/ticket-tags/:ticketId",
  apiTokenAuth,
  isAuth,
  TicketTagController.removeAll
);

export default ticketTagRoutes;
