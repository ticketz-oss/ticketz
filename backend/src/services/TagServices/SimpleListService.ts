import { Op, Sequelize } from "sequelize";
import Tag from "../../models/Tag";
import Ticket from "../../models/Ticket";
import TicketTag from "../../models/TicketTag";

interface Request {
  companyId: number;
  searchParam?: string;
  kanban?: number;
}

const ListService = async ({
  companyId,
  searchParam,
  kanban = 0
}: Request): Promise<Tag[]> => {
  let whereCondition = {};

  if (searchParam) {
    whereCondition = {
      [Op.or]: [
        { name: { [Op.like]: `%${searchParam}%` } },
        { color: { [Op.like]: `%${searchParam}%` } }
      ]
    };
  }

  const tags = await Tag.findAll({
    where: { ...whereCondition, companyId, kanban  },
    order: [["name", "ASC"]]
  });

  return tags;
};

export default ListService;
