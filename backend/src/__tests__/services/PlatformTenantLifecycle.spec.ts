import sequelize from "../../database";
import Company from "../../models/Company";
import Plan from "../../models/Plan";
import User from "../../models/User";
import CreateCompanyService from "../../services/CompanyService/CreateCompanyService";
import {
  cancelPlatformTenant,
  createPlatformTenant,
  updatePlatformTenant,
  suspendPlatformTenant
} from "../../services/PlatformServices/PlatformTenantService";
import { issuePlatformAccessToken } from "../../services/PlatformServices/PlatformAccessTokenService";
import { enqueueWebhook } from "../../services/PlatformServices/PlatformWebhookService";
import { getIO } from "../../libs/socket";

jest.mock("../../database", () => ({
  __esModule: true,
  default: { transaction: jest.fn() }
}));
jest.mock("../../models/Company");
jest.mock("../../models/Plan");
jest.mock("../../models/User");
jest.mock("../../models/Queue");
jest.mock("../../models/Whatsapp");
jest.mock("../../services/CompanyService/CreateCompanyService");
jest.mock("../../services/CompanyService/UpdateCompanyService");
jest.mock("../../helpers/CreateTokens", () => ({
  createAccessToken: jest.fn(),
  createRefreshToken: jest.fn()
}));
jest.mock("../../helpers/SerializeUser", () => ({
  SerializeUser: jest.fn()
}));
jest.mock("../../services/PlatformServices/PlatformAccessTokenService", () => ({
  hashPlatformAccessToken: jest.fn(() => "token-hash"),
  issuePlatformAccessToken: jest.fn()
}));
jest.mock("../../services/PlatformServices/PlatformWebhookService", () => ({
  enqueueWebhook: jest.fn()
}));
jest.mock("../../services/PlatformServices/PlatformSerializers", () => ({
  normalizePlanRef: jest.fn((value: string) => value),
  planRef: jest.fn(() => "plano-basico"),
  reaisToCents: jest.fn(),
  serializeTenant: jest.fn(() => ({
    tenant_id: "12",
    url_acesso: "https://tenant-a.espacowhats.com.br"
  })),
  tenantUrl: jest.fn((slug: string) => `https://${slug}.espacowhats.com.br`)
}));
jest.mock("../../libs/socket", () => ({ getIO: jest.fn() }));

const transaction = { LOCK: { UPDATE: "UPDATE" } };
const transactionMock = sequelize.transaction as unknown as jest.Mock;
const companyFindOne = Company.findOne as jest.MockedFunction<
  typeof Company.findOne
>;
const companyFindByPk = Company.findByPk as jest.MockedFunction<
  typeof Company.findByPk
>;
const planFindByPk = Plan.findByPk as jest.MockedFunction<typeof Plan.findByPk>;
const userFindOne = User.findOne as jest.MockedFunction<typeof User.findOne>;
const userIncrement = User.increment as jest.MockedFunction<
  typeof User.increment
>;
const createCompany = CreateCompanyService as jest.MockedFunction<
  typeof CreateCompanyService
>;
const issueAccess = issuePlatformAccessToken as jest.MockedFunction<
  typeof issuePlatformAccessToken
>;
const webhook = enqueueWebhook as jest.MockedFunction<typeof enqueueWebhook>;
const socket = getIO as jest.MockedFunction<typeof getIO>;

