import ExchangeEmbeddedSignupCodeService from "../ExchangeEmbeddedSignupCodeService";
import { getMetaGraphApiClient } from "../MetaGraphApiClient";
import { logger } from "../../../utils/logger";
jest.mock("../MetaGraphApiClient", () => ({
  getMetaGraphApiClient: jest.fn()
}));
jest.mock("../../../utils/logger", () => ({ logger: { error: jest.fn() } }));
const get = jest.fn();
const environment = { ...process.env };
beforeEach(() => {
  jest.clearAllMocks();
  get.mockReset();
  process.env.META_APP_ID = "123";
  process.env.META_APP_SECRET = "app-secret";
  (getMetaGraphApiClient as jest.Mock).mockReturnValue({ get });
});
afterAll(() => {
  process.env = environment;
});
it("uses the BISU token returned by a single code exchange without a personal-token re-exchange", async () => {
  get.mockResolvedValue({ data: { access_token: "business-token" } });
  await expect(ExchangeEmbeddedSignupCodeService("once-code")).resolves.toEqual(
    { accessToken: "business-token", expiresInSeconds: null }
  );
  expect(get).toHaveBeenCalledTimes(1);
  expect(get).toHaveBeenCalledWith("/oauth/access_token", {
    params: { client_id: "123", client_secret: "app-secret", code: "once-code" }
  });
});
it.each([0, 3600])(
  "preserves actual lifetime %s without manufacturing 60 days",
  async expires_in => {
    get.mockResolvedValue({
      data: { access_token: "business-token", expires_in }
    });
    await expect(
      ExchangeEmbeddedSignupCodeService("once-code")
    ).resolves.toMatchObject({ expiresInSeconds: expires_in || null });
  }
);
it("rejects a successful HTTP response without a token", async () => {
  get.mockResolvedValue({ data: {} });
  await expect(
    ExchangeEmbeddedSignupCodeService("once-code")
  ).rejects.toMatchObject({ message: "ERR_META_CODE_EXCHANGE_FAILED" });
});
it("does not expose secrets from transport errors in errors or logs", async () => {
  const leaked = "code-secret-token";
  get.mockRejectedValue({
    message: leaked,
    config: { params: { code: leaked, client_secret: leaked } }
  });
  await expect(
    ExchangeEmbeddedSignupCodeService("once-code")
  ).rejects.toMatchObject({ message: "ERR_META_CODE_EXCHANGE_FAILED" });
  expect(JSON.stringify((logger.error as jest.Mock).mock.calls)).not.toContain(
    leaked
  );
});
it.each(["", "code with space", "x".repeat(4097)])(
  "rejects malformed code before Graph",
  async code => {
    await expect(ExchangeEmbeddedSignupCodeService(code)).rejects.toMatchObject(
      { message: "ERR_META_CONNECT_MISSING_FIELDS" }
    );
    expect(get).not.toHaveBeenCalled();
  }
);
