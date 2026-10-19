import { Op } from "sequelize";
import sequelize from "../../database";
import HelpGroup from "../../models/HelpGroup";
import AppError from "../../errors/AppError";
import ListService from "./ListService";
import { HelpActor, assertManageableGroup, scopeKey } from "./scope";

interface ReorderItem {
  id: number;
  order: number;
}

interface Request {
  items: ReorderItem[];
  actor: HelpActor;
}

/**
 * Define a ordem dos cards da Central de Ajuda. Espelha
 * QueueService/ReorderQueuesService: valida que todos os ids sao irmaos (mesmo
 * balde) e reescreve a ordem densa dentro de uma transacao.
 */
const ReorderService = async ({
  items,
  actor
}: Request): Promise<HelpGroup[]> => {
  if (!Array.isArray(items) || !items.length) {
    throw new AppError("ERR_HELP_GROUP_REORDER_EMPTY", 400);
  }

  const ids = items.map(item => Number(item.id)).filter(Number.isInteger);

  if (ids.length !== items.length) {
    throw new AppError("ERR_HELP_GROUP_REORDER_INVALID", 400);
  }

  const groups = await HelpGroup.findAll({
    where: { id: { [Op.in]: ids } }
  });

  if (groups.length !== ids.length) {
    throw new AppError("ERR_NO_HELP_GROUP_FOUND", 404);
  }

  // Reordenar so faz sentido entre cards do mesmo balde (publico + escopo): sao
  // listas distintas na tela e cada uma tem a propria sequencia 0..N-1.
  const scopes = new Set(groups.map(scopeKey));

  if (scopes.size > 1) {
    throw new AppError("ERR_HELP_GROUP_REORDER_INVALID", 400);
  }

  groups.forEach(group => assertManageableGroup(group, actor));

  const orderById = new Map(items.map(item => [Number(item.id), item.order]));

  await sequelize.transaction(async transaction => {
    // eslint-disable-next-line no-restricted-syntax
    for (const [index, group] of groups
      .slice()
      .sort((a, b) => orderById.get(a.id) - orderById.get(b.id))
      .entries()) {
      if (group.order !== index) {
        await group.update({ order: index }, { transaction });
      }
    }
  });

  return ListService(actor);
};

export default ReorderService;
