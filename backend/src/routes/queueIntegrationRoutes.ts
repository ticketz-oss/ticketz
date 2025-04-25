import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as QueueIntegrationController from "../controllers/QueueIntegrationController";

const queueIntegrationRoutes = Router();

queueIntegrationRoutes.get(
  "/queue-integrations",
  isAuth,
  QueueIntegrationController.index
);

queueIntegrationRoutes.get(
  "/queue-integrations/:id",
  isAuth,
  QueueIntegrationController.show
);

queueIntegrationRoutes.post(
  "/queue-integrations",
  isAuth,
  QueueIntegrationController.store
);

queueIntegrationRoutes.put(
  "/queue-integrations/:id",
  isAuth,
  QueueIntegrationController.update
);

queueIntegrationRoutes.delete(
  "/queue-integrations/:id",
  isAuth,
  QueueIntegrationController.remove
);

queueIntegrationRoutes.post(
  "/queue-integrations/test",
  isAuth,
  QueueIntegrationController.testConnection
);

export default queueIntegrationRoutes;
