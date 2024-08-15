import {
  WAPrivacyCallValue,
  WAPrivacyGroupAddValue,
  WAPrivacyOnlineValue,
  WAPrivacyValue,
  WAReadReceiptsValue
} from "@whiskeysockets/baileys";
import AppError from "../../errors/AppError";
import { getWbot } from "../../libs/wbot";

interface PrivacyData {
  readreceipts?: WAReadReceiptsValue;
  profile?: WAPrivacyValue;
  status?: WAPrivacyValue;
  online?: WAPrivacyOnlineValue;
  last?: WAPrivacyValue;
  groupadd?: WAPrivacyGroupAddValue;
  calladd?: WAPrivacyCallValue;
  // disappearing?: '86400' | '604800' | '7776000' | '0';
}

const ShowPrivacyService = async (
  whatsappId: number | string
): Promise<PrivacyData> => {
  if (typeof whatsappId === "string") {
    whatsappId = parseInt(whatsappId, 10);
  }
  const wbot = getWbot(whatsappId);
  const privacy: PrivacyData = await wbot.fetchPrivacySettings(true);

  if (!privacy) {
    throw new AppError("ERR_NO_PRIVACY_FOUND", 404);
  }

  return privacy;
};

export default ShowPrivacyService;
