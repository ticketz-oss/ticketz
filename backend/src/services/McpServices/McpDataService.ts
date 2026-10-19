import { createHmac, timingSafeEqual } from "crypto";
import { QueryTypes } from "sequelize";
import { DateTime } from "luxon";
import sequelize from "../../database";
import mcpConfig from "../../config/mcp";
import Company from "../../models/Company";
import CommemorativeDate from "../../models/CommemorativeDate";
import Queue from "../../models/Queue";
import Tag from "../../models/Tag";
import User from "../../models/User";
import AppError from "../../errors/AppError";
import { BUILT_IN_SCHEDULE_VARIABLES } from "../ScheduleServices/variables";
import { QUICK_MESSAGE_LIMITS } from "./McpQuickMessageService";
import { SCHEDULE_LIMITS } from "./McpScheduleService";
import { getTenantTimezone as getTimezone } from "./tenantTimezone";
import { McpAuthContext } from "./OAuthService";

type Filters = {
  date_from?: string;
  date_to?: string;
  status?: string;
  attendant_id?: number;
  queue_id?: number;
  tag_id?: number;
  contact?: string;
  rating?: number;
};

type ContactFilters = {
  search?: string;
  tag_id?: number;
  language?: string;
  birthday_month?: number;
  birthday_day?: number;
  has_birthday?: boolean;
  cursor?: string;
  limit?: number;
};

type ScheduleFilters = {
  date_from?: string;
  date_to?: string;
  kind?: string;
  status?: string;
  active?: boolean;
  contact_id?: number;
  commemorative_date_id?: number;
  cursor?: string;
  limit?: number;
};

const birthdayExpression = (alias: string): string =>
  `CASE WHEN ${alias}."birthdayDay" IS NOT NULL AND ${alias}."birthdayMonth" IS NOT NULL THEN LPAD(${alias}."birthdayDay"::text,2,'0')||'/'||LPAD(${alias}."birthdayMonth"::text,2,'0') END`;

const contactColumns = `c.name AS "contactName",c.nickname AS "contactNickname",c.number AS "contactPhone",c.email AS "contactEmail",c.language AS "contactLanguage",c."birthdayDay" AS "contactBirthdayDay",c."birthdayMonth" AS "contactBirthdayMonth",${birthdayExpression(
  "c"
)} AS "contactBirthday"`;

type CursorData = {
  companyId: number;
  filtersHash: string;
  createdAt: string;
  id: string | number;
  offset?: number;
};

const signCursor = (payload: string): string =>
  createHmac("sha256", mcpConfig.cursorSecret)
    .update(payload)
    .digest("base64url");

