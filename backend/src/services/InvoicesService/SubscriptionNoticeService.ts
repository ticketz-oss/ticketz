import moment from "moment";
import { Op } from "sequelize";
import Company from "../../models/Company";
import Invoices from "../../models/Invoices";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import { subscriptionDeadline } from "../../helpers/subscriptionDeadline";
import { companyTrial } from "../../helpers/companyTrial";

const SubscriptionNoticeService = async (companyId: number) => {
  const company = await Company.findByPk(companyId);
  const today = moment().startOf("day");
  const billingDay = today.format("YYYY-MM-DD");
  const trial = companyTrial(company || {});
  const empty = { billingDay, notice: null, trial };
  if (
    !company ||
    companyId === 1 ||
    company.platformBilling === "plataforma" ||
    trial.status === "active" ||
    (!company.trialExpiresAt &&
      company.trialEndsAt &&
      moment
        .utc()
        .startOf("day")
        .isBefore(moment.utc(company.trialEndsAt), "day"))
  )
    return empty;

  const invoice = await Invoices.findOne({
    where: { companyId, status: "open", dueDate: { [Op.lte]: billingDay } },
    attributes: ["id", "dueDate"],
    order: [
      ["dueDate", "ASC"],
      ["id", "ASC"]
    ]
  });
  if (!invoice) return empty;

  const gracePeriod =
    Number(await GetCompanySetting(1, "gracePeriod", "0")) || 0;
  const deadline = subscriptionDeadline(invoice.dueDate, gracePeriod);
  if (!deadline.isValid()) return empty;
  const overdue = invoice.dueDate.slice(0, 10) < billingDay;
  return {
    billingDay,
    trial,
    notice: {
      invoiceId: invoice.id,
      dueDate: invoice.dueDate.slice(0, 10),
      severity: overdue ? "error" : "warning",
      remainingDays: Math.max(
        0,
        deadline.clone().startOf("day").diff(today, "days") + 1
      ),
      deadline: deadline.format("YYYY-MM-DD"),
      blocked: moment().isAfter(deadline)
    }
  };
};

export default SubscriptionNoticeService;
