import { verify } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import authConfig from "../config/auth";
import Company from "../models/Company";
import { assertRuntimeCompany } from "../helpers/tenantRuntime";
import { initializeCompanyTimezone } from "../services/CompanyService/CompanyTimezoneService";

interface TokenPayload {
  id: string;
  username: string;
  profile: string;
  super: boolean;
  companyId: number;
  iat: number;
  exp: number;
}

const ensureCompanyActive = async (companyId: number): Promise<void> => {
  assertRuntimeCompany(companyId);
  const company = await Company.findByPk(companyId, {
    attributes: ["status", "platformStatus"]
  });
  if (company?.platformStatus === "suspenso") {
    throw new AppError("ERR_COMPANY_SUSPENDED", 403);
  }
  if (!company?.status || company.platformStatus === "cancelado") {
    throw new AppError("ERR_COMPANY_INACTIVE", 403);
  }
};

const isAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const clientTimezone = req.get("x-client-timezone");

  if (req?.user) {
    // API-token middleware may already have authorized the user, but tenant
    // suspension must still be enforced for every authenticated request.
    await ensureCompanyActive(req.user.companyId);
    await initializeCompanyTimezone(req.user.companyId, clientTimezone);
    next();
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("ERR_UNAUTHORIZED", 401, "debug");
  }

  const [, token] = authHeader.split(" ");

  try {
    const tokenData = verify(token, authConfig.secret) as TokenPayload;
    req.user = {
      id: tokenData.id,
      profile: tokenData.profile,
      isSuper: tokenData.super,
      companyId: tokenData.companyId
    };
    req.companyId = tokenData.companyId;

    await ensureCompanyActive(tokenData.companyId);
    await initializeCompanyTimezone(tokenData.companyId, clientTimezone);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("ERR_SESSION_EXPIRED", 403, "debug");
  }

  next();
};

export default isAuth;
