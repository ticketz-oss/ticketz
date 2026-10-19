import { Transaction } from "sequelize";
import QueueOption from "../../models/QueueOption";

export type SiblingScope = {
  queueId?: number | null;
  parentId?: number | null;
};

/**
 * Deriva o escopo de irmaos de uma opcao. Opcoes raiz pendem da fila
 * ("queueId" preenchido, "parentId" nulo); as demais pendem do pai.
 */
export const scopeOf = (queueOption: QueueOption): SiblingScope =>
  queueOption.parentId
    ? { parentId: queueOption.parentId }
    : { queueId: queueOption.queueId, parentId: null };

/**
 * Compacta "order" para 0..N-1 e recalcula "option", a tecla que o cliente
 * digita no WhatsApp, como 1..N contando apenas os irmaos ativos. Opcoes
 * inativas ficam com "option" nulo, para nao casarem com nada que o cliente
 * digite enquanto estiverem desligadas.
 *
 * Deve ser chamado depois de criar, remover, reordenar ou alternar isActive.
 */
const RenumberSiblingsService = async (
  scope: SiblingScope,
  transaction?: Transaction
): Promise<void> => {
  const where = scope.parentId
    ? { parentId: scope.parentId }
    : { queueId: scope.queueId, parentId: null };

  if (!scope.parentId && !scope.queueId) {
    return;
  }

  const siblings = await QueueOption.findAll({
    where,
    order: [
      ["order", "ASC"],
      ["id", "ASC"]
    ],
    transaction
  });

  let key = 0;

  // Sequencial de proposito: em uma transacao o Sequelize usa uma unica
  // conexao, entao disparar os updates em paralelo seria instavel.
  // eslint-disable-next-line no-restricted-syntax
  for (const [index, sibling] of siblings.entries()) {
    const option = sibling.isActive ? String((key += 1)) : null;

    if (sibling.order !== index || sibling.option !== option) {
      await sibling.update({ order: index, option }, { transaction });
    }
  }
};

export default RenumberSiblingsService;
