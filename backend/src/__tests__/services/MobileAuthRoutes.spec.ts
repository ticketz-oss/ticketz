jest.mock("../../config/mobileAuth", () => ({
  getMobileAuthConfig: jest.fn(() => ({ enabled: true }))
}));
jest.mock("../../services/AuthServices/MobileAuthService", () => ({
  authorizeMobile: jest.fn(),
  exchangeMobile: jest.fn()
}));
jest.mock("../../middleware/isAuth", () => ({
  __esModule: true,
  default: (req, res, next) =>
    req.get("authorization") === "Bearer fixture-access"
      ? next()
      : res.status(401).json({ error: "ERR_UNAUTHORIZED" })
}));

import "express-async-errors";
import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import mobileAuthRoutes from "../../routes/mobileAuthRoutes";
import {
  authorizeMobile,
  exchangeMobile
} from "../../services/AuthServices/MobileAuthService";
import AppError from "../../errors/AppError";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/auth/mobile", mobileAuthRoutes);
app.use(
  (
    err: AppError,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => res.status(err.statusCode || 500).json({ error: err.message })
);
const oldBackend = process.env.BACKEND_URL;
beforeEach(() => {
  jest.clearAllMocks();
  process.env.BACKEND_URL = "https://dev.espacowhats.com.br";
  (authorizeMobile as jest.Mock).mockResolvedValue({
    code: "opaque-code",
    state: "native-state"
  });
  (exchangeMobile as jest.Mock).mockResolvedValue({
    token: "access-result",
    refreshToken: "refresh-result",
    user: { id: 7, companyId: 2 }
  });
});
afterAll(() => {
  if (oldBackend === undefined) delete process.env.BACKEND_URL;
  else process.env.BACKEND_URL = oldBackend;
});

it("publishes only enabled capability with private non-cacheable headers", async () => {
  const response = await request(app).get("/auth/mobile/config");
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ enabled: true });
  expect(response.headers["cache-control"]).toBe("no-store");
  expect(response.headers["pragma"]).toBe("no-cache");
  expect(response.headers["referrer-policy"]).toBe("no-referrer");
});

it("requires existing application authentication before authorizing", async () => {
  const response = await request(app).post("/auth/mobile/authorize").send({});
  expect(response.status).toBe(401);
  expect(response.headers["cache-control"]).toBe("no-store");
  expect(authorizeMobile).not.toHaveBeenCalled();
});

it("forwards access, cookie and origin to the service but returns only code and state", async () => {
  const response = await request(app)
    .post("/auth/mobile/authorize")
    .set("Authorization", "Bearer fixture-access")
    .set("Cookie", "jrt=fixture-refresh")
    .set("Origin", "https://teste.dev.espacowhats.com.br")
    .send({
      codeChallenge: "challenge",
      state: "state",
      redirectUri: "https://untrusted.invalid"
    });
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ code: "opaque-code", state: "native-state" });
  expect(authorizeMobile).toHaveBeenCalledWith({
    accessToken: "fixture-access",
    refreshToken: "fixture-refresh",
    requestOrigin: "https://teste.dev.espacowhats.com.br",
    codeChallenge: "challenge",
    state: "state"
  });
  expect(response.headers["set-cookie"]).toBeUndefined();
});

it("allows a native no-Origin exchange and returns refresh only as a secure HttpOnly cookie", async () => {
  const response = await request(app)
    .post("/auth/mobile/exchange")
    .send({ code: "code", codeVerifier: "verifier" });
  expect(response.status).toBe(200);
  expect(response.body).toEqual({
    token: "access-result",
    user: { id: 7, companyId: 2 }
  });
  expect(exchangeMobile).toHaveBeenCalledWith({
    code: "code",
    codeVerifier: "verifier"
  });
  const cookie = response.headers["set-cookie"][0];
  expect(cookie).toContain("jrt=refresh-result");
  expect(cookie).toContain("HttpOnly");
  expect(cookie).toContain("Secure");
  expect(cookie).toContain("SameSite=None");
  expect(cookie).toContain("Path=/");
  expect(response.headers["cache-control"]).toBe("no-store");
});

it("keeps disabled and rejected exchanges non-cacheable and never writes a cookie", async () => {
  (exchangeMobile as jest.Mock).mockRejectedValueOnce(
    new AppError("ERR_MOBILE_AUTH_DISABLED", 503)
  );
  const response = await request(app)
    .post("/auth/mobile/exchange")
    .send({ code: "code", codeVerifier: "verifier" });
  expect(response.status).toBe(503);
  expect(response.body).toEqual({ error: "ERR_MOBILE_AUTH_DISABLED" });
  expect(response.headers["cache-control"]).toBe("no-store");
  expect(response.headers["set-cookie"]).toBeUndefined();
});

it("rate-limits exchange attempts before executing the service", async () => {
  const results = await Promise.all(
    Array.from({ length: 31 }, () =>
      request(app)
        .post("/auth/mobile/exchange")
        .send({ code: "code", codeVerifier: "verifier" })
    )
  );
  const limited = results.filter(result => result.status === 429);
  expect(limited.length).toBeGreaterThan(0);
  expect(limited[0].body).toEqual({ error: "ERR_MOBILE_AUTH_RATE_LIMIT" });
  expect(limited[0].headers["retry-after"]).toBeDefined();
  expect(limited[0].headers["cache-control"]).toBe("no-store");
  expect((exchangeMobile as jest.Mock).mock.calls.length).toBeLessThan(31);
});
