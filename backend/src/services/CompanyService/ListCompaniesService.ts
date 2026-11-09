import { Sequelize, Op } from "sequelize";
import Company from "../../models/Company";
import Plan from "../../models/Plan";
import Setting from "../../models/Setting";
import { GetCompanySetting } from "../../helpers/CheckSettings";

interface Request {
  searchParam?: string;
  pageNumber?: string;
}

interface CompanyWithStatus extends ReturnType<
  typeof Company.prototype.toJSON
> {
  subscriptionStatus: string;
}

interface Response {
  companies: CompanyWithStatus[];
  count: number;
  hasMore: boolean;
}

const ListCompaniesService = async ({
  searchParam = "",
  pageNumber = "1"
}: Request): Promise<Response> => {
  const searchQuery = `%${searchParam.toLowerCase().trim()}%`;
  const whereCondition = {
    [Op.or]: [
      {
        name: Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("Company.name")),
          "LIKE",
          searchQuery
        )
      },
      {
        phone: Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("Company.phone")),
          "LIKE",
          searchQuery
        )
      },
      {
        email: Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("Company.email")),
          "LIKE",
          searchQuery
        )
      }
    ]
  };
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: companies } = await Company.findAndCountAll({
    where: whereCondition,
    include: [
      { model: Plan, as: "plan", attributes: ["id", "name", "value"] },
      { model: Setting, as: "settings", attributes: ["key", "value"] }
    ],
    limit,
    offset,
    order: [["name", "ASC"]]
  });

  const hasMore = count > offset + companies.length;

  const gracePeriod =
    Number(await GetCompanySetting(1, "gracePeriod", "5")) || 5;

  const companiesWithStatus = companies.map(company => {
    const companyData = company.toJSON();
    let subscriptionStatus = "active";

    if (company.dueDate) {
      const now = new Date();
      const dueDate = new Date(company.dueDate);
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < -gracePeriod) {
        subscriptionStatus = "inactive";
      } else if (diffDays < 0) {
        subscriptionStatus = "gracePeriod";
      } else if (diffDays < 7) {
        subscriptionStatus = "almostDue";
      }
    }

    return {
      ...companyData,
      subscriptionStatus
    };
  });

  return {
    companies: companiesWithStatus,
    count,
    hasMore
  };
};

export default ListCompaniesService;
