import { verify } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import authConfig from "../config/auth";

interface TokenPayload {
  id: string;
  username: string;
  profile: string;
  super: boolean;
  companyId: number;
  iat: number;
  exp: number;
}

const isAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (req?.user) {
    // previous middleware already authorized
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("ERR_UNAUTHORIZED", 401, "debug");
  }

  const [, token] = authHeader.split(" ");

  try {
    req.tokenData = verify(token, authConfig.secret) as TokenPayload;
    req.user = {
      id: req.tokenData.id,
      profile: req.tokenData.profile,
      isSuper: req.tokenData.super,
      companyId: req.tokenData.companyId
    };
    req.companyId = req.tokenData.companyId;
  } catch (err) {
    throw new AppError("ERR_SESSION_EXPIRED", 403, "debug");
  }

  return next();
};

export default isAuth;
