import { Sequelize } from "sequelize";
import Help from "../../models/Help";
import HelpGroup from "../../models/HelpGroup";
import { HelpActor, manageableWhere } from "../HelpGroupServices/scope";

interface Request {
  searchParam?: string;
  groupId?: string;
  actor: HelpActor;
}

// Sem paginacao de proposito: a grade do super admin agrupa os conteudos por
// card e o arrasto reescreve a ordem da lista inteira — uma pagina parcial
// gravaria posicoes erradas nos conteudos que ficaram de fora.
const ListService = async ({
  searchParam = "",
  groupId,
  actor
}: Request): Promise<Help[]> => {
  const whereCondition: Record<string, unknown> = {};

  if (searchParam) {
    whereCondition.title = Sequelize.where(
      Sequelize.fn("LOWER", Sequelize.col("Help.title")),
      "LIKE",
      `%${searchParam.toLowerCase().trim()}%`
    );
  }

  if (groupId) {
    whereCondition.groupId = groupId;
  }

  const records = await Help.findAll({
    where: whereCondition,
    include: [
      {
        model: HelpGroup,
        as: "group",
        // required: o conteudo herda o escopo do card, entao filtrar o card
        // aqui e o que impede um admin de ver conteudo de outro tenant.
        required: true,
        where: manageableWhere(actor),
        attributes: [
          "id",
          "title",
          "icon",
          "audience",
          "order",
          "isGlobal",
          "adminOnly",
          "companyId"
        ]
      }
    ],
    order: [
      [{ model: HelpGroup, as: "group" }, "audience", "ASC"],
      [{ model: HelpGroup, as: "group" }, "isGlobal", "DESC"],
      [{ model: HelpGroup, as: "group" }, "order", "ASC"],
      ["order", "ASC"],
      ["id", "ASC"]
    ]
  });

  return records;
};

export default ListService;
