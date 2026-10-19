jest.mock("../../config/auth", () => ({
  __esModule: true,
  default: {
    secret: "access-fixture-secret",
    refreshSecret: "refresh-fixture-secret"
  }
}));
jest.mock("../../libs/cache", () => ({
  cacheLayer: { set: jest.fn(), get: jest.fn(), consumeIfMatch: jest.fn() }
}));
jest.mock("../../models/User", () => ({
  __esModule: true,
  default: { findByPk: jest.fn() }
}));
jest.mock("../../models/Company", () => ({
  __esModule: true,
  default: { findOne: jest.fn() }
}));
jest.mock("../../models/Setting", () => ({ __esModule: true, default: {} }));
jest.mock("../../helpers/CreateTokens", () => ({
  createAccessToken: jest.fn(() => "issued-access"),
  createRefreshToken: jest.fn(() => "issued-refresh")
}));
jest.mock("../../helpers/SerializeUser", () => ({
  SerializeUser: jest.fn(user => ({ id: user.id, companyId: user.companyId }))
}));

import { createHash } from "crypto";
import { sign } from "jsonwebtoken";
import {
  authorizeMobile,
  exchangeMobile
} from "../../services/AuthServices/MobileAuthService";
import { getMobileAuthConfig } from "../../config/mobileAuth";
import { cacheLayer } from "../../libs/cache";
import {
  createAccessToken,
  createRefreshToken
} from "../../helpers/CreateTokens";
import User from "../../models/User";
import Company from "../../models/Company";

const originalEnv = process.env;
const memory = new Map<string, string>();
const verifier = "native-client-verifier-" + "a".repeat(43);
const challenge = createHash("sha256").update(verifier).digest("base64url");
const state = "native-state-" + "b".repeat(32);
const origin = "https://teste.dev.espacowhats.com.br";
let user: {
  id: number;
  companyId: number;
  tokenVersion: number;
  company: { id: number; status: boolean; platformStatus: string };
};

const access = (claims: Record<string, unknown> = {}) =>
  sign(
    { id: 7, companyId: 2, impersonated: false, ...claims },
    "access-fixture-secret",
    { expiresIn: "15m" }
  );
const refresh = (claims: Record<string, unknown> = {}) =>
  sign(
    { id: 7, companyId: 2, tokenVersion: 3, impersonated: false, ...claims },
    "refresh-fixture-secret",
    { expiresIn: "7d" }
  );
const authorize = (overrides: Record<string, unknown> = {}) =>
  authorizeMobile({
    accessToken: access(),
    refreshToken: refresh(),
    requestOrigin: origin,
    codeChallenge: challenge,
    state,
    ...overrides
  });
const exchange = (code: string, codeVerifier: unknown = verifier) =>
  exchangeMobile({ code, codeVerifier });

beforeEach(() => {
  jest.clearAllMocks();
  memory.clear();
  process.env = {
    ...originalEnv,
    MOBILE_AUTH_ENABLED: "true",
    CLERK_GOOGLE_ENABLED: "true",
    CLERK_ENVIRONMENT: "development",
    CLERK_SECRET_KEY: "sk_test_fixture",
    CLERK_PUBLISHABLE_KEY: `pk_test_${Buffer.from("fixture.clerk.accounts.dev$").toString("base64")}`,
    CLERK_ISSUER: "https://fixture.clerk.accounts.dev",
    CLERK_TENANT_BASE_DOMAIN: "dev.espacowhats.com.br",
    CLERK_AUTHORIZED_PARTIES: `${origin},https://dev.espacowhats.com.br`,
    MASTER_COMPANY_ID: "1"
  };
  delete process.env.TENANT_RUNTIME_COMPANY_ID;
  delete process.env.TENANT_RUNTIME_EXCLUDED_COMPANY_IDS;
  delete process.env.QUEUE_PREFIX;
  user = {
    id: 7,
    companyId: 2,
    tokenVersion: 3,
    company: { id: 2, status: true, platformStatus: "ativo" }
  };
  (User.findByPk as jest.Mock).mockImplementation(async () => user);
  (Company.findOne as jest.Mock).mockResolvedValue({ id: 2 });
  (cacheLayer.set as jest.Mock).mockImplementation(async (key, value) => {
    memory.set(key, value);
    return "OK";
  });
  (cacheLayer.get as jest.Mock).mockImplementation(
    async key => memory.get(key) ?? null
  );
  (cacheLayer.consumeIfMatch as jest.Mock).mockImplementation(
    async (key, expected) => {
      if (memory.get(key) !== expected) return false;
      memory.delete(key);
      return true;
    }
  );
});
afterAll(() => {
  process.env = originalEnv;
});

