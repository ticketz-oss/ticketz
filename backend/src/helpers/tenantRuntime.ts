import { Op, WhereOptions } from "sequelize";
import AppError from "../errors/AppError";

// A shared database does not imply shared ownership of sockets or workers.
// Read at call time so tests can exercise configuration without importing app.ts.
const config = () => {
  const included = process.env.TENANT_RUNTIME_COMPANY_ID?.trim();
  const excluded = process.env.TENANT_RUNTIME_EXCLUDED_COMPANY_IDS?.trim();
  const parse = (value: string): number => {
    if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
      throw new Error("Invalid tenant runtime company ID");
    }
    return Number(value);
  };
  if (included && excluded) {
    throw new Error(
      "Tenant runtime inclusion and exclusion are mutually exclusive"
    );
  }
  const companyId = included ? parse(included) : undefined;
  const excludedIds = excluded
    ? excluded.split(",").map(id => parse(id.trim()))
    : [];
  if (
    companyId &&
    (!process.env.QUEUE_PREFIX || process.env.QUEUE_PREFIX === "bull")
  ) {
    throw new Error(
      "Dedicated tenant runtime requires a separate QUEUE_PREFIX"
    );
  }
  return { companyId, excludedIds };
};

export const isDedicatedRuntime = (): boolean => !!config().companyId;

export const runtimeOwnsCompany = (companyId: number): boolean => {
  const scope = config();
  return scope.companyId
    ? Number(companyId) === scope.companyId
    : !scope.excludedIds.includes(Number(companyId));
};

export const assertRuntimeCompany = (companyId: number): void => {
  if (!runtimeOwnsCompany(companyId)) throw new AppError("ERR_FORBIDDEN", 403);
};

export const runtimeCompanyWhere = (field = "companyId"): WhereOptions => {
  const scope = config();
  if (scope.companyId) return { [field]: scope.companyId };
  if (scope.excludedIds.length)
    return { [field]: { [Op.notIn]: scope.excludedIds } };
  return {};
};

export const runtimeQueueOptions = (): { prefix: string } => {
  config(); // Fail closed before connecting a dedicated worker to shared queues.
  return { prefix: process.env.QUEUE_PREFIX || "bull" };
};
