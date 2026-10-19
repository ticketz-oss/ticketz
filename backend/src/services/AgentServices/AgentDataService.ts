import { createHmac, timingSafeEqual } from "crypto";
import { QueryTypes } from "sequelize";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import { AgentActor, assertModule } from "./AgentPolicyService";
import { AgentResource, AGENT_MODULES, resourceFor } from "./AgentCatalog";

const q = (field: string) => `"${field}"`;
const tenant = (alias: string) => `${alias}."companyId"=:companyId`;
const ticketScope = (actor: AgentActor, alias: string) => {
  if (actor.exportMode) return tenant(alias);
  const individual = `(${alias}."queueId" IN (:queueIds)${actor.profile === "admin" ? ` OR ${alias}."queueId" IS NULL` : ""})${actor.profile === "admin" ? "" : ` AND (${alias}."userId"=:userId OR ${alias}.status='pending')`}`;
  const group =
    actor.profile === "admin"
      ? "true"
      : `EXISTS (SELECT 1 FROM "GroupQueues" gq JOIN "Queues" gqq ON gqq.id=gq."queueId" AND gqq."companyId"=:companyId WHERE gq."companyId"=:companyId AND gq."groupContactId"=${alias}."contactId" AND gq."queueId" IN (:queueIds))`;
  return `${tenant(alias)} AND ((${alias}."isGroup"=false AND (${individual})) OR (${alias}."isGroup"=true AND (${group})))`;
};
const taskScope = (actor: AgentActor, alias: string) =>
  `${tenant(alias)}${actor.profile === "admin" ? "" : ` AND (${alias}."targetType"='GLOBAL' OR (${alias}."targetType"='USER' AND ${alias}."assignedUserId"=:userId) OR (${alias}."targetType"='QUEUE' AND ${alias}."assignedQueueId" IN (:queueIds)))`}`;
