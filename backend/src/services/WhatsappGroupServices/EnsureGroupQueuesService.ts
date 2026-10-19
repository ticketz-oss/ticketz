import GroupQueue from "../../models/GroupQueue";
import Whatsapp from "../../models/Whatsapp";

const EnsureGroupQueuesService = async (
  groupContactId: number,
  whatsappId: number,
  companyId: number
): Promise<void> => {
  if (await GroupQueue.count({ where: { groupContactId } })) return;

  const whatsapp = await Whatsapp.findByPk(whatsappId, { include: ["queues"] });
  const queueIds = whatsapp?.queues?.map(queue => queue.id) || [];
  if (!queueIds.length) return;

  await GroupQueue.bulkCreate(
    queueIds.map(queueId => ({ groupContactId, queueId, companyId })),
    { ignoreDuplicates: true }
  );
};

export default EnsureGroupQueuesService;
