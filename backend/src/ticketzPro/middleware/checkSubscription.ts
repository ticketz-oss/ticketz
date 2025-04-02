import { Request, Response, NextFunction } from "express";
import { SubscriptionService } from "../services/subscriptionService";

const subscriptionService = SubscriptionService.getInstance();

export async function checkSubscription(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = await subscriptionService.status();
  const result = status.success && !status.subscriptionData?.pending;
  if (result === false) {
    return res.status(402).json({ message: "ERR_SUBSCRIPTION_CHECK_FAILED" });
  }
  return next();
}
