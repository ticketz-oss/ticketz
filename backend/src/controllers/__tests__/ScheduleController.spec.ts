import express from "express";
import request from "supertest";
import { update } from "../ScheduleController";
import ShowService from "../../services/ScheduleServices/ShowService";
import UpdateService from "../../services/ScheduleServices/UpdateService";

jest.mock("../../services/ScheduleServices/ShowService", () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock("../../services/ScheduleServices/UpdateService", () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock("../../libs/socket", () => ({
  getIO: () => ({ to: () => ({ emit: jest.fn() }) })
}));

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.user = { id: "7", companyId: 3, profile: "user", isSuper: false };
  next();
});
app.put("/schedules/:scheduleId", (req, res, next) => {
  update(req, res).catch(next);
});
app.use((error, _req, res, _next) => {
  res.status(error.statusCode || 500).json({ error: error.message });
});

describe("ScheduleController.update", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ShowService as jest.Mock).mockResolvedValue({
      id: 12,
      mediaPath: null,
      mediaName: null,
      mediaType: null
    });
    (UpdateService as jest.Mock).mockResolvedValue({
      id: 12,
      body: "Mensagem atualizada"
    });
  });

  it("permite que um atendente autenticado edite na própria empresa", async () => {
    const response = await request(app)
      .put("/schedules/12")
      .send({ body: "Mensagem atualizada" })
      .expect(200);

    expect(ShowService).toHaveBeenCalledWith("12", 3);
    expect(UpdateService).toHaveBeenCalledWith({
      scheduleData: expect.objectContaining({ body: "Mensagem atualizada" }),
      id: "12",
      companyId: 3
    });
    expect(response.body).toEqual({ id: 12, body: "Mensagem atualizada" });
  });
});
