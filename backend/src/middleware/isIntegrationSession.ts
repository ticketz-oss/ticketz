import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import IntegrationSession from "../models/IntegrationSession";

const isIntegrationSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }

  const [, token] = authHeader.split(" ");

  const integrationSession = await IntegrationSession.findOne({
    where: { token },
    include: ["ticket", "integration"]
  });

  if (!integrationSession) {
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }

  if (integrationSession.ticket.status === "closed") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  req.integrationSession = integrationSession;

  return next();
};

export default isIntegrationSession;
