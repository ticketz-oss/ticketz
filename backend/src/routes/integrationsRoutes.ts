import express from "express";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";
import * as IntegrationController from "../controllers/IntegrationController";

const integrationsRoutes = express.Router();

integrationsRoutes.get(
  "/integrations",
  isAuth,
  isAdmin,
  IntegrationController.index
);

integrationsRoutes.get(
  "/integrations/:driver",
  isAuth,
  isAdmin,
  IntegrationController.show
);

export default integrationsRoutes;
