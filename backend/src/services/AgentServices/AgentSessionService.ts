import { randomBytes, createHash } from "crypto";
import Redis from "ioredis";
import { REDIS_URI_CONNECTION } from "../../config/redis";
import AppError from "../../errors/AppError";
import { AgentActor, loadActor } from "./AgentPolicyService";

export const SESSION_TTL = 30 * 60;
export type SessionMessage = { role: "user" | "assistant"; content: string };
export type AgentSession = {
  id: string;
  companyId: number;
  userId: number;
  fingerprint: string;
  messages: SessionMessage[];
  summary: string;
  requests: Record<string, unknown>;
  createdAt: string;
};
let connection: Redis;
export const sessionRedis = () =>
  connection ||
  (connection = new Redis(process.env.AGENT_REDIS_URI || REDIS_URI_CONNECTION));
const key = (id: string) => `agent:session:${id}`;
export const validSessionId = (id: unknown): id is string =>
  typeof id === "string" && /^[a-f0-9]{64}$/.test(id);
export const saveSession = async (session: AgentSession) => {
  const saved = await sessionRedis().eval(
    "local raw=redis.call('GET',KEYS[1]); if not raw then return 0 end; local old=cjson.decode(raw); if old.fingerprint~=ARGV[2] then return 0 end; redis.call('SET',KEYS[1],ARGV[1],'EX',ARGV[3]); return 1",
    1,
    key(session.id),
    JSON.stringify(session),
    session.fingerprint,
    SESSION_TTL
  );
  if (!saved) throw new AppError("ERR_AGENT_SESSION_EXPIRED", 409);
};
export const createSession = async (actor: AgentActor) => {
  const session: AgentSession = {
    id: randomBytes(32).toString("hex"),
    companyId: actor.companyId,
    userId: actor.userId,
    fingerprint: actor.fingerprint,
    messages: [],
    summary: "",
    requests: {},
    createdAt: new Date().toISOString()
  };
  await sessionRedis().set(
    key(session.id),
    JSON.stringify(session),
    "EX",
    SESSION_TTL
  );
  return session;
};
export const readSession = async (
  id: string,
  actor: AgentActor
): Promise<AgentSession> => {
  if (!validSessionId(id)) throw new AppError("ERR_AGENT_INVALID_REQUEST", 400);
  const raw = await sessionRedis().get(key(id));
  if (!raw) throw new AppError("ERR_AGENT_SESSION_EXPIRED", 409);
  const session = JSON.parse(raw) as AgentSession;
  if (session.companyId !== actor.companyId || session.userId !== actor.userId)
    throw new AppError("ERR_AGENT_SESSION_EXPIRED", 409);
  if (session.fingerprint !== actor.fingerprint) {
    await sessionRedis().del(key(id));
    throw new AppError("ERR_AGENT_CONTEXT_CHANGED", 409);
  }
  return session;
};
export const renewSession = async (id: string, actor: AgentActor) => {
  await readSession(id, actor);
  await sessionRedis().expire(key(id), SESSION_TTL);
};
export const deleteSession = async (id: string, actor: AgentActor) => {
  await readSession(id, actor);
  await sessionRedis().del(key(id));
};
export const assertSessionCurrent = async (session: AgentSession) => {
  const actor = await loadActor(session.companyId, session.userId);
  await readSession(session.id, actor);
  return actor;
};
export const boundedHistory = (session: AgentSession) => {
  const budget = Math.min(
    32000,
    Math.max(4000, Number(process.env.AGENT_HISTORY_CHAR_BUDGET) || 16000)
  );
  while (
    session.messages.length > 12 ||
    session.messages.reduce((sum, item) => sum + item.content.length, 0) >
      budget
  ) {
    const removed = session.messages.splice(0, 2);
    // A bounded extractive summary, never new inferred facts or a shared memory.
    session.summary =
      `${session.summary}\n${removed.map(item => `${item.role}: ${item.content.slice(0, 500)}`).join("\n")}`.slice(
        -3000
      );
  }
  return session.messages;
};
export type ToolCapability = {
  sessionId: string;
  companyId: number;
  userId: number;
  fingerprint: string;
  sources: {
    id: string;
    resource: string;
    module: string;
    observedAt: string;
    digest: string;
    metrics: boolean;
    filters: Record<string, unknown>;
  }[];
};
const capabilityKey = (token: string) =>
  `agent:cap:${createHash("sha256").update(token).digest("hex")}`;
export const issueCapability = async (session: AgentSession) => {
  const token = randomBytes(32).toString("hex");
  const capability: ToolCapability = {
    sessionId: session.id,
    companyId: session.companyId,
    userId: session.userId,
    fingerprint: session.fingerprint,
    sources: []
  };
  await sessionRedis().set(
    capabilityKey(token),
    JSON.stringify(capability),
    "EX",
    150
  );
  return token;
};
export const readCapability = async (token: string) => {
  if (!validSessionId(token))
    throw new AppError("ERR_AGENT_PERMISSION_DENIED", 403);
  const raw = await sessionRedis().get(capabilityKey(token));
  if (!raw) throw new AppError("ERR_AGENT_PERMISSION_DENIED", 403);
  const capability = JSON.parse(raw) as ToolCapability;
  const actor = await loadActor(capability.companyId, capability.userId);
  if (actor.fingerprint !== capability.fingerprint)
    throw new AppError("ERR_AGENT_CONTEXT_CHANGED", 409);
  await readSession(capability.sessionId, actor);
  return { capability, actor };
};
export const appendCapabilitySource = async (
  token: string,
  source: ToolCapability["sources"][number]
) => {
  const saved = await sessionRedis().eval(
    "local raw=redis.call('GET',KEYS[1]); if not raw then return 0 end; local value=cjson.decode(raw); if #value.sources>=32 then return 0 end; table.insert(value.sources,cjson.decode(ARGV[1])); redis.call('SET',KEYS[1],cjson.encode(value),'KEEPTTL'); return 1",
    1,
    capabilityKey(token),
    JSON.stringify(source)
  );
  if (!saved) throw new AppError("ERR_AGENT_PERMISSION_DENIED", 403);
};
export const revokeCapability = async (token: string) => {
  await sessionRedis().del(capabilityKey(token));
};
export const lockSession = async (id: string) => {
  const token = randomBytes(24).toString("hex");
  if (
    (await sessionRedis().set(`agent:lock:${id}`, token, "EX", 160, "NX")) !==
    "OK"
  )
    throw new AppError("ERR_AGENT_BUSY", 429);
  return async () => {
    await sessionRedis().eval(
      "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0",
      1,
      `agent:lock:${id}`,
      token
    );
  };
};
