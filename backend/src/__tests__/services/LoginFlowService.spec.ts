import sequelize from "../../database";
import Company from "../../models/Company";
import PlatformAccessToken from "../../models/PlatformAccessToken";
import User from "../../models/User";
import {
  identifyLogin,
  setupInitialPassword
} from "../../services/UserServices/LoginFlowService";
import {
  hashPlatformAccessToken,
  issuePlatformAccessToken
} from "../../services/PlatformServices/PlatformAccessTokenService";

jest.mock("../../database", () => ({
  __esModule: true,
  default: {
    transaction: jest.fn()
  }
}));
jest.mock("../../models/Company");
jest.mock("../../models/PlatformAccessToken");
jest.mock("../../models/User");
jest.mock("../../helpers/CreateTokens", () => ({
  createAccessToken: jest.fn(() => "access-token"),
  createRefreshToken: jest.fn(() => "refresh-token")
}));
jest.mock("../../helpers/SerializeUser", () => ({
  SerializeUser: jest.fn(async user => ({ id: user.id, email: user.email }))
}));
jest.mock("../../services/PlatformServices/PlatformAccessTokenService", () => ({
  hashPlatformAccessToken: jest.fn(() => "token-hash"),
  issuePlatformAccessToken: jest.fn()
}));

const transaction = { LOCK: { UPDATE: "UPDATE" } };
const transactionMock = sequelize.transaction as unknown as jest.Mock;
const companyFindOne = Company.findOne as jest.MockedFunction<
  typeof Company.findOne
>;
const companyFindByPk = Company.findByPk as jest.MockedFunction<
  typeof Company.findByPk
>;
const userFindOne = User.findOne as jest.MockedFunction<typeof User.findOne>;
const userFindByPk = User.findByPk as jest.MockedFunction<typeof User.findByPk>;
const accessFindOne = PlatformAccessToken.findOne as jest.MockedFunction<
  typeof PlatformAccessToken.findOne
>;
const accessUpdate = PlatformAccessToken.update as jest.MockedFunction<
  typeof PlatformAccessToken.update
>;
const issueAccess = issuePlatformAccessToken as jest.MockedFunction<
  typeof issuePlatformAccessToken
>;

describe("LoginFlowService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    transactionMock.mockImplementation(
      async (callback: (value: typeof transaction) => Promise<unknown>) =>
        callback(transaction)
    );
  });

  it("keeps the email lookup scoped to the requested tenant", async () => {
    companyFindOne.mockResolvedValue({
      id: 12,
      status: true,
      platformStatus: "ativo"
    } as Company);
    userFindOne.mockResolvedValue({
      id: 34,
      passwordConfigured: true
    } as User);

    await expect(
      identifyLogin("Admin@Example.com", "tenant-a")
    ).resolves.toEqual({
      email_existe: true,
      senha_definida: true,
      proxima_etapa: "senha"
    });

    const where = userFindOne.mock.calls[0][0].where as Record<
      PropertyKey,
      unknown
    >;
    const conditions = Reflect.ownKeys(where).flatMap(key => where[key]);
    expect(conditions).toContainEqual({ companyId: 12 });
    expect(issueAccess).not.toHaveBeenCalled();
  });

  it("issues an activation challenge only for a user without a password", async () => {
    const company = {
      id: 12,
      status: true,
      platformStatus: "ativo"
    } as Company;
    const user = { id: 34, passwordConfigured: false } as User;
    companyFindOne.mockResolvedValue(company);
    userFindOne.mockResolvedValue(user);
    issueAccess.mockResolvedValue({
      rawToken: "activation-token",
      expiresAt: new Date()
    });

    await expect(
      identifyLogin("admin@example.com", "tenant-a")
    ).resolves.toEqual({
      email_existe: true,
      senha_definida: false,
      proxima_etapa: "criar_senha",
      ativacao_token: "activation-token"
    });
    expect(issueAccess).toHaveBeenCalledWith(
      company,
      user,
      "activation",
      "login_sem_senha",
      "usuario",
      transaction
    );
  });

  it("does not query users globally when the tenant is unknown", async () => {
    companyFindOne.mockResolvedValue(null);

    await expect(
      identifyLogin("admin@example.com", "tenant-inexistente")
    ).rejects.toMatchObject({
      message: "ERR_EMAIL_NOT_FOUND",
      statusCode: 404
    });
    expect(userFindOne).not.toHaveBeenCalled();
  });

  it("uses only the configured master tenant when no slug is present", async () => {
    companyFindByPk.mockResolvedValue({
      id: 1,
      status: true,
      platformStatus: "ativo"
    } as Company);
    userFindOne.mockResolvedValue({
      id: 34,
      passwordConfigured: true
    } as User);

    await identifyLogin("admin@example.com", undefined);

    expect(companyFindByPk).toHaveBeenCalledWith(1);
    const where = userFindOne.mock.calls[0][0].where as Record<
      PropertyKey,
      unknown
    >;
    const conditions = Reflect.ownKeys(where).flatMap(key => where[key]);
    expect(conditions).toContainEqual({ companyId: 1 });
  });

  it("never overwrites an already configured password", async () => {
    const token = "x".repeat(48);
    accessFindOne.mockResolvedValue({
      companyId: 12,
      userId: 34,
      kind: "activation",
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000)
    } as PlatformAccessToken);
    companyFindByPk.mockResolvedValue({
      id: 12,
      status: true,
      platformStatus: "ativo"
    } as Company);
    const update = jest.fn();
    userFindByPk.mockResolvedValue({
      id: 34,
      passwordConfigured: true,
      update
    } as unknown as User);

    await expect(
      setupInitialPassword(token, "StrongPass1", "StrongPass1")
    ).rejects.toMatchObject({
      message: "ERR_PASSWORD_ALREADY_CONFIGURED",
      statusCode: 409
    });
    expect(update).not.toHaveBeenCalled();
    expect(accessUpdate).not.toHaveBeenCalled();
  });

  it("sets the password atomically, consumes activation tokens and authenticates", async () => {
    const token = "x".repeat(48);
    const update = jest.fn().mockResolvedValue(undefined);
    const pendingUser = {
      id: 34,
      email: "admin@example.com",
      passwordConfigured: false,
      update
    } as unknown as User;
    const authenticatedUser = {
      id: 34,
      email: "admin@example.com"
    } as User;
    accessFindOne.mockResolvedValue({
      companyId: 12,
      userId: 34,
      kind: "activation",
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000)
    } as PlatformAccessToken);
    companyFindByPk.mockResolvedValue({
      id: 12,
      status: true,
      platformStatus: "ativo"
    } as Company);
    userFindByPk
      .mockResolvedValueOnce(pendingUser)
      .mockResolvedValueOnce(authenticatedUser);
    accessUpdate.mockResolvedValue([1]);

    await expect(
      setupInitialPassword(token, "StrongPass1", "StrongPass1")
    ).resolves.toEqual({
      token: "access-token",
      refreshToken: "refresh-token",
      serializedUser: { id: 34, email: "admin@example.com" }
    });

    expect(hashPlatformAccessToken).toHaveBeenCalledWith(token);
    expect(update).toHaveBeenCalledWith(
      { password: "StrongPass1", passwordConfigured: true },
      { transaction }
    );
    expect(accessUpdate).toHaveBeenCalledWith(
      { usedAt: expect.any(Date) },
      {
        where: { userId: 34, kind: "activation", usedAt: null },
        transaction
      }
    );
  });
});
