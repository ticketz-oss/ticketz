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
export const safeSettingsKeys = {
  groupsTab: "disabled",
  CheckMsgIsGroup: "disabled",
  soundGroupNotifications: "disabled",
  tagsMode: "ticket",
  // Branding keys: readable by any authenticated user so the per-company
  // theme (colors, logos, app name) applies to every user of the company,
  // not only admins. Empty default -> frontend falls back to its own defaults.
  primaryColorLight: "",
  primaryColorDark: "",
  appLogoLight: "",
  appLogoDark: "",
  appLogoFavicon: "",
  appName: ""
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
