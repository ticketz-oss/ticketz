import { Op } from "sequelize";
import sequelize from "../../database";
import QueueOption from "../../models/QueueOption";
import AppError from "../../errors/AppError";
import RenumberSiblingsService, {
  SiblingScope,
  scopeOf
} from "./RenumberSiblingsService";

interface ReorderItem {
  id: number;
  order: number;
  isActive?: boolean;
}

interface ReorderData {
  companyId: number;
  items: ReorderItem[];
}

/**
 * Aplica em lote a nova ordem e o liga/desliga de um nivel do chatbot.
 * Antes disso exigia um PUT por irmao, disparados sem await pelo frontend.
 */
const ReorderService = async ({
  companyId,
  items
}: ReorderData): Promise<QueueOption[]> => {
  if (!Array.isArray(items) || !items.length) {
    throw new AppError("ERR_QUEUE_OPTION_REORDER_EMPTY", 400);
  }

  const ids = items.map(item => Number(item.id)).filter(Number.isInteger);

  if (ids.length !== items.length) {
    throw new AppError("ERR_QUEUE_OPTION_REORDER_INVALID", 400);
  }

  // Os services de QueueOption operam por id sem filtro de empresa, entao a
  // validacao de tenant aqui e obrigatoria: withTopParentQueue sobe a arvore
  // ate a fila raiz para descobrir a que empresa a opcao pertence.
  const queueOptions = await QueueOption.findAll(
    QueueOption.withTopParentQueue({
      where: { id: { [Op.in]: ids } }
    })
  );

  if (queueOptions.length !== ids.length) {
    throw new AppError("ERR_QUEUE_OPTION_NOT_FOUND", 404);
  }

  const foreign = queueOptions.find(
    queueOption => queueOption.topParentQueue?.companyId !== companyId
  );

  if (foreign) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  // Todos os itens precisam ser irmaos: reordenar so faz sentido dentro de um
  // nivel, e isso impede mover uma opcao para outro ramo por acidente.
  const scopes = new Set(
    queueOptions.map(queueOption =>
      queueOption.parentId
        ? `parent:${queueOption.parentId}`
        : `queue:${queueOption.queueId}`
    )
  );

  if (scopes.size !== 1) {
    throw new AppError("ERR_QUEUE_OPTION_REORDER_MIXED_SCOPE", 400);
  }

  const scope: SiblingScope = scopeOf(queueOptions[0]);
  const orderById = new Map(items.map(item => [Number(item.id), item]));

  await sequelize.transaction(async transaction => {
    // Sequencial: a transacao usa uma unica conexao.
    // eslint-disable-next-line no-restricted-syntax
    for (const queueOption of queueOptions) {
      const item = orderById.get(queueOption.id);

      await queueOption.update(
        {
          order: Number(item.order),
          ...(item.isActive === undefined
            ? {}
            : { isActive: Boolean(item.isActive) })
        },
        { transaction }
      );
    }

    await RenumberSiblingsService(scope, transaction);
  });

  return QueueOption.findAll({
    where: scope.parentId
      ? { parentId: scope.parentId }
      : { queueId: scope.queueId, parentId: null },
    order: [["order", "ASC"]]
  });
};

export default ReorderService;
