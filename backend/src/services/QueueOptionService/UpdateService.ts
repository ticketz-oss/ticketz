import QueueOption from "../../models/QueueOption";
import ShowService from "./ShowService";

interface QueueData {
  queueId?: number;
  title?: string;
  option?: string;
  message?: string;
  parentId?: number;
}

const UpdateService = async (
  queueOptionId: number | string,
  queueOptionData: QueueData
): Promise<QueueOption> => {

  const queueOption = await ShowService(queueOptionId);

  await queueOption.update(queueOptionData);

  return queueOption;
};

export default UpdateService;
