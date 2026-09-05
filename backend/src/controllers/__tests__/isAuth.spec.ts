jest.mock("jsonwebtoken", () => ({ verify: jest.fn() }));

import { verify } from "jsonwebtoken";

import AppError from "../../errors/AppError";
import isAuth from "../../middleware/isAuth";

const verifyToken = verify as jest.Mock;

describe("isAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("accepts a valid bearer token and exposes its authenticated context", () => {
    const next = jest.fn();
    const req = { headers: { authorization: "Bearer valid-token" } } as {
      headers: { authorization: string };
      user?: unknown;
    };

    verifyToken.mockReturnValue({ id: "7", companyId: 3, profile: "admin", super: false });

    isAuth(req as never, {} as never, next);

    expect(verifyToken.mock.calls[0][0]).toBe("valid-token");
    expect(req.user).toEqual({ id: "7", companyId: 3, profile: "admin", isSuper: false });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("rejects a request without a bearer token", () => {
    const next = jest.fn();
    const req = { headers: {} } as never;

    try {
      isAuth(req, {} as never, next);
      fail("Expected authentication to fail");
    } catch (error) {
      expect(error).toMatchObject({ message: "ERR_UNAUTHORIZED", statusCode: 401 } satisfies Partial<AppError>);
    }

    expect(next).not.toHaveBeenCalled();
  });

  it("preserves the existing invalid-token behavior", () => {
    const next = jest.fn();
    const req = { headers: { authorization: "Bearer invalid-token" } } as never;
    verifyToken.mockImplementation(() => {
      throw new Error("invalid token");
    });

    try {
      isAuth(req, {} as never, next);
      fail("Expected authentication to fail");
    } catch (error) {
      expect(error).toMatchObject({ message: "ERR_SESSION_EXPIRED", statusCode: 403 } satisfies Partial<AppError>);
    }

    expect(next).not.toHaveBeenCalled();
  });
});
