import { Request, Response } from "express";
import { handleMetaWebhook } from "../services/MetaServices/MetaWebhookHandler";
import { logger } from "../utils/logger";

/**
 * GET /webhook/meta
 * Meta webhook verification (challenge-response)
 */
export const verify = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // The verify token is set in the env or defaults to "solutionzap_verify"
  const verifyToken = process.env.VERIFY_TOKEN || "solutionzap_verify";

  if (mode === "subscribe" && token === verifyToken) {
    logger.info("Meta webhook verified successfully");
    return res.status(200).send(challenge);
  }

  logger.warn(`Meta webhook verification failed: mode=${mode} token=${token}`);
  return res.sendStatus(403);
};

/**
 * POST /webhook/meta
 * Receive incoming messages and status updates from Meta
 */
export const receive = async (
  req: Request,
  res: Response
): Promise<Response> => {
  // Always respond 200 immediately (Meta requires fast response)
  res.sendStatus(200);

  // Process asynchronously
  try {
    await handleMetaWebhook(req.body);
  } catch (err) {
    logger.error(`Meta webhook handler error: ${err.message}`);
  }

  return;
};
