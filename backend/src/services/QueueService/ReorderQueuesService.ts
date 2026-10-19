import { Op } from "sequelize";
import sequelize from "../../database";
import Queue from "../../models/Queue";
import AppError from "../../errors/AppError";
import ListQueuesService from "./ListQueuesService";

interface ReorderItem {
  id: number;
  order: number;
}

interface Request {
  companyId: number;
  items: ReorderItem[];
}

/**
 * Define a ordem em que as filas aparecem no menu inicial do chatbot.
 */
const ReorderQueuesService = async ({
  companyId,
  items
}: Request): Promise<Queue[]> => {
  if (!Array.isArray(items) || !items.length) {
    throw new AppError("ERR_QUEUE_REORDER_EMPTY", 400);
  }

  const ids = items.map(item => Number(item.id)).filter(Number.isInteger);

  if (ids.length !== items.length) {
    throw new AppError("ERR_QUEUE_REORDER_INVALID", 400);
  }

  const queues = await Queue.findAll({
    where: { id: { [Op.in]: ids }, companyId }
  });

  if (queues.length !== ids.length) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const orderById = new Map(items.map(item => [Number(item.id), item.order]));

  await sequelize.transaction(async transaction => {
    // eslint-disable-next-line no-restricted-syntax
    for (const [index, queue] of queues
      .slice()
      .sort((a, b) => orderById.get(a.id) - orderById.get(b.id))
      .entries()) {
      if (queue.order !== index) {
        await queue.update({ order: index }, { transaction });
      }
    }
  });

  // Devolve pela mesma rota da listagem para o socket carregar os mesmos
  // campos calculados que a tela ja usa.
  return ListQueuesService({ companyId });
};

export default ReorderQueuesService;
