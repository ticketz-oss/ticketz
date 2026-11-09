import { getIO } from "../../libs/socket";
import { getConnectedNumber } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";

interface WhatsappUpdateData {
  id: number;
  name: string;
  channel: string;
  status: string;
  qrcode: string;
  isDefault: boolean;
  updatedAt: Date;
  connectedNumber?: string;
}

export function sendWhatsappUpdate(whatsapp: Whatsapp) {
  const { id, name, channel, status, qrcode, isDefault, updatedAt } = whatsapp;

  const whatsappData: WhatsappUpdateData = {
    id,
    name,
    channel,
    status,
    qrcode,
    isDefault,
    updatedAt
  };

  if (channel === "whatsapp" && status === "CONNECTED") {
    whatsappData.connectedNumber = getConnectedNumber(id);
  }

  const io = getIO();
  io.to(`company-${whatsapp.companyId}-admin`).emit(
    `company-${whatsapp.companyId}-whatsapp`,
    {
      action: "update",
      whatsapp: whatsappData
    }
  );
}
