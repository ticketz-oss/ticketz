import webpush from "web-push";
import Setting from "../models/Setting"; // adjust import to your project
import { logger } from "../utils/logger";

export async function initializeWebPush() {
  // Try loading from DB
  const [publicRecord, privateRecord] = await Promise.all([
    Setting.findOne({ where: { companyId: 1, key: "vapidPublicKey" } }),
    Setting.findOne({ where: { companyId: 1, key: "vapidPrivateKey" } })
  ]);

  let vapidKeys: {
    publicKey: string;
    privateKey: string;
  };

  if (publicRecord && privateRecord) {
    vapidKeys = {
      publicKey: publicRecord.value,
      privateKey: privateRecord.value
    };
  } else {
    // Not found → generate and persist
    vapidKeys = webpush.generateVAPIDKeys();

    await Promise.all([
      Setting.create({
        companyId: 1,
        key: "vapidPublicKey",
        value: vapidKeys.publicKey
      }),
      Setting.create({
        companyId: 1,
        key: "vapidPrivateKey",
        value: vapidKeys.privateKey
      })
    ]);

    logger.debug(vapidKeys, "Generated and saved new VAPID keys");
  }

  webpush.setVapidDetails(
    `mailto:${process.env.EMAIL_ADDRESS || "admin@ticketz.host"}`,
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}
