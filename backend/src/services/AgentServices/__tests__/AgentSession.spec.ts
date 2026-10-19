import {
  boundedHistory,
  createSession,
  readSession,
  saveSession,
  renewSession,
  issueCapability,
  readCapability,
  deleteSession
} from "../AgentSessionService";
import { AgentActor, loadActor } from "../AgentPolicyService";

const values = new Map<string, string>();
const redis = {
  set: jest.fn(async (key, value) => {
    values.set(key, value);
    return "OK";
  }),
  get: jest.fn(async key => values.get(key)),
  del: jest.fn(async key => values.delete(key)),
  expire: jest.fn(async () => 1),
  eval: jest.fn(async (_script, _num, key, serialized, fingerprint) => {
    const old = values.get(key);
    if (!old || JSON.parse(old).fingerprint !== fingerprint) return 0;
    values.set(key, serialized);
    return 1;
  })
};
jest.mock("ioredis", () => ({
  __esModule: true,
  default: jest.fn(() => redis)
}));
jest.mock("../../../config/redis", () => ({
  REDIS_URI_CONNECTION: "redis://test.invalid"
}));
jest.mock("../AgentPolicyService", () => ({ loadActor: jest.fn() }));
const actor = {
  companyId: 1,
  userId: 2,
  fingerprint: "revision-one"
} as AgentActor;

describe("Temporary tenant chat sessions", () => {
  beforeEach(() => {
    values.clear();
    (loadActor as jest.Mock).mockResolvedValue(actor);
  });
  it("starts without client supplied history and expires in 30 minutes", async () => {
    const session = await createSession(actor);
    expect(session.id).toMatch(/^[a-f0-9]{64}$/);
    expect(session.messages).toEqual([]);
    expect(redis.set).toHaveBeenLastCalledWith(
      `agent:session:${session.id}`,
      expect.any(String),
      "EX",
      1800
    );
    await renewSession(session.id, actor);
    expect(redis.expire).toHaveBeenCalledWith(
      `agent:session:${session.id}`,
      1800
    );
  });
  it("rejects foreign tenants and other users without deleting their sessions", async () => {
    const session = await createSession(actor);
    await expect(
      readSession(session.id, { ...actor, companyId: 3 })
    ).rejects.toMatchObject({ statusCode: 409 });
    await expect(
      readSession(session.id, { ...actor, userId: 3 })
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(await readSession(session.id, actor)).toMatchObject({
      id: session.id
    });
  });
  it("invalidates old history when authorization changes", async () => {
    const session = await createSession(actor);
    await expect(
      readSession(session.id, { ...actor, fingerprint: "new-permissions" })
    ).rejects.toMatchObject({ message: "ERR_AGENT_CONTEXT_CHANGED" });
    await expect(readSession(session.id, actor)).rejects.toMatchObject({
      message: "ERR_AGENT_SESSION_EXPIRED"
    });
  });
  it("does not resurrect a session closed during an answer", async () => {
    const session = await createSession(actor);
    await deleteSession(session.id, actor);
    await expect(saveSession(session)).rejects.toMatchObject({
      message: "ERR_AGENT_SESSION_EXPIRED"
    });
  });
  it("rechecks capabilities against current permissions", async () => {
    const session = await createSession(actor);
    const token = await issueCapability(session);
    expect((await readCapability(token)).actor).toEqual(actor);
    (loadActor as jest.Mock).mockResolvedValue({
      ...actor,
      fingerprint: "revoked"
    });
    await expect(readCapability(token)).rejects.toMatchObject({
      message: "ERR_AGENT_CONTEXT_CHANGED"
    });
  });
  it("bounds history and keeps only a summary from its own conversation", async () => {
    const session = await createSession(actor);
    session.messages = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 ? "assistant" : "user",
      content: `own-data-${i} ${"a".repeat(2000)}`
    }));
    boundedHistory(session);
    expect(session.messages.length).toBeLessThanOrEqual(12);
    expect(
      session.messages.reduce((sum, message) => sum + message.content.length, 0)
    ).toBeLessThanOrEqual(16000);
    expect(session.summary.length).toBeLessThanOrEqual(3000);
    expect(session.summary).toContain("own-data");
  });
});
