import { Op, WhereOptions } from "sequelize";
import Setting from "../../models/Setting";
import User from "../../models/User";

interface Request {
  isSuper: boolean,
  companyId: number;
}

const ListSettingsService = async ({
  isSuper, companyId
}: Request): Promise<Setting[] | undefined> => {
  const where: WhereOptions = { companyId };
  if (!isSuper) {
    where.key = {
      [Op.notLike]: "\\_%"
    }
  }
  
  const settings = await Setting.findAll({
    where
  });

  return settings;
};

export default ListSettingsService;
