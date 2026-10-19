import axios from "axios";
import AppError from "../../errors/AppError";
import { loadActor, auditAgent } from "./AgentPolicyService";
import {
  boundedHistory,
  readSession,
  saveSession,
  issueCapability,
  revokeCapability,
  readCapability,
  lockSession,
  assertSessionCurrent
} from "./AgentSessionService";
import { systemHelp } from "./AgentDocumentService";
import { AGENT_TOOL_NAMES, evidenceDigest } from "./AgentToolService";
import { agentCatalog, queryAgentData } from "./AgentDataService";

export const validateAgentChat = (
  body: unknown
): { sessionId: string; message: string; requestId: string } => {
  const request = body as Record<string, unknown>;
  if (
    !request ||
    typeof request.sessionId !== "string" ||
    !/^[a-f0-9]{64}$/.test(request.sessionId) ||
    typeof request.message !== "string" ||
    !request.message.trim() ||
    request.message.length > 8000 ||
    typeof request.requestId !== "string" ||
    !/^[a-zA-Z0-9_-]{1,128}$/.test(request.requestId)
  )
    throw new AppError("ERR_AGENT_INVALID_REQUEST", 400);
  return {
    sessionId: request.sessionId,
    message: request.message.trim(),
    requestId: request.requestId
  };
};
const HermesChatService = async ({
  message,
  sessionId,
  requestId,
  companyId,
  userId,
  signal
}: {
  message: string;
  sessionId: string;
  requestId: string;
  companyId: number;
  userId: number;
  signal?: AbortSignal;
}) => {
  const actor = await loadActor(companyId, userId);
  const unlock = await lockSession(sessionId);
  let capabilityToken: string;
  try {
    const session = await readSession(sessionId, actor);
    if (session.requests[requestId]) return session.requests[requestId];
    const baseURL = process.env.HERMES_CHAT_URL?.trim();
    const key = process.env.HERMES_CHAT_BRIDGE_KEY?.trim();
    const toolsURL =
      process.env.AGENT_TOOLS_BASE_URL || process.env.BACKEND_URL;
    if (!baseURL || !key || key.length < 32 || !toolsURL)
      throw new AppError("ERR_HERMES_NOT_CONFIGURED", 503);
    [baseURL, toolsURL].forEach(address => {
      const url = new URL(address);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        (process.env.NODE_ENV === "production" &&
          url.protocol !== "https:" &&
          !["localhost", "127.0.0.1", "host.docker.internal"].includes(
            url.hostname
          ))
      )
        throw new AppError("ERR_HERMES_NOT_CONFIGURED", 503);
    });
    capabilityToken = await issueCapability(session);
    const response = await axios.post(
      `${baseURL.replace(/\/$/, "")}/chat`,
      {
        companyId,
        userId,
        conversationId: sessionId,
        messages: [
          ...boundedHistory(session),
          { role: "user", content: message }
        ],
        context: {
          businessContext: actor.policy.businessContext.slice(0, 10000),
          summary: session.summary,
          help: systemHelp(),
          modules: agentCatalog(actor),
          revision: actor.policy.revision
        },
        toolAccess: {
          url: `${toolsURL.replace(/\/$/, "")}/agent/tools`,
          token: capabilityToken,
          allowedTools: AGENT_TOOL_NAMES
        }
      },
      {
        headers: { Authorization: `Bearer ${key}` },
        timeout: 150000,
        signal,
        proxy: false,
        maxContentLength: 256 * 1024,
        maxBodyLength: 256 * 1024
      }
    );
    let currentActor = await assertSessionCurrent(session);
    const { capability } = await readCapability(capabilityToken);
    const reply = response.data?.reply;
    if (typeof reply !== "string" || !reply.trim() || reply.length > 8000)
      throw new AppError("ERR_HERMES_EMPTY_REPLY", 502);
    const citations = response.data?.citations;
    if (
      !Array.isArray(citations) ||
      citations.some(
        id =>
          typeof id !== "string" ||
          !capability.sources.some(source => source.id === id)
      )
    )
      throw new AppError("ERR_AGENT_UNGROUNDED_RESPONSE", 502);
    if (response.data?.usesTenantData === true && !citations.length)
      throw new AppError("ERR_AGENT_UNGROUNDED_RESPONSE", 502);
    const citedSources = capability.sources.filter(item =>
      citations.includes(item.id)
    );
    for (let i = 0; i < citedSources.length; i += 1) {
      const source = citedSources[i];
      if (
        !["business", "documentation", "system-help"].includes(source.resource)
      ) {
        const result = await queryAgentData(
          currentActor,
          { ...source.filters, resource: source.resource },
          { metrics: source.metrics }
        );
        if (evidenceDigest(result) !== source.digest)
          throw new AppError("ERR_AGENT_CONTEXT_CHANGED", 409);
      }
    }
    const result = {
      reply,
      sources: capability.sources
        .filter(source => citations.includes(source.id))
        .map(({ id, module, resource, observedAt }) => ({
          id,
          module,
          resource,
          observedAt
        })),
      provider: "hermes",
      authorizationFingerprint: actor.fingerprint
    };
    session.messages.push(
      { role: "user", content: message },
      { role: "assistant", content: reply }
    );
    boundedHistory(session);
    session.requests = { [requestId]: result };
    currentActor = await assertSessionCurrent(session);
    await saveSession(session);
    await auditAgent(
      actor,
      "chat_reply",
      "success",
      undefined,
      result.sources.length,
      actor.policy.revision
    );
    return result;
  } catch (error) {
    if (error instanceof AppError || signal?.aborted || axios.isCancel(error))
      throw error;
    if (axios.isAxiosError(error)) {
      if (["ECONNABORTED", "ETIMEDOUT"].includes(error.code))
        throw new AppError("ERR_HERMES_TIMEOUT", 504);
      if (error.response?.status === 429)
        throw new AppError("ERR_AGENT_BUSY", 429);
    }
    throw new AppError("ERR_HERMES_UNAVAILABLE", 502);
  } finally {
    if (capabilityToken) await revokeCapability(capabilityToken);
    await unlock();
  }
};
export default HermesChatService;
