import { Request, Response, NextFunction } from "express";
import { SubscriptionService } from "../services/subscriptionService";

const subscriptionService = SubscriptionService.getInstance();

export async function checkSubscription(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!subscriptionService.isValid()) {
    return res.status(402).json({ message: "ERR_SUBSCRIPTION_CHECK_FAILED" });
  }
  return next();
}
