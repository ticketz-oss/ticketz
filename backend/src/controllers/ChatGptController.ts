import { Request, Response } from "express";
import mcpConfig from "../config/mcp";
import OAuthGrant from "../models/OAuthGrant";
import OAuthClient from "../models/OAuthClient";
import Setting from "../models/Setting";
import User from "../models/User";
import AppError from "../errors/AppError";
import {
  revokeAllCompanyGrants,
  revokeGrant
} from "../services/McpServices/OAuthService";
import UpdateSettingService from "../services/SettingServices/UpdateSettingService";

const isEnabled = async (companyId: number): Promise<boolean> => {
  const setting = await Setting.findOne({
    where: { companyId, key: "_mcpEnabled" }
  });
  return ["enabled", "true"].includes(setting?.value);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const companyId = req.user.companyId;
  const grants = await OAuthGrant.findAll({
    where: { companyId, active: true },
    include: [
      { model: OAuthClient, attributes: ["clientName"] },
      { model: User, attributes: ["id", "name", "email"] }
    ],
    attributes: ["id", "scopes", "createdAt", "lastUsedAt"],
    order: [["createdAt", "DESC"]]
  });
  return res.json({
    enabled: await isEnabled(companyId),
    mcpUrl: mcpConfig.endpoint,
    scopes: mcpConfig.scopes,
    grants: grants.map(grant => ({
      id: grant.id,
      scopes: grant.scopes,
      createdAt: grant.createdAt,
      lastUsedAt: grant.lastUsedAt,
      client: grant.oauthClient?.clientName || "ChatGPT",
      administrator: grant.user
        ? { id: grant.user.id, name: grant.user.name, email: grant.user.email }
        : null
    }))
  });
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const revoked = await revokeGrant(req.params.grantId, req.user.companyId);
  if (!revoked) throw new AppError("ERR_MCP_GRANT_NOT_FOUND", 404);
  return res.status(204).send();
};

export const removeAll = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const revoked = await revokeAllCompanyGrants(req.user.companyId);
  return res.json({ revoked });
};

export const updatePilot = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const companyId = Number(req.params.companyId);
  if (!Number.isInteger(companyId) || companyId <= 0) {
    throw new AppError("ERR_INVALID_COMPANY", 400);
  }
  const enabled = req.body.enabled === true;
  await UpdateSettingService({
    companyId,
    key: "_mcpEnabled",
    value: enabled ? "enabled" : "disabled"
  });
  if (!enabled) await revokeAllCompanyGrants(companyId);
  return res.json({ enabled });
};
