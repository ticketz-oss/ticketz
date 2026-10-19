jest.mock("@clerk/backend", () => ({
  verifyToken: jest.fn(),
  createClerkClient: jest.fn()
}));
jest.mock("../../models/User", () => ({
  __esModule: true,
  default: { findOne: jest.fn() }
}));
jest.mock("../../models/Company", () => ({
  __esModule: true,
  default: { findOne: jest.fn(), findByPk: jest.fn() }
}));
jest.mock("../../models/Setting", () => ({ __esModule: true, default: {} }));
jest.mock("../../helpers/CreateTokens", () => ({
  createAccessToken: jest.fn(() => "access"),
  createRefreshToken: jest.fn(() => "refresh")
}));
jest.mock("../../helpers/SerializeUser", () => ({
  SerializeUser: jest.fn(user => user)
}));

import { createClerkClient, verifyToken } from "@clerk/backend";
import { Op } from "sequelize";
import { getSocialProviders } from "../../config/clerk";
import ClerkGoogleAuthService, {
  safeGoogleAvatar
} from "../../services/AuthServices/ClerkGoogleAuthService";
import Company from "../../models/Company";
import User from "../../models/User";
import { createAccessToken } from "../../helpers/CreateTokens";

const originalEnv = process.env;
const verifyMock = verifyToken as jest.Mock;
const sessionMock = jest.fn();
const clerkUserMock = jest.fn();
let company: { id: number; status: boolean; platformStatus: string };
let user: {
  id: number;
  companyId: number;
  name: string;
  email: string;
  profile: string;
  super: boolean;
  tokenVersion: number;
  update: jest.Mock;
};
let externalUser: {
  id: string;
  primaryEmailAddressId: string;
  emailAddresses: Array<{
    id: string;
    emailAddress: string;
    verification: { status: string };
    linkedTo: Array<{ id: string; type: string }>;
  }>;
  externalAccounts: Array<{
    id: string;
    identificationId?: string;
    provider: string;
    verification: { status: string };
    emailAddress: string;
    firstName: string;
    lastName: string;
    imageUrl: string;
  }>;
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env = {
    ...originalEnv,
    CLERK_GOOGLE_ENABLED: "true",
    CLERK_ENVIRONMENT: "production",
    CLERK_SECRET_KEY: "sk_live_fixture",
    CLERK_PUBLISHABLE_KEY: `pk_live_${Buffer.from("clerk.example.com$").toString("base64")}`,
    CLERK_ISSUER: "https://clerk.example.com",
    CLERK_AUTHORIZED_PARTIES: "https://acnorte.example.com,https://example.com",
    CLERK_TENANT_BASE_DOMAIN: "example.com"
  };
  delete process.env.TENANT_RUNTIME_COMPANY_ID;
  delete process.env.TENANT_RUNTIME_EXCLUDED_COMPANY_IDS;
  delete process.env.QUEUE_PREFIX;
  verifyMock.mockResolvedValue({
    iss: "https://clerk.example.com",
    azp: "https://acnorte.example.com",
    sub: "clerk-user",
    sid: "session"
  });
  sessionMock.mockResolvedValue({ status: "active", userId: "clerk-user" });
  externalUser = {
    id: "clerk-user",
    primaryEmailAddressId: "email",
    emailAddresses: [
      {
        id: "email",
        emailAddress: "Existing@Example.com",
        verification: { status: "verified" },
        linkedTo: [{ id: "google", type: "oauth_google" }]
      }
    ],
    externalAccounts: [
      {
        id: "google",
        provider: "oauth_google",
        verification: { status: "verified" },
        emailAddress: "existing@example.com",
        firstName: "Google",
        lastName: "Name",
        imageUrl: "https://lh3.googleusercontent.com/avatar"
      }
    ]
  };
  clerkUserMock.mockImplementation(async () => externalUser);
  (createClerkClient as jest.Mock).mockReturnValue({
    users: { getUser: clerkUserMock },
    sessions: { getSession: sessionMock }
  });
  company = { id: 42, status: true, platformStatus: "ativo" };
  (Company.findOne as jest.Mock).mockResolvedValue(company);
  (Company.findByPk as jest.Mock).mockResolvedValue({ ...company, id: 1 });
  user = {
    id: 7,
    companyId: 42,
    name: "Old",
    email: "existing@example.com",
    profile: "user",
    super: false,
    tokenVersion: 6,
    update: jest.fn(async function (profile) {
      Object.assign(user, profile);
    })
  };
  (User.findOne as jest.Mock).mockResolvedValue(user);
});
afterAll(() => {
  process.env = originalEnv;
});

