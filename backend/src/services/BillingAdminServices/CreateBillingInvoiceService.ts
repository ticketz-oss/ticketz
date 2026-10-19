import moment from "moment";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import Invoices from "../../models/Invoices";
import Plan from "../../models/Plan";
import { enqueueWebhook } from "../PlatformServices/PlatformWebhookService";
import { serializeInvoice } from "../PlatformServices/PlatformSerializers";
import { isBillingConsoleCompany } from "../../helpers/billingConsole";

interface Request {
  companyId: number;
  dueDate: string;
  value?: number;
  detail?: string;
  periodStart?: string;
  periodEnd?: string;
}

// Lançamento manual: o financeiro escolhe cliente, valor e vencimento. Nasce
// com origem "manual" pra não ser apagada pelas rotinas que reconstroem a
// fatura automática do ciclo (elas só mexem em origem "sistema").
const CreateBillingInvoiceService = async ({
  companyId,
  dueDate,
  value,
  detail,
  periodStart,
  periodEnd
}: Request): Promise<Invoices> => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate || "")) {
    throw new AppError("ERR_INVALID_DUE_DATE", 400);
  }

  const company = await Company.findByPk(companyId, {
    include: [{ model: Plan, as: "plan" }]
  });

  if (!company) throw new AppError("ERR_NO_COMPANY_FOUND", 404);
  if (isBillingConsoleCompany(company)) {
    throw new AppError("ERR_CANNOT_BILL_OWNER_TENANT", 400);
  }

  const amount =
    value === undefined || value === null || Number.isNaN(Number(value))
      ? Number(company.saleValue ?? company.plan?.value ?? 0)
      : Number(value);

  if (!(amount > 0)) throw new AppError("ERR_INVALID_INVOICE_VALUE", 400);

  return sequelize.transaction(async transaction => {
    const invoice = await Invoices.create(
      {
        detail:
          detail?.trim() ||
          company.plan?.name ||
          `Mensalidade ${moment(dueDate).format("MM/YYYY")}`,
        status: "open",
        value: Math.round(amount * 100) / 100,
        currency: company.plan?.currency || "BRL",
        dueDate,
        companyId: company.id,
        origem: "manual",
        externalRef: null,
        billingType: "regular",
        competencia: moment(dueDate).format("YYYY-MM"),
        periodStart: periodStart || null,
        periodEnd: periodEnd || null
      },
      { transaction }
    );

    await enqueueWebhook(
      "fatura.criada",
      company.id,
      serializeInvoice(invoice),
      transaction
    );

    return invoice;
  });
};

export default CreateBillingInvoiceService;
