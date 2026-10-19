import { getIO } from "../../libs/socket";
import GetWhatsappConnectionNumber from "../../helpers/GetWhatsappConnectionNumber";
import Whatsapp from "../../models/Whatsapp";

export function sendWhatsappUpdate(whatsapp: Whatsapp) {
  const {
    id,
    name,
    channel,
    status,
    qrcode,
    isDefault,
    updatedAt,
    apiMode,
    metaHealthStatus,
    metaPhoneNumberId
  } = whatsapp;

  const io = getIO();
  io.to(`company-${whatsapp.companyId}-admin`).emit(
    `company-${whatsapp.companyId}-whatsapp`,
    {
      action: "update",
      whatsapp: {
        id,
        name,
        number: GetWhatsappConnectionNumber(whatsapp.session),
        channel,
        status,
        qrcode,
        isDefault,
        updatedAt,
        apiMode,
        metaHealthStatus,
        metaPhoneNumberId
      }
    }
  );
}
