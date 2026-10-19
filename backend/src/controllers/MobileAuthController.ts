import { Request, Response } from "express";
import { getMobileAuthConfig } from "../config/mobileAuth";
import { SendRefreshToken } from "../helpers/SendRefreshToken";
import {
  authorizeMobile,
  exchangeMobile
} from "../services/AuthServices/MobileAuthService";

export const configuration = (_req: Request, res: Response): Response =>
  res.json({ enabled: getMobileAuthConfig().enabled });

export const authorize = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await authorizeMobile({
      accessToken: req.get("authorization")?.replace(/^Bearer /, ""),
      refreshToken: req.cookies?.jrt,
      requestOrigin: req.get("origin"),
      codeChallenge: req.body.codeChallenge,
      state: req.body.state
    })
  );

export const exchange = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const result = await exchangeMobile({
    code: req.body.code,
    codeVerifier: req.body.codeVerifier
  });
  SendRefreshToken(res, result.refreshToken);
  return res.json({ token: result.token, user: result.user });
};
