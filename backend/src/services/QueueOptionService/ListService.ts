import { WhereOptions } from "sequelize/types";
import { literal } from "sequelize";
import QueueOption from "../../models/QueueOption";

type QueueOptionFilter = {
  queueId: number;
  queueOptionId: number;
  parentId: number;
};

const ListService = async ({
  queueId,
  queueOptionId,
  parentId
}: QueueOptionFilter): Promise<QueueOption[]> => {
  const whereOptions: WhereOptions = {};

  if (queueId) {
    whereOptions.queueId = queueId;
  }

  if (queueOptionId) {
    whereOptions.id = queueOptionId;
  }

  if (parentId === -1) {
    whereOptions.parentId = null;
  }

  if (parentId > 0) {
    whereOptions.parentId = parentId;
  }

  const queueOptions = await QueueOption.findAll({
    where: whereOptions,
    // O editor navega um nivel por vez: precisa saber quantas respostas cada
    // opcao tem para mostrar o atalho de entrar na ramificacao.
    attributes: {
      include: [
        [
          literal(
            `(SELECT COUNT(*)::int FROM "QueueOptions" AS child
              WHERE child."parentId" = "QueueOption"."id")`
          ),
          "childrenCount"
        ]
      ]
    },
    order: [
      ["order", "ASC"],
      ["id", "ASC"]
    ]
  });

  return queueOptions;
};

export default ListService;
