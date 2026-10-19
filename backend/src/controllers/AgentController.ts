import { Request, Response } from "express";
import AppError from "../errors/AppError";
import HermesChatService, {
  validateAgentChat
} from "../services/AgentServices/HermesChatService";
import {
  loadActor,
  getPolicy,
  getAgentAvailability,
  savePolicy,
  listAgentCompanies,
  auditAgent
} from "../services/AgentServices/AgentPolicyService";
import {
  createSession,
  renewSession,
  deleteSession
} from "../services/AgentServices/AgentSessionService";
import { executeAgentTool } from "../services/AgentServices/AgentToolService";
import {
  AGENT_MODULES,
  defaultModules
} from "../services/AgentServices/AgentCatalog";
import {
  enqueueContextRebuild,
  purgeBlockedDocuments
} from "../services/AgentServices/AgentDocumentService";

const actorFrom = (req: Request) =>
  loadActor(req.user.companyId, Number(req.user.id));
const companyFrom = (req: Request) => {
  const id = Number(req.params.companyId);
  if (!Number.isSafeInteger(id) || id < 1)
    throw new AppError("ERR_AGENT_INVALID_REQUEST", 400);
  return id;
};
export const availability = async (req: Request, res: Response) => {
  const enabled = await getAgentAvailability(req.user.companyId);
  res.setHeader("Cache-Control", "no-store");
  res.json({ enabled });
};
export const session = async (req: Request, res: Response) => {
  const value = await createSession(await actorFrom(req));
  res.setHeader("Cache-Control", "no-store");
  res.status(201).json({ sessionId: value.id, expiresIn: 1800 });
};
export const heartbeat = async (req: Request, res: Response) => {
  await renewSession(req.params.sessionId, await actorFrom(req));
  res.sendStatus(204);
};
export const close = async (req: Request, res: Response) => {
  await deleteSession(req.params.sessionId, await actorFrom(req));
  res.sendStatus(204);
};
export const chat = async (req: Request, res: Response): Promise<void> => {
  const input = validateAgentChat(req.body);
  const controller = new AbortController();
  const disconnect = () => {
    if (!res.writableEnded) controller.abort();
  };
  res.on("close", disconnect);
  try {
    const result = await HermesChatService({
      ...input,
      companyId: req.user.companyId,
      userId: Number(req.user.id),
      signal: controller.signal
    });
    const fresh = await actorFrom(req);
    const { authorizationFingerprint, ...publicResult } = result as {
      authorizationFingerprint: string;
      reply: string;
      sources: unknown[];
      provider: string;
    };
    if (authorizationFingerprint !== fresh.fingerprint)
      throw new AppError("ERR_AGENT_CONTEXT_CHANGED", 409);
    if (!controller.signal.aborted) {
      res.setHeader("Cache-Control", "no-store");
      res.json(publicResult);
    }
  } catch (error) {
    if (!controller.signal.aborted) throw error;
  } finally {
    res.off("close", disconnect);
  }
};
export const tools = async (req: Request, res: Response) => {
  const authorization = req.headers.authorization || "";
  if (!authorization.startsWith("Bearer "))
    throw new AppError("ERR_AGENT_PERMISSION_DENIED", 403);
  const result = await executeAgentTool(authorization.slice(7), req.body);
  res.setHeader("Cache-Control", "no-store");
  res.json(result);
};
export const companies = async (req: Request, res: Response) => {
  res.json(
    await listAgentCompanies(
      typeof req.query.search === "string" ? req.query.search : "",
      typeof req.query.cursor === "string" ? req.query.cursor : ""
    )
  );
};
export const context = async (req: Request, res: Response) => {
  const policy = await getPolicy(companyFrom(req));
  res.json({
    ...policy.get({ plain: true }),
    modules: { ...defaultModules(), ...policy.modules },
    catalog: AGENT_MODULES.map(({ key, title, description }) => ({
      key,
      title,
      description
    }))
  });
};
export const updateContext = async (req: Request, res: Response) => {
  const policy = await savePolicy(
    companyFrom(req),
    Number(req.user.id),
    req.body
  );
  await purgeBlockedDocuments(policy);
  await enqueueContextRebuild(policy.companyId);
  res.json(policy);
};
export const rebuild = async (req: Request, res: Response) => {
  const companyId = companyFrom(req);
  const policy = await getPolicy(companyId);
  await policy.update({ documentStatus: { state: "pending" } });
  await enqueueContextRebuild(companyId);
  await auditAgent(
    { companyId, userId: Number(req.user.id) },
    "rebuild_requested",
    "success"
  );
  res.status(202).json({ state: "pending" });
};
