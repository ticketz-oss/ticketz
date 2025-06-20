import { col, fn, Op } from "sequelize";
import Counter from "../../models/Counter";

export async function listCounterSerie(
  companyId: number,
  serie: string,
  start: Date,
  end: Date
) {
  const where = {
    companyId,
    serie,
    timestamp: {
      [Op.gte]: start,
      [Op.lte]: end
    }
  };

  let groupByField: string;

  const daysBetween = Math.floor(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysBetween < 3) {
    groupByField = "timestamp";
  } else if (daysBetween < 8) {
    groupByField = "hour";
  } else if (daysBetween < 10) {
    groupByField = "three_hours";
  } else if (daysBetween < 30) {
    groupByField = "six_hours";
  } else if (daysBetween < 90) {
    groupByField = "twelve_hours";
  } else {
    groupByField = "day";
  }

  const counters = await Counter.findAll({
    where,
    attributes: [
      [col(groupByField), "time"],
      [fn("SUM", col("value")), "counter"]
    ],
    order: [[groupByField, "ASC"]],
    group: [groupByField]
  });

  return {
    field: groupByField,
    counters
  };
}
