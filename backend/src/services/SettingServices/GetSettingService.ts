import Setting from "../../models/Setting";

interface Request {
  key: string;
  companyId: number;
}

const GetSettingService = async ({
  key,
  companyId
}: Request): Promise<string | undefined> => {
  const setting = await Setting.findOne({
    where: {
      companyId,
      key
    }
  });

  return setting?.value;
};

export default GetSettingService;
