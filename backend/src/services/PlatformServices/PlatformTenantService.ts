/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  assertCompanyWhatsAppMode,
  assertCompanyWhatsAppModeUnchanged
} from "../CompanyService/CompanyWhatsAppModeService";
import { randomBytes } from "crypto";
import { addDays } from "date-fns";
import { Op } from "sequelize";
import sequelize from "../../database";
import PlatformApiError from "../../errors/PlatformApiError";
import Company from "../../models/Company";
import Plan from "../../models/Plan";
import PlatformAccessToken from "../../models/PlatformAccessToken";
import Queue from "../../models/Queue";
import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";
import Setting from "../../models/Setting";
import normalizeSlug from "../../helpers/normalizeSlug";
import { SerializeUser } from "../../helpers/SerializeUser";
import {
  createAccessToken,
  createRefreshToken
} from "../../helpers/CreateTokens";
import CreateCompanyService from "../CompanyService/CreateCompanyService";
import UpdateCompanyService from "../CompanyService/UpdateCompanyService";
import { enqueueWebhook } from "./PlatformWebhookService";
import { getIO } from "../../libs/socket";
import {
  hashPlatformAccessToken,
  issuePlatformAccessToken,
  PlatformAccessKind
} from "./PlatformAccessTokenService";
import { normalizeCompanyTimezone } from "../CompanyService/CompanyTimezoneService";
import {
  normalizePlanRef,
  planRef,
  reaisToCents,
  serializeTenant,
  tenantUrl
} from "./PlatformSerializers";

const CYCLES = ["mensal", "bimestral", "trimestral", "semestral", "anual"];

const validationError = (details: Record<string, unknown>): never => {
  throw new PlatformApiError(
    "validation_error",
    "Dados inválidos.",
    422,
    details
  );
};

const findPlan = async (value: unknown): Promise<Plan> => {
  if (typeof value !== "string" || !value.trim()) {
    throw new PlatformApiError("invalid_plan", "Plano inválido.", 422);
  }
  const numericId = Number(value);
  if (Number.isInteger(numericId) && numericId > 0) {
    const numericPlan = await Plan.findByPk(numericId);
    if (numericPlan) return numericPlan;
  }
  const plans = await Plan.findAll();
  const wanted = normalizePlanRef(value);
  const plan = plans.find(item => planRef(item) === wanted);
  if (!plan) throw new PlatformApiError("invalid_plan", "Plano inválido.", 422);
  return plan;
};

const getCompany = async (id: string | number): Promise<Company> => {
  const company = await Company.findByPk(id);
  if (!company) {
    throw new PlatformApiError(
      "tenant_not_found",
      "Tenant não encontrado.",
      404
    );
  }
  return company;
};

const getAdmin = async (
  companyId: number,
  transaction?: any
): Promise<User | null> =>
  User.findOne({
    where: { companyId, profile: "admin", super: { [Op.not]: true } },
    order: [["id", "ASC"]],
    transaction
  });

const issueToken = async (
  company: Company,
  user: User,
  kind: PlatformAccessKind,
  motivo: string,
  ator: string,
  transaction: any
): Promise<{ url: string; expiresAt: Date }> => {
  const { rawToken, expiresAt } = await issuePlatformAccessToken(
    company,
    user,
    kind,
    motivo,
    ator,
    transaction
  );
  return {
    url: `${tenantUrl(company.slug)}/${kind === "sso" ? "sso" : "ativar"}/${rawToken}`,
    expiresAt
  };
};

