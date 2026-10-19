import { DateTime } from "luxon";
import { parseOneTimeSchedule } from "../recurrence";

describe("schedule one-time date", () => {
  it("interprets a date without offset in the selected IANA timezone", async () => {
    const result = parseOneTimeSchedule(
      "2026-08-13T12:10",
      "America/Rio_Branco"
    );

    expect(DateTime.fromJSDate(result).toUTC().toISO()).toBe(
      "2026-08-13T17:10:00.000Z"
    );
  });

  it("preserves an explicit UTC offset", async () => {
    const result = parseOneTimeSchedule(
      "2026-08-13T12:10:00Z",
      "America/Rio_Branco"
    );

    expect(DateTime.fromJSDate(result).toUTC().toISO()).toBe(
      "2026-08-13T12:10:00.000Z"
    );
  });
});