const encodeCursor = (data: CursorData): string => {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${signCursor(payload)}`;
};

const hashFilters = (filters: unknown): string =>
  createHmac("sha256", mcpConfig.cursorSecret)
    .update(JSON.stringify(filters))
    .digest("base64url");

const decodeCursor = (
  cursor: string,
  auth: McpAuthContext,
  filters: unknown
): CursorData => {
  const [payload, signature] = String(cursor || "").split(".");
  if (!payload || !signature) throw new AppError("invalid_cursor", 400);
  const expected = Uint8Array.from(Buffer.from(signCursor(payload)));
  const received = Uint8Array.from(Buffer.from(signature));
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    throw new AppError("invalid_cursor", 400);
  }
  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    ) as CursorData;
    if (
      data.companyId !== auth.companyId ||
      data.filtersHash !== hashFilters(filters)
    ) {
      throw new Error();
    }
    return data;
  } catch {
    throw new AppError("invalid_cursor", 400);
  }
};

const parseTenantDate = (
  value: string,
  timezone: string,
  end: boolean
): DateTime => {
  const parsed = DateTime.fromISO(value, { zone: timezone });
  if (!parsed.isValid) throw new AppError("invalid_date_range", 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return parsed;
  return end ? parsed.endOf("day") : parsed.startOf("day");
};

export const resolvePeriod = async (
  companyId: number,
  dateFrom?: string,
  dateTo?: string
): Promise<{
  dateFrom: string;
  dateTo: string;
  timezone: string;
  fromUtc: Date;
  toUtc: Date;
}> => {
  const timezone = await getTimezone(companyId);
  const now = DateTime.now().setZone(timezone);
  const from = dateFrom
    ? parseTenantDate(dateFrom, timezone, false)
    : now.minus({ days: 30 }).startOf("day");
  const to = dateTo ? parseTenantDate(dateTo, timezone, true) : now;
  if (from > to || to.diff(from, "days").days > 366) {
    throw new AppError("date_range_must_be_at_most_366_days", 400);
  }
  return {
    dateFrom: from.toISO(),
    dateTo: to.toISO(),
    timezone,
    fromUtc: from.toUTC().toJSDate(),
    toUtc: to.toUTC().toJSDate()
  };
};

const whereForFilters = (
  filters: Filters,
  replacements: Record<string, unknown>
): string => {
  const clauses: string[] = [];
  if (filters.status) {
    clauses.push('t."status" = :status');
    replacements.status = filters.status;
  }
  if (filters.attendant_id) {
    clauses.push('t."userId" = :attendantId');
    replacements.attendantId = filters.attendant_id;
  }
  if (filters.queue_id) {
    clauses.push('t."queueId" = :queueId');
    replacements.queueId = filters.queue_id;
  }
  if (filters.tag_id) {
    clauses.push(
      'EXISTS (SELECT 1 FROM "TicketTags" tt0 WHERE tt0."ticketId" = t.id AND tt0."tagId" = :tagId)'
    );
    replacements.tagId = filters.tag_id;
  }
  if (filters.contact) {
    clauses.push(
      "(c.name ILIKE :contact OR c.nickname ILIKE :contact OR c.number ILIKE :contact OR c.email ILIKE :contact)"
    );
    replacements.contact = `%${filters.contact.slice(0, 80)}%`;
  }
  if (filters.rating) {
    clauses.push(
      'EXISTS (SELECT 1 FROM "UserRatings" ur0 WHERE ur0."ticketId" = t.id AND ur0."companyId" = :companyId AND ur0.rate = :rating)'
    );
    replacements.rating = filters.rating;
  }
  return clauses.length ? ` AND ${clauses.join(" AND ")}` : "";
};

const baseReplacements = (
  auth: McpAuthContext,
  period: { fromUtc: Date; toUtc: Date }
): Record<string, unknown> => ({
  companyId: auth.companyId,
  dateFrom: period.fromUtc,
  dateTo: period.toUtc
});

export const getMcpWriteCapabilities = (scopes: string[]) => {
  const quickMessageWrites = scopes.includes("quick_messages:write");
  const scheduleWrites = scopes.includes("schedules:write");
  return {
    writeActions: quickMessageWrites || scheduleWrites,
    quickMessageWrites,
    scheduleWrites,
    schedulePreviewConfirmationRequired: scheduleWrites
  };
};

export const getTicketzContext = async (auth: McpAuthContext) => {
  const [company, attendants, queues, tags, commemorativeDates] =
    await Promise.all([
      Company.findByPk(auth.companyId, {
        attributes: ["id", "name", "slug", "schedules"]
      }),
      User.findAll({
        where: { companyId: auth.companyId },
        attributes: ["id", "name", "profile"],
        order: [["name", "ASC"]]
      }),
      Queue.findAll({
        where: { companyId: auth.companyId },
        attributes: ["id", "name"],
        order: [["name", "ASC"]]
      }),
      Tag.findAll({
        where: { companyId: auth.companyId },
        attributes: ["id", "name"],
        order: [["name", "ASC"]]
      }),
      CommemorativeDate.findAll({
        where: { companyId: auth.companyId },
        attributes: [
          "id",
          "name",
          "ruleType",
          "month",
          "day",
          "weekday",
          "ordinal",
          "active"
        ],
        order: [
          ["month", "ASC"],
          ["day", "ASC"],
          ["name", "ASC"]
        ]
      })
    ]);
  if (!company) throw new AppError("tenant_not_found", 404);
  const timezone = await getTimezone(auth.companyId);
  return {
    tenant: { id: company.id, name: company.name, slug: company.slug },
    timezone,
    defaultPeriodDays: 30,
    attendants,
    queues,
    tags,
    commemorativeDates,
    contactFields: {
      nickname: "Optional short name used by the {{apelido}} message variable.",
      birthday:
        "Day and month only, without year. Formatted as DD/MM in contactBirthday and used by the {{aniversario}} variable and BIRTHDAY schedules.",
      language: "Contact language code used to localize automatic messages.",
      extraInfo: "Tenant-defined custom fields, exposed as {{extra.<key>}}."
    },
    scheduleKinds: {
      ONCE: "Single delivery at sendAt.",
      BIRTHDAY:
        "Annual delivery on each contact birthday at sendTime in the schedule timezone.",
      COMMEMORATIVE:
        "Annual delivery on the linked commemorative date at sendTime in the schedule timezone."
    },
    scheduleAudienceModes: {
      ALL: "Every eligible WhatsApp contact of the tenant.",
      SELECTED: "Only the contacts listed in the schedule audience."
    },
    scheduleVariables: BUILT_IN_SCHEDULE_VARIABLES,
    limits: {
      listConversations: 100,
      readConversations: 25,
      messagesPerBatch: 500,
      responseBytes: 204800,
      listContacts: 200,
      listSchedules: 100,
      quickMessageShortcodeLength: QUICK_MESSAGE_LIMITS.shortcodeMaxLength,
      quickMessageLength: QUICK_MESSAGE_LIMITS.messageMaxLength,
      scheduleBodyMinLength: SCHEDULE_LIMITS.bodyMinLength,
      scheduleBodyMaxLength: SCHEDULE_LIMITS.bodyMaxLength,
      maxScheduleContacts: SCHEDULE_LIMITS.maxSelectedContacts,
      scheduleConfirmationTtlMinutes: SCHEDULE_LIMITS.confirmationTtlMinutes
    },
    capabilities: {
      deterministicStats: true,
      conversationText: true,
      contactDirectory: true,
      contactBirthdays: true,
      scheduleReads: true,
      mediaFiles: false,
      // Respostas rápidas são modelos de texto que um atendente dispara
      // depois, então criá-las não envia mensagem. Agendamentos programam um
      // envio futuro: criar um não dispara nada agora, o ScheduleMonitor é que
      // entrega na data. Excluir e antecipar continuam fora do MCP.
      ...getMcpWriteCapabilities(auth.scopes),
      sendMessages: false,
      scheduleDeletes: false,
      scheduleSendNow: false,
      scheduleMedia: false,
      contactWrites: false
    },
    scopes: auth.scopes
  };
};

export const getConversationStats = async (
  auth: McpAuthContext,
  filters: Filters
) => {
  const period = await resolvePeriod(
    auth.companyId,
    filters.date_from,
    filters.date_to
  );
  const replacements = baseReplacements(auth, period);
  const extra = whereForFilters(filters, replacements);
  const eligible = `t."companyId" = :companyId AND EXISTS (SELECT 1 FROM "Messages" mx WHERE mx."ticketId" = t.id AND mx."companyId" = :companyId AND mx."createdAt" BETWEEN :dateFrom AND :dateTo)${extra}`;
  const joins = `FROM "Tickets" t JOIN "Contacts" c ON c.id=t."contactId" LEFT JOIN "Users" u ON u.id=t."userId" LEFT JOIN "Queues" q ON q.id=t."queueId"`;
  const queries = await Promise.all([
    sequelize.query(
      `SELECT COUNT(DISTINCT t.id)::int AS total, COUNT(DISTINCT t."contactId")::int AS contacts, MIN(m."createdAt") AS first, MAX(m."createdAt") AS last, COUNT(DISTINCT (m.id,m."ticketId"))::int AS messages ${joins} JOIN "Messages" m ON m."ticketId"=t.id AND m."companyId"=:companyId AND m."createdAt" BETWEEN :dateFrom AND :dateTo WHERE ${eligible}`,
      { replacements, type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT t.status AS key, COUNT(DISTINCT t.id)::int AS total ${joins} WHERE ${eligible} GROUP BY t.status ORDER BY total DESC`,
      { replacements, type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT COALESCE(u.id,0) AS id, COALESCE(u.name,'Unassigned') AS name, COUNT(DISTINCT t.id)::int AS total ${joins} WHERE ${eligible} GROUP BY u.id,u.name ORDER BY total DESC`,
      { replacements, type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT COALESCE(q.id,0) AS id, COALESCE(q.name,'Unassigned') AS name, COUNT(DISTINCT t.id)::int AS total ${joins} WHERE ${eligible} GROUP BY q.id,q.name ORDER BY total DESC`,
      { replacements, type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT DATE(m."createdAt" AT TIME ZONE :timezone) AS day, COUNT(DISTINCT t.id)::int AS conversations, COUNT(DISTINCT (m.id,m."ticketId"))::int AS messages ${joins} JOIN "Messages" m ON m."ticketId"=t.id AND m."companyId"=:companyId AND m."createdAt" BETWEEN :dateFrom AND :dateTo WHERE ${eligible} GROUP BY day ORDER BY day`,
      {
        replacements: { ...replacements, timezone: period.timezone },
        type: QueryTypes.SELECT
      }
    ),
    sequelize.query(
      `SELECT tg.id,tg.name,COUNT(DISTINCT t.id)::int AS total ${joins} JOIN "TicketTags" tt ON tt."ticketId"=t.id JOIN "Tags" tg ON tg.id=tt."tagId" AND tg."companyId"=:companyId WHERE ${eligible} GROUP BY tg.id,tg.name ORDER BY total DESC`,
      { replacements, type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT ur.rate AS rating,COUNT(DISTINCT t.id)::int AS total ${joins} JOIN "UserRatings" ur ON ur."ticketId"=t.id AND ur."companyId"=:companyId WHERE ${eligible} GROUP BY ur.rate ORDER BY ur.rate`,
      { replacements, type: QueryTypes.SELECT }
    )
  ]);
  const summary = queries[0][0] as {
    total?: number;
    messages?: number;
    contacts?: number;
    first?: Date;
    last?: Date;
  };
  return {
    period: {
      dateFrom: period.dateFrom,
      dateTo: period.dateTo,
      timezone: period.timezone
    },
    filters,
    totals: {
      conversations: summary?.total || 0,
      messages: summary?.messages || 0,
      uniqueContacts: summary?.contacts || 0,
      firstMessageAt: summary?.first || null,
      lastMessageAt: summary?.last || null
    },
    byStatus: queries[1],
    byAttendant: queries[2],
    byQueue: queries[3],
    byDay: queries[4],
    byTag: queries[5],
    byRating: queries[6],
    coverage: {
      dateFrom: period.dateFrom,
      dateTo: period.dateTo,
      timezone: period.timezone,
      matchedConversations: summary?.total || 0,
      returnedConversations: summary?.total || 0,
      returnedMessages: summary?.messages || 0,
      remainingConversations: 0,
      skippedConversations: 0,
      truncatedConversations: 0,
      nextCursor: null
    }
  };
};

