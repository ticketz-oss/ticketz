import QueueIntegration from "../../models/QueueIntegration";
import Queue from "../../models/Queue";
import { logger } from "../../utils/logger";

interface Request {
  companyId: number;
  queueId?: number;
}

const ListQueueIntegrationsService = async ({
  companyId,
  queueId
}: Request): Promise<QueueIntegration[]> => {
  try {
    const whereCondition: any = {};
    
    if (queueId) {
      whereCondition.queueId = queueId;
    }

    const integrations = await QueueIntegration.findAll({
      include: [
        {
          model: Queue,
          where: { companyId },
          as: "queue",
          attributes: ["id", "name"]
        }
      ],
      where: whereCondition
    });
    
    return integrations;
  } catch (error) {
    logger.error(`Error fetching queue integrations: ${error}`);
    throw error;
  }

  return integrations;
};

export default ListQueueIntegrationsService;
