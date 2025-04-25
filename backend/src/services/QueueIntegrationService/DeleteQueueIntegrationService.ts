import AppError from "../../errors/AppError";
import QueueIntegration from "../../models/QueueIntegration";
import Queue from "../../models/Queue";

const DeleteQueueIntegrationService = async (
  id: number,
  companyId: number
): Promise<void> => {
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

  await integration.destroy();
};

export default DeleteQueueIntegrationService;
