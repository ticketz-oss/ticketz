import {
  dueDateAfterPayment,
  firstBillableDueDate,
  nextRecurringDueDate,
  resolveDueDate,
  resolveTrialEndsAt
} from "../BillingDateService";
import { calculateProrataCents } from "../ProrataService";

describe("billing date and prorata rules", () => {
  it("implements the approved R$ 300 example exactly", () => {
    const trialEndsAt = resolveTrialEndsAt("2026-09-04", 15);
    const dueDate = firstBillableDueDate(trialEndsAt, 5);
    expect(trialEndsAt).toBe("2026-09-19");
    expect(dueDate).toBe("2026-10-05");
    expect(calculateProrataCents(30000, trialEndsAt, dueDate)).toBe(15871);
  });

  it.each([
    [2025, 1, 31, "2025-02-28"],
    [2024, 1, 31, "2024-02-29"],
    [2026, 3, 31, "2026-04-30"],
    [2026, 0, 31, "2026-01-31"]
  ])("clamps due day to the actual month", (year, month, day, expected) => {
    expect(resolveDueDate(year as number, month as number, day as number)).toBe(
      expected
    );
  });

  it("uses a strictly later due date when trial ends on due day", () => {
    expect(firstBillableDueDate("2026-09-05", 5)).toBe("2026-10-05");
    expect(calculateProrataCents(29990, "2026-09-05", "2026-10-05")).toBe(
      29990
    );
  });

  it("handles year boundaries and recurrence anchors", () => {
    expect(firstBillableDueDate("2026-12-31", 5)).toBe("2027-01-05");
    expect(nextRecurringDueDate("2024-02-29", 31, "MENSAL")).toBe("2024-03-31");
    expect(nextRecurringDueDate("2026-01-31", 31, "ANUAL")).toBe("2027-01-31");
  });

  it.each([
    ["MENSAL", "2026-02-28"],
    ["BIMESTRAL", "2026-03-31"],
    ["TRIMESTRAL", "2026-04-30"],
    ["SEMESTRAL", "2026-07-31"],
    ["ANUAL", "2027-01-31"]
  ])("preserves due-day anchors for %s", (recurrence, expected) => {
    expect(nextRecurringDueDate("2026-01-31", 31, recurrence)).toBe(expected);
  });

  it("keeps integer precision across month boundaries", () => {
    expect(calculateProrataCents(29990, "2024-02-20", "2024-04-05")).toBe(
      44330
    );
  });

  it("makes trial zero billable on the activation day", () => {
    expect(resolveTrialEndsAt("2026-09-04", 0)).toBe("2026-09-04");
  });

  it("charges the first invoice on the last trial day, prorated up to the due day", () => {
    // Signed up on the 1st, 14 days of trial, due day 30: 15 days are billed.
    const trialEndsAt = resolveTrialEndsAt("2026-11-01", 14);
    const periodEnd = firstBillableDueDate(trialEndsAt, 30);
    expect(trialEndsAt).toBe("2026-11-15");
    expect(periodEnd).toBe("2026-11-30");
    expect(calculateProrataCents(30000, trialEndsAt, periodEnd)).toBe(15000);
  });

  it("moves the due date to the end of the prorated period once it is paid", () => {
    expect(
      dueDateAfterPayment({
        billingType: "initial_prorata",
        periodEnd: "2026-11-30",
        currentDueDate: "2026-11-15",
        dueDay: 30
      })
    ).toBe("2026-11-30");
    // Paying a regular invoice keeps the monthly anchor.
    expect(
      dueDateAfterPayment({
        billingType: "regular",
        periodEnd: null,
        currentDueDate: "2026-11-30",
        dueDay: 30
      })
    ).toBe("2026-12-30");
  });

  it("keeps companies created before the change on their monthly cycle", () => {
    // Their first invoice was already due on the first due day.
    expect(
      dueDateAfterPayment({
        billingType: "initial_prorata",
        periodEnd: "2026-11-05",
        currentDueDate: "2026-11-05",
        dueDay: 5
      })
    ).toBe("2026-12-05");
  });
});
