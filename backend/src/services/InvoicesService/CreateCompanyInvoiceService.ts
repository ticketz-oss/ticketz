import moment from "moment";
import { Op, UniqueConstraintError } from "sequelize";
import sequelize from "../../database";
import Company from "../../models/Company";
import Invoices from "../../models/Invoices";
import Plan from "../../models/Plan";
import { priceForDueDate } from "../PartnerServices/PartnerPricing";
import { enqueueWebhook } from "../PlatformServices/PlatformWebhookService";
import { serializeInvoice } from "../PlatformServices/PlatformSerializers";
import { calculateProrataCents } from "../BillingServices/ProrataService";
import { firstBillableDueDate } from "../BillingServices/BillingDateService";

const invoicePrice = (company: Company, plan: Plan, dueDate: string): number =>
  company.partnerId
    ? (priceForDueDate(company, dueDate) ?? plan.value)
    : (company.saleValue ?? plan.value);

// Só a fatura que *esta* rotina gerou pode ser refeita. Cobrança lançada à
// mão na Central de Cobrança (origem "manual") e lançamento vindo da
// plataforma ficam de fora: seriam apagados sem o financeiro saber.
const mutableInvoiceWhere = {
  status: "open",
  origem: "sistema",
  externalRef: null,
  [Op.or]: [{ txId: null }, { txId: "" }]
};

const CreateCompanyInvoiceService = async (
  companyId: number,
  today = moment.utc().format("YYYY-MM-DD")
): Promise<Invoices | null> => {
  try {
    return await sequelize.transaction(async transaction => {
      const company = await Company.findByPk(companyId, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (
        !company ||
        company.platformBilling === "plataforma" ||
        !company.dueDate
      )
        return null;

      const plan = await Plan.findByPk(company.planId, { transaction });
      if (!plan) return null;
      const dueDate = moment.utc(company.dueDate).format("YYYY-MM-DD");
      const initialIssued = await Invoices.findOne({
        where: { companyId, billingType: "initial_prorata" },
        transaction
      });
      const isInitial = Boolean(company.trialEndsAt && !initialIssued);
      if (isInitial && today < company.trialEndsAt) return null;
      if (
        company.trialExpiresAt &&
        new Date() < new Date(company.trialExpiresAt)
      )
        return null;

      const existing = await Invoices.findOne({
        where: {
          companyId,
          origem: { [Op.ne]: "plataforma" },
          externalRef: null,
          dueDate
        },
        transaction
      });
      if (existing) return existing;

      await Invoices.destroy({
        where: { companyId, ...mutableInvoiceWhere },
        transaction
      });

      const monthly = invoicePrice(company, plan, dueDate);
      const monthlyCents = Math.round(Number(monthly) * 100);
      // The first invoice is due on the company's due date (the last trial
      // day for new companies) and covers the days up to the first due day.
      const periodStart = isInitial ? company.trialEndsAt : null;
      const periodEnd = isInitial
        ? firstBillableDueDate(
            company.trialEndsAt,
            company.dueDay || moment.utc(dueDate).date()
          )
        : null;
      const value = isInitial
        ? calculateProrataCents(monthlyCents, periodStart, periodEnd) / 100
        : monthly;

      const invoice = await Invoices.create(
        {
          detail: plan.name,
          status: "open",
          value,
          currency: plan.currency || "",
          dueDate,
          companyId,
          origem: "sistema",
          externalRef: null,
          billingType: isInitial ? "initial_prorata" : "regular",
          periodStart,
          periodEnd
        },
        { transaction }
      );
      await enqueueWebhook(
        "fatura.criada",
        companyId,
        serializeInvoice(invoice),
        transaction
      );
      return invoice;
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return Invoices.findOne({
        where: { companyId, billingType: "initial_prorata" }
      });
    }
    throw error;
  }
};

export default CreateCompanyInvoiceService;
