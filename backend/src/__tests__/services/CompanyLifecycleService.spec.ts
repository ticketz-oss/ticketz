import fs from "fs";
import Company from "../../models/Company";
import Setting from "../../models/Setting";
import User from "../../models/User";
import Invoices from "../../models/Invoices";
import CreateCompanyService from "../../services/CompanyService/CreateCompanyService";
import DeleteCompanyService from "../../services/CompanyService/DeleteCompanyService";
import UpdateCompanyService from "../../services/CompanyService/UpdateCompanyService";

jest.mock("../../models/Company");
jest.mock("../../models/Setting");
jest.mock("../../models/User");
jest.mock("../../models/Invoices");
jest.mock("../../services/McpServices/RevokeMcpGrantsService", () => ({
  revokeCompanyMcpGrants: jest.fn().mockResolvedValue(undefined)
}));
jest.mock("../../services/VoiceServices/VoiceService", () => ({
  disableCompanyVoiceConnections: jest.fn().mockResolvedValue(undefined)
}));
jest.mock("../../helpers/replicateMasterSuperAdmins", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined)
}));
jest.mock("../../helpers/GetPublicPath", () => ({
  getPublicPath: jest.fn(() => "/srv/public")
}));
jest.mock("fs", () => ({
  __esModule: true,
  default: {
    rmSync: jest.fn()
  }
}));

const companyFindOne = Company.findOne as jest.MockedFunction<
  typeof Company.findOne
>;
const companyCreate = Company.create as jest.MockedFunction<
  typeof Company.create
>;
const userFindOrCreate = User.findOrCreate as jest.MockedFunction<
  typeof User.findOrCreate
>;
const settingFindOrCreate = Setting.findOrCreate as jest.MockedFunction<
  typeof Setting.findOrCreate
>;
const rmSync = fs.rmSync as jest.MockedFunction<typeof fs.rmSync>;
const companyFindByPk = Company.findByPk as jest.MockedFunction<
  typeof Company.findByPk
>;
const invoicesFindOne = Invoices.findOne as jest.MockedFunction<
  typeof Invoices.findOne
>;
const invoicesDestroy = Invoices.destroy as jest.MockedFunction<
  typeof Invoices.destroy
>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers().setSystemTime(new Date("2026-09-02T12:00:00.000Z"));
});

afterEach(() => {
  jest.useRealTimers();
});

describe("CreateCompanyService", () => {
  it("creates an immediately active tenant with a usable initial period", async () => {
    const company = { id: 42 } as Company;
    const user = { update: jest.fn() } as unknown as User;

    companyFindOne.mockResolvedValue(null);
    companyCreate.mockResolvedValue(company);
    userFindOrCreate.mockResolvedValue([user, true]);
    settingFindOrCreate.mockResolvedValue([{} as Setting, true]);

    await CreateCompanyService({
      name: "Tenant Novo",
      email: "tenant@example.com",
      slug: "tenant-novo",
      planId: 1,
      timezone: "America/Recife"
    });

    expect(companyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: true,
        whatsappMode: "normal",
        dueDate: "2026-09-05",
        recurrence: "MENSAL",
        timezone: "America/Recife",
        platformStatus: "ativo",
        platformBilling: "sistema"
      }),
      { transaction: undefined }
    );
    expect(settingFindOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyId: 42, key: "voiceCallsEnabled" },
        defaults: expect.objectContaining({ value: "false" })
      })
    );
  });
});

describe("CreateCompanyService with a free trial", () => {
  it("charges the first invoice on the last trial day and plans the welcome", async () => {
    companyFindOne.mockResolvedValue(null);
    companyCreate.mockResolvedValue({ id: 43 } as Company);
    userFindOrCreate.mockResolvedValue([
      { update: jest.fn() } as unknown as User,
      true
    ]);
    settingFindOrCreate.mockResolvedValue([{} as Setting, true]);

    await CreateCompanyService({
      name: "Tenant Teste",
      email: "teste@example.com",
      slug: "tenant-teste",
      planId: 1,
      trialDays: 14,
      dueDay: 30
    });

    // 2026-09-02 + 14 days; the monthly cycle on day 30 starts after it.
    expect(companyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        trialEndsAt: "2026-09-16",
        dueDate: "2026-09-16",
        dueDay: 30
      }),
      { transaction: undefined }
    );
    expect(settingFindOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyId: 43, key: "welcomeTour" },
        defaults: expect.objectContaining({ value: "pending" })
      })
    );
  });
});