const login = (slug: unknown = "acnorte") =>
  ClerkGoogleAuthService({
    clerkToken: "signed-token",
    slug,
    requestOrigin: "https://acnorte.example.com"
  });

it("enables only Google when the complete environment is consistent", () => {
  expect(getSocialProviders().providers).toEqual({
    google: { enabled: true },
    apple: { enabled: false },
    microsoft: { enabled: false }
  });
  expect(JSON.stringify(getSocialProviders())).not.toContain("sk_live");
});

it.each([
  "CLERK_GOOGLE_ENABLED",
  "CLERK_SECRET_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "CLERK_ISSUER",
  "CLERK_AUTHORIZED_PARTIES",
  "CLERK_ENVIRONMENT",
  "CLERK_TENANT_BASE_DOMAIN"
])("fails closed with missing %s", async key => {
  delete process.env[key];
  expect(getSocialProviders().providers.google.enabled).toBe(false);
  expect(getSocialProviders().publishableKey).toBeNull();
  await expect(login()).rejects.toMatchObject({
    message: "ERR_SOCIAL_LOGIN_DISABLED"
  });
  expect(verifyMock).not.toHaveBeenCalled();
});

it("rejects production keys on development and mixed test/live keys", () => {
  process.env.CLERK_ENVIRONMENT = "development";
  expect(getSocialProviders().providers.google.enabled).toBe(false);
  process.env.CLERK_ENVIRONMENT = "production";
  process.env.CLERK_SECRET_KEY = "sk_test_fixture";
  expect(getSocialProviders().providers.google.enabled).toBe(false);
});

it("enables test keys only in an explicit development environment, irrespective of NODE_ENV", () => {
  process.env.NODE_ENV = "production";
  process.env.CLERK_ENVIRONMENT = "development";
  process.env.CLERK_SECRET_KEY = "sk_test_fixture";
  process.env.CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY.replace(
    "pk_live",
    "pk_test"
  );
  expect(getSocialProviders().providers.google.enabled).toBe(true);
});

it("rejects key domain mismatch and wildcard origins", () => {
  process.env.CLERK_ISSUER = "https://another.example.com";
  expect(getSocialProviders().providers.google.enabled).toBe(false);
  process.env.CLERK_ISSUER = "https://clerk.example.com";
  process.env.CLERK_AUTHORIZED_PARTIES = "https://*.example.com";
  expect(getSocialProviders().providers.google.enabled).toBe(false);
});

it("authorizes only the matching existing tenant account and updates only name/photo", async () => {
  const result = await login();
  expect(verifyMock).toHaveBeenCalledWith(
    "signed-token",
    expect.objectContaining({
      authorizedParties: ["https://acnorte.example.com", "https://example.com"]
    })
  );
  expect(Company.findOne).toHaveBeenCalledWith({ where: { slug: "acnorte" } });
  const where = (User.findOne as jest.Mock).mock.calls[0][0].where[Op.and];
  expect(where[1]).toEqual({ companyId: 42 });
  expect(where[0].logic).toBe("existing@example.com");
  expect(user.update).toHaveBeenCalledWith({
    name: "Google Name",
    profilePicUrl: "https://lh3.googleusercontent.com/avatar"
  });
  expect(user.profile).toBe("user");
  expect(user.super).toBe(false);
  expect(user.tokenVersion).toBe(6);
  expect(result.token).toBe("access");
});

it("does not fall back to another tenant when no matching account exists", async () => {
  (User.findOne as jest.Mock).mockResolvedValue(null);
  await expect(login()).rejects.toMatchObject({
    message: "ERR_SOCIAL_LOGIN_NO_ACCESS"
  });
  expect(User.findOne).toHaveBeenCalledTimes(1);
  expect(user.update).not.toHaveBeenCalled();
  expect(createAccessToken).not.toHaveBeenCalled();
});

