import { assertScheduleProvider } from "./assertScheduleProvider";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import CommemorativeDate from "../../models/CommemorativeDate";
import Schedule from "../../models/Schedule";
import ScheduleAudienceContact from "../../models/ScheduleAudienceContact";
import ScheduleDelivery from "../../models/ScheduleDelivery";
import {
  AudienceMode,
  customFieldNames,
  resolveAudience,
  ScheduleKind
} from "./audience";
import {
  nextBirthdayScan,
  nextCommemorativeOccurrence,
  parseOneTimeSchedule,
  validateTimezone
} from "./recurrence";
import { validateScheduleVariables } from "./variables";

export type SchedulePayload = {
  body: string;
  sendAt?: Date | string;
  sendTime?: string;
  timezone?: string;
  contactId?: number;
  contactIds?: number[];
  audienceMode?: AudienceMode;
  kind?: ScheduleKind;
  commemorativeDateId?: number;
  companyId: number;
  userId?: number;
  saveMessage?: boolean;
  mediaPath?: string;
  mediaName?: string;
  mediaType?: string;
  mediaDeliveryMode?: "CAPTION" | "SEPARATE";
};

export const normalizePayload = (payload: SchedulePayload): SchedulePayload => {
  const contactIds = Array.from(
    new Set(payload.contactIds?.map(Number).filter(Boolean) || [])
  );
  if (payload.contactId && !contactIds.includes(Number(payload.contactId))) {
    contactIds.push(Number(payload.contactId));
  }
  return {
    ...payload,
    kind: payload.kind || "ONCE",
    audienceMode: payload.audienceMode || "SELECTED",
    contactIds,
    timezone: payload.timezone || "UTC",
    mediaDeliveryMode: payload.mediaDeliveryMode || "CAPTION"
  };
};

export const calculateNextRun = async (
  payload: SchedulePayload
): Promise<Date> => {
  const timezone = validateTimezone(payload.timezone);
  if (payload.kind === "ONCE") {
    if (!payload.sendAt) throw new AppError("ERR_SCHEDULE_DATE_REQUIRED", 400);
    return parseOneTimeSchedule(payload.sendAt, timezone);
  }
  if (!payload.sendTime) throw new AppError("ERR_SCHEDULE_TIME_REQUIRED", 400);
  if (payload.kind === "BIRTHDAY") {
    return nextBirthdayScan(payload.sendTime, timezone);
  }
  const commemorativeDate = await CommemorativeDate.findOne({
    where: {
      id: payload.commemorativeDateId,
      companyId: payload.companyId,
      active: true
    }
  });
  if (!commemorativeDate) {
    throw new AppError("ERR_COMMEMORATIVE_DATE_NOT_FOUND", 404);
  }
  return nextCommemorativeOccurrence(
    commemorativeDate,
    payload.sendTime,
    timezone
  );
};

const CreateService = async (input: SchedulePayload): Promise<Schedule> => {
  await assertScheduleProvider(input.companyId);
  const payload = normalizePayload(input);
  if (!payload.body || payload.body.trim().length < 5) {
    throw new AppError("ERR_SCHEDULE_INVALID_MESSAGE", 400);
  }
  if (!["ONCE", "BIRTHDAY", "COMMEMORATIVE"].includes(payload.kind)) {
    throw new AppError("ERR_SCHEDULE_INVALID_KIND", 400);
  }
  if (!["ALL", "SELECTED"].includes(payload.audienceMode)) {
    throw new AppError("ERR_SCHEDULE_INVALID_AUDIENCE", 400);
  }

  validateScheduleVariables(
    payload.body,
    await customFieldNames(payload.companyId)
  );
  const contacts = await resolveAudience({
    companyId: payload.companyId,
    kind: payload.kind,
    audienceMode: payload.audienceMode,
    contactIds: payload.contactIds
  });
  const nextRunAt = await calculateNextRun(payload);

  const schedule = await sequelize.transaction(async transaction => {
    const created = await Schedule.create(
      {
        body: payload.body.trim(),
        sendAt: payload.kind === "ONCE" ? nextRunAt : null,
        sendTime: payload.kind === "ONCE" ? null : payload.sendTime,
        nextRunAt,
        timezone: payload.timezone,
        contactId: null,
        companyId: payload.companyId,
        userId: payload.userId,
        saveMessage: !!payload.saveMessage,
        kind: payload.kind,
        audienceMode: payload.audienceMode,
        commemorativeDateId:
          payload.kind === "COMMEMORATIVE" ? payload.commemorativeDateId : null,
        mediaPath: payload.mediaPath,
        mediaName: payload.mediaName,
        mediaType: payload.mediaType,
        mediaDeliveryMode: payload.mediaDeliveryMode,
        totalRecipients: contacts.length,
        status: payload.kind === "ONCE" ? "PENDENTE" : "ATIVA",
        active: true
      },
      { transaction }
    );

    if (payload.audienceMode === "SELECTED") {
      await ScheduleAudienceContact.bulkCreate(
        contacts.map(contact => ({
          scheduleId: created.id,
          contactId: contact.id
        })),
        { transaction }
      );
    }
    if (payload.kind === "ONCE") {
      await ScheduleDelivery.bulkCreate(
        contacts.map(contact => ({
          scheduleId: created.id,
          contactId: contact.id,
          occurrenceKey: `once-${created.id}`,
          scheduledAt: nextRunAt,
          status: "PENDING",
          contactName: contact.name,
          contactNumber: contact.number
        })),
        { transaction }
      );
    }
    return created;
  });

  return schedule.reload({
    include: [
      { model: CommemorativeDate, as: "commemorativeDate" },
      { model: ScheduleAudienceContact, as: "audienceContacts" }
    ]
  });
};

export default CreateService;