export const createPlatformTenant = async (
  body: Record<string, any>
): Promise<Record<string, unknown>> => {
  const required = ["nome", "slug", "email_admin", "plano_ref"];
  const missing = required.filter(field => !body[field]);
  const slug = normalizeSlug(body.slug);
  if (missing.length || !slug || !String(body.email_admin).includes("@")) {
    validationError({
      campos: missing.length ? missing : ["slug", "email_admin"]
    });
  }
  const whatsappMode =
    body.whatsappMode !== undefined ? body.whatsappMode : body.whatsapp_mode;
  try {
    assertCompanyWhatsAppMode(whatsappMode);
  } catch {
    validationError({ whatsappMode });
  }
  const cycle = body.ciclo || "mensal";
  const billing = body.faturamento || "plataforma";
  if (!CYCLES.includes(cycle) || !["plataforma", "sistema"].includes(billing)) {
    validationError({ ciclo: cycle, faturamento: billing });
  }
  if (await Company.findOne({ where: { slug } })) {
    throw new PlatformApiError(
      "slug_already_exists",
      "Slug já cadastrado.",
      409
    );
  }
  const plan = await findPlan(String(body.plano_ref));
  const trialDays = Math.max(0, Number(body.trial_dias || 0));
  if (!Number.isInteger(trialDays))
    validationError({ trial_dias: body.trial_dias });
  const dueDay = Number(
    body.dia_vencimento || addDays(new Date(), trialDays).getUTCDate()
  );
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)
    validationError({ dia_vencimento: body.dia_vencimento });
  const timezone = body.fuso_horario ?? body.timezone;
  if (timezone && !normalizeCompanyTimezone(timezone))
    validationError({ fuso_horario: timezone });

  return sequelize.transaction(async transaction => {
    const generatedPassword = !body.senha_admin;
    const company = await CreateCompanyService(
      {
        name: body.nome,
        whatsappMode,
        slug,
        email: body.email_admin,
        phone: body.telefone,
        password: body.senha_admin || randomBytes(32).toString("base64url"),
        passwordConfigured: !generatedPassword,
        status: true,
        planId: plan.id,
        dueDate: addDays(new Date(), trialDays).toISOString().slice(0, 10),
        trialDays,
        dueDay,
        recurrence: cycle.toUpperCase(),
        timezone
      },
      { transaction }
    );
    await company.update(
      {
        platformStatus: trialDays > 0 ? "trial" : "ativo",
        platformBilling: billing,
        platformPartnerRef: body.parceiro_ref || null,
        platformLimits: body.limites || null
      },
      { transaction }
    );
    const admin = await getAdmin(company.id, transaction);
    const response = serializeTenant(company, plan, admin?.email);
    if (generatedPassword && admin) {
      const activation = await issueToken(
        company,
        admin,
        "activation",
        "ativacao_inicial",
        body.parceiro_ref || "plataforma",
        transaction
      );
      response.ativacao_url = activation.url;
    }
    await enqueueWebhook(
      "tenant.criado",
      company.id,
      {
        tenant_id: String(company.id),
        slug: company.slug,
        url_acesso: tenantUrl(company.slug),
        status: company.platformStatus
      },
      transaction
    );
    return response;
  });
};

export const getPlatformTenant = async (
  id: string
): Promise<Record<string, unknown>> => {
  const company = await getCompany(id);
  const plan = await Plan.findByPk(company.planId);
  if (!plan) throw new PlatformApiError("invalid_plan", "Plano inválido.", 422);
  const admin = await getAdmin(company.id);
  return serializeTenant(company, plan, admin?.email);
};

