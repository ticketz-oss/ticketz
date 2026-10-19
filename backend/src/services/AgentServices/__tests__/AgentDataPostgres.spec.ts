/* eslint-disable @typescript-eslint/no-explicit-any -- Partial registered models represent transaction-local temporary tables only. */
import { Sequelize } from "sequelize";
import fs from "fs";
import path from "path";
import sequelize from "../../../database";
import { AgentActor } from "../AgentPolicyService";
import { defaultModules } from "../AgentCatalog";
import { queryAgentData } from "../AgentDataService";

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

// Opt-in integration: transaction-local temporary tables on one PostgreSQL
// connection shadow the application tables. No live rows are inserted/updated.
const describePg =
  process.env.AGENT_SECURITY_PG_TEST === "true" ? describe : describe.skip;
describePg("Agent SQL isolation on PostgreSQL temporary fixtures", () => {
  let db: Sequelize;
  let transaction: any;
  const longText = `${"A".repeat(4190)}THE-END`;
  const actor = (companyId = 1, userId = 10): AgentActor => ({
    companyId,
    userId,
    profile: "user",
    queueIds: [7],
    chatIds: [4],
    fingerprint: `tenant-${companyId}-user-${userId}`,
    policy: { enabled: true, modules: defaultModules(), revision: 1 } as any
  });
  const register = (table: string, fields: Record<string, string>) => {
    sequelize.models[table] = {
      getTableName: () => table,
      rawAttributes: Object.fromEntries(
        Object.entries(fields).map(([key, type]) => [
          key,
          { type: { key: type } }
        ])
      )
    } as any;
  };
  beforeAll(async () => {
    db = new Sequelize(
      process.env.DB_NAME || "ticketz",
      process.env.DB_USER || "postgres",
      process.env.DB_PASS || "",
      {
        dialect: "postgres",
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || "5432"),
        logging: false
      }
    );
    transaction = await db.transaction();
    const exec = (sql: string, replacements: Record<string, unknown> = {}) =>
      db.query(sql, { transaction, replacements });
    await exec(
      'CREATE TEMP TABLE "Contacts" (id int,"companyId" int,name text,email text) ON COMMIT DROP'
    );
    await exec(
      'CREATE TEMP TABLE "Queues" (id int,"companyId" int) ON COMMIT DROP'
    );
    await exec(
      'CREATE TEMP TABLE "GroupQueues" (id int,"companyId" int,"groupContactId" int,"queueId" int) ON COMMIT DROP'
    );
    await exec(
      'CREATE TEMP TABLE "QueueOptions" (id int,title text,message text,"queueId" int,"parentId" int) ON COMMIT DROP'
    );
    await exec(
      'CREATE TEMP TABLE "Tickets" (id int,"companyId" int,"contactId" int,"userId" int,"queueId" int,status text,"isGroup" boolean) ON COMMIT DROP'
    );
    await exec(
      'CREATE TEMP TABLE "Messages" (id text,"companyId" int,"ticketId" int,body text,"isDeleted" boolean) ON COMMIT DROP'
    );
    await exec(
      'CREATE TEMP TABLE "TicketNotes" (id int,"ticketId" int,note text) ON COMMIT DROP'
    );
    await exec(
      'CREATE TEMP TABLE "Chats" (id int,"companyId" int,title text) ON COMMIT DROP'
    );
    await exec(
      'CREATE TEMP TABLE "ChatMessages" (id int,"chatId" int,message text) ON COMMIT DROP'
    );
    await exec(
      'CREATE TEMP TABLE "TaskBoardTasks" (id int,"companyId" int,title text,"targetType" text,"assignedUserId" int,"assignedQueueId" int) ON COMMIT DROP'
    );
    await exec(
      "INSERT INTO \"Contacts\" VALUES (1,1,'Tenant Alpha','a@example.test'),(2,2,'Tenant Beta private','b@example.test')"
    );
    await exec('INSERT INTO "Queues" VALUES (7,1),(8,1),(20,2)');
    await exec(
      "INSERT INTO \"Tickets\" VALUES (1,1,1,10,7,'open',false),(2,1,1,20,8,'open',false),(3,2,2,30,20,'open',false),(4,1,1,null,null,'pending',true)"
    );
    await exec('INSERT INTO "GroupQueues" VALUES (1,1,1,7)');
    await exec(
      "INSERT INTO \"QueueOptions\" VALUES (1,'Own root','Own',7,null),(2,'Own child','Own',null,1),(3,'Foreign root under own parent','Secret',20,1),(4,'Foreign child','Secret',null,3),(5,'Own root under foreign parent','Own',7,3)"
    );
    await exec(
      "INSERT INTO \"Messages\" VALUES ('same-key',1,1,:body,false),('same-key',2,3,'Other company secret',false),('private',1,2,'Other queue secret',false),('deleted',1,1,'Deleted secret',true)",
      { body: longText }
    );
    await exec(
      "INSERT INTO \"TicketNotes\" VALUES (1,1,'Visible note'),(2,2,'Other queue secret'),(3,3,'Other tenant secret')"
    );
    await exec(
      "INSERT INTO \"Chats\" VALUES (4,1,'Participating'),(5,1,'Private nonparticipant'),(6,2,'Other tenant')"
    );
    await exec(
      "INSERT INTO \"ChatMessages\" VALUES (1,4,'Visible internal message'),(2,5,'Private internal secret'),(3,6,'Tenant Beta internal secret')"
    );
    await exec(
      "INSERT INTO \"TaskBoardTasks\" VALUES (1,1,'Own private','USER',10,null),(2,1,'Other private','USER',20,null),(3,1,'Allowed queue','QUEUE',null,7),(4,1,'Blocked queue','QUEUE',null,8),(5,1,'Global tenant','GLOBAL',null,null),(6,2,'Other tenant task','GLOBAL',null,null)"
    );
    register("Contacts", { id: "INTEGER", name: "TEXT", email: "TEXT" });
    register("Tickets", {
      id: "INTEGER",
      status: "TEXT",
      userId: "INTEGER",
      queueId: "INTEGER",
      contactId: "INTEGER",
      isGroup: "BOOLEAN"
    });
    register("Messages", { id: "STRING", ticketId: "INTEGER", body: "TEXT" });
    register("TicketNotes", {
      id: "INTEGER",
      ticketId: "INTEGER",
      note: "TEXT"
    });
    register("Chats", { id: "INTEGER", title: "TEXT" });
    register("ChatMessages", {
      id: "INTEGER",
      chatId: "INTEGER",
      message: "TEXT"
    });
    register("TaskBoardTasks", {
      id: "INTEGER",
      title: "TEXT",
      targetType: "STRING",
      assignedUserId: "INTEGER",
      assignedQueueId: "INTEGER"
    });
    register("QueueOptions", {
      id: "INTEGER",
      title: "TEXT",
      message: "TEXT",
      queueId: "INTEGER",
      parentId: "INTEGER"
    });
    (sequelize.query as jest.Mock).mockImplementation(async (sql, options) => {
      try {
        return await db.query(sql, { ...options, transaction });
      } catch (error) {
        throw new Error(error.message);
      }
    });
  }, 30000);
  afterAll(async () => {
    if (transaction) await transaction.rollback();
    if (db) await db.close();
  });

  it("never returns another tenant through IDs, full text searches or totals", async () => {
    expect(
      (await queryAgentData(actor(), { resource: "contacts", id: 2 })).total
    ).toBe(0);
    expect(
      (await queryAgentData(actor(), { resource: "contacts", search: "Beta" }))
        .total
    ).toBe(0);
    expect(
      (
        await queryAgentData(
          actor(),
          { resource: "contacts" },
          { metrics: true }
        )
      ).total
    ).toBe(1);
    expect(
      (
        await queryAgentData(actor(2, 30), { resource: "contacts" })
      ).records.map(record => record.id)
    ).toEqual([2]);
  });
  it("applies ticket membership to messages, notes, totals and group tickets", async () => {
    expect(
      (await queryAgentData(actor(), { resource: "tickets" })).records.map(
        record => record.id
      )
    ).toEqual([1, 4]);
    expect(
      (await queryAgentData(actor(), { resource: "messages" })).records.map(
        record => record.id
      )
    ).toEqual(["same-key"]);
    expect(
      (await queryAgentData(actor(), { resource: "notes" })).records.map(
        record => record.id
      )
    ).toEqual([1]);
    expect(
      (await queryAgentData(actor(), { resource: "messages", ticketId: 3 }))
        .total
    ).toBe(0);
  });
  it("makes all long text retrievable in scoped chunks while preserving compound IDs", async () => {
    const chunks = await [0, 1500, 3000].reduce(
      async (previous, offset) => {
        const results = await previous;
        results.push(
          await queryAgentData(actor(), {
            resource: "messages",
            id: "same-key",
            ticketId: 1,
            offset
          })
        );
        return results;
      },
      Promise.resolve([] as Awaited<ReturnType<typeof queryAgentData>>[])
    );
    expect(chunks.map(chunk => chunk.records[0].body).join("")).toBe(longText);
    expect(chunks.every(chunk => chunk.records[0].id === "same-key")).toBe(
      true
    );
    expect(chunks[0].records[0].textLengths).toMatchObject({
      body: longText.length
    });
    expect(
      (
        await queryAgentData(actor(), {
          resource: "messages",
          id: "same-key",
          ticketId: 3,
          offset: 3000
        })
      ).records
    ).toEqual([]);
  });
  it("restricts personal and queue tasks, and internal chats even for admins", async () => {
    expect(
      (await queryAgentData(actor(), { resource: "tasks" })).records.map(
        record => record.id
      )
    ).toEqual([1, 3, 5]);
    expect(
      (
        await queryAgentData(actor(), { resource: "chat-messages" })
      ).records.map(record => record.id)
    ).toEqual([1]);
    expect(
      (
        await queryAgentData(
          { ...actor(), profile: "admin" },
          { resource: "chat-messages", chatId: 5 }
        )
      ).records
    ).toEqual([]);
  });
  it("rejects cross-tenant and changed-authorization cursors and immediately blocks modules", async () => {
    const first = await queryAgentData(actor(), {
      resource: "tasks",
      limit: 1
    });
    await expect(
      queryAgentData(actor(2, 30), {
        resource: "tasks",
        cursor: first.nextCursor
      })
    ).rejects.toMatchObject({ message: "ERR_AGENT_INVALID_CURSOR" });
    await expect(
      queryAgentData(
        { ...actor(), fingerprint: "revoked" },
        { resource: "tasks", cursor: first.nextCursor }
      )
    ).rejects.toMatchObject({ message: "ERR_AGENT_INVALID_CURSOR" });
    const revoked = actor();
    revoked.policy.modules.tarefas = false;
    await expect(
      queryAgentData(revoked, { resource: "tasks" })
    ).rejects.toMatchObject({ statusCode: 403 });
  });
  it("changes the authorization digest when a temporary task is reassigned", async () => {
    const source = fs.readFileSync(
      path.join(__dirname, "../AgentPolicyService.ts"),
      "utf8"
    );
    const sql = source.match(/const authorizationDigestSql = `([\s\S]*?)`;/)[1];
    const run = () =>
      db.query<{ digest: string }>(sql, {
        replacements: { companyId: 1 },
        transaction,
        type: "SELECT" as any
      });
    const before = await run();
    await db.query(
      'UPDATE "TaskBoardTasks" SET "assignedUserId"=20 WHERE id=1',
      { transaction }
    );
    const after = await run();
    expect(before[0].digest).not.toBe(after[0].digest);
    await db.query(
      'UPDATE "TaskBoardTasks" SET "assignedUserId"=10 WHERE id=1',
      { transaction }
    );
  });
  it("scopes flows to their nearest owning queue and invalidates context after moving a child", async () => {
    const admin = { ...actor(), profile: "admin" };
    const rows = await queryAgentData(admin, { resource: "flow-options" });
    expect(rows.records.map(row => row.id)).toEqual([1, 2, 5]);
    const source = fs.readFileSync(
      path.join(__dirname, "../AgentPolicyService.ts"),
      "utf8"
    );
    const sql = source.match(/const authorizationDigestSql = `([\s\S]*?)`;/)[1];
    const run = () =>
      db.query<{ digest: string }>(sql, {
        replacements: { companyId: 1 },
        transaction,
        type: "SELECT" as any
      });
    const before = await run();
    await db.query('UPDATE "QueueOptions" SET "parentId"=3 WHERE id=2', {
      transaction
    });
    expect(
      (await queryAgentData(admin, { resource: "flow-options", id: 2 })).records
    ).toEqual([]);
    expect((await run())[0].digest).not.toBe(before[0].digest);
    await db.query('UPDATE "QueueOptions" SET "parentId"=1 WHERE id=2', {
      transaction
    });
  });
});
