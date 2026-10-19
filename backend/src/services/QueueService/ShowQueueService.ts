import AppError from "../../errors/AppError";
import Queue from "../../models/Queue";
import Whatsapp from "../../models/Whatsapp";

const ShowQueueService = async (
  queueId: number | string,
  companyId: number
): Promise<Queue> => {
  const queue = await Queue.findByPk(queueId, {
    include: [
      {
        model: Whatsapp,
        as: "whatsapps",
        attributes: ["id", "name", "channel", "status"],
        through: { attributes: [] }
      }
    ]
  });

  if (queue?.companyId !== companyId) {
    throw new AppError("Não é possível consultar registros de outra empresa");
  }

  if (!queue) {
    throw new AppError("ERR_QUEUE_NOT_FOUND");
  }

  return queue;
};

export default ShowQueueService;
