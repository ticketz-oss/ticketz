import Setting from "../models/Setting";
import AppError from "../errors/AppError";
import { SimpleObjectCache } from "./simpleObjectCache";
import { logger } from "../utils/logger";

const settingCache = new SimpleObjectCache<string>(10000, logger);

export const invalidateCompanySettingCache = (
  companyId: number,
  key: string
): void => {
  settingCache.delete(`${companyId}-${key}`);
};

export const invalidateCompanySettingCacheByPrefix = (
  companyId: number,
  keyPrefix: string
): void => {
  settingCache.deleteByPrefix(`${companyId}-${keyPrefix}`);
};

const CheckSettings = async (
  key: string,
  defaultValue: string = null
): Promise<string> => {
  const setting = await GetCompanySetting(1, key, defaultValue, true);

  if (setting === null && defaultValue === null) {
    throw new AppError("ERR_NO_SETTING_FOUND", 404);
  }

  return setting;
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
  defaultValue: string = undefined,
  useCache = true
): Promise<string> => {
  if (useCache) {
    const cachedValue = settingCache.get<string>(`${companyId}-${key}`);
    if (cachedValue !== null) {
      return cachedValue;
    }
  }

  const setting = await Setting.findOne({
    where: {
      companyId,
      key
    }
  });

  if (!setting && defaultValue === undefined) {
    throw new AppError("ERR_NO_SETTING_FOUND", 404);
  }

  const settingValue = setting?.value || defaultValue || null;

  settingCache.set(`${companyId}-${key}`, settingValue);

  return settingValue;
};

export default CheckSettings;
