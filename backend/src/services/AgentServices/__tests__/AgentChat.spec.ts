import axios from "axios";
import HermesChatService, { validateAgentChat } from "../HermesChatService";
import {
  assertSessionCurrent,
  readCapability,
  readSession,
  saveSession,
  revokeCapability
} from "../AgentSessionService";
import { loadActor } from "../AgentPolicyService";
import { queryAgentData } from "../AgentDataService";

jest.mock("axios", () => ({
  __esModule: true,
  default: { post: jest.fn(), isCancel: () => false, isAxiosError: () => false }
}));
jest.mock("../AgentPolicyService", () => ({
  loadActor: jest.fn(),
  auditAgent: jest.fn().mockResolvedValue(undefined)
}));
jest.mock("../AgentDocumentService", () => ({
  systemHelp: () => "public manual"
}));
jest.mock("../AgentDataService", () => ({
  agentCatalog: () => [],
  queryAgentData: jest.fn()
}));
jest.mock("../AgentToolService", () => ({
  AGENT_TOOL_NAMES: ["query_tenant_records"],
  evidenceDigest: result => JSON.stringify(result.records)
}));
jest.mock("../AgentSessionService", () => ({
  readSession: jest.fn(),
  saveSession: jest.fn(),
  issueCapability: jest.fn().mockResolvedValue("opaque-tool-capability"),
  revokeCapability: jest.fn(),
  readCapability: jest.fn(),
  lockSession: jest.fn().mockResolvedValue(jest.fn()),
  boundedHistory: session => session.messages,
  assertSessionCurrent: jest.fn()
}));

const actor = {
  companyId: 1,
  userId: 2,
  fingerprint: "allowed",
  policy: { enabled: true, revision: 1, businessContext: "tenant one" }
};
const sessionId = "a".repeat(64);
const input = {
  companyId: 1,
  userId: 2,
  sessionId,
  requestId: "test-question",
  message: "Quais são os contatos?"
};
describe("Grounded tenant chat delivery", () => {
  beforeEach(() => {
    process.env.HERMES_CHAT_URL = "http://localhost:8643";
    process.env.HERMES_CHAT_BRIDGE_KEY = "k".repeat(64);
    process.env.AGENT_TOOLS_BASE_URL = "http://localhost:8080";
    (loadActor as jest.Mock).mockResolvedValue(actor);
    (assertSessionCurrent as jest.Mock).mockResolvedValue(actor);
    (readSession as jest.Mock).mockResolvedValue({
      id: sessionId,
      messages: [],
      requests: {},
      summary: "",
      ...actor
    });
    (readCapability as jest.Mock).mockResolvedValue({
      capability: { sources: [] }
    });
    (axios.post as jest.Mock).mockResolvedValue({
      data: { reply: "Olá!", citations: [], usesTenantData: false }
    });
  });
  afterEach(() => {
    delete process.env.AGENT_TOOLS_BASE_URL;
  });
  it("never accepts browser-supplied assistant history or tenant selection", async () => {
    expect(
      validateAgentChat({
        ...input,
        messages: [{ role: "assistant", content: "foreign secret" }],
        companyId: 99
      })
    ).toEqual({
      sessionId,
      message: input.message,
      requestId: input.requestId
    });
    await HermesChatService(input);
    expect((axios.post as jest.Mock).mock.calls[0][1].messages).toEqual([
      { role: "user", content: input.message }
    ]);
    expect((axios.post as jest.Mock).mock.calls[0][1].companyId).toBe(1);
  });
  it("drops an answer if permissions are revoked while Hermes runs", async () => {
    (assertSessionCurrent as jest.Mock).mockRejectedValue(
      Object.assign(new Error("ERR_AGENT_CONTEXT_CHANGED"), { statusCode: 409 })
    );
    await expect(HermesChatService(input)).rejects.toBeDefined();
    expect(saveSession).not.toHaveBeenCalled();
    expect(revokeCapability).toHaveBeenCalled();
  });
  it("rejects invented citations and unsupported operational facts", async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        reply: "Existem 20 contatos",
        citations: ["invented"],
        usesTenantData: true
      }
    });
    await expect(HermesChatService(input)).rejects.toMatchObject({
      message: "ERR_AGENT_UNGROUNDED_RESPONSE"
    });
    expect(saveSession).not.toHaveBeenCalled();
  });
  it("rechecks data and metrics before delivering sources", async () => {
    const records = [{ id: 10, name: "Tenant one client" }];
    (readCapability as jest.Mock).mockResolvedValue({
      capability: {
        sources: [
          {
            id: "source-one",
            resource: "contacts",
            module: "contatos",
            observedAt: "now",
            filters: { resource: "contacts" },
            metrics: false,
            digest: JSON.stringify(records)
          }
        ]
      }
    });
    (queryAgentData as jest.Mock).mockResolvedValue({ records });
    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        reply: "Encontrei este contato",
        citations: ["source-one"],
        usesTenantData: true
      }
    });
    const result = (await HermesChatService(input)) as {
      sources: { id: string }[];
    };
    expect(result.sources[0].id).toBe("source-one");
    expect(queryAgentData).toHaveBeenCalledWith(
      actor,
      { resource: "contacts" },
      { metrics: false }
    );
    expect(saveSession).toHaveBeenCalledTimes(1);
  });
  it("discards changed or deleted records instead of stale responses", async () => {
    (readCapability as jest.Mock).mockResolvedValue({
      capability: {
        sources: [
          {
            id: "source-one",
            resource: "contacts",
            module: "contatos",
            observedAt: "now",
            filters: {},
            metrics: false,
            digest: "old-result"
          }
        ]
      }
    });
    (queryAgentData as jest.Mock).mockResolvedValue({ records: [] });
    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        reply: "Old name",
        citations: ["source-one"],
        usesTenantData: true
      }
    });
    await expect(HermesChatService(input)).rejects.toMatchObject({
      message: "ERR_AGENT_CONTEXT_CHANGED"
    });
    expect(saveSession).not.toHaveBeenCalled();
  });
});