it("is opt-in and fails closed in production even when the flag is set", async () => {
  expect(getMobileAuthConfig().enabled).toBe(true);
  delete process.env.MOBILE_AUTH_ENABLED;
  await expect(authorize()).rejects.toMatchObject({ statusCode: 503 });
  process.env.MOBILE_AUTH_ENABLED = "true";
  process.env.CLERK_ENVIRONMENT = "production";
  process.env.CLERK_SECRET_KEY = "sk_live_fixture";
  process.env.CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY.replace(
    "pk_test_",
    "pk_live_"
  );
  expect(getMobileAuthConfig().enabled).toBe(false);
  await expect(exchange("a".repeat(43))).rejects.toMatchObject({
    statusCode: 503
  });
  expect(cacheLayer.get).not.toHaveBeenCalled();
});

it("rejects non-dev domains and a disabled or inconsistent Clerk environment", () => {
  process.env.CLERK_TENANT_BASE_DOMAIN = "espacowhats.com.br";
  expect(getMobileAuthConfig().enabled).toBe(false);
  process.env.CLERK_TENANT_BASE_DOMAIN = "dev.espacowhats.com.br";
  process.env.CLERK_GOOGLE_ENABLED = "false";
  expect(getMobileAuthConfig().enabled).toBe(false);
});

it("stores only a hashed single-use code, PKCE challenge and account context for 90 seconds", async () => {
  const result = await authorize();
  expect(result.state).toBe(state);
  expect(result.code).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(Object.keys(result).sort()).toEqual(["code", "state"]);
  const [key, raw, mode, ttl] = (cacheLayer.set as jest.Mock).mock.calls[0];
  expect(key).not.toContain(result.code);
  expect(key).toContain(
    createHash("sha256").update(result.code).digest("base64url")
  );
  expect(mode).toBe("EX");
  expect(ttl).toBe(90);
  const record = JSON.parse(raw);
  expect(record).toEqual({
    userId: 7,
    companyId: 2,
    tokenVersion: 3,
    challenge,
    expiresAt: expect.any(Number)
  });
  expect(record.expiresAt).toBeGreaterThan(Date.now());
  expect(raw).not.toContain(verifier);
  expect(raw).not.toContain(access());
  expect(raw).not.toContain(refresh());
});

it("exchanges once for ordinary application tokens and never modifies the account", async () => {
  const { code } = await authorize();
  await expect(exchange(code)).resolves.toEqual({
    token: "issued-access",
    refreshToken: "issued-refresh",
    user: { id: 7, companyId: 2 }
  });
  expect(createAccessToken).toHaveBeenCalledWith(user);
  expect(createRefreshToken).toHaveBeenCalledWith(user);
  await expect(exchange(code)).rejects.toMatchObject({ statusCode: 401 });
  expect(createAccessToken).toHaveBeenCalledTimes(1);
});

it("allows exactly one of two simultaneous valid exchanges", async () => {
  const { code } = await authorize();
  const results = await Promise.allSettled([exchange(code), exchange(code)]);
  expect(results.filter(value => value.status === "fulfilled")).toHaveLength(1);
  expect(results.filter(value => value.status === "rejected")).toHaveLength(1);
  expect(createAccessToken).toHaveBeenCalledTimes(1);
});

it("does not consume a code on an incorrect verifier", async () => {
  const { code } = await authorize();
  await expect(exchange(code, "z".repeat(43))).rejects.toMatchObject({
    statusCode: 401
  });
  expect(cacheLayer.consumeIfMatch).not.toHaveBeenCalled();
  expect(User.findByPk).toHaveBeenCalledTimes(1);
  await expect(exchange(code)).resolves.toHaveProperty(
    "token",
    "issued-access"
  );
});

