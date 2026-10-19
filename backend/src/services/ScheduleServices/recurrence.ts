import { DateTime } from "luxon";
import AppError from "../../errors/AppError";
import CommemorativeDate from "../../models/CommemorativeDate";

export const isValidBirthday = (day?: number, month?: number): boolean => {
  if (day == null && month == null) return true;
  if (day == null || month == null) return false;
  return DateTime.fromObject({ year: 2000, month, day }).isValid;
};

export const parseSendTime = (
  sendTime: string
): { hour: number; minute: number } => {
  const match = /^(\d{2}):(\d{2})$/.exec(sendTime || "");
  if (!match) throw new AppError("ERR_SCHEDULE_INVALID_TIME", 400);
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    throw new AppError("ERR_SCHEDULE_INVALID_TIME", 400);
  }
  return { hour, minute };
};

export const validateTimezone = (timezone: string): string => {
  const value = timezone || "UTC";
  if (!DateTime.now().setZone(value).isValid) {
    throw new AppError("ERR_SCHEDULE_INVALID_TIMEZONE", 400);
  }
  return value;
};

export const parseOneTimeSchedule = (
  sendAt: Date | string,
  timezone: string
): Date => {
  const raw = String(sendAt);
  const zone = validateTimezone(timezone);
  const parsed = /(?:Z|[+-]\d{2}:?\d{2})$/.test(raw)
    ? DateTime.fromISO(raw)
    : DateTime.fromISO(raw, { zone });
  if (!parsed.isValid) throw new AppError("ERR_SCHEDULE_INVALID_DATE", 400);
  return parsed.toUTC().toJSDate();
};

const fixedOccurrence = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  zone: string
): DateTime => {
  let occurrenceDay = day;
  if (month === 2 && day === 29 && !DateTime.local(year, 2, 29).isValid) {
    occurrenceDay = 28;
  }
  return DateTime.fromObject(
    {
      year,
      month,
      day: occurrenceDay,
      hour,
      minute,
      second: 0,
      millisecond: 0
    },
    { zone }
  );
};

const nthWeekdayOccurrence = (
  year: number,
  month: number,
  weekday: number,
  ordinal: number,
  hour: number,
  minute: number,
  zone: string
): DateTime => {
  const luxonWeekday = weekday === 0 ? 7 : weekday;
  if (ordinal === -1) {
    let date = DateTime.fromObject({ year, month, day: 1 }, { zone }).endOf(
      "month"
    );
    while (date.weekday !== luxonWeekday) date = date.minus({ days: 1 });
    return date.set({ hour, minute, second: 0, millisecond: 0 });
  }

  let date = DateTime.fromObject({ year, month, day: 1 }, { zone });
  const offset = (luxonWeekday - date.weekday + 7) % 7;
  date = date.plus({ days: offset + (ordinal - 1) * 7 });
  if (date.month !== month) {
    throw new AppError("ERR_COMMEMORATIVE_DATE_INVALID_RULE", 400);
  }
  return date.set({ hour, minute, second: 0, millisecond: 0 });
};

export const occurrenceForYear = (
  commemorativeDate: Pick<
    CommemorativeDate,
    "ruleType" | "month" | "day" | "weekday" | "ordinal"
  >,
  year: number,
  sendTime: string,
  timezone: string
): DateTime => {
  const zone = validateTimezone(timezone);
  const { hour, minute } = parseSendTime(sendTime);
  if (commemorativeDate.ruleType === "FIXED_DATE") {
    return fixedOccurrence(
      year,
      commemorativeDate.month,
      commemorativeDate.day,
      hour,
      minute,
      zone
    );
  }
  return nthWeekdayOccurrence(
    year,
    commemorativeDate.month,
    commemorativeDate.weekday,
    commemorativeDate.ordinal,
    hour,
    minute,
    zone
  );
};

export const nextCommemorativeOccurrence = (
  commemorativeDate: Pick<
    CommemorativeDate,
    "ruleType" | "month" | "day" | "weekday" | "ordinal"
  >,
  sendTime: string,
  timezone: string,
  from: DateTime = DateTime.now()
): Date => {
  const localFrom = from.setZone(validateTimezone(timezone));
  let year = localFrom.year;
  while (year <= localFrom.year + 28) {
    try {
      const occurrence = occurrenceForYear(
        commemorativeDate,
        year,
        sendTime,
        timezone
      );
      if (occurrence > localFrom) return occurrence.toUTC().toJSDate();
    } catch (error) {
      if (
        !(error instanceof AppError) ||
        error.message !== "ERR_COMMEMORATIVE_DATE_INVALID_RULE"
      ) {
        throw error;
      }
    }
    year += 1;
  }
  throw new AppError("ERR_COMMEMORATIVE_DATE_INVALID_RULE", 400);
};

export const nextBirthdayScan = (
  sendTime: string,
  timezone: string,
  from: DateTime = DateTime.now()
): Date => {
  const localFrom = from.setZone(validateTimezone(timezone));
  const { hour, minute } = parseSendTime(sendTime);
  let next = localFrom.set({ hour, minute, second: 0, millisecond: 0 });
  if (next <= localFrom) next = next.plus({ days: 1 });
  return next.toUTC().toJSDate();
};

export const birthdayMatches = (
  day: number,
  month: number,
  localDate: DateTime
): boolean => {
  if (month === 2 && day === 29 && !localDate.isInLeapYear) {
    return localDate.month === 2 && localDate.day === 28;
  }
  return localDate.month === month && localDate.day === day;
};
