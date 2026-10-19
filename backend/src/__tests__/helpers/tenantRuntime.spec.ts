import { Op } from "sequelize";
import {
  assertRuntimeCompany,
  isDedicatedRuntime,
  runtimeCompanyWhere,
  runtimeOwnsCompany,
  runtimeQueueOptions
} from "../../helpers/tenantRuntime";

describe("tenant runtime ownership", () => {
  const original = { ...process.env };
  beforeEach(() => {
    delete process.env.TENANT_RUNTIME_COMPANY_ID;
    delete process.env.TENANT_RUNTIME_EXCLUDED_COMPANY_IDS;
    delete process.env.QUEUE_PREFIX;
  });
  afterAll(() => {
    process.env = original;
  });

  it("preserves legacy ownership and Redis queue names by default", () => {
    expect(runtimeOwnsCompany(9)).toBe(true);
    expect(runtimeOwnsCompany(1)).toBe(true);
    expect(runtimeCompanyWhere()).toEqual({});
    expect(isDedicatedRuntime()).toBe(false);
    expect(runtimeQueueOptions()).toEqual({ prefix: "bull" });
  });

  it("assigns the dedicated runtime only its tenant", () => {
    process.env.TENANT_RUNTIME_COMPANY_ID = "9";
    process.env.QUEUE_PREFIX = "acnorte-production";
    expect(runtimeOwnsCompany(9)).toBe(true);
    expect(runtimeOwnsCompany(10)).toBe(false);
    expect(() => assertRuntimeCompany(10)).toThrow("ERR_FORBIDDEN");
    expect(runtimeCompanyWhere("id")).toEqual({ id: 9 });
    expect(isDedicatedRuntime()).toBe(true);
    expect(runtimeQueueOptions().prefix).toBe("acnorte-production");
  });

  it("makes legacy and dedicated ownership disjoint", () => {
    process.env.TENANT_RUNTIME_EXCLUDED_COMPANY_IDS = "9, 11";
    expect(runtimeOwnsCompany(9)).toBe(false);
    expect(runtimeOwnsCompany(10)).toBe(true);
    expect(runtimeOwnsCompany(11)).toBe(false);
    expect(runtimeCompanyWhere()).toEqual({
      companyId: { [Op.notIn]: [9, 11] }
    });
  });

  it.each(["0", "-9", "9oops", "9.5", "9007199254740993"])(
    "fails closed for invalid tenant %s",
    value => {
      process.env.TENANT_RUNTIME_COMPANY_ID = value;
      process.env.QUEUE_PREFIX = "acnorte-production";
      expect(() => runtimeOwnsCompany(9)).toThrow();
    }
  );

  it("rejects overlapping configuration", () => {
    process.env.TENANT_RUNTIME_COMPANY_ID = "9";
    process.env.TENANT_RUNTIME_EXCLUDED_COMPANY_IDS = "9";
    expect(() => runtimeOwnsCompany(9)).toThrow();
  });

  it.each([undefined, "bull"])(
    "rejects dedicated workers using shared queues (%s)",
    prefix => {
      process.env.TENANT_RUNTIME_COMPANY_ID = "9";
      if (prefix) process.env.QUEUE_PREFIX = prefix;
      expect(() => runtimeQueueOptions()).toThrow();
    }
  );
});