export const updatePlatformTenant = async (
  id: string,
  body: Record<string, any>
): Promise<Record<string, unknown>> => {
  const company = await getCompany(id);
  const whatsappMode =
    body.whatsappMode !== undefined ? body.whatsappMode : body.whatsapp_mode;
  try {
    assertCompanyWhatsAppModeUnchanged(company.whatsappMode, whatsappMode);
  } catch (error) {
    throw new PlatformApiError(
      error.message === "ERR_COMPANY_WHATSAPP_MODE_IMMUTABLE"
        ? "whatsapp_mode_immutable"
        : "validation_error",
      error.message,
      error.statusCode || 422
    );
  }
  const plan = body.plano_ref
    ? await findPlan(String(body.plano_ref))
    : await Plan.findByPk(company.planId);
  if (!plan) throw new PlatformApiError("invalid_plan", "Plano inválido.", 422);
  if (body.ciclo && !CYCLES.includes(body.ciclo))
    validationError({ ciclo: body.ciclo });
  const trialDays =
    body.trial_dias === undefined ? undefined : Number(body.trial_dias);
  const dueDay =
    body.dia_vencimento === undefined ? undefined : Number(body.dia_vencimento);
  if (
    trialDays !== undefined &&
    (!Number.isInteger(trialDays) || trialDays < 0 || trialDays > 3650)
  )
    validationError({ trial_dias: body.trial_dias });
  if (
    dueDay !== undefined &&
    (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)
  )
    validationError({ dia_vencimento: body.dia_vencimento });
  const timezone = body.fuso_horario ?? body.timezone;
  if (timezone && !normalizeCompanyTimezone(timezone))
    validationError({ fuso_horario: timezone });

  await sequelize.transaction(async transaction => {
    await UpdateCompanyService(
      {
        id: company.id,
        whatsappMode,
        name: body.nome === undefined ? company.name : body.nome,
        email:
          body.email_admin === undefined ? company.email : body.email_admin,
        phone: body.telefone === undefined ? company.phone : body.telefone,
        planId: plan.id,
        ...(trialDays === undefined ? {} : { trialDays }),
        ...(dueDay === undefined ? {} : { dueDay }),
        recurrence: body.ciclo ? body.ciclo.toUpperCase() : company.recurrence,
        ...(timezone === undefined ? {} : { timezone })
      },
      { transaction }
    );
    if (body.limites !== undefined) {
      await company.update({ platformLimits: body.limites }, { transaction });
    }
    if (body.email_admin !== undefined) {
      const admin = await getAdmin(company.id, transaction);
      if (admin)
        await admin.update({ email: body.email_admin }, { transaction });
    }
  });
  return getPlatformTenant(id);
};

export const suspendPlatformTenant = async (
  id: string,
  body: Record<string, any>
): Promise<Record<string, unknown>> => {
  const company = await getCompany(id);
  if (!["suspender", "reativar"].includes(body.acao)) {
    validationError({ acao: body.acao });
  }
  const status =
    body.acao === "suspender"
      ? "suspenso"
      : company.platformPreviousStatus || "ativo";
  await sequelize.transaction(async transaction => {
    await company.update(
      {
        platformStatus: status,
        platformPreviousStatus:
          body.acao === "suspender"
            ? company.platformStatus === "suspenso"
              ? company.platformPreviousStatus
              : company.platformStatus
            : null,
        status: body.acao === "reativar"
      },
      { transaction }
    );
    if (body.acao === "suspender") {
      await User.increment("tokenVersion", {
        where: { companyId: company.id },
        transaction
      });
      await enqueueWebhook(
        "tenant.suspenso",
        company.id,
        { tenant_id: String(company.id), status, motivo: body.motivo || null },
        transaction
      );
    }
  });
  if (body.acao === "suspender") {
    getIO().in(`company-${company.id}-mainchannel`).disconnectSockets(true);
  }
  return {
    tenant_id: String(company.id),
    status: body.acao === "suspender" ? "suspenso" : "ativo",
    alterado_em: new Date().toISOString()
  };
};

export const cancelPlatformTenant = async (
  id: string
): Promise<Record<string, unknown>> => {
  const company = await getCompany(id);
  const dataUntil = addDays(new Date(), 90).toISOString().slice(0, 10);
  await sequelize.transaction(async transaction => {
    await company.update(
      {
        platformStatus: "cancelado",
        status: false,
        platformCancelledAt: new Date(),
        platformDataUntil: dataUntil
      },
      { transaction }
    );
    await User.increment("tokenVersion", {
      where: { companyId: company.id },
      transaction
    });
  });
  getIO().in(`company-${company.id}-mainchannel`).disconnectSockets(true);
  return {
    tenant_id: String(company.id),
    status: "cancelado",
    dados_ate: dataUntil
  };
};

