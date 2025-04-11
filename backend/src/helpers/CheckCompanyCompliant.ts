import Company from "../models/Company";
import { GetCompanySetting } from "./CheckSettings";

export async function checkCompanyCompliant(
  company: number | Company
): Promise<boolean> {
  if ((typeof company === "object" && company?.id === 1) || company === 1) {
    return true;
  }

  if (typeof company === "number") {
    company = await Company.findByPk(company);
  }

  const gracePeriod =
    Number(await GetCompanySetting(1, "gracePeriod", "0")) || 0;

  const dueDate = new Date(company.dueDate);
  dueDate.setDate(dueDate.getDate() + gracePeriod);

  return new Date() <= dueDate;
}
