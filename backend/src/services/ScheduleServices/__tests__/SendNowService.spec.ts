import sequelize from "../../../database";
import ScheduleDelivery from "../../../models/ScheduleDelivery";
import SendNowService from "../SendNowService";
import ShowService from "../ShowService";

jest.mock("../../../database", () => ({
  __esModule: true,
  default: { transaction: jest.fn() }
}));
jest.mock("../../../models/ScheduleDelivery", () => ({
  __esModule: true,
  default: { count: jest.fn(), update: jest.fn() }
}));
jest.mock("../ShowService");
jest.mock("../assertScheduleProvider");

const mockedShow = ShowService as jest.MockedFunction<typeof ShowService>;
const mockedCount = ScheduleDelivery.count as jest.MockedFunction<
  typeof ScheduleDelivery.count
>;
const mockedDeliveryUpdate = ScheduleDelivery.update as jest.MockedFunction<
  typeof ScheduleDelivery.update
>;
const mockedTransaction = sequelize.transaction as unknown as jest.Mock;

describe("SendNowService", () => {
  beforeEach(() => {
    mockedTransaction.mockImplementation(async callback =>
      callback({} as never)
    );
  });

  it("moves a pending one-time schedule and its deliveries to now", async () => {
    const schedule = {
      id: 15,
      kind: "ONCE",
      active: true,
      status: "PENDENTE",
      update: jest.fn().mockResolvedValue(undefined)
    };
    mockedShow
      .mockResolvedValueOnce(schedule as never)
      .mockResolvedValueOnce(schedule as never);
    mockedCount.mockResolvedValue(2);
    mockedDeliveryUpdate.mockResolvedValue([2] as never);

    await SendNowService(15, 4);

    expect(mockedDeliveryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "PENDING" }),
      expect.objectContaining({ transaction: expect.any(Object) })
    );
    expect(schedule.update).toHaveBeenCalledWith(
      expect.objectContaining({
        sendAt: expect.any(Date),
        nextRunAt: expect.any(Date),
        status: "PENDENTE"
      }),
      expect.objectContaining({ transaction: expect.any(Object) })
    );
  });

  it("rejects recurring and completed schedules", async () => {
    mockedShow.mockResolvedValue({
      id: 16,
      kind: "BIRTHDAY",
      active: true,
      status: "ATIVA"
    } as never);

    await expect(SendNowService(16, 4)).rejects.toEqual(
      expect.objectContaining({
        message: "ERR_SCHEDULE_SEND_NOW_UNAVAILABLE",
        statusCode: 400
      })
    );
  });
});
