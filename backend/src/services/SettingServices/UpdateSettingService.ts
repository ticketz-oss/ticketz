import AppError from "../../errors/AppError";
import { getIO } from "../../libs/socket";
import Setting from "../../models/Setting";
import { updateDefaultLanguage } from "../TranslationServices/i18nService";
import { safeSettingsKeys } from "./GetSettingService";

interface Request {
  key: string;
  value: string;
  companyId: number;
}

const UpdateSettingService = async ({
  key,
  value,
  companyId
}: Request): Promise<Setting | undefined> => {
  const [setting] = await Setting.findOrCreate({
    where: {
      key,
      companyId
    },
    defaults: {
      key,
      value,
      companyId
    }
  });

  if (setting != null && setting?.companyId !== companyId) {
    throw new AppError("Não é possível consultar registros de outra empresa");
  }

  if (!setting) {
    throw new AppError("ERR_NO_SETTING_FOUND", 404);
  }

  await setting.update({ value });

  if (setting.key === "defaultLanguage" && companyId === 1) {
    updateDefaultLanguage(value);
  }

  if (setting.key in safeSettingsKeys) {
    const io = getIO();
    io.to(`company-${companyId}-mainchannel`).emit("settings", {
      key: setting.key,
      value: setting.value
    });
  }

  return setting;
};

export default UpdateSettingService;
