import express from "express";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";
import * as IntegrationController from "../controllers/IntegrationController";
import isIntegrationSession from "../middleware/isIntegrationSession";

const integrationsRoutes = express.Router();

integrationsRoutes.get(
  "/integrations",
  isAuth,
  isAdmin,
  IntegrationController.index
);

integrationsRoutes.get(
  "/integrations/listQueues",
  isIntegrationSession,
  IntegrationController.listQueues
);

integrationsRoutes.get(
  "/integrations/:driver",
  isAuth,
  isAdmin,
  IntegrationController.show
);

integrationsRoutes.post(
  "/integrations/webhook",
  isIntegrationSession,
  IntegrationController.webhook
);

export default integrationsRoutes;
