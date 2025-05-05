import Setting from "../models/Setting";
import AppError from "../errors/AppError";
import { SimpleObjectCache } from "./simpleObjectCache";
import { logger } from "../utils/logger";

const settingCache = new SimpleObjectCache(10000, logger);

const CheckSettings = async (
  key: string,
  defaultValue: string = null
): Promise<string> => {
  const setting = await Setting.findOne({
    where: {
      companyId: 1,
      key
    }
  });

  if (!setting && defaultValue === null) {
    throw new AppError("ERR_NO_SETTING_FOUND", 404);
  }

  return setting?.value || defaultValue;
};

/**
 * Get the company setting by key
 *
 * @param companyId - The ID of the company
 * @param key - The key of the setting
 * @param defaultValue - The default value to return if the setting is not found
 * @return The value of the setting or the default value
 */
export const GetCompanySetting = async (
  companyId: number,
  key: string,
  defaultValue: string = null,
  useCache = false
): Promise<string> => {
  if (useCache) {
    const cachedValue = settingCache.get(`${companyId}-${key}`);
    if (cachedValue) {
      return cachedValue;
    }
  }

  const setting = await Setting.findOne({
    where: {
      companyId,
      key
    }
  });

  if (!setting && defaultValue === null) {
    throw new AppError("ERR_NO_SETTING_FOUND", 404);
  }

  if (useCache) {
    settingCache.set(`${companyId}-${key}`, setting?.value || defaultValue);
  }

  return setting?.value || defaultValue;
};

export default CheckSettings;
