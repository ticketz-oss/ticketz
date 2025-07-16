import { Request, Response } from "express";
import { IntegrationServices } from "../services/IntegrationServices/IntegrationServices";
import { logger } from "../utils/logger";
import AppError from "../errors/AppError";
import Queue from "../models/Queue";

const integrationServices = IntegrationServices.getInstance();

export const index = async (req: Request, res: Response): Promise<Response> => {
  const integrations = IntegrationServices.getInstance();

  return res.json(await integrations.listDrivers());
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const integrations = IntegrationServices.getInstance();
  const { driver } = req.params;

  return res.json(await integrations.getDriverOptions(driver));
};

export const webhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { integrationSession, replyHandler, body } = req;

  try {
    await integrationServices.processPayload(
      integrationSession,
      body,
      replyHandler
    );
    return res.json({ executed: true });
  } catch (error) {
    logger.error(
      { message: error?.message, payload: body },
      "Error processing webhook"
    );
    throw new AppError("ERR_WEBHOOK_PROCESSING", 500);
  }
};

export const listQueues = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { integrationSession } = req;

  try {
    const queues = await Queue.findAll({
      where: {
        companyId: integrationSession.ticket.companyId,
        visibleToIntegrations: true
      },
      attributes: ["id", "name", "description"]
    });
    return res.json(queues);
  } catch (error) {
    logger.error(
      { message: error?.message },
      "Error listing queues for integration session"
    );
    throw new AppError("ERR_LIST_QUEUES", 500);
  }
};
