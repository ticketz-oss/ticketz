import AppError from "../../errors/AppError";

export const assertTrialDays = (value: unknown): number => {
  const parsed = Number(value);
  if (
    typeof value === "boolean" ||
    !Number.isInteger(parsed) ||
    parsed < 0 ||
    parsed > 3650
  )
    throw new AppError("ERR_INVALID_TRIAL_DAYS");
  return parsed;
};

export const assertDueDay = (value: unknown): number => {
  const parsed = Number(value);
  if (
    typeof value === "boolean" ||
    !Number.isInteger(parsed) ||
    parsed < 1 ||
    parsed > 31
  )
    throw new AppError("ERR_INVALID_DUE_DAY");
  return parsed;
};
