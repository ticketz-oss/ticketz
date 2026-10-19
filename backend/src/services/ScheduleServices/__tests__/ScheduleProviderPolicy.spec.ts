import Company from "../../../models/Company";
import CreateService from "../CreateService";
import UpdateService from "../UpdateService";
import SendNowService from "../SendNowService";
import { assertScheduleProvider } from "../assertScheduleProvider";
import ShowService from "../ShowService";
import sequelize from "../../../database";

jest.mock("../../../models/Company", () => ({
  __esModule: true,
  default: { findByPk: jest.fn() }
}));
jest.mock("../../../database", () => ({
  __esModule: true,
  default: { transaction: jest.fn() }
}));
jest.mock("../ShowService", () => ({ __esModule: true, default: jest.fn() }));

it.each([
  ["create", () => CreateService({ companyId: 7, body: "Teste" })],
  ["update", () => UpdateService({ id: 1, companyId: 7, scheduleData: {} })],
  ["send now", () => SendNowService(1, 7)]
])(
  "rejects official schedule %s before any work is queued",
  async (_name, action) => {
    (Company.findByPk as jest.Mock).mockResolvedValue({
      id: 7,
      whatsappMode: "meta"
    });
    await expect((action as () => Promise<unknown>)()).rejects.toMatchObject({
      message: "ERR_WAPP_OFFICIAL_MODE_NOT_SUPPORTED"
    });
    expect(ShowService).not.toHaveBeenCalled();
    expect(sequelize.transaction).not.toHaveBeenCalled();
  }
);

it("allows unofficial companies without requiring a live connection", async () => {
  (Company.findByPk as jest.Mock).mockResolvedValue({
    id: 7,
    whatsappMode: "normal"
  });
  await expect(assertScheduleProvider(7)).resolves.toBeUndefined();
});
