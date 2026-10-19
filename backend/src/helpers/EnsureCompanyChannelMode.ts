import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";
import { isCompanyAllowedForMetaMode } from "../config/metaAllowlist";

// Garante que uma empresa nunca fique com conexoes WhatsApp misturando os
// dois modos (Baileys nao-oficial e Cloud API oficial da Meta). Chamado
// sempre que o modo de uma empresa e decidido/travado.
export const assertCompanyCanUseMetaMode = async (
  companyId: number
): Promise<void> => {
  if (!isCompanyAllowedForMetaMode(companyId)) {
    throw new AppError("ERR_COMPANY_NOT_ALLOWED_FOR_META_MODE", 403);
  }

  const officialConnections = await Whatsapp.count({
    where: { companyId, apiMode: "official" }
  });
  const baileysConnections = await Whatsapp.count({
    where: { companyId, apiMode: "baileys", channel: "whatsapp" }
  });

  if (baileysConnections > 0 && officialConnections === 0) {
    throw new AppError("ERR_COMPANY_HAS_BAILEYS_CONNECTIONS", 409);
  }
};
