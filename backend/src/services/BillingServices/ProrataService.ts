import moment from "moment";
import AppError from "../../errors/AppError";

export const PRORATA_SCALE = 377580;

const parse = (value: string) => {
  const date = moment.utc(value, "YYYY-MM-DD", true);
  if (!date.isValid()) throw new AppError("ERR_INVALID_BILLING_DATE");
  return date.startOf("day");
};

export const calculateProrataCents = (
  monthlyCents: number,
  periodStart: string,
  periodEnd: string
): number => {
  if (!Number.isSafeInteger(monthlyCents) || monthlyCents < 0)
    throw new AppError("ERR_INVALID_INVOICE_VALUE");
  let cursor = parse(periodStart);
  const end = parse(periodEnd);
  if (!end.isAfter(cursor, "day"))
    throw new AppError("ERR_INVALID_BILLING_PERIOD");
  if (cursor.clone().add(1, "month").isSame(end, "day")) return monthlyCents;

  let scaled = 0;
  while (cursor.isBefore(end, "day")) {
    const segmentEnd = moment.min(
      cursor.clone().add(1, "month").startOf("month"),
      end
    );
    const days = segmentEnd.diff(cursor, "days");
    const daysInMonth = cursor.daysInMonth();
    scaled += monthlyCents * days * (PRORATA_SCALE / daysInMonth);
    cursor = segmentEnd.clone();
  }
  return Math.floor((scaled + PRORATA_SCALE / 2) / PRORATA_SCALE);
};
