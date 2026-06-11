import { Sequelize, Op } from "sequelize";
import Queue from "../../models/Queue";
import Company from "../../models/Company";
import User from "../../models/User";

interface Request {
  searchParam?: string;
  pageNumber?: string | number;
  profile?: string;
  companyId?: number;
}

interface Response {
  users: User[];
  count: number;
  hasMore: boolean;
}

const ListUsersService = async ({
  searchParam = "",
  pageNumber = "1",
  companyId
}: Request): Promise<Response> => {
  const whereCondition = {
    [Op.or]: [
      {
        "$User.name$": Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("User.name")),
          "LIKE",
          `%${searchParam.toLowerCase()}%`
        )
      },
      { email: { [Op.like]: `%${searchParam.toLowerCase()}%` } }
    ],
    companyId: {
      [Op.eq]: companyId
    }
  };

  const parsedPageNumber = +pageNumber;

  if (parsedPageNumber > 1) {
    return {
      users: [],
      count: 0,
      hasMore: false
    };
  }

  const users = await User.findAll({
    where: whereCondition,
    attributes: ["name", "id", "email", "companyId", "profile", "createdAt"],
    order: [["createdAt", "DESC"]],
    include: [
      { model: Queue, as: "queues", attributes: ["id", "name", "color"] },
      { model: Company, as: "company", attributes: ["id", "name"] }
    ]
  });

  return {
    users,
    count: users.length,
    hasMore: false
  };
};

export default ListUsersService;
