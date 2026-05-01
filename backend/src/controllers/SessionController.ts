import { Request, Response } from "express";
import AppError from "../errors/AppError";
import { getIO } from "../libs/socket";

import AuthUserService from "../services/UserServices/AuthUserService";
import { SendRefreshToken } from "../helpers/SendRefreshToken";
import { RefreshTokenService } from "../services/AuthServices/RefreshTokenService";
import FindUserFromToken from "../services/AuthServices/FindUserFromToken";
import User from "../models/User";
import { SerializeUser } from "../helpers/SerializeUser";
import { createAccessToken, createRefreshToken } from "../helpers/CreateTokens";
import Company from "../models/Company";
import Setting from "../models/Setting";
import Translation from "../models/Translation";
import { decodeRefreshToken } from "../helpers/DecodeRefreshToken";

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;

  const langs = await Translation.findAll({
    attributes: ["language"],
    group: ["language"]
  });

  const availableLanguages = langs.map(l => l.language.replace(/_/g, "-"));

  const language = (req.acceptsLanguages(availableLanguages) || null)?.replace(
    /-/g,
    "_"
  );

  const { token, serializedUser, refreshToken } = await AuthUserService({
    email,
    password,
    language
  });

  SendRefreshToken(res, refreshToken);

  const io = getIO();
  io.to(`user-${serializedUser.id}`).emit(
    `company-${serializedUser.companyId}-auth`,
    {
      action: "update",
      user: {
        id: serializedUser.id,
        email: serializedUser.email,
        companyId: serializedUser.companyId
      }
    }
  );

  return res.status(200).json({
    token,
    user: serializedUser
  });
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const token: string = req.cookies.jrt;

  if (!token) {
    throw new AppError("ERR_UNAUTHORIZED", 401);
  }

  const { user, newToken, refreshToken } = await RefreshTokenService(
    res,
    token
  );

  SendRefreshToken(res, refreshToken);

  return res.json({ token: newToken, user });
};

export const me = async (req: Request, res: Response): Promise<Response> => {
  const token: string = req.cookies.jrt;
  const user = await FindUserFromToken(token);
  const { id, profile, email, super: superAdmin } = user;

  if (!token) {
    throw new AppError("ERR_UNAUTHORIZED", 401);
  }

  return res.json({ id, profile, email, super: superAdmin });
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  res.clearCookie("jrt");

  return res.send();
};

export const impersonate = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const token: string = req.cookies.jrt;
  const { companyId } = req.params;

  if (!token) {
    throw new AppError("ERR_UNAUTHORIZED", 401);
  }

  const currentRefreshTokenData = decodeRefreshToken(token);

  if (currentRefreshTokenData.impersonated) {
    throw new AppError("ERR_ALREADY_IMPERSONATING", 400);
  }

  const user = await User.findOne({
    where: { companyId: Number(companyId), profile: "admin" },
    include: ["queues", { model: Company, include: [{ model: Setting }] }]
  });

  if (!user) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  const metadata = {
    originalUserId: Number(req.user.id),
    originalCompanyId: Number(req.user.companyId)
  };

  const newToken = createAccessToken(user, {
    impersonated: true,
    ...metadata
  });
  const refreshToken = createRefreshToken(user, {
    impersonated: true,
    ...metadata
  });
  const serializedUser = await SerializeUser(user);

  SendRefreshToken(res, refreshToken);

  const io = getIO();
  io.to(`user-${serializedUser.id}`).emit(
    `company-${serializedUser.companyId}-auth`,
    {
      action: "update",
      user: {
        id: serializedUser.id,
        email: serializedUser.email,
        companyId: serializedUser.companyId,
        impersonated: true
      }
    }
  );

  return res.status(200).json({
    token: newToken,
    user: serializedUser
  });
};

export const backToSuper = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const token: string = req.cookies.jrt;

  if (!token) {
    throw new AppError("ERR_UNAUTHORIZED", 401);
  }

  const refreshTokenData = decodeRefreshToken(token);

  if (!refreshTokenData.impersonated || !refreshTokenData.originalUserId) {
    throw new AppError("ERR_NOT_IMPERSONATING", 400);
  }

  const originalUser = await User.findByPk(refreshTokenData.originalUserId, {
    include: ["queues", { model: Company, include: [{ model: Setting }] }]
  });

  if (!originalUser || !originalUser.super) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  const newToken = createAccessToken(originalUser);
  const newRefreshToken = createRefreshToken(originalUser);
  const serializedUser = await SerializeUser(originalUser);

  SendRefreshToken(res, newRefreshToken);

  return res.status(200).json({
    token: newToken,
    user: serializedUser
  });
};
