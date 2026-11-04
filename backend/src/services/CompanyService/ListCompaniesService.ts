import { Sequelize, Op } from "sequelize";
import Company from "../../models/Company";

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
          Sequelize.fn("LOWER", Sequelize.col("name")),
          "LIKE",
          searchQuery
        )
      },
      {
        phone: Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("phone")),
          "LIKE",
          searchQuery
        )
      },
      {
        email: Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("email")),
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