export const getAttendantMetrics = async (
  auth: McpAuthContext,
  filters: Filters
) => {
  const period = await resolvePeriod(
    auth.companyId,
    filters.date_from,
    filters.date_to
  );
  const replacements = baseReplacements(auth, period);
  const rows = (await sequelize.query(
    `WITH eligible AS (
       SELECT t.id,t."userId",t.status FROM "Tickets" t
       WHERE t."companyId"=:companyId
         AND EXISTS (SELECT 1 FROM "Messages" m WHERE m."ticketId"=t.id AND m."companyId"=:companyId AND m."createdAt" BETWEEN :dateFrom AND :dateTo)
     ), ratings AS (
       SELECT ur."ticketId",AVG(ur.rate) AS rating,COUNT(*)::int AS count
       FROM "UserRatings" ur WHERE ur."companyId"=:companyId GROUP BY ur."ticketId"
     ), tracking AS (
       SELECT tr."ticketId",AVG(tr."waitTime") AS wait,AVG(tr."serviceTime") AS service
       FROM "TicketTraking" tr WHERE tr."companyId"=:companyId GROUP BY tr."ticketId"
     )
     SELECT u.id,u.name,COUNT(e.id)::int AS total,
       COUNT(e.id) FILTER (WHERE e.status='open')::int AS open,
       COUNT(e.id) FILTER (WHERE e.status='closed')::int AS closed,
       ROUND(AVG(r.rating)::numeric,2) AS "averageRating",COALESCE(SUM(r.count),0)::int AS "ratingCount",
       ROUND(AVG(tr.wait)::numeric,2) AS "averageWaitSeconds",
       ROUND(AVG(tr.service)::numeric,2) AS "averageServiceSeconds"
     FROM "Users" u LEFT JOIN eligible e ON e."userId"=u.id
     LEFT JOIN ratings r ON r."ticketId"=e.id
     LEFT JOIN tracking tr ON tr."ticketId"=e.id
     WHERE u."companyId"=:companyId GROUP BY u.id,u.name ORDER BY total DESC,u.name`,
    { replacements, type: QueryTypes.SELECT }
  )) as Array<{ total: number }>;
  return {
    period: {
      dateFrom: period.dateFrom,
      dateTo: period.dateTo,
      timezone: period.timezone
    },
    attendants: rows,
    coverage: {
      dateFrom: period.dateFrom,
      dateTo: period.dateTo,
      timezone: period.timezone,
      matchedConversations: rows.reduce(
        (sum, row) => sum + Number(row.total),
        0
      ),
      returnedConversations: rows.reduce(
        (sum, row) => sum + Number(row.total),
        0
      ),
      returnedMessages: 0,
      remainingConversations: 0,
      skippedConversations: 0,
      truncatedConversations: 0,
      nextCursor: null
    }
  };
};

