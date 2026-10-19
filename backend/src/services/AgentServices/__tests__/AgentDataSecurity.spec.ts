/* eslint-disable @typescript-eslint/no-explicit-any -- Minimal ORM mock fixtures intentionally omit unrelated model fields. */
import fs from "fs";
import path from "path";
import ts from "typescript";
import { AGENT_MODULES, defaultModules, resourceFor } from "../AgentCatalog";
import { AgentActor } from "../AgentPolicyService";
import {
  agentCatalog,
  queryAgentData,
  scopeForResource
} from "../AgentDataService";
import sequelize from "../../../database";

jest.mock("../../../database", () => ({
  __esModule: true,
  default: { models: {}, query: jest.fn() }
}));
jest.mock("../../../models/Company", () => ({ __esModule: true, default: {} }));
jest.mock("../../../models/User", () => ({ __esModule: true, default: {} }));
jest.mock("../../../models/AgentTenantPolicy", () => ({
  __esModule: true,
  default: {}
}));
jest.mock("../../../models/AgentContextAudit", () => ({
  __esModule: true,
  default: {}
}));
jest.mock("../../../helpers/tenantRuntime", () => ({
  assertRuntimeCompany: jest.fn()
}));

const actor = (changes: Partial<AgentActor> = {}): AgentActor => ({
  companyId: 1,
  userId: 10,
  profile: "user",
  queueIds: [7],
  chatIds: [4],
  fingerprint: "permission-v1",
  policy: { enabled: true, modules: defaultModules(), revision: 1 } as any,
  ...changes
});
const query = sequelize.query as jest.Mock;
const register = (key: string) => {
  const { resource } = resourceFor(key);
  sequelize.models[resource.table] = {
    getTableName: () => resource.table,
    rawAttributes: Object.fromEntries(
      resource.fields.map(field => [
        field,
        {
          type: {
            key: ["body", "name", "description", "transcript"].includes(field)
              ? "TEXT"
              : "INTEGER"
          }
        }
      ])
    )
  } as any;
};

