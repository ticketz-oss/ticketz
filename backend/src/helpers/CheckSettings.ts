import Setting from "../models/Setting";
import AppError from "../errors/AppError";

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

export const GetCompanySetting = async (
  companyId: number,
  key: string,
  defaultValue: string = null
): Promise<string> => {
  const setting = await Setting.findOne({
    where: {
      companyId,
      key
    }
  });

  if (!setting && defaultValue === null) {
    throw new AppError("ERR_NO_SETTING_FOUND", 404);
  }

  return setting?.value || defaultValue;
};

export default CheckSettings;
