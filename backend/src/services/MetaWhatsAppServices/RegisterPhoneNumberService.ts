import { getMetaGraphApiClient, withAuth } from "./MetaGraphApiClient";
import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";

export const assertMetaRegistrationPin = (pin: unknown): string => {
  if (typeof pin !== "string" || !/^\d{6}$/.test(pin)) {
    throw new AppError("ERR_META_INVALID_REGISTRATION_PIN", 400);
  }
  return pin;
};

// Registra o numero para uso na Cloud API (POST /{phoneNumberId}/register).
const RegisterPhoneNumberService = async (
  phoneNumberId: string,
  accessToken: string,
  pin?: string
): Promise<void> => {
  const registrationPin = assertMetaRegistrationPin(pin);
  const client = getMetaGraphApiClient();

  try {
    await client.post(
      `/${phoneNumberId}/register`,
      {
        messaging_product: "whatsapp",
        pin: registrationPin
      },
      withAuth(accessToken)
    );
  } catch (err) {
    logger.error(
      {
        phoneNumberId,
        status: err.response?.status,
        graphCode: err.response?.data?.error?.code
      },
      "Failed to register Meta phone number"
    );
    throw new AppError("ERR_META_PHONE_REGISTER_FAILED", 502);
  }
};

export default RegisterPhoneNumberService;
