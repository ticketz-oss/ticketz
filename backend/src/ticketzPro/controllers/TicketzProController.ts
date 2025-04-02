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
 * return license status from memory cache or query license server
 * if recheck=true, query license server
 * if recheck=false, return cached status
 * if recheck=undefined, return cached
 * if no status, return 402
 * OK result includes subscription data
 */
export const getStatus = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { recheck } = req.query;
  const status = await subscriptionService.status(!!recheck);
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
  const { paymentService, addressData, customerData, ccData, cardToken } =
    req.body;

  try {
    const status = await subscriptionService.subscribe({
      paymentService,
      customerData,
      addressData,
      ccData,
      cardToken
    });
    if (status) {
      return res.json({ message: "SUBSCRIPTION_STATUS", status });
    }
    return res.status(403).json({ message: "ERR_SUBSCRIBE_FAILED" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

/**
 * cancel
 *
 * call license server to cancel the license
 */

export const cancel = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  const status = await subscriptionService.cancel();
  if (status) {
    return res.json({ message: "SUBSCRIPTION_CANCEL_STATUS", status });
  }
  return res.status(402).json({ message: "ERR_SUBSCRIPTION_CANCEL_FAILED" });
};
