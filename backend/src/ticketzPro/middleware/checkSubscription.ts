import { Request, Response, NextFunction } from "express";
import { SubscriptionService } from "../services/subscriptionService";

const subscriptionService = SubscriptionService.getInstance();

export function checkSubscription(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const result = subscriptionService.getTaskResult();
  if (result === false) {
    return res.status(402).json({ message: "ERR_SUBSCRIPTION_CHECK_FAILED" });
  }
  return next();
}
