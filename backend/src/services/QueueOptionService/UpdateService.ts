import { pick } from "lodash";
import QueueOption from "../../models/QueueOption";
import ShowService from "./ShowService";
import RenumberSiblingsService, { scopeOf } from "./RenumberSiblingsService";

interface QueueData {
  queueId?: number;
  title?: string;
  message?: string;
  parentId?: number;
  forwardQueueId?: number;
  exitChatbot?: boolean;
  isActive?: boolean;
}

// Lista de permissao. "option" e "order" ficam de fora de proposito: sao
// derivados da posicao entre os irmaos ativos (RenumberSiblingsService) e nunca
// podem chegar do cliente.
const UPDATABLE_FIELDS: (keyof QueueData)[] = [
  "queueId",
  "title",
  "message",
  "parentId",
  "forwardQueueId",
  "exitChatbot",
  "isActive"
];

const UpdateService = async (
  queueOptionId: number | string,
  queueOptionData: QueueData
): Promise<QueueOption> => {
  const queueOption = await ShowService(queueOptionId);

  await queueOption.update(pick(queueOptionData, UPDATABLE_FIELDS));

  // Alternar isActive muda a numeracao de todo o nivel.
  await RenumberSiblingsService(scopeOf(queueOption));

  return queueOption.reload();
};

export default UpdateService;
