import { IANAZone } from "luxon";
import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import Company from "../../models/Company";

const MAX_TIMEZONE_LENGTH = 100;

export const normalizeCompanyTimezone = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return null;

  const timezone = value.trim();
  if (
    !timezone ||
    timezone.length > MAX_TIMEZONE_LENGTH ||
    !IANAZone.isValidZone(timezone)
  ) {
    return null;
  }

  return timezone;
};

export const assertCompanyTimezone = (value: unknown): string | null => {
  const timezone = normalizeCompanyTimezone(value);
  if (value !== undefined && value !== null && value !== "" && !timezone) {
    throw new AppError("ERR_COMPANY_INVALID_TIMEZONE", 400);
  }
  return timezone;
};

/**
 * Captures the first authenticated browser's IANA zone exactly once.
 * The conditional UPDATE is atomic, so concurrent first accesses cannot
 * replace the zone selected by the request that reached Postgres first.
 */
export const initializeCompanyTimezone = async (
  companyId: number,
  value: unknown
): Promise<void> => {
  const timezone = normalizeCompanyTimezone(value);
  if (!timezone) return;

  await Company.update(
    { timezone },
    {
      where: {
        id: companyId,
        timezone: { [Op.is]: null }
      }
    }
  );
};
