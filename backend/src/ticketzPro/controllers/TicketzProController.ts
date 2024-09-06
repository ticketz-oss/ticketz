import { Request, Response } from "express";
import { SubscriptionService } from "../services/subscriptionService";

const subscriptionService = SubscriptionService.getInstance();

/**
 * checkStatus
 *
 * query license server to get current license status
 *
 * returns only http 200 for OK and 403 for FAIL
 */
export const checkStatus = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  const result = await subscriptionService.triggerSingleCheck();
  if (result) {
    return res.json({ message: "SUBSCRIPTION_OK" });
  }
  return res.status(402).json({ message: "ERR_SUBSCRIPTION_CHECK_FAILED" });
};

/**
 * getStatus
 *
 * return license status from memory
 *
 * OK result includes subscription data
 */
export const getStatus = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  const status = subscriptionService.status();
  if (status) {
    return res.json({ message: "SUBSCRIPTION_STATUS", status });
  }
  return res.status(402).json({ message: "ERR_SUBSCRIPTION_CHECK_FAILED" });
};

/**
 * subscribe
 *
 * call license server to create a new license
 *
 * When successful triggers an initial check and return the getStatus() result
 */
export const subscribe = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const {
    paymentService,
    emailAddress,
    cardToken,
    addressData
  } = req.body;

  try {
    const status = await subscriptionService.subscribe(
      paymentService,
      emailAddress,
      cardToken,
      addressData
    );
    if (status) {
      return res.json({ message: "SUBSCRIPTION_STATUS", status });
    }
    return res.status(403).json({ message: "ERR_SUBSCRIBE_FAILED" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};
