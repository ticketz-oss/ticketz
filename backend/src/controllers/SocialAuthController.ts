import { Request, Response } from "express";
import { getSocialProviders } from "../config/clerk";
import { SendRefreshToken } from "../helpers/SendRefreshToken";
import ClerkGoogleAuthService from "../services/AuthServices/ClerkGoogleAuthService";

export const providers = (_req: Request, res: Response): Response => {
  res.setHeader("Cache-Control", "no-store");
  return res.json(getSocialProviders());
};

export const google = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const result = await ClerkGoogleAuthService({
    clerkToken: req.body.clerkToken,
    slug: req.body.slug,
    requestOrigin: req.get("origin")
  });
  SendRefreshToken(res, result.refreshToken);
  res.setHeader("Cache-Control", "no-store");
  return res.json({ token: result.token, user: result.serializedUser });
};
