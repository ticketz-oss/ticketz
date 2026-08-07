import crypto from "crypto";
import * as Yup from "yup";

import AppError from "../../errors/AppError";
import { cacheLayer } from "../../libs/cache";
import User from "../../models/User";

interface Request {
  token: string;
  password: string;
}

type PasswordResetCacheValue = {
  userId: number;
  email: string;
  passwordHash: string;
};

const ResetPasswordService = async ({
  token,
  password
}: Request): Promise<void> => {
  const schema = Yup.object().shape({
    token: Yup.string().trim().required(),
    password: Yup.string().min(5).max(50).required()
  });

  try {
    await schema.validate({ token, password });
  } catch (err: unknown) {
    throw new AppError((err as Error).message);
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const cachedValue = await cacheLayer.get(`password-reset:${tokenHash}`);

  if (!cachedValue) {
    throw new AppError("ERR_INVALID_PASSWORD_RESET_TOKEN", 400);
  }

  const parsedValue = JSON.parse(cachedValue) as PasswordResetCacheValue;
  const user = await User.findByPk(parsedValue.userId);

  if (
    !user ||
    user.email.toLowerCase() !== parsedValue.email.toLowerCase() ||
    user.passwordHash !== parsedValue.passwordHash
  ) {
    await cacheLayer.del(`password-reset:${tokenHash}`);
    await cacheLayer.del(`password-reset-user:${parsedValue.userId}`);
    throw new AppError("ERR_INVALID_PASSWORD_RESET_TOKEN", 400);
  }

  await user.update({
    password,
    tokenVersion: user.tokenVersion + 1
  });

  await cacheLayer.del(`password-reset:${tokenHash}`);

  const activeTokenHash = await cacheLayer.get(`password-reset-user:${user.id}`);
  if (activeTokenHash === tokenHash) {
    await cacheLayer.del(`password-reset-user:${user.id}`);
  }
};

export default ResetPasswordService;