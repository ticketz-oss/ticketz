import service, {
  normalizeSignupData
} from "../CreateSelfServiceCompanyService";
import CreateCompanyService from "../CreateCompanyService";
import Plan from "../../../models/Plan";
import {
  saveSignupBranding,
  prepareSignupImages
} from "../SignupBrandingService";

jest.mock("../../../database", () => ({
  __esModule: true,
  default: { transaction: jest.fn(callback => callback("transaction")) }
}));
jest.mock("../../../models/Plan", () => ({
  __esModule: true,
  default: { findOne: jest.fn() }
}));
jest.mock("../CreateCompanyService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../SignupBrandingService", () => ({
  prepareSignupImages: jest.fn(),
  saveSignupBranding: jest.fn()
}));

const valid = {
  name: " Minha Empresa ",
  email: " CONTATO@EXAMPLE.COM ",
  phone: "5511999999999",
  password: "trial-password",
  planId: "4",
  dueDay: "31",
  slug: "minha-empresa",
  whatsappMode: "official"
};
describe("public tenant creation", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Keep the transaction mock implementation after reset.
    const sequelize = jest.requireMock("../../../database").default;
    sequelize.transaction.mockImplementation(callback =>
      callback("transaction")
    );
    (Plan.findOne as jest.Mock).mockResolvedValue({
      id: 4,
      name: "Enterprise"
    });
    (CreateCompanyService as jest.Mock).mockResolvedValue({
      id: 10,
      name: "Minha Empresa"
    });
    (prepareSignupImages as jest.Mock).mockResolvedValue([]);
  });
  it("forces self-service and 7 days, ignoring privileged client fields", async () => {
    await service({
      ...valid,
      trialDays: 999,
      signupSource: "partner",
      partnerId: 1,
      platformBilling: "plataforma",
      dueDate: "2099-01-01"
    });
    expect(CreateCompanyService).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Minha Empresa",
        email: "contato@example.com",
        trialDays: 7,
        signupSource: "self_service",
        dueDay: 31,
        whatsappMode: "meta",
        campaignsEnabled: false
      }),
      { transaction: "transaction" }
    );
    const data = (CreateCompanyService as jest.Mock).mock.calls[0][0];
    expect(data.partnerId).toBeUndefined();
    expect(data.platformBilling).toBeUndefined();
    expect(data.dueDate).toBeUndefined();
    expect(saveSignupBranding).toHaveBeenCalledWith(
      10,
      "Minha Empresa",
      "#5000ff",
      [],
      "transaction",
      []
    );
  });
  it("defaults dueDay to the day the 7-day trial ends", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-10-28T23:59:00Z"));
    expect(normalizeSignupData({ ...valid, dueDay: undefined }).dueDay).toBe(4);
    jest.useRealTimers();
  });
  it("rejects invalid days and private or missing plans before creating a tenant", async () => {
    await expect(service({ ...valid, dueDay: "32" })).rejects.toMatchObject({
      message: "ERR_SIGNUP_INVALID_DATA"
    });
    expect(CreateCompanyService).not.toHaveBeenCalled();
    (Plan.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service(valid)).rejects.toMatchObject({
      message: "ERR_SIGNUP_INVALID_PLAN"
    });
    expect(Plan.findOne).toHaveBeenCalledWith({
      where: { id: 4, isPublic: true },
      transaction: "transaction"
    });
    expect(CreateCompanyService).not.toHaveBeenCalled();
  });
  it("propagates branding failure so the transaction rolls back", async () => {
    (saveSignupBranding as jest.Mock).mockRejectedValue(
      new Error("image write failed")
    );
    await expect(service(valid)).rejects.toThrow("image write failed");
  });
  it("preserves the QR connection choice and optional AI addon", () => {
    expect(
      normalizeSignupData({
        ...valid,
        whatsappMode: "unofficial",
        aiAddon: "equipe"
      })
    ).toMatchObject({ whatsappMode: "normal", aiAddon: "equipe" });
  });
});
