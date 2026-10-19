import AssertMetaSignupAssetsService from "./AssertMetaSignupAssetsService";
import { clearTicketTemplatesCache } from "./ListTicketTemplatesService";
import AssertMetaWabaRuntimeService from "./AssertMetaWabaRuntimeService";
import { Op } from "sequelize";
import { assertRuntimeCompany } from "../../helpers/tenantRuntime";
import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import { getIO } from "../../libs/socket";
import ExchangeEmbeddedSignupCodeService from "./ExchangeEmbeddedSignupCodeService";
import RegisterPhoneNumberService, {
  assertMetaRegistrationPin
} from "./RegisterPhoneNumberService";
import { SubscribeWabaWebhookService } from "./SubscribeWabaWebhookService";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";

interface Request {
  whatsappId: number;
  companyId: number;
  code: string;
  pin: string;
  wabaId: string;
  phoneNumberId: string;
  businessId?: string;
}

// Orquestra o fluxo de Embedded Signup: troca o "code" por token, registra
// o numero na Cloud API e assina o webhook do WABA. So pode ser chamado numa
// conexao que ja pertence a uma empresa em modo "meta" (garantido pelo
// controller, que carrega a connection via ShowWhatsAppService e confere
// company.whatsappMode antes de chegar aqui).
const ConnectMetaWhatsAppService = async ({
  whatsappId,
  companyId,
  code,
  pin,
  wabaId,
  phoneNumberId,
  businessId
}: Request): Promise<Whatsapp> => {
  assertRuntimeCompany(companyId);
  const whatsapp = await Whatsapp.findOne({
    where: { id: whatsappId, companyId }
  });

  if (!whatsapp) {
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  if (whatsapp.apiMode !== "official") {
    throw new AppError("ERR_WAPP_NOT_OFFICIAL_MODE", 400);
  }

  if (!process.env.ENCRYPTION_KEY)
    throw new AppError("ERR_META_APP_NOT_CONFIGURED", 500);

  const registrationPin = assertMetaRegistrationPin(pin);
  await AssertMetaWabaRuntimeService(wabaId, whatsappId);

  const linked = await Whatsapp.count({
    where: { metaPhoneNumberId: phoneNumberId, id: { [Op.ne]: whatsappId } }
  });
  if (linked > 0) throw new AppError("ERR_META_PHONE_ALREADY_CONNECTED", 409);

  const { accessToken, expiresInSeconds } =
    await ExchangeEmbeddedSignupCodeService(code);

  const verifiedAssets = await AssertMetaSignupAssetsService({
    accessToken,
    wabaId,
    phoneNumberId,
    businessId
  });
  const exchangeExpiry = expiresInSeconds
    ? new Date(Date.now() + expiresInSeconds * 1000)
    : null;
  const tokenExpiry =
    [exchangeExpiry, verifiedAssets.tokenExpiresAt]
      .filter((value): value is Date => value !== null)
      .sort((left, right) => left.getTime() - right.getTime())[0] || null;

  await RegisterPhoneNumberService(phoneNumberId, accessToken, registrationPin);
  await SubscribeWabaWebhookService(wabaId, accessToken);

  await whatsapp.update({
    metaWabaId: wabaId,
    metaPhoneNumberId: phoneNumberId,
    metaBusinessId: verifiedAssets.businessId,
    metaAccessToken: accessToken,
    metaTokenExpiresAt: tokenExpiry,
    metaWebhookVerifiedAt: new Date(),
    status: "CONNECTED"
  });

  clearTicketTemplatesCache(whatsapp.id);
  const sanitized = await ShowWhatsAppService(whatsapp.id);

  const io = getIO();
  io.to(`company-${companyId}-admin`).emit(
    `company-${companyId}-whatsappSession`,
    { action: "update", session: sanitized }
  );

  return sanitized;
};

export default ConnectMetaWhatsAppService;
