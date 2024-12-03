import AppError from "../../errors/AppError";
import { getWbot } from "../../libs/wbot";

interface PrivacyData {
  readreceipts?: "all" | "none";
  profile?: "all" | "contacts" | "contact_blacklist" | "none";
  status?: "all" | "contacts" | "contact_blacklist" | "none";
  online?: "all" | "match_last_seen";
  last?: "all" | "contacts" | "contact_blacklist" | "none";
  groupadd?: "all" | "contacts" | "contact_blacklist";
  calladd?: "all" | "known";
  disappearing?: "86400" | "604800" | "7776000" | "0";
  whatsappId?: number;
}

const ShowPrivacyService = async (
  whatsappId: number | string
): Promise<PrivacyData> => {
  if (typeof whatsappId === "string") {
    whatsappId = parseInt(whatsappId, 10);
  }
  const wbot = getWbot(whatsappId);
  const privacy: PrivacyData = await wbot.fetchPrivacySettings();

  if (!privacy) {
    throw new AppError("ERR_NO_PRIVACY_FOUND", 404);
  }

  return privacy;
};

export default ShowPrivacyService;
