import { Request, Response } from "express";
import * as controller from "../MetaWhatsAppController";
import ShowWhatsAppService from "../../services/WhatsappService/ShowWhatsAppService";
import ConnectMetaWhatsAppService from "../../services/MetaWhatsAppServices/ConnectMetaWhatsAppService";
import { assertMetaSignupConfigured } from "../../services/MetaWhatsAppServices/GetMetaSignupConfigService";

jest.mock("../../services/WhatsappService/ShowWhatsAppService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock(
  "../../services/MetaWhatsAppServices/ConnectMetaWhatsAppService",
  () => ({
    __esModule: true,
    default: jest.fn()
  })
);
jest.mock(
  "../../services/MetaWhatsAppServices/ConnectMetaWhatsAppManualService",
  () => ({ __esModule: true, default: jest.fn() })
);
jest.mock(
  "../../services/MetaWhatsAppServices/GetMetaOnboardingStatusService",
  () => ({ __esModule: true, default: jest.fn() })
);
jest.mock(
  "../../services/MetaWhatsAppServices/GetMetaSignupConfigService",
  () => ({
    assertMetaSignupConfigured: jest.fn(),
    getMetaSignupConfig: jest.fn()
  })
);

const body = {
  code: "signup-code",
  pin: "123456",
  wabaId: "111",
  phoneNumberId: "222"
};
const request = (data = body) =>
  ({
    params: { whatsappId: "9" },
    user: { companyId: 2 },
    body: data
  }) as unknown as Request;
const json = jest.fn();
const response = { status: jest.fn(() => ({ json })) } as unknown as Response;

beforeEach(() => {
  jest.resetAllMocks();
  (response.status as jest.Mock).mockReturnValue({ json });
  (ShowWhatsAppService as jest.Mock).mockResolvedValue({ companyId: 2 });
});

it("rejects another tenant's connection before token exchange or Meta mutations", async () => {
  (ShowWhatsAppService as jest.Mock).mockResolvedValue({ companyId: 3 });
  await expect(controller.connect(request(), response)).rejects.toMatchObject({
    statusCode: 403
  });
  expect(ConnectMetaWhatsAppService).not.toHaveBeenCalled();
});

it.each([
  { code: {} },
  { code: " " },
  { wabaId: ["111"] },
  { phoneNumberId: "222/phone_numbers" },
  { businessId: "invalid" }
])("rejects malformed signup data %j before any work", async overrides => {
  await expect(
    controller.connect(request({ ...body, ...overrides } as never), response)
  ).rejects.toMatchObject({ message: "ERR_META_CONNECT_MISSING_FIELDS" });
  expect(assertMetaSignupConfigured).not.toHaveBeenCalled();
  expect(ShowWhatsAppService).not.toHaveBeenCalled();
  expect(ConnectMetaWhatsAppService).not.toHaveBeenCalled();
});

it("stops partial platform setup before token exchange", async () => {
  (assertMetaSignupConfigured as jest.Mock).mockImplementationOnce(() => {
    throw { message: "ERR_META_APP_NOT_CONFIGURED", statusCode: 503 };
  });
  await expect(controller.connect(request(), response)).rejects.toMatchObject({
    statusCode: 503
  });
  expect(ConnectMetaWhatsAppService).not.toHaveBeenCalled();
});
