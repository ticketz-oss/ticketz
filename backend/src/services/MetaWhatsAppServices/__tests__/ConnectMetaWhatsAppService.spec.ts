import AssertMetaSignupAssetsService from "../AssertMetaSignupAssetsService";
import { clearTicketTemplatesCache } from "../ListTicketTemplatesService";
import Whatsapp from "../../../models/Whatsapp";
import ConnectMetaWhatsAppService from "../ConnectMetaWhatsAppService";
import ExchangeEmbeddedSignupCodeService from "../ExchangeEmbeddedSignupCodeService";
import RegisterPhoneNumberService from "../RegisterPhoneNumberService";
import AssertMetaWabaRuntimeService from "../AssertMetaWabaRuntimeService";
import { SubscribeWabaWebhookService } from "../SubscribeWabaWebhookService";
import ShowWhatsAppService from "../../WhatsappService/ShowWhatsAppService";

jest.mock("../../../models/Whatsapp");
jest.mock("../AssertMetaSignupAssetsService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../ListTicketTemplatesService", () => ({
  clearTicketTemplatesCache: jest.fn()
}));
jest.mock("../ExchangeEmbeddedSignupCodeService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../RegisterPhoneNumberService", () => ({
  ...jest.requireActual("../RegisterPhoneNumberService"),
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../AssertMetaWabaRuntimeService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../SubscribeWabaWebhookService", () => ({
  SubscribeWabaWebhookService: jest.fn()
}));
jest.mock("../../WhatsappService/ShowWhatsAppService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../../../libs/socket", () => ({
  getIO: () => ({ to: () => ({ emit: jest.fn() }) })
}));

const request = {
  whatsappId: 9,
  companyId: 2,
  code: "code",
  wabaId: "111",
  phoneNumberId: "222",
  pin: "012345"
};
const update = jest.fn();
const originalEncryptionKey = process.env.ENCRYPTION_KEY;
beforeEach(() => {
  jest.clearAllMocks();
  process.env.ENCRYPTION_KEY = "a".repeat(64);
  (AssertMetaSignupAssetsService as jest.Mock).mockResolvedValue({
    businessId: "333",
    tokenExpiresAt: null
  });
  (Whatsapp.findOne as jest.Mock).mockResolvedValue({
    id: 9,
    apiMode: "official",
    update
  });
  (Whatsapp.count as jest.Mock).mockResolvedValue(0);
  (ExchangeEmbeddedSignupCodeService as jest.Mock).mockResolvedValue({
    accessToken: "private-token",
    expiresInSeconds: null
  });
  (ShowWhatsAppService as jest.Mock).mockResolvedValue({
    id: 9,
    status: "CONNECTED"
  });
});
afterAll(() => {
  if (originalEncryptionKey === undefined) delete process.env.ENCRYPTION_KEY;
  else process.env.ENCRYPTION_KEY = originalEncryptionKey;
});

it("passes the admin's PIN to Meta without persisting it", async () => {
  await ConnectMetaWhatsAppService(request);
  expect(AssertMetaWabaRuntimeService).toHaveBeenCalledWith("111", 9);
  expect(clearTicketTemplatesCache).toHaveBeenCalledWith(9);
  expect(RegisterPhoneNumberService).toHaveBeenCalledWith(
    "222",
    "private-token",
    "012345"
  );
  expect(update).toHaveBeenCalledWith(
    expect.objectContaining({ status: "CONNECTED" })
  );
  expect(update.mock.calls[0][0]).not.toHaveProperty("pin");
});

it.each([undefined, "12345", "abcdef", 123456])(
  "rejects invalid PIN %s before exchanging the code",
  async pin => {
    await expect(
      ConnectMetaWhatsAppService({ ...request, pin } as never)
    ).rejects.toMatchObject({ message: "ERR_META_INVALID_REGISTRATION_PIN" });
    expect(ExchangeEmbeddedSignupCodeService).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  }
);

it("never marks the connection ready when registration fails", async () => {
  (RegisterPhoneNumberService as jest.Mock).mockRejectedValueOnce(
    new Error("register failed")
  );
  await expect(ConnectMetaWhatsAppService(request)).rejects.toThrow(
    "register failed"
  );
  expect(SubscribeWabaWebhookService).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});

it("does not register, subscribe or persist when assets cannot be verified", async () => {
  (AssertMetaSignupAssetsService as jest.Mock).mockRejectedValueOnce(
    new Error("verification failed")
  );
  await expect(ConnectMetaWhatsAppService(request)).rejects.toThrow(
    "verification failed"
  );
  expect(RegisterPhoneNumberService).not.toHaveBeenCalled();
  expect(SubscribeWabaWebhookService).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});
it("persists server-verified ownership and earliest expiry instead of browser data", async () => {
  const expiresAt = new Date(Date.now() + 60000);
  (AssertMetaSignupAssetsService as jest.Mock).mockResolvedValueOnce({
    businessId: "333",
    tokenExpiresAt: expiresAt
  });
  (ExchangeEmbeddedSignupCodeService as jest.Mock).mockResolvedValueOnce({
    accessToken: "private-token",
    expiresInSeconds: 3600
  });
  await ConnectMetaWhatsAppService({ ...request, businessId: "333" });
  expect(update).toHaveBeenCalledWith(
    expect.objectContaining({
      metaBusinessId: "333",
      metaTokenExpiresAt: expiresAt
    })
  );
  expect(AssertMetaSignupAssetsService).toHaveBeenCalledWith(
    expect.objectContaining({
      accessToken: "private-token",
      wabaId: "111",
      phoneNumberId: "222"
    })
  );
  expect(
    (AssertMetaSignupAssetsService as jest.Mock).mock.invocationCallOrder[0]
  ).toBeLessThan(
    (RegisterPhoneNumberService as jest.Mock).mock.invocationCallOrder[0]
  );
});
