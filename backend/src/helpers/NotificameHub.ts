import { MessageSubscription, Client } from "notificamehubsdk";
import Whatsapp from "../models/Whatsapp";
import { logger } from "../utils/logger";
import { NgrokInstance } from "./NgrokInstance";

export const initializeWebhook = async (whatsapp: Whatsapp) => {
  let session: { hubToken: string; hubChannel: string };
  try {
    session = JSON.parse(whatsapp.session);
  } catch (e) {
    throw new Error("ERR_INVALID_SESSION");
  }

  const { hubToken, hubChannel: channel } = session;
  if (!hubToken || !channel) {
    throw new Error("ERR_INVALID_SESSION");
  }

  const client = new Client(hubToken);

  const backendUrl =
    NgrokInstance.getInstance().getUrl() || process.env.BACKEND_URL;

  const url = `${backendUrl}/notificamehub/webhook/${channel}`;

  const subscription = new MessageSubscription(
    {
      url
    },
    {
      channel
    }
  );

  client
    .createSubscription(subscription)
    .then((response: any) => {
      logger.info({ response }, `Webhook subscribed to url: ${url}`);
    })
    .catch((error: any) => {
      logger.error(error, "Error subscribing to webhook");
    });

  await Whatsapp.update(
    {
      status: "CONNECTED"
    },
    {
      where: {
        id: whatsapp.id
      }
    }
  );
};