export const scopeForResource = (
  actor: AgentActor,
  resource: AgentResource
): string => {
  const parent = (table: string, fk: string, condition = tenant("p")) =>
    `EXISTS (SELECT 1 FROM ${q(table)} p WHERE p.id=r.${q(fk)} AND ${condition})`;
  switch (resource.scope) {
    case "tickets":
      return ticketScope(actor, "r");
    case "messages":
      return `${tenant("r")} AND r."isDeleted"=false AND ${parent("Tickets", "ticketId", ticketScope(actor, "p"))}`;
    case "ticketChild":
      return `${resource.table !== "TicketNotes" ? `${tenant("r")} AND ` : ""}${parent("Tickets", "ticketId", ticketScope(actor, "p"))}`;
    case "chats":
      return `${tenant("r")}${actor.exportMode ? "" : " AND r.id IN (:chatIds)"}`;
    case "chatChild":
      return parent(
        "Chats",
        "chatId",
        `${tenant("p")}${actor.exportMode ? "" : " AND p.id IN (:chatIds)"}`
      );
    case "tasks":
      return taskScope(actor, "r");
    case "taskChild":
      return `${tenant("r")} AND ${parent("TaskBoardTasks", "taskId", taskScope(actor, "p"))}`;
    case "queues":
      return `${tenant("r")}${actor.profile === "admin" ? "" : " AND r.id IN (:queueIds)"}`;
    case "queueOptions":
      return `EXISTS (WITH RECURSIVE ancestors AS (SELECT r.id,r."parentId",r."queueId" UNION SELECT p.id,p."parentId",p."queueId" FROM "QueueOptions" p JOIN ancestors a ON a."parentId"=p.id WHERE a."queueId" IS NULL) SELECT 1 FROM ancestors a JOIN "Queues" p ON p.id=a."queueId" WHERE ${tenant("p")})`;
    case "contactChild":
      return parent("Contacts", "contactId");
    case "contactTag":
      assertModule(actor, "contatos");
      return `${parent("Contacts", "contactId")} AND ${parent("Tags", "tagId")}`;
    case "ticketTag":
      assertModule(actor, "atendimentos");
      return `${parent("Tickets", "ticketId", ticketScope(actor, "p"))} AND ${parent("Tags", "tagId")}`;
    case "scheduleChild":
      return `${parent("Schedules", "scheduleId")} AND ${parent("Contacts", "contactId")}`;
    case "campaignChild":
      return parent("Campaigns", "campaignId");
    case "listChild":
      return parent("ContactLists", "contactListId");
    case "prospectingChild":
      return `${tenant("r")} AND ${parent("ProspeccaoAutomacoes", "automationId")}`;
    case "userQueue":
      return `${parent("Users", "userId")} AND ${parent("Queues", "queueId")}`;
    case "quickMessages":
      return `${tenant("r")}${actor.exportMode ? "" : ` AND (COALESCE((SELECT value FROM "Settings" WHERE "companyId"=:companyId AND key='quickMessages' LIMIT 1),'individual')<>'individual' OR r."userId"=:userId)`}`;
    case "calls":
      return `${tenant("r")}${actor.profile === "admin" ? "" : ' AND (r."userId"=:userId OR r."queueId" IN (:queueIds) OR EXISTS (SELECT 1 FROM "Queues" cq WHERE cq."companyId"=:companyId AND cq.id IN (:queueIds) AND r."queueIds" @> jsonb_build_array(cq.id)))'}`;
    case "settings":
      return `${tenant("r")} AND r.key IN ('scheduleType','quickMessages','defaultLanguage','userRating','tagsMode','groupsTab','callType','chatbotAutoExit','outOfHoursAction','keepUserAndQueue','noQueueTimeout','openTicketTimeout')`;
    case "announcements":
      return `(r."isGlobal"=true OR ${tenant("r")}) AND r.status=true AND (r."startsAt" IS NULL OR r."startsAt"<=NOW()) AND (r."endsAt" IS NULL OR r."endsAt">=NOW())${actor.exportMode ? "" : ` AND (r."audienceMode"='ALL' OR :profile=ANY(r.profiles) OR EXISTS (SELECT 1 FROM "AnnouncementUsers" x WHERE x."announcementId"=r.id AND x."userId"=:userId) OR EXISTS (SELECT 1 FROM "AnnouncementQueues" x WHERE x."announcementId"=r.id AND x."queueId" IN (:queueIds)) OR EXISTS (SELECT 1 FROM "AnnouncementWhatsapps" x JOIN "WhatsappQueues" w ON w."whatsappId"=x."whatsappId" JOIN "Queues" aq ON aq.id=w."queueId" AND aq."companyId"=:companyId WHERE x."announcementId"=r.id AND w."queueId" IN (:queueIds)))`}`;
    case "help":
      return `r."isActive"=true${actor.profile === "admin" ? "" : ' AND r."adminOnly"=false'} AND ${parent("HelpGroups", "groupId", `p."isActive"=true AND p.audience='company' AND (p."isGlobal"=true OR ${tenant("p")})${actor.profile === "admin" ? "" : ' AND p."adminOnly"=false'}`)}`;
    default:
      return tenant("r");
  }
};
const replacementsFor = (actor: AgentActor) => ({
  companyId: actor.companyId,
  userId: actor.userId,
  profile: actor.profile,
  queueIds: actor.queueIds.length ? actor.queueIds : [-1],
  chatIds: actor.chatIds.length ? actor.chatIds : [-1]
});
const signer = (value: string) =>
  createHmac(
    "sha256",
    process.env.JWT_SECRET ||
      process.env.HERMES_CHAT_BRIDGE_KEY ||
      "agent-development-cursor"
  )
    .update(value)
    .digest("base64url");
