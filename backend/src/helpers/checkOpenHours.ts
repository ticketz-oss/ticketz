import { DateTime } from "luxon";

type HourRange = { from: string; to: string };
type WeeklyRule = { days: string[]; hours: HourRange[] };
type Override = {
  date: string;
  repeat?: "yearly";
  closed?: boolean;
  hours?: HourRange[];
  label?: string;
};
export type OpenHoursData = {
  weeklyRules: WeeklyRule[];
  overrides: Override[];
  timezone: string;
};

function isNowInRange(now: DateTime, hr: HourRange): boolean {
  const [fromHour, fromMinute] = hr.from.split(":").map(Number);
  const [toHour, toMinute] = hr.to.split(":").map(Number);

  const from = now.set({
    hour: fromHour,
    minute: fromMinute,
    second: 0,
    millisecond: 0
  });
  const to = now.set({
    hour: toHour,
    minute: toMinute,
    second: 0,
    millisecond: 0
  });

  return now >= from && now < to;
}

export function checkOpenHours(data: OpenHoursData): boolean {
  const now = DateTime.now().setZone(data.timezone);
  const todayStr = now.toISODate(); // e.g., "2026-02-16"
  const todayMonthDay = now.toFormat("MM-dd"); // e.g., "12-25"
  const weekday = now.toFormat("ccc").toLowerCase().slice(0, 3); // "mon", "tue", etc.

  // 1. Check for override
  const override: Override = data.overrides.find(o => {
    if (o.repeat === "yearly") {
      return o.date.slice(5) === todayMonthDay;
    }
    return o.date === todayStr;
  });

  if (override) {
    if (override.closed) return false;
    if (override.hours && override.hours.length > 0) {
      return override.hours.some(hr => isNowInRange(now, hr));
    }
    // If override exists but not closed and no hours, treat as closed
    return false;
  }

  // 2. Check weekly rules
  // eslint-disable-next-line no-restricted-syntax
  for (const rule of data.weeklyRules) {
    if (rule.days.includes(weekday)) {
      if (rule.hours.length === 0) return false;
      if (rule.hours.some(hr => isNowInRange(now, hr))) {
        return true;
      }
    }
  }
  return false;
}
