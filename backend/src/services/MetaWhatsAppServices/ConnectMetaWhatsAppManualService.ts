import { clearTicketTemplatesCache } from "./ListTicketTemplatesService";
import AssertMetaWabaRuntimeService from "./AssertMetaWabaRuntimeService";
import { Op } from "sequelize";
import { assertRuntimeCompany } from "../../helpers/tenantRuntime";
import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import { getIO } from "../../libs/socket";
import RegisterPhoneNumberService from "./RegisterPhoneNumberService";
import { SubscribeWabaWebhookService } from "./SubscribeWabaWebhookService";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";

interface Request {
  whatsappId: number;
  companyId: number;
  wabaId: string;
  phoneNumberId: string;
  accessToken: string;
  businessId?: string;
  pin?: string;
}

// Bypass temporario do Embedded Signup: recebe as credenciais da Cloud API
// ja prontas (App proprio do cliente, fora de um Provedor de Tecnologia) em
// vez de trocar um "code" - usado so enquanto a verificacao de negocio pra
// virar Tech Provider nao sai. Isso quebra deliberadamente a regra "nunca
// token colado manualmente" do Embedded Signup; por isso fica atras de
// isSuper, nao isAdmin.
const ConnectMetaWhatsAppManualService = async ({
  whatsappId,
  companyId,
  wabaId,
  phoneNumberId,
  accessToken,
  businessId,
  pin
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

  await AssertMetaWabaRuntimeService(wabaId, whatsappId);

  const linked = await Whatsapp.count({
    where: { metaPhoneNumberId: phoneNumberId, id: { [Op.ne]: whatsappId } }
  });
  if (linked > 0) throw new AppError("ERR_META_PHONE_ALREADY_CONNECTED", 409);

  await RegisterPhoneNumberService(phoneNumberId, accessToken, pin);
  await SubscribeWabaWebhookService(wabaId, accessToken);

  await whatsapp.update({
    metaWabaId: wabaId,
    metaPhoneNumberId: phoneNumberId,
    metaBusinessId: businessId || null,
    metaAccessToken: accessToken,
    metaTokenExpiresAt: null,
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

export default ConnectMetaWhatsAppManualService;
