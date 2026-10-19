import express from "express";
import request from "supertest";
import User from "../../../models/User";
import agentRoutes from "../../../routes/agentRoutes";
import * as AgentController from "../../../controllers/AgentController";
import AppError from "../../../errors/AppError";
import "express-async-errors";

jest.mock("../../../middleware/isAuth", () => ({
  __esModule: true,
  default: (req, _res, next) => {
    req.user = { id: "9", companyId: 1, profile: "admin", isSuper: true };
    next();
  }
}));
jest.mock("../../../models/User", () => ({
  __esModule: true,
  default: { findOne: jest.fn() }
}));
jest.mock("../../../controllers/AgentController", () =>
  Object.fromEntries(
    [
      "session",
      "availability",
      "heartbeat",
      "close",
      "chat",
      "tools",
      "companies",
      "context",
      "updateContext",
      "rebuild"
    ].map(key => [key, jest.fn((_req, res) => res.json({ ok: true }))])
  )
);
const app = express();
app.use(express.json());
app.use(agentRoutes);
app.use((error: AppError, _req, res, _next) =>
  res.status(error.statusCode || 500).json({ error: error.message })
);
describe("Agent administration authority", () => {
  it("reads availability only from the authenticated company", async () => {
    const response = await request(app).get("/agent/availability");
    expect(response.status).toBe(200);
    expect(AgentController.availability).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ companyId: 1 })
      }),
      expect.anything(),
      expect.anything()
    );
  });
  it.each(["get", "put", "post"])(
    "rejects %s requests despite a super claim when DB authority is absent",
    async method => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      const path =
        method === "get"
          ? "/agent/admin/companies/2/context"
          : method === "put"
            ? "/agent/admin/companies/2/context"
            : "/agent/admin/companies/2/context/rebuild";
      const response = await request(app)[method](path).send({ enabled: true });
      expect(response.status).toBe(403);
      expect(response.body.error).toBe("ERR_AGENT_PERMISSION_DENIED");
      expect(AgentController.updateContext).not.toHaveBeenCalled();
      expect(AgentController.context).not.toHaveBeenCalled();
    }
  );
  it("requires a super user confirmed inside the authenticated tenant", async () => {
    (User.findOne as jest.Mock).mockResolvedValue({ id: 9 });
    const response = await request(app).get("/agent/admin/companies");
    expect(response.status).toBe(200);
    expect(User.findOne).toHaveBeenCalledWith({
      where: { id: "9", companyId: 1, super: true },
      attributes: ["id"]
    });
  });
  it("sanitizes database errors before the global logger can receive private content", async () => {
    (User.findOne as jest.Mock).mockResolvedValue({ id: 9 });
    (AgentController.companies as jest.Mock).mockRejectedValueOnce(
      new Error("SELECT private secret")
    );
    const response = await request(app).get("/agent/admin/companies");
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: "ERR_AGENT_QUERY_FAILED" });
  });
});
