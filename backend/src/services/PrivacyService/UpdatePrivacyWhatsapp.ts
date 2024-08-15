import {
  WAPrivacyCallValue,
  WAPrivacyGroupAddValue,
  WAPrivacyOnlineValue,
  WAPrivacyValue,
  WAReadReceiptsValue
} from "@whiskeysockets/baileys";
import { getWbot } from "../../libs/wbot";
import { logger } from "../../utils/logger";
import ShowPrivacyService from "./ShowPrivacyService";

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

const UpdatePrivacyWhatsapp = async (
  whatsappId: number,
  privacySettings: PrivacyData
): Promise<PrivacyData> => {
  try {
    const privacy: PrivacyData = await ShowPrivacyService(whatsappId);
    if (privacy) {
      const wbot = getWbot(whatsappId);
      if (privacy.readreceipts !== privacySettings.readreceipts)
        wbot.updateReadReceiptsPrivacy(privacySettings.readreceipts);
      if (privacy.profile !== privacySettings.profile)
        wbot.updateProfilePicturePrivacy(privacySettings.profile);
      if (privacy.status !== privacySettings.status)
        wbot.updateStatusPrivacy(privacySettings.status);
      if (privacy.online !== privacySettings.online)
        wbot.updateOnlinePrivacy(privacySettings.online);
      if (privacy.last !== privacySettings.last)
        wbot.updateLastSeenPrivacy(privacySettings.last);
      if (privacy.groupadd !== privacySettings.groupadd)
        wbot.updateGroupsAddPrivacy(privacySettings.groupadd);
      if (privacy.calladd !== privacySettings.calladd)
        wbot.updateCallPrivacy(privacySettings.calladd);
      // privacy.disappearing !== privacySettings.disappearing ? wbot.updateDefaultDisappearingMode(parseInt(privacySettings.disappearing)) : null;
    }
    return privacy;
  } catch (err) {
    logger.error(err);
    return privacySettings;
  }
};
export default UpdatePrivacyWhatsapp;
