import {
  isBrandingKey,
  removerArquivoBranding
} from "../../helpers/brandingFiles";
import AppError from "../../errors/AppError";
import validateLoginBranding from "../../helpers/validateLoginBranding";
import { getIO } from "../../libs/socket";
import Setting from "../../models/Setting";
import { updateDefaultLanguage } from "../TranslationServices/i18nService";
import { safeSettingsKeys } from "./GetSettingService";

interface Request {
  key: string;
  value: string;
  companyId: number;
  arquivoNovo?: boolean;
}

const UpdateSettingService = async ({
  key,
  value,
  companyId,
  arquivoNovo = false
}: Request): Promise<Setting | undefined> => {
  validateLoginBranding(key, value);
  let anterior: string;
  const persistir = async transaction => {
    const [setting] = await Setting.findOrCreate({
      where: {
        key,
        companyId
      },
      defaults: { key, value, companyId },
      transaction
    });
    if (setting != null && setting?.companyId !== companyId) {
      throw new AppError("Não é possível consultar registros de outra empresa");
    }

    if (!setting) {
      throw new AppError("ERR_NO_SETTING_FOUND", 404);
    }

    await setting.reload({ transaction, lock: transaction.LOCK.UPDATE });
    anterior = setting.value;
    await setting.update({ value }, { transaction });
    return setting;
  };
  let setting: Setting;
  try {
    setting = await Setting.sequelize.transaction(persistir);
  } catch (erro) {
    if (arquivoNovo) await removerArquivoBranding(companyId, key, value);
    throw erro;
  }
  if (
    isBrandingKey(key) &&
    anterior &&
    anterior !== value &&
    !(await Setting.count({ where: { value: anterior } }))
  ) {
    await removerArquivoBranding(companyId, key, anterior);
  }

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
