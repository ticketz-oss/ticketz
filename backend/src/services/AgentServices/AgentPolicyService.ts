import { createHash } from "crypto";
import { Op, QueryTypes } from "sequelize";
import sequelize from "../../database";
import Company from "../../models/Company";
import User from "../../models/User";
import AgentTenantPolicy from "../../models/AgentTenantPolicy";
import AgentContextAudit from "../../models/AgentContextAudit";
import AppError from "../../errors/AppError";
import { assertRuntimeCompany } from "../../helpers/tenantRuntime";
import { defaultModules, moduleFor } from "./AgentCatalog";

export type AgentActor = {
  companyId: number;
  userId: number;
  profile: string;
  queueIds: number[];
  chatIds: number[];
  policy: AgentTenantPolicy;
  fingerprint: string;
  exportMode?: boolean;
};
// Hash only authorization metadata. Even changing a record's audience (without
// updating an account or policy) must retire historical context containing it.
const authorizationDigestSql = `WITH RECURSIVE owned_options AS (
  SELECT qo.id,qo."queueId",qo."parentId" FROM "QueueOptions" qo JOIN "Queues" q ON q.id=qo."queueId" WHERE q."companyId"=:companyId
  UNION SELECT qo.id,qo."queueId",qo."parentId" FROM "QueueOptions" qo JOIN owned_options p ON p.id=qo."parentId" WHERE qo."queueId" IS NULL
) SELECT md5(COALESCE(string_agg(a.fingerprint,',' ORDER BY a.resource,a.id),'')) AS digest FROM (
  SELECT 'tickets' AS resource,id::text AS id,md5(concat_ws('|',id,"userId","queueId",status,"isGroup","contactId")) AS fingerprint FROM "Tickets" WHERE "companyId"=:companyId
  UNION ALL SELECT 'tasks',id::text,md5(concat_ws('|',id,"targetType","assignedUserId","assignedQueueId")) FROM "TaskBoardTasks" WHERE "companyId"=:companyId
  UNION ALL SELECT 'quick-messages',id::text,md5(concat_ws('|',id,"userId")) FROM "QuickMessages" WHERE "companyId"=:companyId
  UNION ALL SELECT 'groups',id::text,md5(concat_ws('|',id,"groupContactId","queueId")) FROM "GroupQueues" WHERE "companyId"=:companyId
  UNION ALL SELECT 'flow-options',id::text,md5(concat_ws('|',id,"queueId","parentId")) FROM owned_options
  UNION ALL SELECT 'calls',id::text,md5(concat_ws('|',id,"userId","queueId","queueIds"::text)) FROM "VoiceCalls" WHERE "companyId"=:companyId
  UNION ALL SELECT 'help-groups',id::text,md5(concat_ws('|',id,audience,"isGlobal","isActive","adminOnly")) FROM "HelpGroups" WHERE "isGlobal"=true OR "companyId"=:companyId
  UNION ALL SELECT 'help',h.id::text,md5(concat_ws('|',h.id,h."groupId",h."isActive",h."adminOnly")) FROM "Helps" h JOIN "HelpGroups" g ON g.id=h."groupId" WHERE g."isGlobal"=true OR g."companyId"=:companyId
  UNION ALL SELECT 'announcements',id::text,md5(concat_ws('|',id,status,"audienceMode",profiles::text,"startsAt","endsAt",COALESCE("startsAt"<=NOW(),true),COALESCE("endsAt">=NOW(),true))) FROM "Announcements" WHERE "isGlobal"=true OR "companyId"=:companyId
  UNION ALL SELECT 'announcement-users',concat_ws(':',x."announcementId",x."userId"),md5(concat_ws('|',x."announcementId",x."userId")) FROM "AnnouncementUsers" x JOIN "Announcements" a ON a.id=x."announcementId" WHERE a."isGlobal"=true OR a."companyId"=:companyId
  UNION ALL SELECT 'announcement-queues',concat_ws(':',x."announcementId",x."queueId"),md5(concat_ws('|',x."announcementId",x."queueId")) FROM "AnnouncementQueues" x JOIN "Announcements" a ON a.id=x."announcementId" WHERE a."isGlobal"=true OR a."companyId"=:companyId
  UNION ALL SELECT 'announcement-connections',concat_ws(':',x."announcementId",x."whatsappId"),md5(concat_ws('|',x."announcementId",x."whatsappId")) FROM "AnnouncementWhatsapps" x JOIN "Announcements" a ON a.id=x."announcementId" WHERE a."isGlobal"=true OR a."companyId"=:companyId
  UNION ALL SELECT 'connection-queues',concat_ws(':',x."whatsappId",x."queueId"),md5(concat_ws('|',x."whatsappId",x."queueId")) FROM "WhatsappQueues" x JOIN "Queues" q ON q.id=x."queueId" WHERE q."companyId"=:companyId
) a`;
export const getPolicy = async (
  companyId: number
): Promise<AgentTenantPolicy> => {
  const company = await Company.findByPk(companyId, { attributes: ["id"] });
  if (!company) throw new AppError("ERR_AGENT_TENANT_NOT_FOUND", 404);
  const [policy] = await AgentTenantPolicy.findOrCreate({
    where: { companyId },
    defaults: { companyId, enabled: false, modules: defaultModules() }
  });
  return policy;
};
export const getAgentAvailability = async (companyId: number) => {
  const policy = await AgentTenantPolicy.findOne({
    where: { companyId },
    attributes: ["enabled"]
  });
  return policy?.enabled === true;
};
export const loadActor = async (
  companyId: number,
  userId: number
): Promise<AgentActor> => {
  assertRuntimeCompany(companyId);
  const [user, company, policy] = await Promise.all([
    User.findOne({
      where: { id: userId, companyId },
      attributes: ["id", "companyId", "profile", "tokenVersion"]
    }),
    Company.findByPk(companyId, {
      attributes: ["id", "status", "platformStatus"]
    }),
    getPolicy(companyId)
  ]);
  if (
    !user ||
    !company?.status ||
    ["suspenso", "cancelado"].includes(company.platformStatus)
  )
    throw new AppError("ERR_AGENT_PERMISSION_DENIED", 403);
  if (!policy.enabled) throw new AppError("ERR_AGENT_DISABLED", 403);
  const [queues, chats, settings, authorization] = await Promise.all([
    sequelize.query<{ id: number }>(
      'SELECT q.id FROM "UserQueues" uq JOIN "Queues" q ON q.id=uq."queueId" AND q."companyId"=:companyId WHERE uq."userId"=:userId ORDER BY q.id',
      { replacements: { companyId, userId }, type: QueryTypes.SELECT }
    ),
    sequelize.query<{ id: number }>(
      'SELECT c.id FROM "ChatUsers" cu JOIN "Chats" c ON c.id=cu."chatId" AND c."companyId"=:companyId WHERE cu."userId"=:userId ORDER BY c.id',
      { replacements: { companyId, userId }, type: QueryTypes.SELECT }
    ),
    sequelize.query(
      "SELECT key,value FROM \"Settings\" WHERE \"companyId\"=:companyId AND key IN ('quickMessages','groupsTab','messageVisibility') ORDER BY key",
      { replacements: { companyId }, type: QueryTypes.SELECT }
    ),
    sequelize.query<{ digest: string }>(authorizationDigestSql, {
      replacements: { companyId },
      type: QueryTypes.SELECT
    })
  ]);
  const queueIds = queues.map(item => Number(item.id));
  const chatIds = chats.map(item => Number(item.id));
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify([
        companyId,
        userId,
        user.profile,
        user.tokenVersion,
        queueIds,
        chatIds,
        settings,
        authorization[0]?.digest,
        policy.revision
      ])
    )
    .digest("hex");
  return {
    companyId,
    userId,
    profile: user.profile,
    queueIds,
    chatIds,
    policy,
    fingerprint
  };
};
export const assertModule = (actor: AgentActor, key: string) => {
  const module = moduleFor(key);
  if (!module) throw new AppError("ERR_AGENT_INVALID_RESOURCE", 400);
  if (
    !actor.policy.enabled ||
    actor.policy.modules?.[key] === false ||
    (module.admin && actor.profile !== "admin")
  )
    throw new AppError("ERR_AGENT_MODULE_BLOCKED", 403);
  return module;
};
export const auditAgent = async (
  actor: { companyId: number; userId?: number },
  event: string,
  status: string,
  module?: string,
  recordCount?: number,
  revision?: number
) => {
  await AgentContextAudit.create({
    companyId: actor.companyId,
    userId: actor.userId,
    event,
    status,
    module,
    recordCount,
    revision
  });
};
export const savePolicy = async (
  companyId: number,
  userId: number,
  input: unknown
) => {
  const body = input as Record<string, unknown>;
  if (
    !body ||
    typeof body.enabled !== "boolean" ||
    typeof body.businessContext !== "string" ||
    body.businessContext.length > 50000 ||
    !body.modules ||
    typeof body.modules !== "object" ||
    Array.isArray(body.modules) ||
    !Number.isInteger(body.revision)
  )
    throw new AppError("ERR_AGENT_INVALID_REQUEST", 400);
  const modules = body.modules as Record<string, unknown>;
  if (
    Object.entries(modules).some(
      ([key, value]) => !moduleFor(key) || typeof value !== "boolean"
    )
  )
    throw new AppError("ERR_AGENT_INVALID_REQUEST", 400);
  await getPolicy(companyId);
  return sequelize.transaction(async transaction => {
    const policy = await AgentTenantPolicy.findOne({
      where: { companyId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!policy || policy.revision !== body.revision)
      throw new AppError("ERR_AGENT_POLICY_CONFLICT", 409);
    await policy.update(
      {
        enabled: body.enabled as boolean,
        modules: { ...defaultModules(), ...modules } as Record<string, boolean>,
        businessContext: body.businessContext as string,
        updatedById: userId,
        revision: policy.revision + 1,
        documentStatus: { state: "pending" }
      },
      { transaction }
    );
    await AgentContextAudit.create(
      {
        companyId,
        userId,
        event: "policy_saved",
        status: "success",
        revision: policy.revision
      },
      { transaction }
    );
    return policy;
  });
};
export const listAgentCompanies = async (search = "", cursor = "") => {
  if (
    typeof search !== "string" ||
    typeof cursor !== "string" ||
    (cursor && !/^\d{1,7}$/.test(cursor))
  )
    throw new AppError("ERR_AGENT_INVALID_REQUEST", 400);
  const offset = cursor ? Number(cursor) : 0;
  const { rows: companies, count } = await Company.findAndCountAll({
    attributes: ["id", "name", "slug", "status"],
    where: search
      ? {
          name: {
            [Op.iLike]: `%${search.slice(0, 100).replace(/[\\%_]/g, "\\$&")}%`
          }
        }
      : {},
    order: [
      ["name", "ASC"],
      ["id", "ASC"]
    ],
    limit: 100,
    offset
  });
  const policies = await AgentTenantPolicy.findAll({
    where: { companyId: { [Op.in]: companies.map(company => company.id) } }
  });
  const hasMore = offset + companies.length < count;
  return {
    companies: companies.map(company => ({
      ...company.get({ plain: true }),
      enabled:
        policies.find(policy => policy.companyId === company.id)?.enabled ??
        false
    })),
    hasMore,
    nextCursor: hasMore ? String(offset + companies.length) : null
  };
};
