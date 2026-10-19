import { assertScheduleProvider } from "./assertScheduleProvider";
import { Op } from "sequelize";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import ScheduleDelivery from "../../models/ScheduleDelivery";
import ShowService from "./ShowService";

const SendNowService = async (id: string | number, companyId: number) => {
  await assertScheduleProvider(companyId);
  const schedule = await ShowService(id, companyId);

  if (
    schedule.kind !== "ONCE" ||
    !schedule.active ||
    schedule.status !== "PENDENTE"
  ) {
    throw new AppError("ERR_SCHEDULE_SEND_NOW_UNAVAILABLE", 400);
  }

  const pendingCount = await ScheduleDelivery.count({
    where: {
      scheduleId: schedule.id,
      status: { [Op.in]: ["PENDING", "ERROR"] }
    }
  });

  if (!pendingCount) {
    throw new AppError("ERR_SCHEDULE_SEND_NOW_UNAVAILABLE", 400);
  }

  const now = new Date();
  await sequelize.transaction(async transaction => {
    await ScheduleDelivery.update(
      {
        scheduledAt: now,
        status: "PENDING",
        queuedAt: null,
        errorMessage: null
      },
      {
        where: {
          scheduleId: schedule.id,
          status: { [Op.in]: ["PENDING", "ERROR"] }
        },
        transaction
      }
    );
    await schedule.update(
      {
        sendAt: now,
        nextRunAt: now,
        status: "PENDENTE"
      },
      { transaction }
    );
  });

  return ShowService(id, companyId);
};

export default SendNowService;
