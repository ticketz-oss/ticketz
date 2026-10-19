import { Mutex } from "async-mutex";
import Company from "../models/Company";
import { logger } from "../utils/logger";
import { GetCompanySetting } from "./CheckSettings";
import { SimpleObjectCache } from "./simpleObjectCache";
import moment from "moment";
import { subscriptionDeadline } from "./subscriptionDeadline";
import Invoices from "../models/Invoices";
import { companyTrial } from "./companyTrial";

const companyComplianceCache = new SimpleObjectCache(60 * 1000, logger);
const checkMutex = new Mutex();

export async function checkCompanyCompliant(
  company: number | Company
): Promise<boolean> {
  const companyId = typeof company === "number" ? company : company.id;

  // company 1 is always compliant
  if (companyId === 1) {
    return true;
  }

  return checkMutex.runExclusive(async () => {
    const cacheKey = `company-${companyId}`;
    const cachedValue = await companyComplianceCache.get(cacheKey);

    if (cachedValue) {
      return cachedValue;
    }

    if (typeof company === "number") {
      company = await Company.findByPk(company);
    }

    const gracePeriod =
      Number(await GetCompanySetting(1, "gracePeriod", "0")) || 0;

    if (
      companyTrial(company).status === "active" ||
      (!company.trialExpiresAt &&
        company.trialEndsAt &&
        moment
          .utc()
          .startOf("day")
          .isBefore(moment.utc(company.trialEndsAt), "day"))
    ) {
      companyComplianceCache.set(cacheKey, true);
      return true;
    }

    const openInvoice = await Invoices.findOne({
      where: { companyId, status: "open" },
      attributes: ["dueDate"],
      order: [["dueDate", "ASC"]]
    });
    const isCompliant = moment().isSameOrBefore(
      subscriptionDeadline(openInvoice?.dueDate || company.dueDate, gracePeriod)
    );

    companyComplianceCache.set(cacheKey, isCompliant);

    return isCompliant;
  });
}
