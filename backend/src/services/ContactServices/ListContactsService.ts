import { Sequelize, Op } from "sequelize";
import Contact from "../../models/Contact";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  companyId: number;
}

interface Response {
  contacts: Contact[];
  count: number;
  hasMore: boolean;
}

const ListContactsService = async ({
  searchParam = "",
  pageNumber = "1",
  companyId
}: Request): Promise<Response> => {
  const normalizedSearchParam = searchParam.toLowerCase().trim();
  const whereCondition = {
    [Op.or]: [
      {
        name: Sequelize.where(
          Sequelize.fn(
            "LOWER",
            Sequelize.fn("UNACCENT", Sequelize.col("Contact.name"))
          ),
          {
            [Op.like]: Sequelize.literal(
              `'%' || UNACCENT('${normalizedSearchParam}') || '%'`
            )
          }
        )
      },
      { number: { [Op.like]: `%${normalizedSearchParam}%` } }
    ],
    companyId: {
      [Op.eq]: companyId
    }
  };
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: contacts } = await Contact.findAndCountAll({
    where: whereCondition,
    include: ["tags"],
    limit,
    offset,
    order: [[Sequelize.col("Contact.name"), "ASC"]]
  });

  const hasMore = count > offset + contacts.length;

  return {
    contacts,
    count,
    hasMore
  };
};

export default ListContactsService;
