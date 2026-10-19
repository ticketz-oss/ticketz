import { Request, Response } from "express";
import { URL } from "url";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import WebPushSubscription from "../models/WebPushSubscription";
import {
  sendTestWebPush,
  StoredSubscriptionInput,
  subscriptionHash,
  webPushPublicKey
} from "../services/WebPushServices/WebPushService";

const schema = Yup.object({
  endpoint: Yup.string().url().max(4096).required(),
  expirationTime: Yup.number().nullable().optional(),
  keys: Yup.object({
    p256dh: Yup.string().min(20).max(512).required(),
    auth: Yup.string().min(8).max(256).required()
  }).required()
});

const assertAppleEndpoint = (endpoint: string): void => {
  let parsed: URL;
  try {
    parsed = new URL(endpoint);
  } catch {
    throw new AppError("ERR_INVALID_PUSH_SUBSCRIPTION", 400);
  }
  if (
    parsed.protocol !== "https:" ||
    !(
      parsed.hostname === "web.push.apple.com" ||
      parsed.hostname.endsWith(".push.apple.com")
    )
  ) {
    throw new AppError("ERR_INVALID_PUSH_SUBSCRIPTION", 400);
  }
};

export const publicKey = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  const key = webPushPublicKey();
  return res.json({ available: !!key, publicKey: key });
};

export const subscribe = async (
  req: Request,
  res: Response
): Promise<Response> => {
  let input: StoredSubscriptionInput;
  try {
    input = (await schema.validate(req.body, {
      stripUnknown: true
    })) as StoredSubscriptionInput;
  } catch {
    throw new AppError("ERR_INVALID_PUSH_SUBSCRIPTION", 400);
  }
  assertAppleEndpoint(input.endpoint);
  const endpointHash = subscriptionHash(input.endpoint);
  const [record] = await WebPushSubscription.upsert({
    endpointHash,
    endpoint: input.endpoint,
    p256dh: input.keys.p256dh,
    auth: input.keys.auth,
    expirationTime: input.expirationTime ?? null,
    userAgent: req.get("user-agent")?.slice(0, 1000) || null,
    userId: Number(req.user.id),
    companyId: Number(req.user.companyId),
    active: true
  });
  return res.status(201).json({ id: record.id, active: true });
};

export const unsubscribe = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const endpoint = String(req.body?.endpoint || "");
  if (!endpoint) throw new AppError("ERR_INVALID_PUSH_SUBSCRIPTION", 400);
  await WebPushSubscription.update(
    { active: false },
    {
      where: {
        endpointHash: subscriptionHash(endpoint),
        userId: Number(req.user.id),
        companyId: Number(req.user.companyId)
      }
    }
  );
  return res.json({ active: false });
};

export const test = async (req: Request, res: Response): Promise<Response> => {
  const count = await sendTestWebPush(
    Number(req.user.companyId),
    Number(req.user.id)
  );
  if (count === 0) throw new AppError("ERR_PUSH_SUBSCRIPTION_NOT_FOUND", 404);
  return res.json({ sent: count });
};
