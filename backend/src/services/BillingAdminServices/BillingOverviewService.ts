/* eslint-disable @typescript-eslint/no-explicit-any -- filtros do Sequelize misturam chaves e símbolos Op */
import moment from "moment";
import { Op } from "sequelize";
import Company from "../../models/Company";
import Invoices from "../../models/Invoices";
import Plan from "../../models/Plan";
import {
  BillingFilters,
  companyInclude,
  invoiceWhere,
  invoiceStatusLabel,
  today
} from "./BillingAdminQuery";
import { billingConsoleSlugs } from "../../helpers/billingConsole";

interface Bucket {
  billed: number;
  received: number;
  open: number;
  overdue: number;
  cancelled: number;
  count: number;
  paidCount: number;
  openCount: number;
  overdueCount: number;
}

const emptyBucket = (): Bucket => ({
  billed: 0,
  received: 0,
  open: 0,
  overdue: 0,
  cancelled: 0,
  count: 0,
  paidCount: 0,
  openCount: 0,
  overdueCount: 0
});

const add = (bucket: Bucket, invoice: Invoices): void => {
  const value = Number(invoice.value) || 0;
  const situacao = invoiceStatusLabel(invoice.status, invoice.dueDate);

  bucket.count += 1;
  if (situacao === "cancelled") {
    bucket.cancelled += value;
    return;
  }

  // Cancelada não entra em "faturado": ela deixou de ser cobrança.
  bucket.billed += value;
  if (situacao === "paid") {
    bucket.received += value;
    bucket.paidCount += 1;
  } else if (situacao === "overdue") {
    bucket.overdue += value;
    bucket.overdueCount += 1;
  } else {
    bucket.open += value;
    bucket.openCount += 1;
  }
};

// Mensalidade contratada de um cliente: o preço negociado quando existe,
// senão o do plano. É a base do MRR.
const monthlyValue = (company: Company): number =>
  Number(company.saleValue ?? company.plan?.value ?? 0) || 0;

const BillingOverviewService = async (filters: BillingFilters) => {
  const invoices = await Invoices.findAll({
    where: invoiceWhere(filters),
    include: [companyInclude(filters)]
  });

  const totals = emptyBucket();
  const byPlan = new Map<
    number,
    {
      planId: number;
      planName: string;
      bucket: Bucket;
      clients: number;
      mrr: number;
    }
  >();
  const byMonth = new Map<string, Bucket>();

  const planBucket = (planId: number, planName: string) => {
    if (!byPlan.has(planId)) {
      byPlan.set(planId, {
        planId,
        planName,
        bucket: emptyBucket(),
        clients: 0,
        mrr: 0
      });
    }
    return byPlan.get(planId);
  };

  invoices.forEach(invoice => {
    add(totals, invoice);

    const planId = invoice.company?.planId || 0;
    const planName = invoice.company?.plan?.name || "Sem plano";
    add(planBucket(planId, planName).bucket, invoice);

    const month = invoice.dueDate ? invoice.dueDate.slice(0, 7) : "-";
    if (!byMonth.has(month)) byMonth.set(month, emptyBucket());
    add(byMonth.get(month), invoice);
  });

  // Carteira: os tenants cobráveis, fora o próprio dono da plataforma.
  // Os Op.or existem porque `slug` e `platformBilling` aceitam null, e um
  // `!=`/`NOT IN` simples descartaria essas linhas silenciosamente.
  const clientWhere: Record<string | symbol, any> = {
    [Op.and]: [
      {
        [Op.or]: [
          { slug: null },
          { slug: { [Op.notIn]: billingConsoleSlugs() } }
        ]
      },
      {
        [Op.or]: [
          { platformBilling: null },
          { platformBilling: { [Op.ne]: "plataforma" } }
        ]
      }
    ]
  };
  if (filters.companyId) clientWhere.id = Number(filters.companyId);
  if (filters.planId) clientWhere.planId = Number(filters.planId);

  const companies = await Company.findAll({
    where: clientWhere,
    include: [{ model: Plan, as: "plan", attributes: ["id", "name", "value"] }]
  });

  const hoje = today();
  const clients = {
    total: companies.length,
    active: 0,
    trial: 0,
    inactive: 0
  };
  let mrr = 0;

  companies.forEach(company => {
    const value = monthlyValue(company);
    const inTrial = !!company.trialEndsAt && company.trialEndsAt > hoje;

    if (!company.status || company.platformStatus === "cancelado") {
      clients.inactive += 1;
      return;
    }

    if (inTrial) {
      clients.trial += 1;
      return;
    }

    clients.active += 1;
    mrr += value;

    const entry = planBucket(
      company.planId || 0,
      company.plan?.name || "Sem plano"
    );
    entry.clients += 1;
    entry.mrr += value;
  });

  const round = (value: number): number => Math.round(value * 100) / 100;
  const roundBucket = (bucket: Bucket) => ({
    ...bucket,
    billed: round(bucket.billed),
    received: round(bucket.received),
    open: round(bucket.open),
    overdue: round(bucket.overdue),
    cancelled: round(bucket.cancelled)
  });

  return {
    range: {
      startDate: filters.startDate || null,
      endDate: filters.endDate || null
    },
    totals: roundBucket(totals),
    mrr: round(mrr),
    clients,
    byPlan: Array.from(byPlan.values())
      .map(entry => ({
        planId: entry.planId,
        planName: entry.planName,
        clients: entry.clients,
        mrr: round(entry.mrr),
        ...roundBucket(entry.bucket)
      }))
      .sort((a, b) => b.billed - a.billed || b.mrr - a.mrr),
    byMonth: Array.from(byMonth.entries())
      .filter(([month]) => month !== "-")
      .map(([month, bucket]) => ({
        month,
        label: moment(`${month}-01`).format("MM/YYYY"),
        ...roundBucket(bucket)
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  };
};

export default BillingOverviewService;
