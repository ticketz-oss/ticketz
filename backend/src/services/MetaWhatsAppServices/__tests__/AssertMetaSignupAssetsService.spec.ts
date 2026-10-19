import AssertMetaSignupAssetsService from "../AssertMetaSignupAssetsService";
import { getMetaGraphApiClient } from "../MetaGraphApiClient";
jest.mock("../MetaGraphApiClient", () => ({
  getMetaGraphApiClient: jest.fn(),
  withAuth: (token: string) => ({
    headers: { Authorization: `Bearer ${token}` }
  })
}));
const get = jest.fn();
const environment = { ...process.env };
const request = {
  accessToken: "customer-token",
  wabaId: "111",
  phoneNumberId: "222",
  businessId: "333"
};
const token = () => ({
  is_valid: true,
  app_id: "123",
  scopes: ["whatsapp_business_management", "whatsapp_business_messaging"],
  granular_scopes: [
    { scope: "whatsapp_business_management", target_ids: ["111"] }
  ],
  expires_at: 0
});
beforeEach(() => {
  jest.clearAllMocks();
  get.mockReset();
  process.env.META_APP_ID = "123";
  process.env.META_APP_SECRET = "secret";
  (getMetaGraphApiClient as jest.Mock).mockReturnValue({ get });
  get.mockImplementation(async path => {
    if (path === "/debug_token") return { data: { data: token() } };
    if (path === "/111")
      return { data: { id: "111", owner_business_info: { id: "333" } } };
    if (path === "/111/phone_numbers")
      return { data: { data: [{ id: "222" }] } };
    throw new Error("Unexpected path");
  });
});
afterAll(() => {
  process.env = environment;
});
it("verifies the issuing app, management grant, customer ownership and phone membership", async () => {
  await expect(AssertMetaSignupAssetsService(request)).resolves.toEqual({
    businessId: "333",
    tokenExpiresAt: null
  });
  expect(get).toHaveBeenNthCalledWith(1, "/debug_token", {
    headers: { Authorization: "Bearer 123|secret" },
    params: { input_token: "customer-token" }
  });
  expect(get).toHaveBeenLastCalledWith(
    "/111/phone_numbers",
    expect.objectContaining({
      headers: { Authorization: "Bearer customer-token" }
    })
  );
});
it.each([
  { is_valid: false },
  { app_id: "999" },
  { scopes: ["whatsapp_business_management"] },
  { granular_scopes: [] },
  {
    granular_scopes: [
      { scope: "whatsapp_business_management", target_ids: ["999"] }
    ]
  },
  { expires_at: 1 },
  { data_access_expires_at: 1 }
])("rejects an invalid or ungranted token %j", async override => {
  get.mockResolvedValueOnce({ data: { data: { ...token(), ...override } } });
  await expect(AssertMetaSignupAssetsService(request)).rejects.toMatchObject({
    message: "ERR_META_ASSETS_NOT_AUTHORIZED"
  });
  expect(get).toHaveBeenCalledTimes(1);
});
it("does not accept a phone merely because its token can access some WABA", async () => {
  get
    .mockResolvedValueOnce({ data: { data: token() } })
    .mockResolvedValueOnce({
      data: { id: "111", owner_business_info: { id: "333" } }
    })
    .mockResolvedValueOnce({ data: { data: [{ id: "999" }] } });
  await expect(AssertMetaSignupAssetsService(request)).rejects.toMatchObject({
    message: "ERR_META_ASSETS_NOT_AUTHORIZED"
  });
});
it("rejects a browser business ID different from the owner returned by Meta", async () => {
  await expect(
    AssertMetaSignupAssetsService({ ...request, businessId: "999" })
  ).rejects.toMatchObject({ message: "ERR_META_ASSETS_NOT_AUTHORIZED" });
  expect(get).toHaveBeenCalledTimes(2);
});
it("uses a paginated phone cursor without following an untrusted URL", async () => {
  get
    .mockResolvedValueOnce({ data: { data: token() } })
    .mockResolvedValueOnce({
      data: { id: "111", owner_business_info: { id: "333" } }
    })
    .mockResolvedValueOnce({
      data: {
        data: [],
        paging: {
          next: "https://untrusted.example/steal",
          cursors: { after: "next" }
        }
      }
    })
    .mockResolvedValueOnce({ data: { data: [{ id: "222" }] } });
  await expect(AssertMetaSignupAssetsService(request)).resolves.toMatchObject({
    businessId: "333"
  });
  expect(get).toHaveBeenLastCalledWith(
    "/111/phone_numbers",
    expect.objectContaining({
      params: { fields: "id", limit: 100, after: "next" }
    })
  );
});
it("sanitizes unexpected upstream failures", async () => {
  get.mockRejectedValue(new Error("customer-token secret"));
  await expect(AssertMetaSignupAssetsService(request)).rejects.toMatchObject({
    message: "ERR_META_ASSET_VERIFICATION_FAILED"
  });
});
it("rejects path injection before any request", async () => {
  await expect(
    AssertMetaSignupAssetsService({ ...request, wabaId: "111/extendedcredits" })
  ).rejects.toMatchObject({ message: "ERR_META_ASSETS_NOT_AUTHORIZED" });
  expect(get).not.toHaveBeenCalled();
});

it("does not persist browser ownership when Meta omits optional owner information", async () => {
  get
    .mockResolvedValueOnce({ data: { data: token() } })
    .mockResolvedValueOnce({ data: { id: "111" } });
  await expect(AssertMetaSignupAssetsService(request)).resolves.toMatchObject({
    businessId: null
  });
});
it("normalizes configured app credentials before inspecting the grant", async () => {
  process.env.META_APP_ID = " 123 ";
  process.env.META_APP_SECRET = " secret ";
  await expect(AssertMetaSignupAssetsService(request)).resolves.toMatchObject({
    businessId: "333"
  });
  expect(get).toHaveBeenNthCalledWith(
    1,
    "/debug_token",
    expect.objectContaining({ headers: { Authorization: "Bearer 123|secret" } })
  );
});
