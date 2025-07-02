import { Op, WhereOptions } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import Tag from "../../models/Tag";
import TicketTag from "../../models/TicketTag";
import ContactTag from "../../models/ContactTag";
import sequelize from "../../database";

interface Request {
  companyId: number;
  searchParam?: string;
  pageNumber?: string | number;
}

interface Response {
  tags: Tag[];
  count: number;
  hasMore: boolean;
}

const ListService = async ({
  companyId,
  searchParam,
  pageNumber = "1"
}: Request): Promise<Response> => {
  let where: WhereOptions<Tag> = { companyId };
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  if (searchParam) {
    const searchPattern = `%${searchParam}%`;
    where = {
      companyId,
      [Op.and]: [
        Sequelize.literal(
          `immutable_unaccent(LOWER("name")) LIKE immutable_unaccent(LOWER(${sequelize.escape(
            searchPattern
          )}))`
        )
      ]
    };
  }

  const { count, rows: tags } = await Tag.findAndCountAll({
    where,
    limit,
    offset,
    order: [Sequelize.literal('immutable_unaccent(LOWER("name")) ASC')],
    include: [
      {
        model: TicketTag,
        as: "ticketTags",
        attributes: ["ticketId"],
        required: false
      },
      {
        model: ContactTag,
        as: "contactTags",
        attributes: ["contactId"],
        required: false
      }
    ],
    attributes: ["id", "name", "color", "ticketsCount", "contactsCount"]
  });

  const hasMore = count > offset + tags.length;

  return {
    tags,
    count,
    hasMore
  };
};

export default ListService;
