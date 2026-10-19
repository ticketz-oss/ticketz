import { Request, Response } from "express";
import AppError from "../errors/AppError";
import {
  isStatusEnabled,
  listCompaniesWithStatusFlag,
  setStatusEnabled
} from "../services/WhatsappStatusServices/StatusFeatureService";

const positiveInt = (value: unknown): number | null => {
  if (typeof value !== "string" || !/^\d{1,9}$/.test(value)) return null;
  const parsed = Number(value);
  return parsed > 0 ? parsed : null;
};

export const availability = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const enabled = await isStatusEnabled(req.user.companyId);
  res.setHeader("Cache-Control", "no-store");
  return res.json({ enabled });
};

export const companies = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { searchParam, pageNumber } = req.query;
  if (pageNumber !== undefined && positiveInt(pageNumber) === null) {
    throw new AppError("ERR_STATUS_INVALID_REQUEST", 400);
  }
  const result = await listCompaniesWithStatusFlag({
    searchParam: typeof searchParam === "string" ? searchParam : "",
    pageNumber: pageNumber === undefined ? 1 : positiveInt(pageNumber)
  });
  return res.json(result);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const companyId = positiveInt(req.params.companyId);
  const { enabled } = req.body || {};
  if (companyId === null || typeof enabled !== "boolean") {
    throw new AppError("ERR_STATUS_INVALID_REQUEST", 400);
  }
  return res.json(await setStatusEnabled(companyId, enabled));
};