export const listConversations = async (
  auth: McpAuthContext,
  input: Filters & { cursor?: string; limit?: number }
) => {
  const period = await resolvePeriod(
    auth.companyId,
    input.date_from,
    input.date_to
  );
  const limit = Math.min(Math.max(input.limit || 50, 1), 100);
  const filterIdentity = {
    ...input,
    cursor: undefined,
    limit: undefined,
    period: [period.dateFrom, period.dateTo]
  };
  const replacements = baseReplacements(auth, period);
  const extra = whereForFilters(input, replacements);
  let cursorClause = "";
  if (input.cursor) {
    const cursor = decodeCursor(input.cursor, auth, filterIdentity);
    replacements.cursorCreatedAt = cursor.createdAt;
    replacements.cursorId = cursor.id;
    cursorClause = ' AND (t."createdAt",t.id) < (:cursorCreatedAt,:cursorId)';
  }
  const eligible = `t."companyId"=:companyId AND EXISTS (SELECT 1 FROM "Messages" mx WHERE mx."ticketId"=t.id AND mx."companyId"=:companyId AND mx."createdAt" BETWEEN :dateFrom AND :dateTo)${extra}`;
  const [{ total }] = (await sequelize.query(
    `SELECT COUNT(DISTINCT t.id)::int AS total FROM "Tickets" t JOIN "Contacts" c ON c.id=t."contactId" WHERE ${eligible}`,
    { replacements, type: QueryTypes.SELECT }
  )) as Array<{ total: number }>;
  replacements.limit = limit + 1;
  const rows = (await sequelize.query(
    `SELECT t.id AS "ticketId",t.status,t."createdAt",t."updatedAt",c.id AS "contactId",${contactColumns},u.id AS "attendantId",u.name AS "attendantName",q.id AS "queueId",q.name AS "queueName",
      (SELECT COUNT(*)::int FROM "Messages" mc WHERE mc."ticketId"=t.id AND mc."companyId"=:companyId AND mc."createdAt" BETWEEN :dateFrom AND :dateTo) AS "messageCount",
      (SELECT ur.rate FROM "UserRatings" ur WHERE ur."ticketId"=t.id AND ur."companyId"=:companyId ORDER BY ur."createdAt" DESC LIMIT 1) AS rating,
      COALESCE((SELECT json_agg(json_build_object('id',tg.id,'name',tg.name)) FROM "TicketTags" tt JOIN "Tags" tg ON tg.id=tt."tagId" AND tg."companyId"=:companyId WHERE tt."ticketId"=t.id),'[]') AS tags
     FROM "Tickets" t JOIN "Contacts" c ON c.id=t."contactId" LEFT JOIN "Users" u ON u.id=t."userId" LEFT JOIN "Queues" q ON q.id=t."queueId"
     WHERE ${eligible}${cursorClause} ORDER BY t."createdAt" DESC,t.id DESC LIMIT :limit`,
    { replacements, type: QueryTypes.SELECT }
  )) as Array<
    Record<string, unknown> & {
      ticketId: number;
      createdAt: string;
    }
  >;
  const hasMore = rows.length > limit;
  const selected = rows.slice(0, limit).map(row => ({
    ...row,
    url: `${mcpConfig.frontendUrl}/tickets/${row.ticketId}`
  }));
  const last = rows[Math.min(rows.length, limit) - 1];
  const previousOffset = input.cursor
    ? decodeCursor(input.cursor, auth, filterIdentity).offset || 0
    : 0;
  const currentOffset = previousOffset + selected.length;
  const nextCursor =
    hasMore && last
      ? encodeCursor({
          companyId: auth.companyId,
          filtersHash: hashFilters(filterIdentity),
          createdAt: last.createdAt,
          id: last.ticketId,
          offset: currentOffset
        })
      : null;
  return {
    conversations: selected,
    coverage: {
      dateFrom: period.dateFrom,
      dateTo: period.dateTo,
      timezone: period.timezone,
      matchedConversations: total,
      returnedConversations: selected.length,
      returnedMessages: 0,
      remainingConversations: Math.max(Number(total) - currentOffset, 0),
      skippedConversations: 0,
      truncatedConversations: 0,
      nextCursor
    }
  };
};

