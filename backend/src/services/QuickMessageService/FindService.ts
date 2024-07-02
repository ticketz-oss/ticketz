import { Op } from "sequelize";
import QuickMessage from "../../models/QuickMessage";
import Company from "../../models/Company";
import { GetCompanySetting } from "../../helpers/CheckSettings";

type Params = {
  companyId: number;
  userId: number;
};

type QuickMessageWhere = {
  companyId: number;
  userId?: number;
}

const FindService = async ({ companyId, userId }: Params): Promise<QuickMessage[]> => {
  const where: QuickMessageWhere = {
    companyId,
  } 

  const quickMessagesSetting = await GetCompanySetting(companyId, "quickMessages","individual"); 

  if (quickMessagesSetting === "individual") {
    where.userId = userId
  }
  
  const notes: QuickMessage[] = await QuickMessage.findAll({
    where,
    include: [{ model: Company, as: "company", attributes: ["id", "name"] }],
    order: [["shortcode", "ASC"]]
  });

  return notes;
};

export default FindService;
