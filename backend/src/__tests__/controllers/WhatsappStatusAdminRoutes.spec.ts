jest.mock("../../services/WhatsappStatusServices/StatusFeatureService", () => ({
  isStatusEnabled: jest.fn(),
  setStatusEnabled: jest.fn(),
  listCompaniesWithStatusFlag: jest.fn()
}));
jest.mock("../../middleware/isAuth", () => ({
  __esModule: true,
  default: (req, res, next) => {
    if (!req.get("authorization"))
      return res.status(401).json({ error: "ERR_SESSION_EXPIRED" });
    req.user = {
      id: req.get("x-user") || "1",
      profile: "admin",
      companyId: 2,
      super: false
    };
    return next();
  }
}));
jest.mock("../../middleware/isSuper", () => ({
  __esModule: true,
  default: (req, res, next) =>
    req.user.id === "1"
      ? next()
      : res.status(401).json({ error: "Acesso não permitido" })
}));

import "express-async-errors";
import express from "express";
import request from "supertest";
import whatsappStatusAdminRoutes from "../../routes/whatsappStatusAdminRoutes";
import {
  isStatusEnabled,
  listCompaniesWithStatusFlag,
  setStatusEnabled
} from "../../services/WhatsappStatusServices/StatusFeatureService";
import AppError from "../../errors/AppError";

const app = express();
app.use(express.json());
app.use(whatsappStatusAdminRoutes);
app.use(
  (
    err: AppError,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => res.status(err.statusCode || 500).json({ error: err.message })
);

beforeEach(() => {
  jest.clearAllMocks();
});

it("reports availability for the logged user's company only", async () => {
  (isStatusEnabled as jest.Mock).mockResolvedValue(true);
  const response = await request(app)
    .get("/whatsapp-status/availability")
    .set("Authorization", "Bearer x");
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ enabled: true });
  expect(isStatusEnabled).toHaveBeenCalledWith(2);
});

it("requires authentication for availability", async () => {
  const response = await request(app).get("/whatsapp-status/availability");
  expect(response.status).toBe(401);
  expect(isStatusEnabled).not.toHaveBeenCalled();
});

it("rejects the admin routes for non-super users", async () => {
  const list = await request(app)
    .get("/whatsapp-status/admin/companies")
    .set("Authorization", "Bearer x")
    .set("x-user", "5");
  const put = await request(app)
    .put("/whatsapp-status/admin/companies/3")
    .set("Authorization", "Bearer x")
    .set("x-user", "5")
    .send({ enabled: true });
  expect(list.status).toBe(401);
  expect(put.status).toBe(401);
  expect(listCompaniesWithStatusFlag).not.toHaveBeenCalled();
  expect(setStatusEnabled).not.toHaveBeenCalled();
});

it("lists companies with search and page", async () => {
  (listCompaniesWithStatusFlag as jest.Mock).mockResolvedValue({
    companies: [{ id: 3, name: "Empresa A" }],
    hasMore: false
  });
  const response = await request(app)
    .get("/whatsapp-status/admin/companies?searchParam=Emp&pageNumber=2")
    .set("Authorization", "Bearer x");
  expect(response.status).toBe(200);
  expect(response.body.companies).toHaveLength(1);
  expect(listCompaniesWithStatusFlag).toHaveBeenCalledWith({
    searchParam: "Emp",
    pageNumber: 2
  });
});

it("updates the flag with a strict boolean", async () => {
  (setStatusEnabled as jest.Mock).mockResolvedValue({
    id: 3,
    name: "Empresa A",
    whatsappStatusEnabled: false
  });
  const response = await request(app)
    .put("/whatsapp-status/admin/companies/3")
    .set("Authorization", "Bearer x")
    .send({ enabled: false });
  expect(response.status).toBe(200);
  expect(response.body.whatsappStatusEnabled).toBe(false);
  expect(setStatusEnabled).toHaveBeenCalledWith(3, false);
});

it.each([
  ["/whatsapp-status/admin/companies/3", { enabled: "false" }],
  ["/whatsapp-status/admin/companies/abc", { enabled: true }],
  ["/whatsapp-status/admin/companies/0", { enabled: true }]
])("rejects invalid input on %s", async (url, body) => {
  const response = await request(app)
    .put(url)
    .set("Authorization", "Bearer x")
    .send(body);
  expect(response.status).toBe(400);
  expect(response.body.error).toBe("ERR_STATUS_INVALID_REQUEST");
  expect(setStatusEnabled).not.toHaveBeenCalled();
});
