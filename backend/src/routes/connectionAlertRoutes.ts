import { Router } from "express";

import isAuth from "../middleware/isAuth";
import * as ConnectionAlertController from "../controllers/ConnectionAlertController";

const connectionAlertRoutes = Router();

connectionAlertRoutes.get(
  "/connection-alerts",
  isAuth,
  ConnectionAlertController.index
);

connectionAlertRoutes.get(
  "/connection-alerts/summary",
  isAuth,
  ConnectionAlertController.summary
);

connectionAlertRoutes.put(
  "/connection-alerts/:alertId/viewed",
  isAuth,
  ConnectionAlertController.markViewed
);

connectionAlertRoutes.put(
  "/connection-alerts/viewed/all",
  isAuth,
  ConnectionAlertController.markAllViewed
);

export default connectionAlertRoutes;