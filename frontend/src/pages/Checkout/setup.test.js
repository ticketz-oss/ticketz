import {
  firstBillingPreview,
  isReservedSlug,
  prorataCents,
  slugFromName,
  tenantLoginUrl,
  trialEndPreview
} from "./setup";

describe("self-service setup", () => {
  it("uses the chosen billing day strictly after all 7 trial days", () => {
    expect(
      firstBillingPreview(15, new Date("2026-10-08T18:00:00Z")).toISOString()
    ).toBe("2026-11-15T00:00:00.000Z");
    expect(
      firstBillingPreview(16, new Date("2026-10-08T18:00:00Z")).toISOString()
    ).toBe("2026-10-16T00:00:00.000Z");
  });
  it("clamps day 31 in February and handles the year boundary", () => {
    expect(
      firstBillingPreview(31, new Date("2027-01-25T18:00:00Z")).toISOString()
    ).toBe("2027-02-28T00:00:00.000Z");
    expect(
      firstBillingPreview(5, new Date("2026-12-20T18:00:00Z")).toISOString()
    ).toBe("2027-01-05T00:00:00.000Z");
  });
  it("charges the first invoice on the last trial day, prorated to the due day", () => {
    const now = new Date("2026-11-01T18:00:00Z");
    const start = trialEndPreview(now);
    const end = firstBillingPreview(30, now);
    expect(start.toISOString()).toBe("2026-11-08T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-30T00:00:00.000Z");
    expect(prorataCents(30000, start, end)).toBe(22000);
  });
  it("matches the backend prorata across months and for a full month", () => {
    expect(
      prorataCents(
        30000,
        new Date("2026-09-19T00:00:00Z"),
        new Date("2026-10-05T00:00:00Z")
      )
    ).toBe(15871);
    expect(
      prorataCents(
        29990,
        new Date("2024-02-20T00:00:00Z"),
        new Date("2024-04-05T00:00:00Z")
      )
    ).toBe(44330);
    expect(
      prorataCents(
        29990,
        new Date("2026-09-05T00:00:00Z"),
        new Date("2026-10-05T00:00:00Z")
      )
    ).toBe(29990);
  });
  it("ends the trial 7 days after signup", () => {
    expect(
      trialEndPreview(new Date("2026-10-28T23:59:00Z")).toISOString()
    ).toBe("2026-11-04T00:00:00.000Z");
  });
  it.each(["app", "admin", "public", "www"])("flags %s as reserved", slug => {
    expect(isReservedSlug(slug)).toBe(true);
  });
  it("accepts a normal company address", () => {
    expect(isReservedSlug("loja-da-ana")).toBe(false);
  });
  it("generates a usable address from a company name", () => {
    expect(slugFromName(" Clínica São João! ")).toBe("clinica-sao-joao");
    expect(slugFromName("a".repeat(62) + " ! última")).toBe("a".repeat(62));
  });
  it("sends the new tenant to its own login with the local port", () => {
    expect(
      tenantLoginUrl("minha-empresa", {
        protocol: "http:",
        hostname: "localhost",
        port: "3000"
      })
    ).toBe("http://minha-empresa.localhost:3000/login");
    expect(
      tenantLoginUrl(
        "minha-empresa",
        { protocol: "https:", hostname: "www.example.com", port: "" },
        "example.com"
      )
    ).toBe("https://minha-empresa.example.com/login");
  });
});
