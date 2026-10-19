import { Response as Res } from "express";

import User from "../../models/User";
import { assertRuntimeCompany } from "../../helpers/tenantRuntime";
import AppError from "../../errors/AppError";
import ShowUserService from "../UserServices/ShowUserService";
import {
  createAccessToken,
  createRefreshToken
} from "../../helpers/CreateTokens";
import {
  decodeRefreshToken,
  RefreshTokenPayload
} from "../../helpers/DecodeRefreshToken";

interface Response {
  user: User;
  newToken: string;
  refreshToken: string;
}

export const RefreshTokenService = async (
  res: Res,
  token: string
): Promise<Response> => {
  let decoded: RefreshTokenPayload;
  try {
    decoded = decodeRefreshToken(token);
  } catch {
    res.clearCookie("jrt");
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  const { id, tokenVersion, impersonated, originalUserId, originalCompanyId } =
    decoded;
  const user = await ShowUserService(id);
  assertRuntimeCompany(user.companyId);

  if (user.company?.platformStatus === "suspenso") {
    res.clearCookie("jrt");
    throw new AppError("ERR_COMPANY_SUSPENDED", 403);
  }
  if (
    user.tokenVersion !== tokenVersion ||
    !user.company?.status ||
    user.company.platformStatus === "cancelado"
  ) {
    res.clearCookie("jrt");
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  const newToken = createAccessToken(user, {
    impersonated: impersonated === true,
    originalUserId,
    originalCompanyId
  });
  const refreshToken = createRefreshToken(user, {
    impersonated: impersonated === true,
    originalUserId,
    originalCompanyId
  });

  return { user, newToken, refreshToken };
};
