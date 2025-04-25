import AppError from "../../errors/AppError";
import QueueIntegration from "../../models/QueueIntegration";
import Queue from "../../models/Queue";

interface IntegrationData {
  provider?: string;
  name?: string;
  settings?: Record<string, any>;
  flowId?: string;
  webhookUrl?: string;
  active?: boolean;
}

const UpdateQueueIntegrationService = async (
  id: number,
  integrationData: IntegrationData,
  companyId: number
): Promise<QueueIntegration> => {
  const integration = await QueueIntegration.findByPk(id, {
    include: [
      {
        model: Queue,
        as: "queue",
        attributes: ["id", "name", "companyId"]
      }
    ]
  });

  if (!integration) {
    throw new AppError("Integração não encontrada", 404);
  }

  // Verifica se a fila pertence à empresa do usuário
  if (integration.queue.companyId !== companyId) {
    throw new AppError("Não autorizado", 403);
  }

  await integration.update(integrationData);

  return integration;
};

export default UpdateQueueIntegrationService;