describe("DeleteCompanyService", () => {
  it("allows deleting a tenant that never created a media directory", async () => {
    const destroy = jest.fn().mockResolvedValue(undefined);
    companyFindOne.mockResolvedValue({ destroy } as unknown as Company);

    await DeleteCompanyService("42");

    expect(rmSync).toHaveBeenCalledWith("/srv/public/media/42", {
      recursive: true,
      force: true
    });
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(rmSync.mock.invocationCallOrder[0]).toBeLessThan(
      destroy.mock.invocationCallOrder[0]
    );
  });
});

describe("UpdateCompanyService billing reconciliation", () => {
  const company = () =>
    ({
      id: 9,
      name: "AC Norte",
      status: true,
      planId: 2,
      dueDate: "2026-09-19",
      dueDay: 19,
      trialDays: 0,
      trialEndsAt: null,
      saleValue: null,
      introValue: null,
      introMonths: null,
      update: jest.fn().mockResolvedValue(undefined)
    }) as unknown as Company;

  it("não reconstrói a fatura quando o vencimento não mudou", async () => {
    companyFindByPk.mockResolvedValue(company());

    await UpdateCompanyService(
      {
        id: 9,
        name: "AC Norte",
        dueDate: "2026-09-19"
      },
      { billingCentralized: true }
    );

    expect(invoicesFindOne).not.toHaveBeenCalled();
    expect(invoicesDestroy).not.toHaveBeenCalled();
  });

  it("remove a fatura automática sem cobrança ao mudar o vencimento", async () => {
    companyFindByPk.mockResolvedValue(company());
    invoicesFindOne.mockResolvedValue(null);
    invoicesDestroy.mockResolvedValue(1);

    await UpdateCompanyService(
      {
        id: 9,
        name: "AC Norte",
        dueDate: "2026-10-19"
      },
      { billingCentralized: true }
    );

    expect(invoicesDestroy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyId: 9,
          status: "open",
          origem: "sistema"
        })
      })
    );
  });

  it("bloqueia a mudança quando a cobrança já foi emitida no gateway", async () => {
    companyFindByPk.mockResolvedValue(company());
    invoicesFindOne.mockResolvedValue({ id: 14 } as Invoices);

    await expect(
      UpdateCompanyService(
        {
          id: 9,
          name: "AC Norte",
          dueDate: "2026-10-19"
        },
        { billingCentralized: true }
      )
    ).rejects.toMatchObject({
      message: "ERR_ACTIVE_CHARGE_PREVENTS_DUE_DATE_CHANGE",
      statusCode: 409
    });
  });
});

describe("Company WhatsApp provider choice", () => {
  it("persists the official provider at creation", async () => {
    companyFindOne.mockResolvedValue(null);
    companyCreate.mockResolvedValue({ id: 42 } as Company);
    userFindOrCreate.mockResolvedValue([{} as User, true]);
    settingFindOrCreate.mockResolvedValue([{} as Setting, true]);
    await CreateCompanyService({ name: "Official", whatsappMode: "meta" });
    expect(companyCreate).toHaveBeenCalledWith(
      expect.objectContaining({ whatsappMode: "meta" }),
      expect.anything()
    );
  });

  it.each(["invalid", null, "official"])(
    "rejects invalid mode %s before creating records",
    async whatsappMode => {
      await expect(
        CreateCompanyService({ name: "Invalid", whatsappMode } as never)
      ).rejects.toMatchObject({ message: "ERR_COMPANY_INVALID_WHATSAPP_MODE" });
      expect(companyCreate).not.toHaveBeenCalled();
    }
  );

  it.each([
    ["normal", "meta"],
    ["meta", "normal"]
  ])("rejects changing %s to %s before any write", async (current, next) => {
    const update = jest.fn();
    companyFindByPk.mockResolvedValue({
      id: 42,
      whatsappMode: current,
      update
    } as unknown as Company);
    await expect(
      UpdateCompanyService({
        id: 42,
        name: "Existing",
        whatsappMode: next
      } as never)
    ).rejects.toMatchObject({
      message: "ERR_COMPANY_WHATSAPP_MODE_IMMUTABLE",
      statusCode: 409
    });
    expect(update).not.toHaveBeenCalled();
  });

  it.each(["normal", "meta"])(
    "allows saving an unchanged %s provider",
    async mode => {
      const update = jest.fn();
      companyFindByPk.mockResolvedValue({
        id: 42,
        whatsappMode: mode,
        update
      } as unknown as Company);
      await UpdateCompanyService({
        id: 42,
        name: "Existing",
        whatsappMode: mode
      } as never);
      expect(update).toHaveBeenCalled();
      expect(update.mock.calls[0][0]).not.toHaveProperty("whatsappMode");
    }
  );
});
