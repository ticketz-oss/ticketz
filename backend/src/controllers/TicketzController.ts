import { Request, Response } from "express";
import TicketzStatusService from "../services/TicketzServices/TicketzStatusService";

export const status = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  const ticketzStatus = await TicketzStatusService();

  return res.status(200).json(ticketzStatus);
};
