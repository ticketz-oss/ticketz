import AppError from "../../errors/AppError";
import { getWbot } from "../../libs/wbot";
import { logger } from "../../utils/logger";
import ShowPrivacyService from "./ShowPrivacyService";

interface Request {
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

const UpdatePrivacyWhatsapp = async (
  whatsappId: number,
  privacySettings: Request,
  update = false
): Promise<boolean> => {
  let privacy = null;
  try {
    privacy = await ShowPrivacyService(whatsappId);
    if (privacy) {
      if (update) {
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

        if (privacy.disappearing !== privacySettings.disappearing)
          wbot.updateDefaultDisappearingMode(
            parseInt(privacySettings.disappearing, 10)
          );
      }
    }
  } catch (err) {
    logger.error(err);
    throw new AppError("ERR_NOT_ACCEPTABLE", 406);
  }
  return true;
};
export default UpdatePrivacyWhatsapp;
