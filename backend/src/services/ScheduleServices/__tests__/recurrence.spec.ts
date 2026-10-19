import { DateTime } from "luxon";
import {
  birthdayMatches,
  isValidBirthday,
  nextBirthdayScan,
  nextCommemorativeOccurrence,
  occurrenceForYear
} from "../recurrence";

describe("schedule recurrence", () => {
  it("validates day and month pairs including leap day", () => {
    expect(isValidBirthday(29, 2)).toBe(true);
    expect(isValidBirthday(31, 4)).toBe(false);
    expect(isValidBirthday(undefined, undefined)).toBe(true);
    expect(isValidBirthday(10, undefined)).toBe(false);
  });

  it("uses February 28 for leap-day birthdays in non-leap years", () => {
    expect(birthdayMatches(29, 2, DateTime.fromISO("2025-02-28"))).toBe(true);
    expect(birthdayMatches(29, 2, DateTime.fromISO("2024-02-28"))).toBe(false);
    expect(birthdayMatches(29, 2, DateTime.fromISO("2024-02-29"))).toBe(true);
  });

  it("calculates the birthday scan in the tenant timezone", () => {
    const next = nextBirthdayScan(
      "09:00",
      "America/Rio_Branco",
      DateTime.fromISO("2026-08-31T13:30:00Z")
    );

    expect(DateTime.fromJSDate(next).toUTC().toISO()).toBe(
      "2026-08-31T14:00:00.000Z"
    );
  });

  it("calculates the second Sunday of May", () => {
    const occurrence = occurrenceForYear(
      {
        ruleType: "NTH_WEEKDAY",
        month: 5,
        day: null,
        weekday: 0,
        ordinal: 2
      } as Parameters<typeof occurrenceForYear>[0],
      2027,
      "09:30",
      "America/Sao_Paulo"
    );
    expect(occurrence.toFormat("yyyy-LL-dd HH:mm")).toBe("2027-05-09 09:30");
  });

  it("calculates the last weekday in a month", () => {
    const occurrence = occurrenceForYear(
      {
        ruleType: "NTH_WEEKDAY",
        month: 8,
        day: null,
        weekday: 1,
        ordinal: -1
      } as Parameters<typeof occurrenceForYear>[0],
      2026,
      "08:00",
      "America/Rio_Branco"
    );
    expect(occurrence.toFormat("yyyy-LL-dd HH:mm")).toBe("2026-08-31 08:00");
  });

  it("moves a past fixed date to the next year", () => {
    const next = nextCommemorativeOccurrence(
      {
        ruleType: "FIXED_DATE",
        month: 1,
        day: 1,
        weekday: null,
        ordinal: null
      } as Parameters<typeof nextCommemorativeOccurrence>[0],
      "10:00",
      "UTC",
      DateTime.fromISO("2026-08-13T10:00:00Z")
    );
    expect(DateTime.fromJSDate(next, { zone: "UTC" }).toISODate()).toBe(
      "2027-01-01"
    );
  });

  it("skips years without the requested fifth weekday", () => {
    const next = nextCommemorativeOccurrence(
      {
        ruleType: "NTH_WEEKDAY",
        month: 2,
        day: null,
        weekday: 1,
        ordinal: 5
      } as Parameters<typeof nextCommemorativeOccurrence>[0],
      "10:00",
      "UTC",
      DateTime.fromISO("2026-01-01T00:00:00Z")
    );
    expect(DateTime.fromJSDate(next, { zone: "UTC" }).toISODate()).toBe(
      "2044-02-29"
    );
  });
});