it.each([undefined, "short", "x".repeat(129), "!".repeat(43)])(
  "rejects malformed verifier %s without Redis access",
  async value => {
    await expect(
      exchangeMobile({ code: "A".repeat(43), codeVerifier: value })
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(cacheLayer.get).not.toHaveBeenCalled();
  }
);

it.each(["", "x".repeat(42), "!".repeat(43), "x".repeat(44)])(
  "rejects malformed code %s",
  async code => {
    await expect(exchange(code)).rejects.toMatchObject({ statusCode: 401 });
    expect(cacheLayer.get).not.toHaveBeenCalled();
  }
);

it.each([
  { codeChallenge: "plain" },
  { codeChallenge: "!".repeat(43) },
  { state: "short" },
  { state: "a".repeat(129) }
])("rejects malformed authorization input", async input => {
  await expect(authorize(input)).rejects.toMatchObject({ statusCode: 400 });
  expect(cacheLayer.set).not.toHaveBeenCalled();
});

it.each([
  undefined,
  "https://evil.example",
  "https://teste.dev.espacowhats.com.br/",
  "http://teste.dev.espacowhats.com.br"
])("rejects missing or untrusted web origins %s", async requestOrigin => {
  await expect(authorize({ requestOrigin })).rejects.toMatchObject({
    statusCode: 403
  });
  expect(cacheLayer.set).not.toHaveBeenCalled();
});

it("cannot switch tenants through the authorized web origin", async () => {
  await expect(
    authorize({ requestOrigin: "https://dev.espacowhats.com.br" })
  ).rejects.toMatchObject({ statusCode: 403 });
  expect(User.findByPk).not.toHaveBeenCalled();
});

it.each([
  { accessToken: "invalid" },
  { refreshToken: "invalid" },
  { accessToken: access({ id: 8 }) },
  { accessToken: access({ companyId: 3 }) },
  { refreshToken: refresh({ tokenVersion: -1 }) }
])("requires matching valid access and refresh sessions", async values => {
  await expect(authorize(values)).rejects.toMatchObject({ statusCode: 401 });
  expect(cacheLayer.set).not.toHaveBeenCalled();
});

it.each(["access", "refresh"])(
  "rejects impersonated %s sessions",
  async tokenKind => {
    const values =
      tokenKind === "access"
        ? { accessToken: access({ impersonated: true }) }
        : { refreshToken: refresh({ originalUserId: 1 }) };
    await expect(authorize(values)).rejects.toMatchObject({ statusCode: 403 });
    expect(cacheLayer.set).not.toHaveBeenCalled();
  }
);

it.each(["deleted", "version", "company", "inactive", "suspended", "runtime"])(
  "revalidates %s state immediately before exchange",
  async change => {
    const { code } = await authorize();
    if (change === "deleted")
      (User.findByPk as jest.Mock).mockResolvedValue(null);
    if (change === "version") user.tokenVersion += 1;
    if (change === "company") user.companyId = 9;
    if (change === "inactive") user.company.status = false;
    if (change === "suspended") user.company.platformStatus = "suspenso";
    if (change === "runtime")
      process.env.TENANT_RUNTIME_EXCLUDED_COMPANY_IDS = "2";
    await expect(exchange(code)).rejects.toBeDefined();
    expect(createAccessToken).not.toHaveBeenCalled();
    expect(cacheLayer.consumeIfMatch).not.toHaveBeenCalled();
  }
);

it("rejects an expired or corrupt record without token issuance", async () => {
  const { code } = await authorize();
  const [key, raw] = [...memory.entries()][0];
  memory.set(
    key,
    JSON.stringify({ ...JSON.parse(raw), expiresAt: Date.now() - 1 })
  );
  await expect(exchange(code)).rejects.toMatchObject({ statusCode: 401 });
  memory.set(key, "{broken");
  await expect(exchange(code)).rejects.toMatchObject({ statusCode: 401 });
  expect(createAccessToken).not.toHaveBeenCalled();
});

it("fails closed if the atomic consumption fails or Redis is unavailable", async () => {
  const { code } = await authorize();
  (cacheLayer.consumeIfMatch as jest.Mock).mockResolvedValueOnce(false);
  await expect(exchange(code)).rejects.toMatchObject({ statusCode: 401 });
  (cacheLayer.get as jest.Mock).mockRejectedValueOnce(
    new Error("redis unavailable")
  );
  await expect(exchange(code)).rejects.toThrow("redis unavailable");
  expect(createAccessToken).not.toHaveBeenCalled();
});
