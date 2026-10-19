/* eslint-disable @typescript-eslint/no-explicit-any -- filtros do Sequelize misturam chaves e símbolos Op */
import { Op } from "sequelize";
import Company from "../../models/Company";
import Invoices from "../../models/Invoices";
import Plan from "../../models/Plan";
import { billingConsoleSlugs } from "../../helpers/billingConsole";
import { invoiceStatusLabel, today } from "./BillingAdminQuery";

interface Request {
  planId?: string | number;
  searchParam?: string;
  includeOwner?: boolean;
}

const ListBillingClientsService = async (params: Request = {}) => {
  const where: Record<string | symbol, any> = {
    [Op.and]: [
      {
        [Op.or]: [
          { platformBilling: null },
          { platformBilling: { [Op.ne]: "plataforma" } }
        ]
      }
    ]
  };

  if (!params.includeOwner) {
    where[Op.and].push({
      [Op.or]: [{ slug: null }, { slug: { [Op.notIn]: billingConsoleSlugs() } }]
    });
  }

  if (params.planId) where.planId = Number(params.planId);

  const search = params.searchParam?.trim();
  if (search) {
    where[Op.and].push({
      [Op.or]: [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ]
    });
  }

  const companies = await Company.findAll({
    where,
    include: [
      {
        model: Plan,
        as: "plan",
        attributes: ["id", "name", "value", "currency"]
      }
    ],
    order: [["name", "ASC"]]
  });

  const invoices = await Invoices.findAll({
    where: {
      companyId: { [Op.in]: companies.map(c => c.id) },
      status: { [Op.ne]: "deleted" }
    },
    attributes: ["id", "companyId", "value", "status", "dueDate", "paidAt"]
  });

  const hoje = today();

  return companies.map(company => {
    const mine = invoices.filter(invoice => invoice.companyId === company.id);
    const sum = (predicate: (i: Invoices) => boolean) =>
      Math.round(
        mine
          .filter(predicate)
          .reduce((acc, invoice) => acc + (Number(invoice.value) || 0), 0) * 100
      ) / 100;

    const situacao = (invoice: Invoices) =>
      invoiceStatusLabel(invoice.status, invoice.dueDate);

    const lastPaid = mine
      .filter(invoice => invoice.status === "paid" && invoice.paidAt)
      .sort(
        (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
      )[0];

    return {
      id: company.id,
      name: company.name,
      email: company.email,
      phone: company.phone,
      slug: company.slug,
      status: company.status,
      platformStatus: company.platformStatus,
      planId: company.planId,
      planName: company.plan?.name || null,
      planValue: Number(company.plan?.value ?? 0) || 0,
      currency: company.plan?.currency || "BRL",
      saleValue: company.saleValue === null ? null : Number(company.saleValue),
      monthlyValue: Number(company.saleValue ?? company.plan?.value ?? 0) || 0,
      dueDate: company.dueDate,
      dueDay: company.dueDay,
      recurrence: company.recurrence,
      trialDays: company.trialDays,
      trialEndsAt: company.trialEndsAt,
      inTrial: !!company.trialEndsAt && company.trialEndsAt > hoje,
      openAmount: sum(i => situacao(i) === "open"),
      overdueAmount: sum(i => situacao(i) === "overdue"),
      paidAmount: sum(i => situacao(i) === "paid"),
      overdueCount: mine.filter(i => situacao(i) === "overdue").length,
      lastPaidAt: lastPaid?.paidAt || null
    };
  });
};

export default ListBillingClientsService;
