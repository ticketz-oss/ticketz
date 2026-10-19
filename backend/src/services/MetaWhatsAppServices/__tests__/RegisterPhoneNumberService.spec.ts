import { logger } from "../../../utils/logger";
import RegisterPhoneNumberService from "../RegisterPhoneNumberService";
import { getMetaGraphApiClient } from "../MetaGraphApiClient";

jest.mock("../MetaGraphApiClient", () => ({
  getMetaGraphApiClient: jest.fn(),
  withAuth: jest.fn(() => ({ headers: { Authorization: "redacted" } }))
}));
jest.mock("../../../utils/logger", () => ({
  logger: { error: jest.fn() }
}));

const post = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  (getMetaGraphApiClient as jest.Mock).mockReturnValue({ post });
});

it("registers successfully only when Graph accepts registration", async () => {
  post.mockResolvedValue({ data: { success: true } });
  await expect(
    RegisterPhoneNumberService("phone", "token", "123456")
  ).resolves.toBeUndefined();
  expect(post).toHaveBeenCalledWith(
    "/phone/register",
    { messaging_product: "whatsapp", pin: "123456" },
    expect.any(Object)
  );
});

it.each([133010, 133000, 190])(
  "rejects registration error %i instead of connecting",
  async graphCode => {
    post.mockRejectedValue({ graphCode });
    await expect(
      RegisterPhoneNumberService("phone", "token", "123456")
    ).rejects.toMatchObject({ message: "ERR_META_PHONE_REGISTER_FAILED" });
  }
);

it.each([undefined, null, "12345", "1234567", "abcdef", 123456])(
  "rejects invalid PIN %s before contacting Graph",
  async pin => {
    await expect(
      RegisterPhoneNumberService("phone", "token", pin as string)
    ).rejects.toMatchObject({ message: "ERR_META_INVALID_REGISTRATION_PIN" });
    expect(post).not.toHaveBeenCalled();
  }
);

it("does not log Axios credentials or the registration PIN on failure", async () => {
  post.mockRejectedValue({
    config: {
      data: { pin: "654321" },
      headers: { Authorization: "secret-token" }
    },
    response: { status: 400, data: { error: { code: 100 } } }
  });
  await expect(
    RegisterPhoneNumberService("phone", "secret-token", "654321")
  ).rejects.toMatchObject({ message: "ERR_META_PHONE_REGISTER_FAILED" });
  expect(logger.error).toHaveBeenCalledWith(
    { phoneNumberId: "phone", status: 400, graphCode: 100 },
    expect.any(String)
  );
});
