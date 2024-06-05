import Setting from "../../models/Setting";

interface Request {
  key: string;
}

const GetSuperSettingService = async ({
  key
}: Request): Promise<string | undefined> => {
  
  if (!key.startsWith("_")) {
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

export default GetSuperSettingService;
