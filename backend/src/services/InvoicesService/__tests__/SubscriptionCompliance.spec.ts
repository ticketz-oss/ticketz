import Company from "../../../models/Company";
import Invoices from "../../../models/Invoices";
import { GetCompanySetting } from "../../../helpers/CheckSettings";
import { checkCompanyCompliant } from "../../../helpers/CheckCompanyCompliant";

jest.mock("../../../models/Company", () => ({ findByPk: jest.fn() }));
jest.mock("../../../models/Invoices", () => ({ findOne: jest.fn() }));
jest.mock("../../../helpers/CheckSettings", () => ({
  GetCompanySetting: jest.fn()
}));
jest.mock("../../../utils/logger", () => ({ logger: {} }));
jest.mock("../../../helpers/simpleObjectCache", () => ({
  SimpleObjectCache: class {
    get = jest.fn().mockResolvedValue(null);
    set = jest.fn();
  }
}));

describe("invoice grace period enforcement", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (Company.findByPk as jest.Mock).mockResolvedValue({
      id: 9,
      dueDate: "2026-10-19"
    });
    (Invoices.findOne as jest.Mock).mockResolvedValue({
      dueDate: "2026-09-25"
    });
    (GetCompanySetting as jest.Mock).mockResolvedValue("5");
  });
  afterEach(() => jest.useRealTimers());

  it("keeps access through the fifth full day after the invoice due date", async () => {
    jest.setSystemTime(new Date(2026, 8, 30, 23, 59, 59, 999));
    expect(await checkCompanyCompliant(9)).toBe(true);
  });

  it("blocks on day six even if the subscription date was extended", async () => {
    jest.setSystemTime(new Date(2026, 9, 1));
    expect(await checkCompanyCompliant(9)).toBe(false);
    expect(Invoices.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: 9, status: "open" } })
    );
  });

  it("restores access using the renewed subscription date after payment", async () => {
    jest.setSystemTime(new Date(2026, 9, 1));
    (Invoices.findOne as jest.Mock).mockResolvedValue(null);
    expect(await checkCompanyCompliant(9)).toBe(true);
  });
});
