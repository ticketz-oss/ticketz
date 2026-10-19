import { literal } from "sequelize";
import Queue from "../../models/Queue";

interface Request {
  companyId: number;
}

const ListQueuesService = async ({ companyId }: Request): Promise<Queue[]> => {
  const queues = await Queue.findAll({
    where: {
      companyId
    },
    // A listagem mostra quantas opcoes de chatbot a fila tem no menu inicial.
    attributes: {
      include: [
        [
          literal(
            `(SELECT COUNT(*)::int FROM "QueueOptions" AS opt
              WHERE opt."queueId" = "Queue"."id" AND opt."parentId" IS NULL)`
          ),
          "optionsCount"
        ]
      ]
    },
    order: [
      ["order", "ASC"],
      ["name", "ASC"]
    ]
  });

  return queues;
};

export default ListQueuesService;
