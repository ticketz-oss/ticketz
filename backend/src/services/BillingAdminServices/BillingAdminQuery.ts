/* eslint-disable @typescript-eslint/no-explicit-any -- filtros do Sequelize misturam chaves e símbolos Op */
import { Op, WhereOptions } from "sequelize";
import moment from "moment";
import Company from "../../models/Company";
import Plan from "../../models/Plan";

export type BillingStatus = "open" | "overdue" | "paid" | "cancelled";

export interface BillingFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  planId?: string | number;
  companyId?: string | number;
  searchParam?: string;
}

export const today = (): string => moment.utc().format("YYYY-MM-DD");

const isDate = (value?: string): boolean =>
  !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);

// Todas as listagens da Central de Cobrança recortam por vencimento: é a data
// que o financeiro usa pra falar de "cobranças de setembro", mesmo que a
// fatura tenha sido lançada antes.
export const invoiceWhere = (filters: BillingFilters): WhereOptions => {
  const where: Record<string | symbol, any> = {
    status: { [Op.ne]: "deleted" }
  };

  if (isDate(filters.startDate) || isDate(filters.endDate)) {
    where.dueDate = {};
    if (isDate(filters.startDate)) where.dueDate[Op.gte] = filters.startDate;
    if (isDate(filters.endDate)) where.dueDate[Op.lte] = filters.endDate;
  }

  if (filters.companyId) where.companyId = Number(filters.companyId);

  switch (filters.status) {
    case "paid":
      where.status = "paid";
      break;
    case "cancelled":
      where.status = "cancelled";
      break;
    case "open":
      where.status = "open";
      break;
    case "overdue":
      where.status = "open";
      where.dueDate = { ...(where.dueDate || {}), [Op.lt]: today() };
      break;
    default:
      break;
  }

  return where;
};

// O plano e a busca por nome moram na empresa, então viram condição no join.
export const companyInclude = (filters: BillingFilters) => {
  const where: Record<string | symbol, any> = {};
  let filtered = false;

  if (filters.planId) {
    where.planId = Number(filters.planId);
    filtered = true;
  }

  const search = filters.searchParam?.trim();
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } }
    ];
    filtered = true;
  }

  return {
    model: Company,
    as: "company",
    required: filtered,
    where: filtered ? where : undefined,
    attributes: [
      "id",
      "name",
      "email",
      "phone",
      "planId",
      "status",
      "dueDate",
      "dueDay",
      "recurrence",
      "trialEndsAt",
      "trialDays",
      "saleValue",
      "platformStatus"
    ],
    include: [
      {
        model: Plan,
        as: "plan",
        attributes: ["id", "name", "value", "currency"]
      }
    ]
  };
};

export const invoiceStatusLabel = (
  status: string,
  dueDate: string
): BillingStatus => {
  if (status === "paid") return "paid";
  if (status === "cancelled") return "cancelled";
  return dueDate && dueDate < today() ? "overdue" : "open";
};
