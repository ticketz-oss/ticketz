import AppError from "../../errors/AppError";
import { assertRuntimeCompany } from "../../helpers/tenantRuntime";
import Whatsapp from "../../models/Whatsapp";

const GetMetaOnboardingStatusService = async (
  whatsappId: string,
  companyId: number
) => {
  assertRuntimeCompany(companyId);
  const whatsapp = await Whatsapp.findOne({
    where: { id: whatsappId, companyId },
    attributes: ["id", "apiMode", "status", "metaWabaId", "metaPhoneNumberId"]
  });
  if (!whatsapp) throw new AppError("ERR_NO_WAPP_FOUND", 404);
  if (whatsapp.apiMode !== "official") {
    throw new AppError("ERR_WAPP_NOT_OFFICIAL_MODE", 400);
  }

  return {
    connectionStatus: whatsapp.status,
    billingMode: "direct" as const,
    // Connection and API permissions do not attest to a customer's payment
    // instrument. Payment details stay with Meta, outside this application.
    billingStatus: "unverified" as const,
    billingManagementUrl: whatsapp.metaWabaId
      ? "https://business.facebook.com/billing_hub/"
      : null,
    wabaId: whatsapp.metaWabaId || null,
    phoneNumberId: whatsapp.metaPhoneNumberId || null
  };
};

export default GetMetaOnboardingStatusService;
