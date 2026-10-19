import { verify } from "jsonwebtoken";
import AppError from "../errors/AppError";
import authConfig from "../config/auth";

export type RefreshTokenPayload = {
  id: string;
  tokenVersion: number;
  companyId: number;
  sessionId?: string;
  impersonated?: boolean;
  originalUserId?: number;
  originalCompanyId?: number;
  originalSessionId?: string;
  iat: number;
  exp: number;
};

export function decodeRefreshToken(token: string): RefreshTokenPayload {
  if (!token || !authConfig.refreshSecret) {
    throw new AppError("ERR_UNAUTHORIZED", 401);
  }

  try {
    const decoded = verify(
      token,
      authConfig.refreshSecret
    ) as RefreshTokenPayload;

    if (!decoded.id) {
      throw new AppError("ERR_SESSION_EXPIRED", 401);
    }

    return decoded;
  } catch {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }
}