const encodeCursor = (payload: object) => {
  const value = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${value}.${signer(value)}`;
};
const decodeCursor = (cursor: string, binding: string) => {
  try {
    const [value, signature] = cursor.split(".");
    const expected = Buffer.from(signer(value));
    const received = Buffer.from(signature || "");
    if (
      expected.length !== received.length ||
      !timingSafeEqual(Uint8Array.from(expected), Uint8Array.from(received))
    )
      throw new Error();
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString());
    if (
      decoded.binding !== binding ||
      !Number.isSafeInteger(decoded.offset) ||
      decoded.offset < 0
    )
      throw new Error();
    return decoded.offset as number;
  } catch {
    throw new AppError("ERR_AGENT_INVALID_CURSOR", 400);
  }
};
export type AgentFilters = {
  resource: string;
  search?: string;
  id?: string | number;
  ticketId?: number;
  chatId?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
  offset?: number;
};
export const queryAgentData = async (
  actor: AgentActor,
  input: AgentFilters,
  options: { exportOffset?: number; metrics?: boolean; fullText?: boolean } = {}
) => {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    typeof input.resource !== "string"
  )
    throw new AppError("ERR_AGENT_INVALID_REQUEST", 400);
  const allowedFilters = [
    "resource",
    "search",
    "id",
    "ticketId",
    "chatId",
    "status",
    "dateFrom",
    "dateTo",
    "cursor",
    "limit",
    "offset"
  ];
  if (Object.keys(input).some(key => !allowedFilters.includes(key)))
    throw new AppError("ERR_AGENT_INVALID_REQUEST", 400);
  (["search", "status", "dateFrom", "dateTo", "cursor"] as const).forEach(
    name => {
      if (input[name] !== undefined && typeof input[name] !== "string")
        throw new AppError("ERR_AGENT_INVALID_REQUEST", 400);
    }
  );
  if (
    input.id !== undefined &&
    !(
      (typeof input.id === "string" &&
        input.id.length > 0 &&
        input.id.length <= 128) ||
      (Number.isSafeInteger(input.id) && Number(input.id) > 0)
    )
  )
    throw new AppError("ERR_AGENT_INVALID_REQUEST", 400);
  (["ticketId", "chatId"] as const).forEach(name => {
    if (
      input[name] !== undefined &&
      (!Number.isSafeInteger(input[name]) || input[name] <= 0)
    )
      throw new AppError("ERR_AGENT_INVALID_REQUEST", 400);
  });
  if (
    input.limit !== undefined &&
    (!Number.isSafeInteger(input.limit) || input.limit <= 0)
  )
    throw new AppError("ERR_AGENT_INVALID_REQUEST", 400);
  if (
    input.offset !== undefined &&
    (!Number.isSafeInteger(input.offset) ||
      input.offset < 0 ||
      input.offset > 10000000 ||
      (input.offset > 0 && input.id === undefined))
  )
    throw new AppError("ERR_AGENT_INVALID_REQUEST", 400);
  if (
    (input.cursor?.length || 0) > 2048 ||
    (input.status?.length || 0) > 128 ||
    (input.dateFrom &&
      input.dateTo &&
      Date.parse(input.dateFrom) > Date.parse(input.dateTo))
  )
    throw new AppError("ERR_AGENT_INVALID_REQUEST", 400);
  const definition = resourceFor(input?.resource);
  if (!definition) throw new AppError("ERR_AGENT_INVALID_RESOURCE", 400);
  assertModule(actor, definition.module.key);
  if (options.metrics) assertModule(actor, "relatorios");
  const { resource } = definition;
  // Filter against the actual registered model, failing on missing tables rather than querying arbitrary SQL.
  const model = Object.values(sequelize.models).find(
    item => item.getTableName() === resource.table
  );
  if (!model) throw new AppError("ERR_AGENT_RESOURCE_UNAVAILABLE", 503);
  const fields = resource.fields.filter(field => model.rawAttributes[field]);
  const replacements: Record<string, unknown> = replacementsFor(actor);
  const clauses = [scopeForResource(actor, resource)];
  (["id", "ticketId", "chatId", "status"] as const).forEach(name => {
    if (input[name] !== undefined) {
      if (!fields.includes(name) || String(input[name]).length > 128)
        throw new AppError("ERR_AGENT_INVALID_REQUEST", 400);
      clauses.push(`r.${q(name)}=:${name}`);
      replacements[name] = input[name];
    }
  });
  if (input.search) {
    if (
      typeof input.search !== "string" ||
      input.search.length > 200 ||
      !resource.search?.length
    )
      throw new AppError("ERR_AGENT_INVALID_REQUEST", 400);
    clauses.push(
      `(${resource.search
        .filter(field => fields.includes(field))
        .map(field => `r.${q(field)}::text ILIKE :search`)
        .join(" OR ")})`
    );
    replacements.search = `%${input.search.replace(/[\\%_]/g, "\\$&")}%`;
  }
  [
    ["dateFrom", ">="],
    ["dateTo", "<="]
  ].forEach(([name, operator]) => {
    if (input[name]) {
      if (
        !fields.includes("createdAt") ||
        !Number.isFinite(Date.parse(input[name]))
      )
        throw new AppError("ERR_AGENT_INVALID_REQUEST", 400);
      clauses.push(`r."createdAt"${operator}:${name}`);
      replacements[name] = new Date(input[name]);
    }
  });
  const where = clauses.map(clause => `(${clause})`).join(" AND ");
  const from = `FROM ${q(resource.table)} r WHERE ${where}`;
  const binding = signer(
    JSON.stringify([
      actor.companyId,
      actor.userId,
      actor.fingerprint,
      input.resource,
      input.search,
      input.id,
      input.ticketId,
      input.chatId,
      input.status,
      input.dateFrom,
      input.dateTo,
      input.offset
    ])
  );
  const offset =
    options.exportOffset ??
    (input.cursor ? decodeCursor(input.cursor, binding) : 0);
  if (!Number.isSafeInteger(offset) || offset < 0)
    throw new AppError("ERR_AGENT_INVALID_CURSOR", 400);
  const counts = await sequelize.query<{ total: number }>(
    `SELECT COUNT(*)::int AS total ${from}`,
    { replacements, type: QueryTypes.SELECT }
  );
  const total = Number(counts[0]?.total || 0);
  const observedAt = new Date().toISOString();
  if (options.metrics) {
    const group = ["status", "state", "targetType", "kind"].find(field =>
      fields.includes(field)
    );
    const distribution = group
      ? await sequelize.query(
          `SELECT r.${q(group)} AS value,COUNT(*)::int AS count ${from} GROUP BY r.${q(group)} ORDER BY count DESC`,
          { replacements, type: QueryTypes.SELECT }
        )
      : [];
    return {
      resource: resource.key,
      total,
      distribution,
      observedAt,
      coverage: { total, complete: true },
      records: [],
      nextCursor: null
    };
  }
  const limit = Number.isInteger(input.limit)
    ? Math.max(1, Math.min(input.limit, options.fullText ? 100 : 20))
    : 10;
  const textFields = fields.filter(
    field =>
      field !== "id" &&
      ["TEXT", "STRING"].includes(
        (model.rawAttributes[field].type as { key?: string })?.key
      )
  );
  const textOffset = input.offset || 0;
  const selection =
    fields
      .map(field => {
        const text = (model.rawAttributes[field].type as { key?: string })?.key;
        return !options.fullText &&
          field !== "id" &&
          ["TEXT", "STRING"].includes(text)
          ? `SUBSTRING(r.${q(field)}::text FROM (:textOffset + 1) FOR 1500) AS ${q(field)}`
          : `r.${q(field)}`;
      })
      .join(",") +
    (!options.fullText && textFields.length
      ? `,jsonb_build_object(${textFields.map(field => `'${field}',length(r.${q(field)}::text)`).join(",")}) AS "textLengths"`
      : "");
  const orderFields = fields.includes("id")
    ? ["id", ...(fields.includes("ticketId") ? ["ticketId"] : [])]
    : fields.slice(0, 2);
  const records = await sequelize.query<Record<string, unknown>>(
    `SELECT ${selection} ${from} ORDER BY ${orderFields.map(field => `r.${q(field)}`).join(",")} LIMIT :limit OFFSET :offset`,
    {
      replacements: { ...replacements, limit, offset, textOffset },
      type: QueryTypes.SELECT
    }
  );
  const textComplete =
    options.fullText ||
    (textOffset === 0 &&
      records.every(record =>
        Object.values(
          (record.textLengths || {}) as Record<string, number>
        ).every(length => length <= 1500)
      ));
  return {
    resource: resource.key,
    records,
    total,
    observedAt,
    coverage: {
      total,
      returned: records.length,
      offset,
      complete: offset === 0 && records.length >= total && textComplete,
      textTruncatedAt: options.fullText ? null : 1500,
      textOffset
    },
    nextCursor:
      offset + records.length < total
        ? encodeCursor({ binding, offset: offset + records.length })
        : null
  };
};
export const agentCatalog = (actor: AgentActor) =>
  AGENT_MODULES.filter(
    module =>
      actor.policy.modules?.[module.key] !== false &&
      (!module.admin || actor.profile === "admin")
  ).map(({ key, title, description, usage, resources }) => ({
    key,
    title,
    description,
    usage,
    resources: resources.map(resource => ({
      key: resource.key,
      fields: resource.fields,
      table: resource.table,
      searchFields: resource.search
    }))
  }));
