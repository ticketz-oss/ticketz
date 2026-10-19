import { Request, Response } from "express";
import {
  cancelPlatformTenant,
  createPlatformAccess,
  createPlatformTenant,
  exchangePlatformAccess,
  getPlatformTenant,
  getPlatformUsage,
  listPlatformPlans,
  suspendPlatformTenant,
  updatePlatformTenant
} from "../services/PlatformServices/PlatformTenantService";
import {
  createPlatformFinance,
  deletePlatformFinance,
  getPlatformFinance,
  listPlatformFinance,
  updatePlatformFinance
} from "../services/PlatformServices/PlatformFinanceService";
import { SendRefreshToken } from "../helpers/SendRefreshToken";

export const health = async (_req: Request, res: Response): Promise<Response> =>
  res.json({
    status: "ok",
    versao: "1.0",
    sistema: "espaco-whats",
    hora: new Date().toISOString()
  });

export const createTenant = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.status(201).json(await createPlatformTenant(req.body));

export const showTenant = async (
  req: Request,
  res: Response
): Promise<Response> => res.json(await getPlatformTenant(req.params.id));

export const updateTenant = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await updatePlatformTenant(req.params.id, req.body));

export const suspendTenant = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await suspendPlatformTenant(req.params.id, req.body));

export const deleteTenant = async (
  req: Request,
  res: Response
): Promise<Response> => res.json(await cancelPlatformTenant(req.params.id));

export const listPlans = async (
  _req: Request,
  res: Response
): Promise<Response> => res.json(await listPlatformPlans());

export const usage = async (req: Request, res: Response): Promise<Response> =>
  res.json(await getPlatformUsage(req.params.id));

export const access = async (req: Request, res: Response): Promise<Response> =>
  res.status(201).json(await createPlatformAccess(req.params.id, req.body));

export const exchangeAccess = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const result = await exchangePlatformAccess(req.body.token);
  SendRefreshToken(res, String(result.refreshToken));
  return res.json({ token: result.token, user: result.user });
};

export const listFinance = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await listPlatformFinance(req.params.id, req.query));

export const createFinance = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const result = await createPlatformFinance(req.params.id, req.body);
  return res.status(result.statusCode).json(result.body);
};

export const showFinance = async (
  req: Request,
  res: Response
): Promise<Response> => res.json(await getPlatformFinance(req.params.id));

export const updateFinance = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await updatePlatformFinance(req.params.id, req.body));

export const deleteFinance = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await deletePlatformFinance(req.params.id);
  return res.status(204).send();
};
