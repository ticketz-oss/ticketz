import { getWbot } from "../../libs/wbot";
import { logger } from "../../utils/logger";
import ShowPrivacyService from "./ShowPrivacyService";

interface Request {
  readreceipts?: 'all' | 'none';
  profile?: 'all' | 'contacts' | 'contact_blacklist' | 'none';
  status?: 'all' | 'contacts' | 'contact_blacklist' | 'none';
  online?: 'all' | 'match_last_seen';
  last?: 'all' | 'contacts' | 'contact_blacklist' | 'none';
  groupadd?: 'all' | 'contacts' | 'contact_blacklist';
  calladd?: 'all' | 'known';
  disappearing?: '86400' | '604800' | '7776000' | '0'
  whatsappId?: number;
}

const UpdatePrivacyWhatsapp = async (whatsappId: number, privacySettings: Request, update: boolean = false): Promise<Request> => {
  try {
    const privacy: Request = await ShowPrivacyService(whatsappId);
    if(privacy) {
      if(update) {
        const wbot = getWbot(whatsappId);
        privacy.readreceipts !== privacySettings.readreceipts ? wbot.updateReadReceiptsPrivacy(privacySettings.readreceipts) : null;
        privacy.profile !== privacySettings.profile ? wbot.updateProfilePicturePrivacy(privacySettings.profile) : null;
        privacy.status !== privacySettings.status ? wbot.updateStatusPrivacy(privacySettings.status) : null;
        privacy.online !== privacySettings.online ? wbot.updateOnlinePrivacy(privacySettings.online) : null;
        privacy.last !== privacySettings.last ? wbot.updateLastSeenPrivacy(privacySettings.last) : null;
        privacy.groupadd !== privacySettings.groupadd ? wbot.updateGroupsAddPrivacy(privacySettings.groupadd) : null;
        // privacy.calladd !== privacySettings.calladd ? wbot.updateCallPrivacy(privacySettings.calladd) : null;
        // privacy.disappearing !== privacySettings.disappearing ? wbot.updateDefaultDisappearingMode(parseInt(privacySettings.disappearing)) : null;
      }

      return privacy;
    } else {
      return privacy;
    }
  } catch(err) {
    logger.error(err);
  }
}
export default UpdatePrivacyWhatsapp;