export const listContacts = async (
  auth: McpAuthContext,
  input: ContactFilters
) => {
  const limit = Math.min(Math.max(input.limit || 50, 1), 200);
  const filterIdentity = { ...input, cursor: undefined, limit: undefined };
  const replacements: Record<string, unknown> = { companyId: auth.companyId };
  const clauses: string[] = ['c."companyId"=:companyId', 'c."isGroup"=false'];
  if (input.search) {
    clauses.push(
      "(c.name ILIKE :search OR c.nickname ILIKE :search OR c.number ILIKE :search OR c.email ILIKE :search)"
    );
    replacements.search = `%${input.search.slice(0, 80)}%`;
  }
  if (input.tag_id) {
    clauses.push(
      'EXISTS (SELECT 1 FROM "ContactTags" ct0 WHERE ct0."contactId"=c.id AND ct0."tagId"=:tagId)'
    );
    replacements.tagId = input.tag_id;
  }
  if (input.language) {
    clauses.push("c.language=:language");
    replacements.language = input.language.slice(0, 20);
  }
  if (input.birthday_month) {
    clauses.push('c."birthdayMonth"=:birthdayMonth');
    replacements.birthdayMonth = input.birthday_month;
  }
  if (input.birthday_day) {
    clauses.push('c."birthdayDay"=:birthdayDay');
    replacements.birthdayDay = input.birthday_day;
  }
  if (input.has_birthday !== undefined) {
    clauses.push(
      input.has_birthday
        ? '(c."birthdayDay" IS NOT NULL AND c."birthdayMonth" IS NOT NULL)'
        : '(c."birthdayDay" IS NULL OR c."birthdayMonth" IS NULL)'
    );
  }
  const where = clauses.join(" AND ");
  const [{ total }] = (await sequelize.query(
    `SELECT COUNT(*)::int AS total FROM "Contacts" c WHERE ${where}`,
    { replacements, type: QueryTypes.SELECT }
  )) as Array<{ total: number }>;
  let cursorClause = "";
  let previousOffset = 0;
  if (input.cursor) {
    const cursor = decodeCursor(input.cursor, auth, filterIdentity);
    replacements.cursorCreatedAt = cursor.createdAt;
    replacements.cursorId = cursor.id;
    previousOffset = cursor.offset || 0;
    cursorClause = ' AND (c."createdAt",c.id) < (:cursorCreatedAt,:cursorId)';
  }
  replacements.limit = limit + 1;
  const rows = (await sequelize.query(
    `SELECT c.id,c.name,c.nickname,c.number,c.email,c.language,c."birthdayDay",c."birthdayMonth",${birthdayExpression(
      "c"
    )} AS birthday,c."disableBot" AS "chatbotDisabled",c.channel,c."createdAt",c."updatedAt",
      COALESCE((SELECT json_agg(json_build_object('id',tg.id,'name',tg.name) ORDER BY tg.name) FROM "ContactTags" ct JOIN "Tags" tg ON tg.id=ct."tagId" AND tg."companyId"=:companyId WHERE ct."contactId"=c.id),'[]') AS tags,
      COALESCE((SELECT json_agg(json_build_object('name',cf.name,'value',cf.value) ORDER BY cf.name) FROM "ContactCustomFields" cf WHERE cf."contactId"=c.id),'[]') AS "extraInfo",
      (SELECT COUNT(*)::int FROM "Tickets" t WHERE t."contactId"=c.id AND t."companyId"=:companyId) AS "conversationCount",
      (SELECT MAX(m."createdAt") FROM "Messages" m JOIN "Tickets" t2 ON t2.id=m."ticketId" WHERE t2."contactId"=c.id AND m."companyId"=:companyId) AS "lastMessageAt"
     FROM "Contacts" c WHERE ${where}${cursorClause}
     ORDER BY c."createdAt" DESC,c.id DESC LIMIT :limit`,
    { replacements, type: QueryTypes.SELECT }
  )) as Array<Record<string, unknown> & { id: number; createdAt: string }>;
  const hasMore = rows.length > limit;
  const selected = rows.slice(0, limit);
  const last = selected[selected.length - 1];
  const currentOffset = previousOffset + selected.length;
  return {
    contacts: selected,
    filters: filterIdentity,
    coverage: {
      matchedRecords: total,
      returnedRecords: selected.length,
      remainingRecords: Math.max(Number(total) - currentOffset, 0),
      nextCursor:
        hasMore && last
          ? encodeCursor({
              companyId: auth.companyId,
              filtersHash: hashFilters(filterIdentity),
              createdAt: last.createdAt,
              id: last.id,
              offset: currentOffset
            })
          : null
    }
  };
};

