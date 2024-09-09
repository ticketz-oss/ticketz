// src/server.ts
import { Router } from "express";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isSuper";
import { logger } from "../utils/logger";
import { subscriptionTaskQueue, recheckQueue } from "./jobs/subscriptionTask";
import { SubscriptionService } from "./services/subscriptionService";
import * as TicketzProController from "./controllers/TicketzProController";

export const ticketzPro = async app => {
  subscriptionTaskQueue.on("completed", job => {
    logger.debug(`Subscription Job ${job.id} completed successfully`);
  });

  subscriptionTaskQueue.on("failed", (job, err) => {
    logger.debug(`Subscription Job ${job.id} failed with error ${err.message}`);
  });

  recheckQueue.on("completed", job => {
    logger.debug(`Recheck Job ${job.id} completed successfully`);
  });

  recheckQueue.on("failed", (job, err) => {
    logger.debug(`Recheck Job ${job.id} failed with error ${err.message}`);
  });

  const subscriptionService = SubscriptionService.getInstance();
  subscriptionService.triggerSingleCheck().then(result => {
    logger.debug(`Initial subscription check result: ${result}`);
  });

  const routes = Router();

  routes.get(
    "/ticketzPro/check",
    isAuth,
    isSuper,
    TicketzProController.checkStatus
  );

  routes.get(
    "/ticketzPro/status",
    isAuth,
    isSuper,
    TicketzProController.getStatus
  );

  routes.post(
    "/ticketzPro/subscribe",
    isAuth,
    isSuper,
    TicketzProController.subscribe
  );

  routes.get(
    "/ticketzPro/cancel",
    isAuth,
    isSuper,
    TicketzProController.cancel
  );

  app.use(routes);
};
