import Company from "../../../models/Company";
import Setting from "../../../models/Setting";
import {
  allowedVoiceCompanyIds,
  assertVoiceCompanyAllowlisted,
  voiceEnabledForCompany
} from "../VoiceAccessService";

jest.mock("../../../models/Company");
jest.mock("../../../models/Setting");

const companyFindByPk = Company.findByPk as jest.MockedFunction<
  typeof Company.findByPk
>;
const settingFindOne = Setting.findOne as jest.MockedFunction<
  typeof Setting.findOne
>;

describe("VoiceAccessService tenant isolation", () => {
  beforeEach(() => {
    process.env.WACALLS_ENABLED = "true";
    process.env.WACALLS_ALLOWED_COMPANY_IDS = "1";
  });

  afterAll(() => {
    delete process.env.WACALLS_ENABLED;
    delete process.env.WACALLS_ALLOWED_COMPANY_IDS;
  });

  it("parses only valid positive company IDs", () => {
    process.env.WACALLS_ALLOWED_COMPANY_IDS = "1, 9, invalid, -2";
    expect([...allowedVoiceCompanyIds()]).toEqual([1, 9]);
  });

  it("enables only the active allowlisted tenant with its switch on", async () => {
    companyFindByPk.mockResolvedValue({
      id: 1,
      status: true,
      platformStatus: "ativo"
    } as Company);
    settingFindOne.mockResolvedValue({ value: "true" } as Setting);

    await expect(voiceEnabledForCompany(1)).resolves.toBe(true);
    await expect(voiceEnabledForCompany(9)).resolves.toBe(false);
    expect(companyFindByPk).toHaveBeenCalledTimes(1);
  });

  it("denies a tenant outside the immutable server allowlist", () => {
    expect(() => assertVoiceCompanyAllowlisted(9)).toThrow(
      "ERR_VOICE_NOT_ALLOWLISTED"
    );
  });

  it("keeps the pilot off when the per-tenant switch is disabled", async () => {
    companyFindByPk.mockResolvedValue({
      id: 1,
      status: true,
      platformStatus: "ativo"
    } as Company);
    settingFindOne.mockResolvedValue({ value: "false" } as Setting);

    await expect(voiceEnabledForCompany(1)).resolves.toBe(false);
  });
});
