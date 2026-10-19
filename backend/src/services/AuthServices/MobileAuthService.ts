import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { verify } from "jsonwebtoken";
import authConfig from "../../config/auth";
import { getMobileAuthConfig } from "../../config/mobileAuth";
import AppError from "../../errors/AppError";
import { cacheLayer } from "../../libs/cache";
import { decodeRefreshToken } from "../../helpers/DecodeRefreshToken";
import {
  createAccessToken,
  createRefreshToken
} from "../../helpers/CreateTokens";
import { SerializeUser } from "../../helpers/SerializeUser";
import { assertRuntimeCompany } from "../../helpers/tenantRuntime";
import normalizeSlug from "../../helpers/normalizeSlug";
import User from "../../models/User";
import Company from "../../models/Company";
import Setting from "../../models/Setting";

type CodeRecord = {
  userId: number;
  companyId: number;
  tokenVersion: number;
  challenge: string;
  expiresAt: number;
};

const invalid = () => new AppError("ERR_MOBILE_AUTH_INVALID", 401);
const forbidden = () => new AppError("ERR_MOBILE_AUTH_FORBIDDEN", 403);
const digest = (value: string) =>
  createHash("sha256").update(value).digest("base64url");
const isHash = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[A-Za-z0-9_-]{43}$/.test(value) &&
  Buffer.from(value, "base64url").toString("base64url") === value;

const config = () => {
  const value = getMobileAuthConfig();
  if (!value.enabled) throw new AppError("ERR_MOBILE_AUTH_DISABLED", 503);
  return value;
};

const ordinary = (claims: Record<string, unknown>) => {
  if (
    claims.impersonated ||
    claims.originalUserId !== undefined ||
    claims.originalCompanyId !== undefined ||
    claims.originalSessionId !== undefined
  ) {
    throw forbidden();
  }
};

const activeUser = async (
  id: number,
  companyId: number,
  tokenVersion: number
) => {
  assertRuntimeCompany(companyId);
  const user = await User.findByPk(id, {
    include: ["queues", { model: Company, include: [{ model: Setting }] }]
  });
  if (
    !user ||
    user.companyId !== companyId ||
    user.tokenVersion !== tokenVersion ||
    !user.company ||
    user.company.id !== companyId
  )
    throw invalid();
  if (user.company.platformStatus === "suspenso") {
    throw new AppError("ERR_COMPANY_SUSPENDED", 403);
  }
  if (!user.company.status || user.company.platformStatus === "cancelado") {
    throw new AppError("ERR_COMPANY_INACTIVE", 403);
  }
  return user;
};

const companyForOrigin = async (origin: unknown): Promise<number> => {
  const settings = config();
  if (typeof origin !== "string" || !settings.origins.includes(origin))
    throw forbidden();
  const url = new URL(origin);
  if (url.protocol !== "https:" || origin !== url.origin) throw forbidden();
  if (
    [
      settings.baseDomain,
      `www.${settings.baseDomain}`,
      `app.${settings.baseDomain}`
    ].includes(url.hostname)
  ) {
    const id = Number(process.env.MASTER_COMPANY_ID || 1);
    if (!Number.isSafeInteger(id) || id < 1) throw forbidden();
    return id;
  }
  if (!url.hostname.endsWith(`.${settings.baseDomain}`)) throw forbidden();
  const slug = normalizeSlug(
    url.hostname.slice(0, -(settings.baseDomain.length + 1))
  );
  const company = await Company.findOne({
    where: { slug },
    attributes: ["id"]
  });
  if (!company) throw forbidden();
  return company.id;
};

export const authorizeMobile = async ({
  accessToken,
  refreshToken,
  requestOrigin,
  codeChallenge,
  state
}: {
  accessToken: unknown;
  refreshToken: unknown;
  requestOrigin: unknown;
  codeChallenge: unknown;
  state: unknown;
}): Promise<{ code: string; state: string }> => {
  const settings = config();
  if (
    !isHash(codeChallenge) ||
    typeof state !== "string" ||
    !/^[A-Za-z0-9_-]{22,128}$/.test(state)
  ) {
    throw new AppError("ERR_MOBILE_AUTH_REQUEST", 400);
  }
  if (typeof accessToken !== "string" || typeof refreshToken !== "string")
    throw invalid();
  let access: Record<string, unknown>;
  let refresh: ReturnType<typeof decodeRefreshToken>;
  try {
    const decoded = verify(accessToken, authConfig.secret, {
      algorithms: ["HS256"]
    });
    if (typeof decoded === "string") throw invalid();
    access = decoded;
    refresh = decodeRefreshToken(refreshToken);
  } catch {
    throw invalid();
  }
  ordinary(access);
  ordinary(refresh);
  const id = Number(refresh.id);
  const companyId = Number(refresh.companyId);
  if (
    !Number.isSafeInteger(id) ||
    id < 1 ||
    !Number.isSafeInteger(companyId) ||
    companyId < 1 ||
    !Number.isSafeInteger(refresh.tokenVersion) ||
    refresh.tokenVersion < 0 ||
    Number(access.id) !== id ||
    Number(access.companyId) !== companyId
  )
    throw invalid();
  if ((await companyForOrigin(requestOrigin)) !== companyId) throw forbidden();
  await activeUser(id, companyId, refresh.tokenVersion);
  const code = randomBytes(32).toString("base64url");
  const record: CodeRecord = {
    userId: id,
    companyId,
    tokenVersion: refresh.tokenVersion,
    challenge: codeChallenge,
    expiresAt: Date.now() + settings.ttl * 1000
  };
  await cacheLayer.set(
    `${settings.keyPrefix}${digest(code)}`,
    JSON.stringify(record),
    "EX",
    settings.ttl
  );
  return { code, state };
};

export const exchangeMobile = async ({
  code,
  codeVerifier
}: {
  code: unknown;
  codeVerifier: unknown;
}) => {
  const settings = config();
  if (
    !isHash(code) ||
    typeof codeVerifier !== "string" ||
    !/^[A-Za-z0-9._~-]{43,128}$/.test(codeVerifier)
  )
    throw invalid();
  const key = `${settings.keyPrefix}${digest(code)}`;
  const raw = await cacheLayer.get(key);
  if (typeof raw !== "string") throw invalid();
  let record: CodeRecord;
  try {
    record = JSON.parse(raw);
  } catch {
    throw invalid();
  }
  if (
    !record ||
    !Number.isSafeInteger(record.userId) ||
    record.userId < 1 ||
    !Number.isSafeInteger(record.companyId) ||
    record.companyId < 1 ||
    !Number.isSafeInteger(record.tokenVersion) ||
    record.tokenVersion < 0 ||
    !Number.isFinite(record.expiresAt) ||
    record.expiresAt <= Date.now() ||
    !isHash(record.challenge) ||
    !timingSafeEqual(
      Uint8Array.from(Buffer.from(record.challenge)),
      Uint8Array.from(Buffer.from(digest(codeVerifier)))
    )
  )
    throw invalid();
  const user = await activeUser(
    record.userId,
    record.companyId,
    record.tokenVersion
  );
  if (!(await cacheLayer.consumeIfMatch(key, raw))) throw invalid();
  return {
    token: createAccessToken(user),
    refreshToken: createRefreshToken(user),
    user: await SerializeUser(user)
  };
};
