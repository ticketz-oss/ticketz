import AppError from "../../errors/AppError";
import QueueIntegration from "../../models/QueueIntegration";
import Queue from "../../models/Queue";

const ShowQueueIntegrationService = async (
  id: number,
  companyId: number
): Promise<QueueIntegration> => {
  const integration = await QueueIntegration.findOne({
    where: { id },
    include: [
      {
        model: Queue,
        where: { companyId },
        as: "queue",
        attributes: ["id", "name"]
      }
    ]
  });

  if (!integration) {
    throw new AppError("Integração não encontrada", 404);
  }

  return integration;
};

export default ShowQueueIntegrationService;
