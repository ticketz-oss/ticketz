import { getIO } from "../../libs/socket";
import Whatsapp from "../../models/Whatsapp";

export function sendWhatsappUpdate(whatsapp: Whatsapp) {
  const { id, name, channel, status, qrcode, isDefault, updatedAt } = whatsapp;

  const io = getIO();
  io.to(`company-${whatsapp.companyId}-admin`).emit(
    `company-${whatsapp.companyId}-whatsapp`,
    {
      action: "update",
      whatsapp: {
        id,
        name,
        channel,
        status,
        qrcode,
        isDefault,
        updatedAt
      }
    }
  );
}
