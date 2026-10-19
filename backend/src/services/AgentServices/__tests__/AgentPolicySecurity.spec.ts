/* eslint-disable @typescript-eslint/no-explicit-any -- Mutable policy mock intentionally models only the persisted contract under test. */
import sequelize from "../../../database";
import Company from "../../../models/Company";
import User from "../../../models/User";
import AgentTenantPolicy from "../../../models/AgentTenantPolicy";
import AgentContextAudit from "../../../models/AgentContextAudit";
import { defaultModules } from "../AgentCatalog";
import {
  getAgentAvailability,
  getPolicy,
  listAgentCompanies,
  loadActor,
  savePolicy
} from "../AgentPolicyService";

jest.mock("../../../database", () => ({
  __esModule: true,
  default: { query: jest.fn(), transaction: jest.fn() }
}));
jest.mock("../../../models/Company", () => ({
  __esModule: true,
  default: { findByPk: jest.fn(), findAndCountAll: jest.fn() }
}));
jest.mock("../../../models/User", () => ({
  __esModule: true,
  default: { findOne: jest.fn() }
}));
jest.mock("../../../models/AgentTenantPolicy", () => ({
  __esModule: true,
  default: { findOrCreate: jest.fn(), findOne: jest.fn(), findAll: jest.fn() }
}));
jest.mock("../../../models/AgentContextAudit", () => ({
  __esModule: true,
  default: { create: jest.fn() }
}));
jest.mock("../../../helpers/tenantRuntime", () => ({
  assertRuntimeCompany: jest.fn()
}));

describe("Agent policies and revocation", () => {
  const company = { id: 1, status: true, platformStatus: "ativo" };
  const user = { id: 10, companyId: 1, profile: "user", tokenVersion: 1 };
  let policy: any;
  let aclDigest: string;
  beforeEach(() => {
    policy = {
      enabled: true,
      modules: defaultModules(),
      businessContext: "Tenant business",
      revision: 1,
      update: jest.fn().mockImplementation(async updates => {
        Object.assign(policy, updates);
        return policy;
      })
    };
    aclDigest = "acl-one";
    (Company.findByPk as jest.Mock).mockResolvedValue(company);
    (User.findOne as jest.Mock).mockResolvedValue(user);
    (AgentTenantPolicy.findOrCreate as jest.Mock).mockResolvedValue([policy]);
    (AgentTenantPolicy.findOne as jest.Mock).mockResolvedValue(policy);
    (AgentTenantPolicy.findAll as jest.Mock).mockResolvedValue([]);
    (AgentContextAudit.create as jest.Mock).mockResolvedValue({});
    (sequelize.transaction as jest.Mock).mockImplementation(fn =>
      fn({ LOCK: { UPDATE: "UPDATE" } })
    );
    (sequelize.query as jest.Mock).mockImplementation(async sql => {
      if (sql.includes("AS digest")) return [{ digest: aclDigest }];
      if (sql.includes('"ChatUsers"')) return [{ id: 4 }];
      if (sql.includes('"UserQueues"')) return [{ id: 7 }];
      return [];
    });
  });

  it("creates policy defaults for a new company", async () => {
    await getPolicy(1);
    expect(AgentTenantPolicy.findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyId: 1 },
        defaults: { companyId: 1, enabled: false, modules: defaultModules() }
      })
    );
  });

  it("shows availability only for an enabled policy in the authenticated tenant", async () => {
    expect(await getAgentAvailability(1)).toBe(true);
    expect(AgentTenantPolicy.findOne).toHaveBeenCalledWith({
      where: { companyId: 1 },
      attributes: ["enabled"]
    });
    (AgentTenantPolicy.findOne as jest.Mock).mockResolvedValueOnce({
      enabled: false
    });
    expect(await getAgentAvailability(1)).toBe(false);
    (AgentTenantPolicy.findOne as jest.Mock).mockResolvedValueOnce(null);
    expect(await getAgentAvailability(1)).toBe(false);
  });

  it("reloads the authenticated user inside its own tenant", async () => {
    await loadActor(1, 10);
    expect(User.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 10, companyId: 1 } })
    );
    (User.findOne as jest.Mock).mockResolvedValue(null);
    await expect(loadActor(2, 10)).rejects.toMatchObject({ statusCode: 403 });
  });

  it("rejects disabled agent and inactive companies", async () => {
    policy.enabled = false;
    await expect(loadActor(1, 10)).rejects.toMatchObject({
      message: "ERR_AGENT_DISABLED"
    });
    policy.enabled = true;
    (Company.findByPk as jest.Mock).mockResolvedValue({
      ...company,
      platformStatus: "suspenso"
    });
    await expect(loadActor(1, 10)).rejects.toMatchObject({
      message: "ERR_AGENT_PERMISSION_DENIED"
    });
  });

  it("retires the context when record ACLs or policy revision change", async () => {
    const first = await loadActor(1, 10);
    aclDigest = "acl-two";
    const changedRecord = await loadActor(1, 10);
    expect(first.fingerprint).not.toBe(changedRecord.fingerprint);
    policy.revision = 2;
    const changedPolicy = await loadActor(1, 10);
    expect(changedRecord.fingerprint).not.toBe(changedPolicy.fingerprint);
    const digestSql = (sequelize.query as jest.Mock).mock.calls.find(([sql]) =>
      sql.includes("AS digest")
    )[0];
    [
      "Tickets",
      "TaskBoardTasks",
      "GroupQueues",
      "HelpGroups",
      "Announcements",
      "AnnouncementUsers"
    ].forEach(table => expect(digestSql).toContain(`"${table}"`));
    expect(digestSql).not.toContain("businessContext");
    expect(digestSql).not.toContain("description");
  });

  it("audits changes without business text and rejects a stale revision", async () => {
    await savePolicy(1, 10, {
      enabled: true,
      modules: { contatos: false },
      businessContext: "Private customer facts",
      revision: 1
    });
    expect(policy.revision).toBe(2);
    expect(policy.modules.contatos).toBe(false);
    expect(AgentContextAudit.create).toHaveBeenCalledWith(
      {
        companyId: 1,
        userId: 10,
        event: "policy_saved",
        status: "success",
        revision: 2
      },
      expect.any(Object)
    );
    await expect(
      savePolicy(1, 10, {
        enabled: true,
        modules: {},
        businessContext: "Old edit",
        revision: 1
      })
    ).rejects.toMatchObject({
      message: "ERR_AGENT_POLICY_CONFLICT",
      statusCode: 409
    });
  });

  it.each([
    { modules: { SQL: true } },
    { modules: { contatos: "yes" } },
    { enabled: "yes" },
    { businessContext: "x".repeat(50001) }
  ])("rejects unowned module and malformed policy: %o", async changes => {
    await expect(
      savePolicy(1, 10, {
        enabled: true,
        modules: {},
        businessContext: "",
        revision: 1,
        ...changes
      })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(policy.update).not.toHaveBeenCalled();
  });

  it("paginates company administration without silently dropping more than 100 companies", async () => {
    const rows = [{ id: 101, get: () => ({ id: 101, name: "Company" }) }];
    (Company.findAndCountAll as jest.Mock).mockResolvedValue({
      rows,
      count: 102
    });
    const result = await listAgentCompanies("Company", "100");
    expect(result).toMatchObject({
      companies: [{ id: 101, name: "Company", enabled: false }],
      hasMore: true,
      nextCursor: "101"
    });
    expect(Company.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100, offset: 100 })
    );
    await expect(listAgentCompanies("", "-1")).rejects.toMatchObject({
      statusCode: 400
    });
  });
});
