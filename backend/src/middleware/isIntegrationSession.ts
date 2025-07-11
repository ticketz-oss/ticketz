import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import IntegrationSession from "../models/IntegrationSession";
import { OmniServices } from "../services/OmniServices/OmniServices";
import GetTicketWbot from "../helpers/GetTicketWbot";
import { wbotReplyHandler } from "../services/WbotServices/wbotMessageListener";
import Ticket from "../models/Ticket";
import { IntegrationMessage } from "../services/IntegrationServices/IntegrationServices";

const omniServices = OmniServices.getInstance();

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
    include: [
      "integration",
      {
        model: Ticket,
        as: "ticket",
        include: ["contact", "whatsapp"]
      }
    ]
  });

  if (!integrationSession) {
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }

  if (integrationSession.ticket.status === "closed") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  req.integrationSession = integrationSession;

  const omniDriver = omniServices.getOmniDriver(integrationSession.ticket);

  if (omniDriver) {
    req.replyHandler = async (ticket: Ticket, message: IntegrationMessage) => {
      await omniDriver.sendMessage(
        ticket,
        omniServices.convertIntegrationMessage(message)
      );
    };
  } else {
    const wbot = await GetTicketWbot(integrationSession.ticket);
    if (!wbot) {
      throw new AppError("No connection driver found");
    }
    req.replyHandler = async (ticket: Ticket, message: IntegrationMessage) => {
      await wbotReplyHandler(ticket, message);
    };
  }

  return next();
};

export default isIntegrationSession;
