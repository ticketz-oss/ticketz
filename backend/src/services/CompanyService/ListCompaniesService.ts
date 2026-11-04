import { Sequelize, Op } from "sequelize";
import Company from "../../models/Company";
import Plan from "../../models/Plan";

interface Request {
  searchParam?: string;
  pageNumber?: string;
}

interface Response {
  companies: Company[];
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
    include: [{ model: Plan, as: "plan", attributes: ["id", "name", "value"] }],
    limit,
    offset,
    order: [["name", "ASC"]]
  });

  const hasMore = count > offset + companies.length;

  return {
    companies,
    count,
    hasMore
  };
};

export default ListCompaniesService;
