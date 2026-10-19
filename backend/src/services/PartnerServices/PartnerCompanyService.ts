import moment from "moment";
import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import Partner from "../../models/Partner";
import Plan from "../../models/Plan";
import Invoices from "../../models/Invoices";
import CreateCompanyService from "../CompanyService/CreateCompanyService";
import UpdateCompanyService from "../CompanyService/UpdateCompanyService";
import { resellerCost } from "./PartnerPricing";

// Trial das empresas criadas por parceiro. Expira sozinho pelo
// checkCompanyCompliant se a primeira fatura nao for paga.
const TRIAL_DAYS = 3;

// Limite do periodo inicial: 3 anos e mais do que qualquer caso comercial.
const MAX_INTRO_MONTHS = 36;

const parseSaleValue = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new AppError("ERR_INVALID_SALE_VALUE", 400);
  }
  return Math.round(parsed * 100) / 100;
};

const isEmpty = (value: unknown): boolean =>
  value === undefined || value === null || value === "";

export interface IntroPricing {
  introValue: number | null;
  introMonths: number | null;
}

/**
 * Normaliza o periodo inicial. Os dois campos andam juntos: um sem o outro e
 * erro, os dois vazios limpam a promocao.
 *
 * Nao ha comparacao entre `introValue` e `saleValue` — o periodo inicial e
 * bidirecional (consultoria embutida cobra mais, desconto de captacao cobra
 * menos). A unica trava e o custo de revenda, aplicada no assertAboveFloor.
 */
const parseIntroPricing = (data: {
  introValue?: unknown;
  introMonths?: unknown;
}): IntroPricing | undefined => {
  if (data.introValue === undefined && data.introMonths === undefined) {
    return undefined;
  }

  const emptyValue = isEmpty(data.introValue);
  const emptyMonths = isEmpty(data.introMonths);

  if (emptyValue && emptyMonths) {
    return { introValue: null, introMonths: null };
  }

  if (emptyValue !== emptyMonths) {
    throw new AppError("ERR_INVALID_INTRO_PRICING", 400);
  }

  const introValue = Number(data.introValue);
  const introMonths = Number(data.introMonths);

  if (!Number.isFinite(introValue) || introValue <= 0) {
    throw new AppError("ERR_INVALID_INTRO_PRICING", 400);
  }

  if (
    !Number.isInteger(introMonths) ||
    introMonths < 1 ||
    introMonths > MAX_INTRO_MONTHS
  ) {
    throw new AppError("ERR_INVALID_INTRO_PRICING", 400);
  }

  return { introValue: Math.round(introValue * 100) / 100, introMonths };
};

const getPartner = async (partnerId: number): Promise<Partner> => {
  const partner = await Partner.findByPk(partnerId);

  if (!partner) {
    throw new AppError("ERR_NO_PARTNER_FOUND", 404);
  }

  return partner;
};

/**
 * Valida os precos contra o custo de revenda do parceiro.
 *
 * Esta e a trava comercial do canal: o parceiro define quanto cobra, mas
 * nenhum dos dois precos pode ficar abaixo do que a plataforma recebe.
 */
const assertAboveFloor = async (
  planId: number,
  partner: Partner,
  saleValue: number,
  introValue?: number | null
): Promise<{ plan: Plan; cost: number }> => {
  const plan = await Plan.findByPk(planId);

  if (!plan) {
    throw new AppError("ERR_NO_PLAN_FOUND", 404);
  }

  const cost = resellerCost(plan.value, partner.discountPct);

  if (saleValue < cost) {
    throw new AppError("ERR_SALE_VALUE_BELOW_MINIMUM", 400);
  }

  if (introValue != null && introValue < cost) {
    throw new AppError("ERR_INTRO_VALUE_BELOW_MINIMUM", 400);
  }

  return { plan, cost };
};

export interface PartnerCompanyListItem {
  company: Company;
  openInvoice: Invoices | null;
}

/**
 * Clientes do parceiro com a fatura em aberto de cada um.
 *
 * `Company` nao tem associacao com `Invoices`, entao as faturas vem numa
 * consulta separada em vez de um include.
 */
