import { createHash, timingSafeEqual } from "crypto";
import { NextFunction, Request, Response } from "express";
import GetSuperSettingService from "../services/SettingServices/GetSuperSettingService";

const digest = (value: string): Uint8Array =>
  Uint8Array.from(createHash("sha256").update(value).digest());

const constantTimeEqual = timingSafeEqual as unknown as (
  left: Uint8Array,
  right: Uint8Array
) => boolean;

const platformKeyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const received = req.header("X-Platform-Key") || "";
  const expected =
    process.env.PLATFORM_API_KEY ||
    (await GetSuperSettingService({ key: "_platformApiKey" })) ||
    "";

  const valid =
    received.length >= 48 &&
    expected.length >= 48 &&
    constantTimeEqual(digest(received), digest(expected));

  if (!valid) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  req.platform = { ok: true };
  next();
};

export default platformKeyAuth;
