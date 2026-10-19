import Setting from "../../models/Setting";
import isSignupAllowed from "../../services/CompanyService/SignupGateService";

jest.mock("../../models/Setting", () => ({
  __esModule: true,
  default: { findOne: jest.fn() }
}));

const settingFindOne = Setting.findOne as jest.Mock;
const originalMasterCompanyId = process.env.MASTER_COMPANY_ID;

describe("self-service signup gate", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    delete process.env.MASTER_COMPANY_ID;
  });

  afterAll(() => {
    if (originalMasterCompanyId === undefined) {
      delete process.env.MASTER_COMPANY_ID;
    } else {
      process.env.MASTER_COMPANY_ID = originalMasterCompanyId;
    }
  });

  it("is closed when MASTER_COMPANY_ID is missing", async () => {
    await expect(isSignupAllowed()).resolves.toBe(false);
    expect(settingFindOne).not.toHaveBeenCalled();
  });

  it.each(["abc", "0", "-3"])(
    "is closed for invalid MASTER_COMPANY_ID %s",
    async raw => {
      process.env.MASTER_COMPANY_ID = raw;
      await expect(isSignupAllowed()).resolves.toBe(false);
      expect(settingFindOne).not.toHaveBeenCalled();
    }
  );

  it("is closed when the master has no allowSignup row", async () => {
    process.env.MASTER_COMPANY_ID = "1";
    settingFindOne.mockResolvedValue(null);
    await expect(isSignupAllowed()).resolves.toBe(false);
  });

  it("reads allowSignup from the configured master company", async () => {
    process.env.MASTER_COMPANY_ID = "7";
    settingFindOne.mockResolvedValue({ value: "enabled" });
    await expect(isSignupAllowed()).resolves.toBe(true);
    expect(settingFindOne).toHaveBeenCalledWith({
      where: { companyId: 7, key: "allowSignup" }
    });
  });

  it("is closed when allowSignup is disabled", async () => {
    process.env.MASTER_COMPANY_ID = "1";
    settingFindOne.mockResolvedValue({ value: "disabled" });
    await expect(isSignupAllowed()).resolves.toBe(false);
  });
});
