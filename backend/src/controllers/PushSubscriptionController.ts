import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import { getVapidPublicKey, isWebPushConfigured } from "../config/webPush";
import PushSubscription from "../models/PushSubscription";

const subscriptionSchema = Yup.object().shape({
  endpoint: Yup.string().url().required(),
  keys: Yup.object()
    .shape({
      p256dh: Yup.string().required(),
      auth: Yup.string().required()
    })
    .required()
});

interface SubscriptionBody {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export const publicKey = async (
  req: Request,
  res: Response
): Promise<Response> => {
  return res
    .status(200)
    .json({ publicKey: getVapidPublicKey(), enabled: isWebPushConfigured() });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  if (!isWebPushConfigured()) {
    throw new AppError("ERR_PUSH_NOT_CONFIGURED", 503);
  }

  const { id: userId, companyId } = req.user;

  try {
    await subscriptionSchema.validate(req.body);
  } catch (err) {
    throw new AppError(err.message, 400);
  }

  const { endpoint, keys } = req.body as SubscriptionBody;

  // O mesmo endpoint pode reaparecer para outro usuário quando dois
  // atendentes usam o mesmo aparelho: o dono da inscrição passa a ser o
  // último que logou, senão o push vaza para a conta anterior.
  const existing = await PushSubscription.findOne({ where: { endpoint } });

  if (existing) {
    await existing.update({
      userId: +userId,
      companyId,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: req.get("user-agent") || null
    });
    return res.status(200).json({ id: existing.id });
  }

  const subscription = await PushSubscription.create({
    userId: +userId,
    companyId,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    userAgent: req.get("user-agent") || null
  });

  return res.status(201).json({ id: subscription.id });
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { endpoint } = req.body as { endpoint?: string };

  if (!endpoint) {
    throw new AppError("ERR_PUSH_ENDPOINT_REQUIRED", 400);
  }

  await PushSubscription.destroy({
    where: { endpoint, companyId: req.user.companyId }
  });

  return res.status(200).json({ message: "ok" });
};