export const ListPartnerCompanies = async (
  partnerId: number
): Promise<PartnerCompanyListItem[]> => {
  const companies = await Company.findAll({
    where: { partnerId },
    include: [{ model: Plan, as: "plan", attributes: ["id", "name", "value"] }],
    order: [["id", "DESC"]]
  });

  if (!companies.length) {
    return [];
  }

  const invoices = await Invoices.findAll({
    where: {
      companyId: companies.map(company => company.id),
      status: "open"
    },
    order: [["dueDate", "ASC"]]
  });

  return companies.map(company => ({
    company,
    openInvoice:
      invoices.find(invoice => invoice.companyId === company.id) || null
  }));
};

export const ShowPartnerCompany = async (
  partnerId: number,
  companyId: number | string
): Promise<Company> => {
  const company = await Company.findOne({
    where: { id: companyId, partnerId },
    include: [{ model: Plan, as: "plan" }]
  });

  if (!company) {
    throw new AppError("ERR_NO_COMPANY_FOUND", 404);
  }

  return company;
};

interface PartnerCompanyData {
  whatsappMode?: "normal" | "meta";
  name: string;
  email: string;
  phone?: string;
  password?: string;
  planId: number;
  saleValue: number;
  introValue?: number | null;
  introMonths?: number | null;
  recurrence?: string;
  timezone?: string | null;
}

export const CreatePartnerCompany = async (
  partnerId: number,
  data: PartnerCompanyData
): Promise<Company> => {
  const partner = await getPartner(partnerId);
  const saleValue = parseSaleValue(data.saleValue);
  const intro = parseIntroPricing(data) || {
    introValue: null,
    introMonths: null
  };

  const { cost } = await assertAboveFloor(
    data.planId,
    partner,
    saleValue,
    intro.introValue
  );

  return CreateCompanyService({
    name: data.name,
    whatsappMode: data.whatsappMode,
    email: data.email,
    phone: data.phone,
    password: data.password,
    planId: data.planId,
    status: true,
    recurrence: data.recurrence || "MENSAL",
    timezone: data.timezone,
    dueDate: moment().add(TRIAL_DAYS, "days").format("YYYY-MM-DD"),
    trialDays: TRIAL_DAYS,
    dueDay: moment().add(TRIAL_DAYS, "days").date(),
    partnerId,
    saleValue,
    introValue: intro.introValue,
    introMonths: intro.introMonths,
    // Snapshot do custo: reajuste de plano nao mexe em negocio ja fechado.
    platformCost: cost
  });
};

export const UpdatePartnerCompany = async (
  partnerId: number,
  companyId: number | string,
  data: Partial<PartnerCompanyData>
): Promise<Company> => {
  const company = await ShowPartnerCompany(partnerId, companyId);
  const partner = await getPartner(partnerId);

  const planId = data.planId || company.planId;
  const planChanged = !!data.planId && data.planId !== company.planId;
  const intro = parseIntroPricing(data);

  const saleValue =
    data.saleValue !== undefined ? parseSaleValue(data.saleValue) : undefined;

  let cost: number | undefined;

  // Trocar de plano pode deixar o preco atual abaixo do novo custo, entao a
  // revalidacao usa os valores que ficarao valendo depois da atualizacao.
  if (saleValue !== undefined || intro !== undefined || planChanged) {
    const effectiveSaleValue = saleValue ?? (Number(company.saleValue) || 0);
    const effectiveIntroValue =
      intro !== undefined ? intro.introValue : (company.introValue ?? null);

    ({ cost } = await assertAboveFloor(
      planId,
      partner,
      effectiveSaleValue,
      effectiveIntroValue
    ));
  }

  // O parceiro nao mexe em status, vencimento nem slug.
  return UpdateCompanyService({
    id: company.id,
    whatsappMode: data.whatsappMode,
    name: data.name || company.name,
    email: data.email ?? company.email,
    phone: data.phone ?? company.phone,
    planId,
    ...(data.timezone !== undefined ? { timezone: data.timezone } : {}),
    ...(saleValue !== undefined ? { saleValue } : {}),
    ...(intro !== undefined
      ? { introValue: intro.introValue, introMonths: intro.introMonths }
      : {}),
    // Plano novo e negocio novo: o snapshot do custo e refeito.
    ...(planChanged && cost !== undefined ? { platformCost: cost } : {})
  });
};
