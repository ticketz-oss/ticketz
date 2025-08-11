import express from "express";
import { OmniServices } from "../services/OmniServices/OmniServices";
import { logger } from "../utils/logger";
import isAuth from "../middleware/isAuth";
import apiTokenAuth from "../middleware/apiTokenAuth";
import isCompliant from "../middleware/isCompliant";

const omniRoutes = express.Router();

omniRoutes.post(
  "/omni/executeTicketAction/:ticketId/:action",
  apiTokenAuth,
  isAuth,
  isCompliant,
  (req, res) => {
    const omniServices = OmniServices.getInstance();
    return omniServices.executeTicketAction(req, res);
  }
);

export default omniRoutes;
