import { sign } from "jsonwebtoken";
import authConfig from "../config/auth";
import User from "../models/User";

interface ImpersonationMetadata {
  impersonated?: boolean;
  sessionId?: string;
  originalUserId?: number;
  originalCompanyId?: number;
  originalSessionId?: string;
}

export const createAccessToken = (
  user: User,
  metadata: ImpersonationMetadata = {}
): string => {
  const { secret, expiresIn } = authConfig;

  return sign(
    {
      username: user.name,
      profile: user.profile,
      super: user.super,
      id: user.id,
      companyId: user.companyId,
      impersonated: !!metadata.impersonated,
      sessionId: metadata.sessionId,
      originalUserId: metadata.originalUserId,
      originalCompanyId: metadata.originalCompanyId,
      originalSessionId: metadata.originalSessionId
    },
    secret,
    {
      expiresIn
    }
  );
};

export const createRefreshToken = (
  user: User,
  metadata: ImpersonationMetadata = {}
): string => {
  const { refreshSecret, refreshExpiresIn } = authConfig;

  return sign(
    {
      id: user.id,
      tokenVersion: user.tokenVersion,
      companyId: user.companyId,
      sessionId: metadata.sessionId,
      impersonated: !!metadata.impersonated,
      originalUserId: metadata.originalUserId,
      originalCompanyId: metadata.originalCompanyId,
      originalSessionId: metadata.originalSessionId
    },
    refreshSecret,
    {
      expiresIn: refreshExpiresIn
    }
  );
};
