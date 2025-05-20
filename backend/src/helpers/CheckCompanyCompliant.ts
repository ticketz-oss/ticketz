import { Mutex } from "async-mutex";
import Company from "../models/Company";
import { logger } from "../utils/logger";
import { GetCompanySetting } from "./CheckSettings";
import { SimpleObjectCache } from "./simpleObjectCache";

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

    const dueDate = new Date(company.dueDate);
    dueDate.setDate(dueDate.getDate() + gracePeriod);
    dueDate.setHours(23, 59, 59, 999);

    const isCompliant = new Date() <= dueDate;

    companyComplianceCache.set(cacheKey, isCompliant);

    return isCompliant;
  });
}