export const listSchedules = async (
  auth: McpAuthContext,
  input: ScheduleFilters
) => {
  const limit = Math.min(Math.max(input.limit || 50, 1), 100);
  const filterIdentity = { ...input, cursor: undefined, limit: undefined };
  const timezone = await getTimezone(auth.companyId);
  const replacements: Record<string, unknown> = { companyId: auth.companyId };
  const clauses: string[] = ['s."companyId"=:companyId'];
  const occurrence = 'COALESCE(s."nextRunAt",s."sendAt")';
  // Agendamentos apontam para o futuro, então a janela é livre: só valida a
  // ordem, sem o limite de 366 dias no passado usado pelas conversas.
  const from = input.date_from
    ? parseTenantDate(input.date_from, timezone, false)
    : null;
  const to = input.date_to
    ? parseTenantDate(input.date_to, timezone, true)
    : null;
  if (from && to && from > to) {
    throw new AppError("invalid_date_range", 400);
  }
  if (from) {
    clauses.push(`${occurrence} >= :dateFrom`);
    replacements.dateFrom = from.toUTC().toJSDate();
  }
  if (to) {
    clauses.push(`${occurrence} <= :dateTo`);
    replacements.dateTo = to.toUTC().toJSDate();
  }
  if (input.kind) {
    clauses.push("s.kind=:kind");
    replacements.kind = input.kind;
  }
  if (input.status) {
    clauses.push("s.status=:status");
    replacements.status = input.status;
  }
  if (input.active !== undefined) {
    clauses.push("s.active=:active");
    replacements.active = input.active;
  }
  if (input.contact_id) {
    clauses.push(
      '(s."contactId"=:contactId OR EXISTS (SELECT 1 FROM "ScheduleAudienceContacts" sac0 WHERE sac0."scheduleId"=s.id AND sac0."contactId"=:contactId))'
    );
    replacements.contactId = input.contact_id;
  }
  if (input.commemorative_date_id) {
    clauses.push('s."commemorativeDateId"=:commemorativeDateId');
    replacements.commemorativeDateId = input.commemorative_date_id;
  }
  const where = clauses.join(" AND ");
  const [{ total }] = (await sequelize.query(
    `SELECT COUNT(*)::int AS total FROM "Schedules" s WHERE ${where}`,
    { replacements, type: QueryTypes.SELECT }
  )) as Array<{ total: number }>;
  let cursorClause = "";
  let previousOffset = 0;
  if (input.cursor) {
    const cursor = decodeCursor(input.cursor, auth, filterIdentity);
    replacements.cursorCreatedAt = cursor.createdAt;
    replacements.cursorId = cursor.id;
    previousOffset = cursor.offset || 0;
    cursorClause = ' AND (s."createdAt",s.id) < (:cursorCreatedAt,:cursorId)';
  }
  replacements.limit = limit + 1;
  const rows = (await sequelize.query(
    `SELECT s.id,s.kind,s.status,s.active,s."audienceMode",LEFT(s.body,2000) AS body,s."sendAt",s."sendTime",s.timezone,s."nextRunAt",s."lastRunAt",s."sentAt",s."totalRecipients",s."sentCount",s."errorCount",s."mediaType",s."mediaName",s."mediaDeliveryMode",s."saveMessage",s."createdAt",s."updatedAt",
      u.id AS "createdById",u.name AS "createdByName",
      cd.id AS "commemorativeDateId",cd.name AS "commemorativeDateName",cd.month AS "commemorativeDateMonth",cd.day AS "commemorativeDateDay",
      c.id AS "contactId",c.name AS "contactName",c.nickname AS "contactNickname",c.number AS "contactPhone",
      (SELECT COUNT(*)::int FROM "ScheduleAudienceContacts" sac WHERE sac."scheduleId"=s.id) AS "audienceContactCount",
      COALESCE((SELECT json_agg(json_build_object('status',d.status,'total',d.total)) FROM (SELECT sd.status,COUNT(*)::int AS total FROM "ScheduleDeliveries" sd WHERE sd."scheduleId"=s.id GROUP BY sd.status) d),'[]') AS "deliveriesByStatus",
      (SELECT MAX(sd2."sentAt") FROM "ScheduleDeliveries" sd2 WHERE sd2."scheduleId"=s.id) AS "lastDeliveryAt"
     FROM "Schedules" s LEFT JOIN "Users" u ON u.id=s."userId" LEFT JOIN "CommemorativeDates" cd ON cd.id=s."commemorativeDateId" LEFT JOIN "Contacts" c ON c.id=s."contactId"
     WHERE ${where}${cursorClause}
     ORDER BY s."createdAt" DESC,s.id DESC LIMIT :limit`,
    { replacements, type: QueryTypes.SELECT }
  )) as Array<Record<string, unknown> & { id: number; createdAt: string }>;
  const hasMore = rows.length > limit;
  const selected = rows.slice(0, limit);
  const last = selected[selected.length - 1];
  const currentOffset = previousOffset + selected.length;
  return {
    schedules: selected,
    filters: filterIdentity,
    defaultTimezone: timezone,
    coverage: {
      timezone,
      matchedRecords: total,
      returnedRecords: selected.length,
      remainingRecords: Math.max(Number(total) - currentOffset, 0),
      nextCursor:
        hasMore && last
          ? encodeCursor({
              companyId: auth.companyId,
              filtersHash: hashFilters(filterIdentity),
              createdAt: last.createdAt,
              id: last.id,
              offset: currentOffset
            })
          : null
    }
  };
};

