import AppError from "../../errors/AppError";
import QueueIntegration from "../../models/QueueIntegration";
import Queue from "../../models/Queue";

interface IntegrationData {
  queueId: number;
  provider: string;
  name: string;
  settings: Record<string, any>;
  flowId?: string;
  webhookUrl?: string;
  active?: boolean;
}

const CreateQueueIntegrationService = async (
  integrationData: IntegrationData,
  companyId: number
): Promise<QueueIntegration> => {
  const { queueId } = integrationData;

  const queue = await Queue.findOne({
    where: { id: queueId, companyId }
  });
  
  if (!queue) {
    throw new AppError("Fila não encontrada", 404);
  }

  // Verifica se já existe uma integração ativa para esta fila
  const existingIntegration = await QueueIntegration.findOne({
    where: { queueId, active: true }
  });

  if (existingIntegration) {
    throw new AppError("Já existe uma integração ativa para esta fila", 400);
  }

  const integration = await QueueIntegration.create({
    ...integrationData,
    active: integrationData.active !== undefined ? integrationData.active : true
  });

  return integration;
};

export default CreateQueueIntegrationService;
