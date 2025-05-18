import { Request, Response } from "express";

import {
  DashboardDateRange,
  statusSummaryService,
  ticketsStatisticsService,
  usersReportService
} from "../services/ReportService/DashboardService";
import { WorkerManager } from "../worker_manager";

export const ticketsStatistic = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const params: DashboardDateRange = req.query;
  const { companyId } = req.user;

  const result = await ticketsStatisticsService(companyId, params);
  return res.status(200).json(result);
};

export const usersReport = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const params: DashboardDateRange = req.query;
  const { companyId } = req.user;

  const result = await usersReportService(companyId, params);
  return res.status(200).json(result);
};

export const statusSummary = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;

  if (req.user.isSuper) {
    const worker = WorkerManager.getInstance();
    worker.sendStats();
  }

  const dashboardData = await statusSummaryService(companyId);
  return res.status(200).json(dashboardData);
};
