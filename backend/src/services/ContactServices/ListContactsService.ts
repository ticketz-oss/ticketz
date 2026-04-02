import { Sequelize, Op, Includeable } from "sequelize";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";

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

  const includeCondition: Includeable[] = [
    {
      model: ContactCustomField,
      as: "extraInfo",
      attributes: ["id", "name", "value"],
      required: false
    },
    "tags"
  ];

  const orConditions: any[] = [
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
  ];

  if (normalizedSearchParam) {
    orConditions.push({
      "$extraInfo.value$": Sequelize.where(
        Sequelize.fn("LOWER", Sequelize.col("extraInfo.value")),
        { [Op.like]: `%${normalizedSearchParam}%` }
      )
    });
    orConditions.push({
      "$extraInfo.name$": Sequelize.where(
        Sequelize.fn("LOWER", Sequelize.col("extraInfo.name")),
        { [Op.like]: `%${normalizedSearchParam}%` }
      )
    });
  }

  const whereCondition: any = {
    [Op.or]: orConditions,
    companyId: {
      [Op.eq]: companyId
    }
  };

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: contacts } = await Contact.findAndCountAll({
    where: whereCondition,
    include: includeCondition,
    limit,
    offset,
    order: [[Sequelize.col("Contact.name"), "ASC"]],
    distinct: true,
    col: "id",
    subQuery: false
  });

  const hasMore = count > offset + contacts.length;

  return {
    contacts,
    count,
    hasMore
  };
};

export default ListContactsService;