export const listPlatformPlans = async (): Promise<Record<string, unknown>> => {
  const plans = await Plan.findAll({ order: [["id", "ASC"]] });
  return {
    data: plans.map(plan => ({
      plano_ref: planRef(plan),
      nome: plan.name,
      preco_tabela_centavos: reaisToCents(plan.value),
      ciclo: "mensal",
      publico: plan.isPublic,
      limites: {
        usuarios: plan.users,
        conexoes: plan.connections,
        filas: plan.queues
      },
      preco_por_adicional_centavos: 0,
      adicional_label: "conexão"
    }))
  };
};

export const getPlatformUsage = async (
  id: string
): Promise<Record<string, unknown>> => {
  const company = await getCompany(id);
  const plan = await Plan.findByPk(company.planId);
  if (!plan) throw new PlatformApiError("invalid_plan", "Plano inválido.", 422);
  const [users, connections, queues] = await Promise.all([
    User.count({ where: { companyId: company.id, super: { [Op.not]: true } } }),
    Whatsapp.count({ where: { companyId: company.id } }),
    Queue.count({ where: { companyId: company.id } })
  ]);
  const limits = company.platformLimits || {};
  const response = {
    tenant_id: String(company.id),
    medido_em: new Date().toISOString(),
    metricas: [
      {
        chave: "conexoes",
        label: "Conexões",
        valor: connections,
        limite: limits.conexoes ?? plan.connections
      },
      {
        chave: "usuarios",
        label: "Usuários",
        valor: users,
        limite: limits.usuarios ?? plan.users
      },
      {
        chave: "filas",
        label: "Filas",
        valor: queues,
        limite: limits.filas ?? plan.queues
      }
    ]
  };
  await sequelize.transaction(transaction =>
    enqueueWebhook("uso.atualizado", company.id, response, transaction)
  );
  return response;
};

export const createPlatformAccess = async (
  id: string,
  body: Record<string, any>
): Promise<Record<string, unknown>> => {
  const company = await getCompany(id);
  if (
    !company.status ||
    ["suspenso", "cancelado"].includes(company.platformStatus)
  ) {
    throw new PlatformApiError("tenant_inactive", "Tenant inativo.", 409);
  }
  const admin = await getAdmin(company.id);
  if (!admin)
    throw new PlatformApiError(
      "admin_not_found",
      "Administrador não encontrado.",
      404
    );
  return sequelize.transaction(async transaction => {
    const access = await issueToken(
      company,
      admin,
      "sso",
      body.motivo || "suporte",
      body.ator || "plataforma",
      transaction
    );
    return {
      url: access.url,
      expira_em: access.expiresAt.toISOString(),
      uso_unico: true
    };
  });
};

export const exchangePlatformAccess = async (
  rawToken: unknown
): Promise<Record<string, unknown>> => {
  if (typeof rawToken !== "string" || rawToken.length < 48) {
    throw new PlatformApiError("acesso_invalido", "Acesso inválido.", 401);
  }
  const tokenHash = hashPlatformAccessToken(rawToken);
  let userId = 0;

  await sequelize.transaction(async transaction => {
    const accessToken = await PlatformAccessToken.findOne({
      where: { tokenHash },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (
      !accessToken ||
      accessToken.kind !== "sso" ||
      accessToken.usedAt ||
      accessToken.expiresAt.getTime() < Date.now()
    ) {
      throw new PlatformApiError("acesso_invalido", "Acesso inválido.", 401);
    }
    const company = await Company.findByPk(accessToken.companyId, {
      transaction
    });
    if (
      !company?.status ||
      ["suspenso", "cancelado"].includes(company.platformStatus)
    ) {
      throw new PlatformApiError("tenant_inactive", "Tenant inativo.", 409);
    }
    userId = accessToken.userId;
    await accessToken.update({ usedAt: new Date() }, { transaction });
  });

  const user = await User.findByPk(userId, {
    include: ["queues", { model: Company, include: [{ model: Setting }] }]
  });
  if (!user) {
    throw new PlatformApiError(
      "admin_not_found",
      "Administrador não encontrado.",
      404
    );
  }
  return {
    token: createAccessToken(user),
    refreshToken: createRefreshToken(user),
    user: await SerializeUser(user)
  };
};
