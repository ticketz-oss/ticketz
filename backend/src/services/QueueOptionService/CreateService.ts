import QueueOption from "../../models/QueueOption";
import RenumberSiblingsService, { scopeOf } from "./RenumberSiblingsService";

interface QueueOptionData {
  queueId: number;
  title: string;
  message?: string;
  parentId?: number;
  forwardQueueId?: number;
  exitChatbot?: boolean;
  isActive?: boolean;
}

const CreateService = async (
  queueOptionData: QueueOptionData
): Promise<QueueOption> => {
  const where = queueOptionData.parentId
    ? { parentId: queueOptionData.parentId }
    : { queueId: queueOptionData.queueId, parentId: null };

  // Entra no fim do nivel; "option" e atribuido pela renumeracao.
  const order = await QueueOption.count({ where });

  const queueOption = await QueueOption.create({
    ...queueOptionData,
    order,
    option: null
  });

  await RenumberSiblingsService(scopeOf(queueOption));

  return queueOption.reload();
};

export default CreateService;
