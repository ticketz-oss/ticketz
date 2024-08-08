// src/server.ts
import { Request, Response, Router } from "express";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isSuper";
import { logger } from "../utils/logger";
import { subscriptionTaskQueue, recheckQueue } from "./jobs/subscriptionTask";
import { SubscriptionService } from "./services/subscriptionService";

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
    async (_req: Request, res: Response) => {
      const result = await subscriptionService.triggerSingleCheck();
      if (result) {
        res.json({ message: "SUBSCRIPTION_OK" });
      } else {
        res.status(403).json({ message: "ERR_SUBSCRIPTION_CHECK_FAILED" });
      }
    }
  );

  routes.get(
    "/ticketzPro/status",
    isAuth,
    isSuper,
    async (_req: Request, res: Response) => {
      const status = subscriptionService.status();
      if (status) {
        res.json({ message: "SUBSCRIPTION_STATUS", status });
      } else {
        res.status(403).json({ message: "ERR_SUBSCRIPTION_CHECK_FAILED" });
      }
    }
  );

  app.use(routes);
};
