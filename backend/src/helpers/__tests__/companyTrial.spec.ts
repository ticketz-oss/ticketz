import { companyTrial } from "../companyTrial";

describe("company trial status", () => {
  const company = {
    trialStartedAt: "2026-10-08T18:00:00Z",
    trialExpiresAt: "2026-10-22T18:00:00Z"
  };
  it("keeps the last day available until the exact expiration time", () => {
    expect(companyTrial(company, new Date("2026-10-22T17:59:59Z")).status).toBe(
      "active"
    );
    expect(companyTrial(company, new Date("2026-10-22T18:00:00Z")).status).toBe(
      "expired"
    );
  });
  it("does not invent a trial for legacy companies", () => {
    expect(companyTrial({}).status).toBe("none");
  });
});
