import Setting from "../../models/Setting";

interface Request {
  key: string;
}

const publicSettingsKeys = [
  "allowSignup",
  "primaryColorLight",
  "primaryColorDark",
  "appLogoLight",
  "appLogoDark",
  "appLogoFavicon",
  "appName"
]

const GetPublicSettingService = async ({
  key
}: Request): Promise<string | undefined> => {
  
  if (!publicSettingsKeys.includes(key)) {
    return null;
  }
  
  const setting = await Setting.findOne({
    where: {
      companyId: 1,
      key
    }
  });

  return setting?.value;
};

export default GetPublicSettingService;
