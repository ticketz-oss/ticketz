import { Sequelize, Op, Filterable } from "sequelize";
import Plan from "../../models/Plan";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  listPublic?: string;
}

interface Response {
  plans: Plan[];
  count: number;
  hasMore: boolean;
}

const ListPlansService = async ({
  searchParam = "",
  pageNumber = "1",
  listPublic
}: Request): Promise<Response> => {
  let whereCondition: Filterable["where"] = {
    [Op.or]: [
      {
        name: Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("name")),
          "LIKE",
          `%${searchParam.toLowerCase().trim()}%`
        )
      }
    ]
  };
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  if (listPublic === "false") {
    whereCondition = {
      ...whereCondition,
      isPublic: false
    };
  }

  const { count, rows: plans } = await Plan.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [["name", "ASC"]]
  });

  const hasMore = count > offset + plans.length;

  return {
    plans,
    count,
    hasMore
  };
};

export default ListPlansService;