it("never updates a user returned outside the resolved tenant", async () => {
  user.companyId = 99;
  await expect(login()).rejects.toMatchObject({
    message: "ERR_SOCIAL_LOGIN_NO_ACCESS"
  });
  expect(user.update).not.toHaveBeenCalled();
});

it("allows Google only for the tenant owned by a dedicated runtime", async () => {
  process.env.TENANT_RUNTIME_COMPANY_ID = "42";
  process.env.QUEUE_PREFIX = "acnorte-production";
  await expect(login()).resolves.toHaveProperty("token", "access");
  process.env.TENANT_RUNTIME_COMPANY_ID = "99";
  jest.clearAllMocks();
  await expect(login()).rejects.toMatchObject({ message: "ERR_FORBIDDEN" });
  expect(User.findOne).not.toHaveBeenCalled();
  expect(user.update).not.toHaveBeenCalled();
  expect(createAccessToken).not.toHaveBeenCalled();
});

it("rejects an excluded tenant in the shared runtime before account lookup", async () => {
  process.env.TENANT_RUNTIME_EXCLUDED_COMPANY_IDS = "42, 99";
  await expect(login()).rejects.toMatchObject({ message: "ERR_FORBIDDEN" });
  expect(User.findOne).not.toHaveBeenCalled();
  expect(user.update).not.toHaveBeenCalled();
  expect(createAccessToken).not.toHaveBeenCalled();
});

it("keeps non-excluded tenants working in the shared runtime", async () => {
  process.env.TENANT_RUNTIME_EXCLUDED_COMPANY_IDS = "99";
  await expect(login()).resolves.toHaveProperty("token", "access");
});

it("fails closed for malformed or overlapping runtime ownership configuration", async () => {
  process.env.TENANT_RUNTIME_COMPANY_ID = "42oops";
  process.env.QUEUE_PREFIX = "acnorte-production";
  await expect(login()).rejects.toThrow("Invalid tenant runtime company ID");
  process.env.TENANT_RUNTIME_COMPANY_ID = "42";
  process.env.TENANT_RUNTIME_EXCLUDED_COMPANY_IDS = "42";
  await expect(login()).rejects.toThrow("mutually exclusive");
  expect(User.findOne).not.toHaveBeenCalled();
  expect(user.update).not.toHaveBeenCalled();
  expect(createAccessToken).not.toHaveBeenCalled();
});

it("rejects a dedicated runtime that accidentally uses the shared queue prefix", async () => {
  process.env.TENANT_RUNTIME_COMPANY_ID = "42";
  process.env.QUEUE_PREFIX = "bull";
  await expect(login()).rejects.toThrow("requires a separate QUEUE_PREFIX");
  expect(User.findOne).not.toHaveBeenCalled();
});

it("requires request Origin to match the signed authorized party", async () => {
  await expect(
    ClerkGoogleAuthService({
      clerkToken: "signed-token",
      slug: "acnorte",
      requestOrigin: "https://evil.example"
    })
  ).rejects.toMatchObject({ message: "ERR_SOCIAL_LOGIN_INVALID" });
  await expect(
    ClerkGoogleAuthService({
      clerkToken: "signed-token",
      slug: "acnorte",
      requestOrigin: undefined
    })
  ).rejects.toMatchObject({ message: "ERR_SOCIAL_LOGIN_INVALID" });
  expect(User.findOne).not.toHaveBeenCalled();
});

it("restricts the apex origin to the configured master company", async () => {
  verifyMock.mockResolvedValue({
    iss: "https://clerk.example.com",
    azp: "https://example.com",
    sub: "clerk-user",
    sid: "session"
  });
  user.companyId = 1;
  await ClerkGoogleAuthService({
    clerkToken: "signed-token",
    requestOrigin: "https://example.com"
  });
  expect(Company.findByPk).toHaveBeenCalledWith(1);
  expect((User.findOne as jest.Mock).mock.calls[0][0].where[Op.and][1]).toEqual(
    { companyId: 1 }
  );
  await expect(
    ClerkGoogleAuthService({
      clerkToken: "signed-token",
      slug: "acnorte",
      requestOrigin: "https://example.com"
    })
  ).rejects.toMatchObject({ message: "ERR_SOCIAL_LOGIN_INVALID" });
});

