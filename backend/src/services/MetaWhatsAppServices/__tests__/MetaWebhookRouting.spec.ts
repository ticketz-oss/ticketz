import Whatsapp from "../../../models/Whatsapp";
import AssertMetaWabaRuntimeService from "../AssertMetaWabaRuntimeService";
import { SubscribeWabaWebhookService } from "../SubscribeWabaWebhookService";
import { getMetaGraphApiClient } from "../MetaGraphApiClient";

jest.mock("../../../models/Whatsapp", () => ({
  __esModule: true,
  default: { findAll: jest.fn() }
}));
jest.mock("../../../utils/logger", () => ({ logger: { error: jest.fn() } }));
jest.mock("../MetaGraphApiClient", () => ({
  getMetaGraphApiClient: jest.fn(),
  withAuth: jest.fn(() => ({}))
}));
const post = jest.fn();
const environment = { ...process.env };
beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...environment };
  delete process.env.TENANT_RUNTIME_COMPANY_ID;
  process.env.TENANT_RUNTIME_EXCLUDED_COMPANY_IDS = "9";
  delete process.env.META_WEBHOOK_CALLBACK_URL;
  delete process.env.META_WEBHOOK_VERIFY_TOKEN;
  (getMetaGraphApiClient as jest.Mock).mockReturnValue({ post });
});
afterAll(() => {
  process.env = environment;
});

it("refuses to redirect an account owned by the dedicated runtime", async () => {
  (Whatsapp.findAll as jest.Mock).mockResolvedValue([{ id: 90, companyId: 9 }]);
  await expect(
    AssertMetaWabaRuntimeService("business", 1)
  ).rejects.toMatchObject({
    message: "ERR_META_WABA_OTHER_RUNTIME",
    statusCode: 409
  });
  expect(post).not.toHaveBeenCalled();
});
it("permits a WABA shared by companies in this runtime", async () => {
  (Whatsapp.findAll as jest.Mock).mockResolvedValue([{ id: 2, companyId: 2 }]);
  await expect(
    AssertMetaWabaRuntimeService("business", 1)
  ).resolves.toBeUndefined();
});
it("sets only the subscribed WABA callback and preserves app-wide configuration", async () => {
  process.env.META_WEBHOOK_CALLBACK_URL =
    "https://example.com/backend/webhooks/meta/whatsapp";
  process.env.META_WEBHOOK_VERIFY_TOKEN = "test-verifier";
  await SubscribeWabaWebhookService("business", "test-token");
  expect(post).toHaveBeenCalledTimes(1);
  expect(post).toHaveBeenCalledWith(
    "/business/subscribed_apps",
    {
      override_callback_uri: process.env.META_WEBHOOK_CALLBACK_URL,
      verify_token: "test-verifier"
    },
    {}
  );
});
it("keeps legacy subscriptions unchanged without an override", async () => {
  await SubscribeWabaWebhookService("business", "test-token");
  expect(post).toHaveBeenCalledWith("/business/subscribed_apps", {}, {});
});
it("fails closed when the alternate callback lacks its verifier", async () => {
  process.env.META_WEBHOOK_CALLBACK_URL = "https://example.com/webhook";
  await expect(
    SubscribeWabaWebhookService("business", "test-token")
  ).rejects.toMatchObject({ message: "ERR_META_WEBHOOK_CONFIG_INVALID" });
  expect(post).not.toHaveBeenCalled();
});