describe("Agent read authorization", () => {
  beforeEach(() => {
    Object.keys(sequelize.models).forEach(key => delete sequelize.models[key]);
    query.mockReset();
  });

  it("defaults every module to enabled, while hiding administrative modules from regular users", () => {
    expect(Object.values(defaultModules()).every(Boolean)).toBe(true);
    expect(agentCatalog(actor()).map(module => module.key)).not.toContain(
      "financeiro"
    );
    expect(
      agentCatalog(actor({ profile: "admin" })).map(module => module.key)
    ).toContain("financeiro");
  });

  it("fails before SQL when source module or report permission is revoked", async () => {
    const denied = actor();
    denied.policy.modules.contatos = false;
    await expect(
      queryAgentData(denied, { resource: "contacts" })
    ).rejects.toMatchObject({ statusCode: 403 });
    denied.policy.modules.contatos = true;
    denied.policy.modules.relatorios = false;
    await expect(
      queryAgentData(denied, { resource: "contacts" }, { metrics: true })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(query).not.toHaveBeenCalled();
  });

  it("keeps explicit IDs and searches inside parameterized tenant scope", async () => {
    register("contacts");
    query.mockResolvedValueOnce([{ total: 0 }]).mockResolvedValueOnce([]);
    const result = await queryAgentData(actor(), {
      resource: "contacts",
      id: 200,
      search: "%' OR true --"
    });
    expect(result.total).toBe(0);
    const [sql, opts] = query.mock.calls[0];
    expect(sql).toContain('r."companyId"=:companyId');
    expect(sql).toContain('r."id"=:id');
    expect(sql).not.toContain("OR true --");
    expect(opts.replacements.companyId).toBe(1);
    expect(opts.replacements.id).toBe(200);
    expect(opts.replacements.search).toContain("\\%");
  });

  it.each([{ companyId: 2 }, { userId: 20 }, { fingerprint: "permission-v2" }])(
    "binds cursors to tenant, user and permissions: %o",
    async changes => {
      register("contacts");
      query
        .mockResolvedValueOnce([{ total: 2 }])
        .mockResolvedValueOnce([{ id: 11 }]);
      const first = await queryAgentData(actor(), {
        resource: "contacts",
        limit: 1
      });
      query.mockClear();
      await expect(
        queryAgentData(actor(changes), {
          resource: "contacts",
          limit: 1,
          cursor: first.nextCursor
        })
      ).rejects.toMatchObject({ message: "ERR_AGENT_INVALID_CURSOR" });
      expect(query).not.toHaveBeenCalled();
    }
  );

  it("rejects forged cursor signatures and cursor reuse with other filters", async () => {
    register("contacts");
    query
      .mockResolvedValueOnce([{ total: 2 }])
      .mockResolvedValueOnce([{ id: 11 }]);
    const first = await queryAgentData(actor(), {
      resource: "contacts",
      limit: 1
    });
    await expect(
      queryAgentData(actor(), {
        resource: "contacts",
        cursor: `${first.nextCursor}x`
      })
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(
      queryAgentData(actor(), {
        resource: "contacts",
        search: "private",
        cursor: first.nextCursor
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it.each([
    { companyId: 2 },
    { resource: "Users; DROP TABLE Users" },
    { id: {} },
    { chatId: -1 },
    { search: [] },
    { limit: Infinity },
    { dateFrom: "2026-10-07", dateTo: "2026-10-01" }
  ])("rejects invalid selectors and arbitrary scope: %o", async changes => {
    await expect(
      queryAgentData(actor(), { resource: "contacts", ...changes } as any)
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(query).not.toHaveBeenCalled();
  });

  it("enforces private chat membership even for administrators", () => {
    const scope = scopeForResource(
      actor({ profile: "admin" }),
      resourceFor("chat-messages").resource
    );
    expect(scope).toContain('p."companyId"=:companyId');
    expect(scope).toContain("p.id IN (:chatIds)");
  });

  it("preserves personal and queue task visibility and uses parent scope for task events", () => {
    const task = scopeForResource(actor(), resourceFor("tasks").resource);
    expect(task).toContain('"assignedUserId"=:userId');
    expect(task).toContain('"assignedQueueId" IN (:queueIds)');
    expect(
      scopeForResource(actor(), resourceFor("task-events").resource)
    ).toContain('p."targetType"');
  });

  it("uses group membership and queue grants for tickets and messages", () => {
    const scope = scopeForResource(actor(), resourceFor("messages").resource);
    expect(scope).toContain('r."isDeleted"=false');
    expect(scope).toContain('"GroupQueues"');
    expect(scope).toContain('gq."companyId"=:companyId');
    expect(scope).toContain('p."userId"=:userId');
  });

  it("does not expose ticket-tag links when ticket module is blocked", () => {
    const denied = actor();
    denied.policy.modules.atendimentos = false;
    expect(() =>
      scopeForResource(denied, resourceFor("ticket-tags").resource)
    ).toThrow("ERR_AGENT_MODULE_BLOCKED");
  });

  it("explicitly projects records rather than selecting entire rows", async () => {
    register("users");
    query
      .mockResolvedValueOnce([{ total: 1 }])
      .mockResolvedValueOnce([{ id: 10, name: "Only tenant 1" }]);
    await queryAgentData(actor(), { resource: "users" });
    const sql = query.mock.calls[1][0];
    expect(sql).not.toContain("SELECT *");
    expect(sql).not.toContain("passwordHash");
    expect(sql).not.toContain('"super"');
  });
  it("marks truncated text as partial and allows a later scoped chunk", async () => {
    register("messages");
    query.mockResolvedValueOnce([{ total: 1 }]).mockResolvedValueOnce([
      {
        id: "message-key",
        ticketId: 1,
        body: "x".repeat(1500),
        textLengths: { body: 4000 }
      }
    ]);
    const first = await queryAgentData(actor(), {
      resource: "messages",
      id: "message-key",
      ticketId: 1
    });
    expect(first.coverage.complete).toBe(false);
    query.mockResolvedValueOnce([{ total: 1 }]).mockResolvedValueOnce([
      {
        id: "message-key",
        ticketId: 1,
        body: "remainder",
        textLengths: { body: 4000 }
      }
    ]);
    await queryAgentData(actor(), {
      resource: "messages",
      id: "message-key",
      ticketId: 1,
      offset: 1500
    });
    const [sql, options] = query.mock.calls[3];
    expect(sql).toContain("FROM (:textOffset + 1)");
    expect(options.replacements.textOffset).toBe(1500);
    expect(sql).toContain('r."id",');
    await expect(
      queryAgentData(actor(), { resource: "messages", offset: 1500 })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe("Owned catalog coverage", () => {
  it("defines unique module/resource keys and excludes credentials and raw provider payloads", () => {
    const resources = AGENT_MODULES.flatMap(module => module.resources);
    expect(new Set(resources.map(resource => resource.key)).size).toBe(
      resources.length
    );
    resources.forEach(resource =>
      expect(resource.fields).not.toEqual(
        expect.arrayContaining(["passwordHash"])
      )
    );
    expect(
      resources
        .flatMap(resource => resource.fields)
        .filter(field =>
          /password|token|session|secret|qrcode|apikey|paygwdata|datajson/i.test(
            field
          )
        )
    ).toEqual([]);
  });

  it("maps allowlisted fields to declared model attributes", () => {
    const modelFolder = path.resolve(__dirname, "../../../models");
    const declared = fs
      .readdirSync(modelFolder)
      .filter(name => name.endsWith(".ts"))
      .map(name => {
        const source = ts.createSourceFile(
          name,
          fs.readFileSync(path.join(modelFolder, name), "utf8"),
          ts.ScriptTarget.Latest,
          true
        );
        const cls = source.statements.find(ts.isClassDeclaration);
        if (!cls) return null;
        const table =
          source.text.match(/tableName:\s*"([^"]+)"/)?.[1] ||
          `${cls.name.text}s`;
        const attributes = cls.members
          .filter(
            member =>
              ts.isPropertyDeclaration(member) || ts.isGetAccessor(member)
          )
          .filter(member =>
            (ts.getDecorators(member as any) || []).some(decorator =>
              /^(Column|CreatedAt|UpdatedAt)(\(|$)/.test(
                decorator.expression.getText(source)
              )
            )
          )
          .map(member => member.name.getText(source));
        return { table, attributes: ["id", ...attributes] };
      })
      .filter(Boolean);
    const missing: string[] = [];
    AGENT_MODULES.forEach(module =>
      module.resources.forEach(resource => {
        const model = declared.find(item => item.table === resource.table);
        if (!model) missing.push(`Missing model ${resource.table}`);
        resource.fields.forEach(field => {
          if (!model?.attributes.includes(field))
            missing.push(`${resource.table}.${field}`);
        });
      })
    );
    expect(missing).toEqual([]);
  });
});
