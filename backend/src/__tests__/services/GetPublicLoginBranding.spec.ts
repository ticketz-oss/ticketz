import Company from "../../models/Company";
import Setting from "../../models/Setting";
import GetPublicSettingService from "../../services/SettingServices/GetPublicSettingService";

jest.mock("../../models/Company", () => ({
  __esModule: true,
  default: { findOne: jest.fn() }
}));
jest.mock("../../models/Setting", () => ({
  __esModule: true,
  default: { findOne: jest.fn() }
}));

const companyFindOne = Company.findOne as jest.Mock;
const settingFindOne = Setting.findOne as jest.Mock;
const originalMasterCompanyId = process.env.MASTER_COMPANY_ID;
const loginKeys = ["loginHeadline", "loginDescription", "loginTemplate"];

describe("public login branding", () => {
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

  it.each(loginKeys)("returns %s only from the requested tenant", async key => {
    process.env.MASTER_COMPANY_ID = "1";
    companyFindOne.mockResolvedValue({ id: 12 });
    settingFindOne.mockResolvedValue({ value: "tenant-specific-value" });

    await expect(
      GetPublicSettingService({ key, slug: "  ACNORTE  " })
    ).resolves.toBe("tenant-specific-value");

    expect(companyFindOne).toHaveBeenCalledWith({
      where: { slug: "acnorte" },
      attributes: ["id"]
    });
    expect(settingFindOne).toHaveBeenCalledTimes(1);
    expect(settingFindOne).toHaveBeenCalledWith({
      where: { companyId: 12, key }
    });
  });

  it.each(loginKeys)(
    "does not expose %s from any client for an unknown slug without a master",
    async key => {
      companyFindOne.mockResolvedValue(null);
      settingFindOne.mockResolvedValue({ value: "private-client-brand" });

      await expect(
        GetPublicSettingService({ key, slug: "unknown-tenant" })
      ).resolves.toBeNull();
      expect(settingFindOne).not.toHaveBeenCalled();
    }
  );

  it.each([undefined, "", "invalid/slug", "admin"])(
    "uses neutral branding for an unresolved slug %s without a master",
    async slug => {
      await expect(
        GetPublicSettingService({ key: "loginHeadline", slug })
      ).resolves.toBeNull();
      expect(companyFindOne).not.toHaveBeenCalled();
      expect(settingFindOne).not.toHaveBeenCalled();
    }
  );

  it("uses only the explicitly configured master as a fallback", async () => {
    process.env.MASTER_COMPANY_ID = "99";
    companyFindOne.mockResolvedValue(null);
    settingFindOne.mockResolvedValue({ value: "Espaço Apps" });

    await expect(
      GetPublicSettingService({ key: "loginHeadline", slug: "unknown-tenant" })
    ).resolves.toBe("Espaço Apps");
    expect(settingFindOne).toHaveBeenCalledWith({
      where: { companyId: 99, key: "loginHeadline" }
    });
  });

  it.each(["0", "-1", "1.5", "not-a-number"])(
    "does not resolve a client using invalid master ID %s",
    async masterId => {
      process.env.MASTER_COMPANY_ID = masterId;

      await expect(
        GetPublicSettingService({ key: "loginTemplate" })
      ).resolves.toBeNull();
      expect(settingFindOne).not.toHaveBeenCalled();
    }
  );

  it.each(["_privateKey", "smtpPassword", "loginTemplateUnknown"])(
    "keeps unlisted setting %s private without even querying the tenant",
    async key => {
      companyFindOne.mockResolvedValue({ id: 12 });
      settingFindOne.mockResolvedValue({ value: "secret" });

      await expect(
        GetPublicSettingService({ key, slug: "acnorte" })
      ).resolves.toBeNull();
      expect(companyFindOne).not.toHaveBeenCalled();
      expect(settingFindOne).not.toHaveBeenCalled();
    }
  );

  it.each([null, { value: "" }])(
    "allows a missing or cleared tenant value to use the frontend default",
    async setting => {
      companyFindOne.mockResolvedValue({ id: 12 });
      settingFindOne.mockResolvedValue(setting);

      await expect(
        GetPublicSettingService({ key: "loginDescription", slug: "acnorte" })
      ).resolves.toBeNull();
      expect(settingFindOne).toHaveBeenCalledTimes(1);
    }
  );
});