describe("Platform tenant lifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    transactionMock.mockImplementation(
      async (callback: (value: typeof transaction) => Promise<unknown>) =>
        callback(transaction)
    );
    companyFindOne.mockResolvedValue(null);
    planFindByPk.mockResolvedValue({ id: 2 } as Plan);
    userIncrement.mockResolvedValue([1] as never);
  });

  it("returns a one-time activation URL when senha_admin is absent", async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const company = {
      id: 12,
      slug: "tenant-a",
      update
    } as unknown as Company;
    const admin = { id: 34, email: "admin@example.com" } as User;
    createCompany.mockResolvedValue(company);
    userFindOne.mockResolvedValue(admin);
    issueAccess.mockResolvedValue({
      rawToken: "one-time-token",
      expiresAt: new Date()
    });

    const response = await createPlatformTenant({
      nome: "Tenant A",
      slug: "tenant-a",
      email_admin: "admin@example.com",
      plano_ref: "2",
      whatsapp_mode: "meta"
    });

    expect(response).toMatchObject({
      tenant_id: "12",
      url_acesso: "https://tenant-a.espacowhats.com.br",
      ativacao_url: "https://tenant-a.espacowhats.com.br/ativar/one-time-token"
    });
    expect(createCompany).toHaveBeenCalledWith(
      expect.objectContaining({
        passwordConfigured: false,
        whatsappMode: "meta"
      }),
      { transaction }
    );
    expect(issueAccess).toHaveBeenCalledWith(
      company,
      admin,
      "activation",
      "ativacao_inicial",
      "plataforma",
      transaction
    );
  });

  it("suspends without deleting data, invalidates sessions and emits the webhook", async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const destroy = jest.fn();
    const disconnectSockets = jest.fn();
    companyFindByPk.mockResolvedValue({
      id: 12,
      status: true,
      platformStatus: "ativo",
      platformPreviousStatus: null,
      update,
      destroy
    } as unknown as Company);
    socket.mockReturnValue({
      in: jest.fn(() => ({ disconnectSockets }))
    } as never);

    await expect(
      suspendPlatformTenant("12", {
        acao: "suspender",
        motivo: "inadimplencia"
      })
    ).resolves.toMatchObject({ tenant_id: "12", status: "suspenso" });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: false, platformStatus: "suspenso" }),
      { transaction }
    );
    expect(userIncrement).toHaveBeenCalled();
    expect(webhook).toHaveBeenCalledWith(
      "tenant.suspenso",
      12,
      { tenant_id: "12", status: "suspenso", motivo: "inadimplencia" },
      transaction
    );
    expect(disconnectSockets).toHaveBeenCalledWith(true);
    expect(destroy).not.toHaveBeenCalled();
  });

  it("cancels with a soft delete and preserves all tenant records", async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const destroy = jest.fn();
    const disconnectSockets = jest.fn();
    companyFindByPk.mockResolvedValue({
      id: 12,
      update,
      destroy
    } as unknown as Company);
    socket.mockReturnValue({
      in: jest.fn(() => ({ disconnectSockets }))
    } as never);

    await expect(cancelPlatformTenant("12")).resolves.toMatchObject({
      tenant_id: "12",
      status: "cancelado"
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: false, platformStatus: "cancelado" }),
      { transaction }
    );
    expect(destroy).not.toHaveBeenCalled();
  });

  it("reactivates the tenant and reports the contract status as ativo", async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    companyFindByPk.mockResolvedValue({
      id: 12,
      status: false,
      platformStatus: "suspenso",
      platformPreviousStatus: "trial",
      update
    } as unknown as Company);

    await expect(
      suspendPlatformTenant("12", { acao: "reativar", motivo: "regularizado" })
    ).resolves.toMatchObject({ tenant_id: "12", status: "ativo" });
    expect(update).toHaveBeenCalledWith(
      {
        platformStatus: "trial",
        platformPreviousStatus: null,
        status: true
      },
      { transaction }
    );
    expect(webhook).not.toHaveBeenCalled();
  });
});

describe("Platform provider immutability", () => {
  beforeEach(() => jest.clearAllMocks());
  it.each([
    ["normal", "meta"],
    ["meta", "normal"]
  ])(
    "rejects %s to %s before beginning a transaction",
    async (current, next) => {
      companyFindByPk.mockResolvedValue({
        id: 12,
        whatsappMode: current
      } as Company);
      await expect(
        updatePlatformTenant("12", { whatsapp_mode: next })
      ).rejects.toMatchObject({
        code: "whatsapp_mode_immutable",
        statusCode: 409
      });
      expect(transactionMock).not.toHaveBeenCalled();
    }
  );
});
