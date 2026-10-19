import { Includeable, Op, Sequelize, WhereOptions } from "sequelize";
import CommemorativeDate from "../../models/CommemorativeDate";
import Contact from "../../models/Contact";
import Schedule from "../../models/Schedule";
import ScheduleDelivery from "../../models/ScheduleDelivery";
import User from "../../models/User";

interface Request {
  searchParam?: string;
  contactId?: number | string;
  userId?: number | string;
  pageNumber?: string | number;
  companyId?: number;
  kind?: string;
  status?: string;
  periodFrom?: string;
  periodTo?: string;
}

const ListService = async ({
  searchParam = "",
  contactId = "",
  userId = "",
  pageNumber = "1",
  companyId,
  kind,
  status,
  periodFrom,
  periodTo
}: Request) => {
  const where: WhereOptions<Schedule> = { companyId };
  if (searchParam) {
    where[Op.or] = [
      Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("Schedule.body")), {
        [Op.like]: `%${searchParam.toLowerCase()}%`
      }),
      Sequelize.where(
        Sequelize.fn("LOWER", Sequelize.col("commemorativeDate.name")),
        { [Op.like]: `%${searchParam.toLowerCase()}%` }
      )
    ];
  }
  if (userId !== "") where.userId = userId;
  if (kind) where.kind = kind;
  if (status) where.status = status;
  if (periodFrom || periodTo) {
    where.nextRunAt = {
      ...(periodFrom ? { [Op.gte]: new Date(`${periodFrom}T00:00:00`) } : {}),
      ...(periodTo ? { [Op.lte]: new Date(`${periodTo}T23:59:59.999`) } : {})
    };
  }

  const limit = 20;
  const offset = limit * (+pageNumber - 1);
  const include: Includeable[] = [
    { model: Contact, as: "contact", attributes: ["id", "name"] },
    { model: User, as: "user", attributes: ["id", "name"] },
    { model: CommemorativeDate, as: "commemorativeDate" }
  ];
  if (contactId !== "") {
    include.push({
      model: ScheduleDelivery,
      as: "deliveries",
      attributes: [],
      where: { contactId },
      required: true
    });
  }
  const { count, rows: schedules } = await Schedule.findAndCountAll({
    where,
    limit,
    offset,
    distinct: true,
    order: [["createdAt", "DESC"]],
    include
  });
  return { schedules, count, hasMore: count > offset + schedules.length };
};

export default ListService;
