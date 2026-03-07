import { Request, Response } from "express";
import { logger } from "../utils/logger";
import Whatsapp from "../models/Whatsapp";
import { processWaCloudWebhook } from "../services/WaCloudServices/WaCloudMessageListener";
import { processInstagramWebhook } from "../services/InstagramServices/InstagramMessageListener";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "ticketz";

// ─── Webhook Verification (GET) ───────────────────────────────────────────────
export const verify = (req: Request, res: Response): Response => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    logger.info("MetaWebhookController: webhook verified");
    return res.status(200).send(challenge);
  }

  return res.status(403).send("Forbidden");
};

// ─── Incoming Webhook (POST) ───────────────────────────────────────────────────
export const receive = async (
  req: Request,
  res: Response
): Promise<Response> => {
  // Always respond 200 immediately to satisfy Meta's 20s requirement
  res.status(200).send("EVENT_RECEIVED");

  const body = req.body;

  try {
    const { object, entry: entries } = body;

    if (!entries || !Array.isArray(entries)) return;

    for (const entry of entries) {
      if (object === "whatsapp_business_account") {
        // WhatsApp Cloud API — match by phone number ID
        const phoneNumberId =
          entry?.changes?.[0]?.value?.metadata?.phone_number_id;
        if (!phoneNumberId) continue;

        const whatsapp = await Whatsapp.findOne({
          where: {
            facebookPageUserId: phoneNumberId,
            channel: "whatsapp_cloud"
          }
        });
        if (!whatsapp) {
          logger.warn(
            { phoneNumberId },
            "MetaWebhookController: no WaCloud connection for phone number id"
          );
          continue;
        }

        await processWaCloudWebhook(whatsapp, entry);
      } else if (object === "instagram") {
        // Instagram Messaging — match by page ID
        const pageId = entry?.id;
        if (!pageId) continue;

        const whatsapp = await Whatsapp.findOne({
          where: { facebookPageUserId: pageId, channel: "instagram" }
        });
        if (!whatsapp) {
          logger.warn(
            { pageId },
            "MetaWebhookController: no Instagram connection for page id"
          );
          continue;
        }

        await processInstagramWebhook(whatsapp, entry);
      } else if (object === "page") {
        // Facebook Page Messaging → Instagram alternate delivery
        const pageId = entry?.id;
        if (!pageId) continue;

        const whatsapp = await Whatsapp.findOne({
          where: { facebookPageUserId: pageId, channel: "instagram" }
        });
        if (whatsapp) {
          await processInstagramWebhook(whatsapp, entry);
        }
      }
    }
  } catch (err) {
    logger.error({ err }, "MetaWebhookController.receive: error");
  }
};
