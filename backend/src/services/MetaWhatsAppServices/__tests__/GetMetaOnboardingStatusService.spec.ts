import Whatsapp from "../../../models/Whatsapp";
import GetMetaOnboardingStatusService from "../GetMetaOnboardingStatusService";
import {
  assertMetaSignupConfigured,
  getMetaSignupConfig
} from "../GetMetaSignupConfigService";

jest.mock("../../../models/Whatsapp", () => ({
  __esModule: true,
  default: { findOne: jest.fn() }
}));
jest.mock("../../../helpers/tenantRuntime", () => ({
  assertRuntimeCompany: jest.fn()
}));

beforeEach(() => jest.clearAllMocks());

it("scopes onboarding to the tenant and keeps secrets out of the query and response", async () => {
  (Whatsapp.findOne as jest.Mock).mockResolvedValue({
    apiMode: "official",
    status: "CONNECTED",
    metaWabaId: "111",
    metaPhoneNumberId: "222",
    metaAccessToken: "should-never-be-serialized",
    session: "private-session"
  });
  const result = await GetMetaOnboardingStatusService("9", 2);
  expect(Whatsapp.findOne).toHaveBeenCalledWith({
    where: { id: "9", companyId: 2 },
    attributes: ["id", "apiMode", "status", "metaWabaId", "metaPhoneNumberId"]
  });
  expect(result).toEqual({
    connectionStatus: "CONNECTED",
    billingMode: "direct",
    billingStatus: "unverified",
    billingManagementUrl: "https://business.facebook.com/billing_hub/",
    wabaId: "111",
    phoneNumberId: "222"
  });
});

it("does not reveal whether another tenant's connection exists", async () => {
  (Whatsapp.findOne as jest.Mock).mockResolvedValue(null);
  await expect(GetMetaOnboardingStatusService("9", 2)).rejects.toMatchObject({
    statusCode: 404
  });
});

it("does not allow a QR connection into the official onboarding flow", async () => {
  (Whatsapp.findOne as jest.Mock).mockResolvedValue({ apiMode: "baileys" });
  await expect(GetMetaOnboardingStatusService("9", 2)).rejects.toMatchObject({
    message: "ERR_WAPP_NOT_OFFICIAL_MODE"
  });
});

it("keeps an unconnected official number pending without assuming payment", async () => {
  (Whatsapp.findOne as jest.Mock).mockResolvedValue({
    apiMode: "official",
    status: "DISCONNECTED"
  });
  expect(await GetMetaOnboardingStatusService("9", 2)).toMatchObject({
    billingStatus: "unverified",
    billingManagementUrl: null,
    wabaId: null,
    phoneNumberId: null
  });
});

describe("public onboarding configuration", () => {
  const keys = [
    "META_APP_ID",
    "META_CONFIG_ID",
    "META_APP_SECRET",
    "META_GRAPH_API_VERSION",
    "ENCRYPTION_KEY"
  ];
  const previous = keys.map(key => process.env[key]);
  beforeEach(() => {
    process.env.META_APP_ID = "111";
    process.env.META_CONFIG_ID = "222";
    process.env.META_APP_SECRET = "private-secret";
    process.env.ENCRYPTION_KEY = "a".repeat(64);
    delete process.env.META_GRAPH_API_VERSION;
  });
  afterAll(() => {
    keys.forEach((key, index) => {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    });
  });

  it("returns only public values with the same pinned Graph version", () => {
    expect(getMetaSignupConfig()).toEqual({
      appId: "111",
      configId: "222",
      graphApiVersion: "v21.0",
      billingMode: "direct",
      signupAvailable: true
    });
    expect(() => assertMetaSignupConfigured()).not.toThrow();
  });

  it.each(["META_CONFIG_ID", "META_APP_SECRET", "ENCRYPTION_KEY"])(
    "refuses a partial setup without %s before exchanging a code",
    key => {
      delete process.env[key];
      expect(getMetaSignupConfig().signupAvailable).toBe(false);
      expect(() => assertMetaSignupConfigured()).toThrow();
    }
  );

  it("rejects a malformed Graph version", () => {
    process.env.META_GRAPH_API_VERSION = "../../unversioned";
    expect(getMetaSignupConfig().signupAvailable).toBe(false);
    expect(() => assertMetaSignupConfigured()).toThrow();
  });

  it.each(["META_APP_ID", "META_CONFIG_ID"])(
    "does not offer login with an invalid public %s",
    key => {
      process.env[key] = "invalid";
      expect(getMetaSignupConfig().signupAvailable).toBe(false);
      expect(() => assertMetaSignupConfigured()).toThrow();
    }
  );

  it.each(["META_APP_SECRET", "ENCRYPTION_KEY"])(
    "does not offer login with a whitespace-only %s",
    key => {
      process.env[key] = "  ";
      expect(getMetaSignupConfig().signupAvailable).toBe(false);
      expect(() => assertMetaSignupConfigured()).toThrow();
    }
  );
});
