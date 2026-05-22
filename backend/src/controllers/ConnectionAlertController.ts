import { Request, Response } from "express";

import AppError from "../errors/AppError";
import GetConnectionAlertSummaryService from "../services/ConnectionAlertServices/GetConnectionAlertSummaryService";
import ListConnectionAlertsService from "../services/ConnectionAlertServices/ListConnectionAlertsService";
import MarkConnectionAlertsViewedService from "../services/ConnectionAlertServices/MarkConnectionAlertsViewedService";

const ensureAdminAccess = (req: Request) => {
  if (req.user.profile !== "admin" && !req.user.isSuper) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  ensureAdminAccess(req);

  const requestedCompanyId = req.query.companyId
    ? Number(req.query.companyId)
    : req.user.isSuper
      ? undefined
      : Number(req.user.companyId);

  if (
    !req.user.isSuper &&
    requestedCompanyId !== Number(req.user.companyId)
  ) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  const data = await ListConnectionAlertsService({
    companyId: requestedCompanyId,
    pageNumber: String(req.query.pageNumber || "1"),
    limit: String(req.query.limit || "20"),
    onlyUnviewed: String(req.query.onlyUnviewed || "false"),
    eventType: req.query.eventType ? String(req.query.eventType) : undefined,
    isSuper: Boolean(req.user.isSuper)
  });

  return res.status(200).json(data);
};

export const summary = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensureAdminAccess(req);

  const requestedCompanyId = req.query.companyId
    ? Number(req.query.companyId)
    : req.user.isSuper
      ? undefined
      : Number(req.user.companyId);

  if (
    !req.user.isSuper &&
    requestedCompanyId !== Number(req.user.companyId)
  ) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  const data = await GetConnectionAlertSummaryService({
    companyId: requestedCompanyId,
    isSuper: Boolean(req.user.isSuper)
  });

  return res.status(200).json(data);
};

export const markViewed = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensureAdminAccess(req);

  await MarkConnectionAlertsViewedService({
    companyId: req.user.isSuper ? undefined : Number(req.user.companyId),
    alertId: req.params.alertId,
    isSuper: Boolean(req.user.isSuper)
  });

  return res.status(204).send();
};

export const markAllViewed = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensureAdminAccess(req);

  const requestedCompanyId = req.body?.companyId
    ? Number(req.body.companyId)
    : req.user.isSuper
      ? undefined
      : Number(req.user.companyId);

  if (
    !req.user.isSuper &&
    requestedCompanyId !== Number(req.user.companyId)
  ) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  await MarkConnectionAlertsViewedService({
    companyId: requestedCompanyId,
    isSuper: Boolean(req.user.isSuper)
  });

  return res.status(204).send();
};