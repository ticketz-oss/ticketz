import { Request, Response } from "express";
import { Op } from "sequelize";
import AppError from "../errors/AppError";
import CommemorativeDate from "../models/CommemorativeDate";
import Schedule from "../models/Schedule";
import { nextCommemorativeOccurrence } from "../services/ScheduleServices/recurrence";

type CommemorativePayload = {
  name: string;
  ruleType: "FIXED_DATE" | "NTH_WEEKDAY";
  month: number;
  day?: number | null;
  weekday?: number | null;
  ordinal?: number | null;
  active?: boolean;
};

const validatePayload = (payload: CommemorativePayload): void => {
  if (
    !payload.name?.trim() ||
    !["FIXED_DATE", "NTH_WEEKDAY"].includes(payload.ruleType)
  ) {
    throw new AppError("ERR_COMMEMORATIVE_DATE_INVALID", 400);
  }
  if (payload.month < 1 || payload.month > 12) {
    throw new AppError("ERR_COMMEMORATIVE_DATE_INVALID_MONTH", 400);
  }
  if (payload.ruleType === "FIXED_DATE") {
    const date = new Date(2000, payload.month - 1, payload.day);
    if (
      !payload.day ||
      date.getMonth() !== payload.month - 1 ||
      date.getDate() !== payload.day
    ) {
      throw new AppError("ERR_COMMEMORATIVE_DATE_INVALID_DAY", 400);
    }
  } else if (
    payload.weekday == null ||
    payload.weekday < 0 ||
    payload.weekday > 6 ||
    ![-1, 1, 2, 3, 4, 5].includes(payload.ordinal)
  ) {
    throw new AppError("ERR_COMMEMORATIVE_DATE_INVALID_RULE", 400);
  }
};

const findOwned = async (
  id: string,
  companyId: number
): Promise<CommemorativeDate> => {
  const record = await CommemorativeDate.findOne({ where: { id, companyId } });
  if (!record) throw new AppError("ERR_COMMEMORATIVE_DATE_NOT_FOUND", 404);
  return record;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const showInactive = req.query.showInactive === "true";
  const records = await CommemorativeDate.findAll({
    where: { companyId, ...(showInactive ? {} : { active: true }) },
    order: [["name", "ASC"]]
  });
  return res.json(records);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const payload = req.body as CommemorativePayload;
  validatePayload(payload);
  const duplicate = await CommemorativeDate.findOne({
    where: { companyId, name: { [Op.iLike]: payload.name.trim() } }
  });
  if (duplicate) throw new AppError("ERR_COMMEMORATIVE_DATE_DUPLICATED", 400);
  const record = await CommemorativeDate.create({
    ...payload,
    name: payload.name.trim(),
    day: payload.ruleType === "FIXED_DATE" ? payload.day : null,
    weekday: payload.ruleType === "NTH_WEEKDAY" ? payload.weekday : null,
    ordinal: payload.ruleType === "NTH_WEEKDAY" ? payload.ordinal : null,
    companyId
  });
  return res.status(201).json(record);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const payload = req.body as CommemorativePayload;
  validatePayload(payload);
  const record = await findOwned(req.params.id, companyId);
  const duplicate = await CommemorativeDate.findOne({
    where: {
      id: { [Op.ne]: record.id },
      companyId,
      name: { [Op.iLike]: payload.name.trim() }
    }
  });
  if (duplicate) throw new AppError("ERR_COMMEMORATIVE_DATE_DUPLICATED", 400);
  await record.update({
    ...payload,
    name: payload.name.trim(),
    day: payload.ruleType === "FIXED_DATE" ? payload.day : null,
    weekday: payload.ruleType === "NTH_WEEKDAY" ? payload.weekday : null,
    ordinal: payload.ruleType === "NTH_WEEKDAY" ? payload.ordinal : null
  });

  const schedules = await Schedule.findAll({
    where: { companyId, commemorativeDateId: record.id, kind: "COMMEMORATIVE" }
  });
  await Promise.all(
    schedules.map(schedule =>
      schedule.update({
        active: record.active,
        nextRunAt: record.active
          ? nextCommemorativeOccurrence(
              record,
              schedule.sendTime,
              schedule.timezone
            )
          : null
      })
    )
  );
  return res.json(record);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const record = await findOwned(req.params.id, companyId);
  await record.update({ active: false });
  await Schedule.update(
    { active: false, nextRunAt: null },
    { where: { companyId, commemorativeDateId: record.id } }
  );
  return res.status(204).send();
};