const mediaName = (value: string | null): string | null => {
  if (!value) return null;
  const clean = value.split(/[?#]/)[0];
  return clean.split(/[\\/]/).pop()?.slice(0, 180) || null;
};

const loadConversation = async (
  auth: McpAuthContext,
  ticketId: number,
  cursor?: string,
  limit = 200
) => {
  const ticketRows = (await sequelize.query(
    `SELECT t.id AS "ticketId",t.status,t."createdAt",t."updatedAt",c.id AS "contactId",${contactColumns},c."disableBot" AS "contactChatbotDisabled",u.id AS "attendantId",u.name AS "attendantName",q.id AS "queueId",q.name AS "queueName",
      COALESCE((SELECT json_agg(json_build_object('name',cf.name,'value',cf.value) ORDER BY cf.name) FROM "ContactCustomFields" cf WHERE cf."contactId"=c.id),'[]') AS "contactExtraInfo",
      (SELECT ur.rate FROM "UserRatings" ur WHERE ur."ticketId"=t.id AND ur."companyId"=:companyId ORDER BY ur."createdAt" DESC LIMIT 1) AS rating,
      COALESCE((SELECT json_agg(json_build_object('id',tg.id,'name',tg.name)) FROM "TicketTags" tt JOIN "Tags" tg ON tg.id=tt."tagId" AND tg."companyId"=:companyId WHERE tt."ticketId"=t.id),'[]') AS tags
     FROM "Tickets" t JOIN "Contacts" c ON c.id=t."contactId" LEFT JOIN "Users" u ON u.id=t."userId" LEFT JOIN "Queues" q ON q.id=t."queueId"
     WHERE t.id=:ticketId AND t."companyId"=:companyId`,
    {
      replacements: { companyId: auth.companyId, ticketId },
      type: QueryTypes.SELECT
    }
  )) as Array<Record<string, unknown>>;
  if (!ticketRows[0]) throw new AppError("conversation_not_found", 404);
  const cursorData = cursor ? decodeCursor(cursor, auth, { ticketId }) : null;
  const messages = (await sequelize.query(
    `SELECT m.id,m."createdAt" AS at,m."fromMe",m.body AS text,m."mediaType",m."mediaUrl"
     FROM "Messages" m WHERE m."ticketId"=:ticketId AND m."companyId"=:companyId AND m."isDeleted"=false
       ${cursorData ? 'AND (m."createdAt",m.id) > (:cursorCreatedAt,:cursorIdText)' : ""}
     ORDER BY m."createdAt",m.id LIMIT :limit`,
    {
      replacements: {
        companyId: auth.companyId,
        ticketId,
        limit: limit + 1,
        cursorCreatedAt: cursorData?.createdAt,
        cursorIdText: String(cursorData?.id || "")
      },
      type: QueryTypes.SELECT
    }
  )) as Array<{
    id: string;
    at: string;
    fromMe: boolean;
    text: string | null;
    mediaType: string | null;
    mediaUrl: string | null;
  }>;
  const selected = messages.slice(0, limit).map(message => ({
    id: message.id,
    at: message.at,
    direction: message.fromMe ? "attendant" : "customer",
    text: message.text || null,
    media: message.mediaType
      ? {
          type: message.mediaType,
          name: mediaName(message.mediaUrl),
          present: true
        }
      : null
  }));
  const notes = await sequelize.query(
    `SELECT n.id,n.note AS text,n."createdAt" AS at,u.id AS "authorId",u.name AS "authorName" FROM "TicketNotes" n JOIN "Tickets" t ON t.id=n."ticketId" AND t."companyId"=:companyId LEFT JOIN "Users" u ON u.id=n."userId" WHERE n."ticketId"=:ticketId ORDER BY n."createdAt"`,
    {
      replacements: { companyId: auth.companyId, ticketId },
      type: QueryTypes.SELECT
    }
  );
  const hasMore = messages.length > limit;
  const last = messages[Math.min(messages.length, limit) - 1];
  return {
    context: ticketRows[0],
    messages: selected,
    notes,
    truncated: hasMore,
    truncationReason: hasMore ? "message_limit" : null,
    nextMessageCursor:
      hasMore && last
        ? encodeCursor({
            companyId: auth.companyId,
            filtersHash: hashFilters({ ticketId }),
            createdAt: last.at,
            id: last.id
          })
        : null
  };
};

export const readConversation = async (
  auth: McpAuthContext,
  input: { ticket_id: number; cursor?: string; limit?: number }
) => {
  const result = await loadConversation(
    auth,
    input.ticket_id,
    input.cursor,
    Math.min(input.limit || 200, 200)
  );
  return {
    ...result,
    coverage: {
      matchedConversations: 1,
      returnedConversations: 1,
      returnedMessages: result.messages.length,
      remainingConversations: 0,
      skippedConversations: 0,
      truncatedConversations: result.truncated ? 1 : 0,
      nextCursor: null
    }
  };
};

export const readConversations = async (
  auth: McpAuthContext,
  ticketIds: number[]
) => {
  const uniqueTicketIds = [...new Set(ticketIds)].slice(0, 25);
  const conversations: Array<Record<string, unknown>> = [];
  let messageCount = 0;
  let bytes = 0;
  let truncated = 0;
  let skipped = 0;
  await uniqueTicketIds.reduce(async (previous, ticketId) => {
    await previous;
    if (messageCount >= 500 || bytes >= 204800) {
      skipped += 1;
      return;
    }
    try {
      const remainingMessages = Math.min(200, 500 - messageCount);
      const conversation = await loadConversation(
        auth,
        ticketId,
        undefined,
        remainingMessages
      );
      const serialized = JSON.stringify(conversation);
      if (bytes + Buffer.byteLength(serialized) > 204800) {
        while (
          conversation.messages.length > 1 &&
          bytes + Buffer.byteLength(JSON.stringify(conversation)) > 204800
        ) {
          conversation.messages.pop();
        }
        while (
          conversation.notes.length > 0 &&
          bytes + Buffer.byteLength(JSON.stringify(conversation)) > 204800
        ) {
          conversation.notes.pop();
        }
        const onlyMessage = conversation.messages[0];
        while (
          onlyMessage?.text &&
          bytes + Buffer.byteLength(JSON.stringify(conversation)) > 204800
        ) {
          onlyMessage.text = onlyMessage.text.slice(
            0,
            Math.floor(onlyMessage.text.length * 0.75)
          );
        }
        conversation.truncated = true;
        conversation.truncationReason = "response_byte_limit";
        const lastMessage =
          conversation.messages[conversation.messages.length - 1];
        conversation.nextMessageCursor = lastMessage
          ? encodeCursor({
              companyId: auth.companyId,
              filtersHash: hashFilters({ ticketId }),
              createdAt: lastMessage.at,
              id: lastMessage.id
            })
          : null;
      }
      if (bytes + Buffer.byteLength(JSON.stringify(conversation)) > 204800) {
        skipped += 1;
        return;
      }
      messageCount += conversation.messages.length;
      bytes += Buffer.byteLength(JSON.stringify(conversation));
      if (conversation.truncated) truncated += 1;
      conversations.push(conversation);
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 404) skipped += 1;
      else throw error;
    }
  }, Promise.resolve());
  return {
    conversations,
    coverage: {
      matchedConversations: uniqueTicketIds.length,
      returnedConversations: conversations.length,
      returnedMessages: messageCount,
      remainingConversations: Math.max(
        uniqueTicketIds.length - conversations.length - skipped,
        0
      ),
      skippedConversations: skipped,
      truncatedConversations: truncated,
      nextCursor: null
    }
  };
};
