jest.mock("../../libs/socket", () => ({ getIO: jest.fn() }));
jest.mock("../../services/UserServices/AuthUserService", () => jest.fn());
jest.mock("../../helpers/SendRefreshToken", () => ({ SendRefreshToken: jest.fn() }));
jest.mock("../../services/AuthServices/RefreshTokenService", () => ({ RefreshTokenService: jest.fn() }));
jest.mock("../../services/AuthServices/FindUserFromToken", () => jest.fn());
jest.mock("../../helpers/SerializeUser", () => ({ SerializeUser: jest.fn() }));
jest.mock("../../helpers/CreateTokens", () => ({ createAccessToken: jest.fn(), createRefreshToken: jest.fn() }));
jest.mock("../../helpers/DecodeRefreshToken", () => ({ decodeRefreshToken: jest.fn() }));
jest.mock("../../models/User", () => ({ __esModule: true, default: { findByPk: jest.fn() } }));
jest.mock("../../models/Queue", () => ({ __esModule: true, default: {} }));
jest.mock("../../models/Company", () => ({ __esModule: true, default: {} }));
jest.mock("../../models/Setting", () => ({ __esModule: true, default: {} }));
jest.mock("../../models/Translation", () => ({ __esModule: true, default: {} }));

import AppError from "../../errors/AppError";
import User from "../../models/User";
import * as SessionController from "../SessionController";

const findByPk = User.findByPk as jest.Mock;

function request(overrides: Record<string, unknown> = {}) {
  return {
    user: { id: "7", companyId: 3, profile: "admin", isSuper: false },
    body: { userId: 999, companyId: 999, profile: "user" },
    query: { userId: "999", companyId: "999" },
    ...overrides
  } as never;
}

function response(): { json: jest.Mock } {
  const json = jest.fn();
  return { json };
}

describe("SessionController.context", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns only the context loaded for the authenticated user", async () => {
    findByPk.mockResolvedValue({
      id: 7,
      companyId: 3,
      profile: "admin",
      queues: [{ id: 1, name: "Comercial", color: "#ff9800", companyId: 3 }]
    });
    const res = response();

    await SessionController.context(request(), res as never);

    expect(findByPk).toHaveBeenCalledWith("7", expect.objectContaining({ attributes: ["id", "companyId", "profile"] }));
    expect(res.json).toHaveBeenCalledWith({
      id: 7,
      companyId: 3,
      profile: "admin",
      queues: [{ id: 1, name: "Comercial", color: "#ff9800" }]
    });
  });

  it("fails closed when the authenticated user no longer exists", async () => {
    findByPk.mockResolvedValue(null);

    await expect(SessionController.context(request(), response() as never)).rejects.toMatchObject({
      message: "ERR_UNAUTHORIZED",
      statusCode: 401
    } satisfies Partial<AppError>);
  });

  it("fails closed when the database company differs from the verified token", async () => {
    findByPk.mockResolvedValue({ id: 7, companyId: 4, profile: "admin", queues: [] });

    await expect(SessionController.context(request(), response() as never)).rejects.toMatchObject({
      message: "ERR_UNAUTHORIZED",
      statusCode: 401
    } satisfies Partial<AppError>);
  });

  it("fails closed when the database identity differs from the verified token", async () => {
    findByPk.mockResolvedValue({ id: 8, companyId: 3, profile: "admin", queues: [] });

    await expect(SessionController.context(request(), response() as never)).rejects.toMatchObject({
      message: "ERR_UNAUTHORIZED",
      statusCode: 401
    } satisfies Partial<AppError>);
  });
});
