import { Request, Response } from "express";
import { IntegrationServices } from "../services/IntegrationServices/IntegrationServices";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const integrations = IntegrationServices.getInstance();

  return res.json(await integrations.listDrivers());
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const integrations = IntegrationServices.getInstance();
  const { driver } = req.params;

  return res.json(await integrations.getDriverOptions(driver));
};
