import { Op } from "sequelize";
import Company from "../../models/Company";
import {
  assertCompanyTimezone,
  initializeCompanyTimezone,
  normalizeCompanyTimezone
} from "../../services/CompanyService/CompanyTimezoneService";

jest.mock("../../models/Company");

const companyUpdate = Company.update as jest.MockedFunction<
  typeof Company.update
>;

describe("CompanyTimezoneService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("accepts IANA zones and rejects invalid input", () => {
    expect(normalizeCompanyTimezone("America/Rio_Branco")).toBe(
      "America/Rio_Branco"
    );
    expect(normalizeCompanyTimezone("Marte/Olimpo")).toBeNull();
    expect(() => assertCompanyTimezone("Marte/Olimpo")).toThrow(
      "ERR_COMPANY_INVALID_TIMEZONE"
    );
  });

  it("records the first valid browser zone with an atomic null guard", async () => {
    companyUpdate.mockResolvedValue([1]);

    await initializeCompanyTimezone(42, "America/Manaus");

    expect(companyUpdate).toHaveBeenCalledWith(
      { timezone: "America/Manaus" },
      {
        where: {
          id: 42,
          timezone: { [Op.is]: null }
        }
      }
    );
  });

  it("ignores invalid browser values without blocking access", async () => {
    await initializeCompanyTimezone(42, "not-a-timezone");
    expect(companyUpdate).not.toHaveBeenCalled();
  });
});
