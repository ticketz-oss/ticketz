import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import CreateQueueIntegrationService from "../services/QueueIntegrationService/CreateQueueIntegrationService";
import ListQueueIntegrationsService from "../services/QueueIntegrationService/ListQueueIntegrationsService";
import ShowQueueIntegrationService from "../services/QueueIntegrationService/ShowQueueIntegrationService";
import UpdateQueueIntegrationService from "../services/QueueIntegrationService/UpdateQueueIntegrationService";
import DeleteQueueIntegrationService from "../services/QueueIntegrationService/DeleteQueueIntegrationService";
import TestWebhookConnectionService from "../services/QueueIntegrationService/TestWebhookConnectionService";
import chatIntegrationService from "../services/ChatIntegrationService/ChatIntegrationService";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { queueId } = req.query;

  const integrations = await ListQueueIntegrationsService({ 
    companyId,
    queueId: queueId ? +queueId : undefined
  });

  return res.status(200).json(integrations);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { queueId, provider, name, settings, flowId, webhookUrl, active } = req.body;
  const { companyId } = req.user;

  const integration = await CreateQueueIntegrationService(
    {
      queueId,
      provider,
      name,
      settings,
      flowId,
      webhookUrl,
      active
    },
    companyId
  );

  const io = getIO();
  io.emit(`company-${companyId}-queueIntegration`, {
    action: "create",
    integration
  });

  // Recarregar integrações ativas
  await chatIntegrationService.refreshIntegrations();

  return res.status(200).json(integration);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { companyId } = req.user;

  const integration = await ShowQueueIntegrationService(+id, companyId);

  return res.status(200).json(integration);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { provider, name, settings, flowId, webhookUrl, active } = req.body;
  const { companyId } = req.user;

  const integration = await UpdateQueueIntegrationService(
    +id,
    {
      provider,
      name,
      settings,
      flowId,
      webhookUrl,
      active
    },
    companyId
  );

  const io = getIO();
  io.emit(`company-${companyId}-queueIntegration`, {
    action: "update",
    integration
  });

  // Recarregar integrações ativas
  await chatIntegrationService.refreshIntegrations();

  return res.status(200).json(integration);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { companyId } = req.user;

  await DeleteQueueIntegrationService(+id, companyId);

  const io = getIO();
  io.emit(`company-${companyId}-queueIntegration`, {
    action: "delete",
    id: +id
  });

  // Recarregar integrações ativas
  await chatIntegrationService.refreshIntegrations();

  return res.status(200).json({ message: "Integração removida com sucesso" });
};

export const testConnection = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { webhookUrl } = req.body;

  if (!webhookUrl) {
    return res.status(400).json({ message: "Webhook URL is required" });
  }
  try {
    const result = await TestWebhookConnectionService({ webhookUrl });
    // Return 200 for success, 422 for webhook connection failures
    // This way frontend knows it's not a server error but a webhook issue
    return res.status(result.success ? 200 : 422).json(result);
  } catch (error) {
    // Only return 500 if there's an actual server error
    console.error("Error in test connection endpoint:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error while testing connection" 
    });
  }
};
