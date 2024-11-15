import AppError from "../../errors/AppError";
import Setting from "../../models/Setting";

interface Request {
  key: string;
  user: {
    profile: string;
    companyId: number;
  };
}

// keys that can be accessed by non-admin users
// with respective default values
const safeSettingsKeys = {
  groupsTab: "disabled",
  CheckMsgIsGroup: "disabled",
  soundGroupNotifications: "disabled"
};

export const GetSettingService = async ({
  key,
  user
}: Request): Promise<string> => {
  if (user.profile !== "admin" && !(key in safeSettingsKeys)) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const setting = await Setting.findOne({
    where: {
      companyId: user.companyId,
      key
    }
  });

  if (!setting && key in safeSettingsKeys) {
    return safeSettingsKeys[key];
  }

  return setting?.value || "";
};