it("rejects unknown tenant, invalid slug and a slug different from the signed origin", async () => {
  await expect(login("other")).rejects.toMatchObject({
    message: "ERR_SOCIAL_LOGIN_INVALID"
  });
  await expect(login({ slug: "acnorte" })).rejects.toMatchObject({
    message: "ERR_SOCIAL_LOGIN_INVALID"
  });
  (Company.findOne as jest.Mock).mockResolvedValue(null);
  await expect(login()).rejects.toMatchObject({
    message: "ERR_SOCIAL_LOGIN_NO_ACCESS"
  });
  expect(user.update).not.toHaveBeenCalled();
});

it.each([false, "cancelado", "suspenso"])(
  "rejects an inactive tenant (%s) before any user update",
  async status => {
    if (status === false) company.status = false;
    else company.platformStatus = String(status);
    await expect(login()).rejects.toMatchObject({ statusCode: 403 });
    expect(User.findOne).not.toHaveBeenCalled();
    expect(user.update).not.toHaveBeenCalled();
  }
);

it("rejects invalid tokens, wrong issuers, untrusted origins and missing session claims", async () => {
  verifyMock.mockRejectedValueOnce(new Error("invalid signature"));
  await expect(login()).rejects.toMatchObject({
    message: "ERR_SOCIAL_LOGIN_INVALID"
  });
  const claimCases = [
    {
      iss: "https://evil.example",
      azp: "https://acnorte.example.com",
      sub: "clerk-user",
      sid: "session"
    },
    {
      iss: "https://clerk.example.com",
      azp: "https://evil.example",
      sub: "clerk-user",
      sid: "session"
    },
    {
      iss: "https://clerk.example.com",
      azp: "https://acnorte.example.com",
      sub: "clerk-user"
    }
  ];
  // Sequential one-shot verification mocks deliberately model distinct requests.
  // eslint-disable-next-line no-restricted-syntax
  for (const claims of claimCases) {
    verifyMock.mockResolvedValueOnce(claims);
    await expect(login()).rejects.toMatchObject({
      message: "ERR_SOCIAL_LOGIN_INVALID"
    });
  }
  expect(User.findOne).not.toHaveBeenCalled();
});

it("supports the current Backend API google provider and identification linkage", async () => {
  externalUser.externalAccounts[0].provider = "google";
  externalUser.externalAccounts[0].id = "eac_google";
  externalUser.externalAccounts[0].identificationId = "google";
  await expect(login()).resolves.toHaveProperty("token", "access");
});

it("supports long Clerk image proxy URLs without downloading images", () => {
  const url = `https://img.clerk.com/${"a".repeat(450)}`;
  expect(safeGoogleAvatar(url)).toBe(url);
});

it("rejects revoked Clerk sessions", async () => {
  sessionMock.mockResolvedValue({ status: "revoked", userId: "clerk-user" });
  await expect(login()).rejects.toMatchObject({
    message: "ERR_SOCIAL_LOGIN_INVALID"
  });
});

it.each(["unverified", "unlinked", "different-email", "apple"])(
  "rejects %s provider identities",
  async scenario => {
    if (scenario === "unverified")
      externalUser.emailAddresses[0].verification.status = "unverified";
    if (scenario === "unlinked") externalUser.emailAddresses[0].linkedTo = [];
    if (scenario === "different-email")
      externalUser.externalAccounts[0].emailAddress = "another@example.com";
    if (scenario === "apple")
      externalUser.externalAccounts[0].provider = "oauth_apple";
    await expect(login()).rejects.toMatchObject({
      message: "ERR_SOCIAL_LOGIN_INVALID"
    });
    expect(user.update).not.toHaveBeenCalled();
  }
);

it("retains existing photos when the provider photo is not a trusted HTTPS URL", async () => {
  externalUser.externalAccounts[0].imageUrl = "http://127.0.0.1/private";
  await login();
  expect(user.update).toHaveBeenCalledWith({ name: "Google Name" });
  expect(
    safeGoogleAvatar("https://lh3.googleusercontent.com.evil.example/image")
  ).toBeUndefined();
  expect(
    safeGoogleAvatar("https://user:pass@lh3.googleusercontent.com/image")
  ).toBeUndefined();
});
