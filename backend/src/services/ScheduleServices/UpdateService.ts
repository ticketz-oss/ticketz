import { assertScheduleProvider } from "./assertScheduleProvider";
import { Op } from "sequelize";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import ScheduleAudienceContact from "../../models/ScheduleAudienceContact";
import ScheduleDelivery from "../../models/ScheduleDelivery";
import { customFieldNames, resolveAudience } from "./audience";
import {
  calculateNextRun,
  normalizePayload,
  SchedulePayload
} from "./CreateService";
import ShowService from "./ShowService";
import { validateScheduleVariables } from "./variables";

interface Request {
  scheduleData: Partial<SchedulePayload>;
  id: string | number;
  companyId: number;
}

const UpdateService = async ({ scheduleData, id, companyId }: Request) => {
  await assertScheduleProvider(companyId);
  const schedule = await ShowService(id, companyId);
  const wasOnce = schedule.kind === "ONCE";
  const existing = schedule.toJSON() as SchedulePayload;
  const payload = normalizePayload({
    ...existing,
    ...scheduleData,
    companyId,
    contactIds:
      scheduleData.contactIds ||
      schedule.audienceContacts?.map(item => item.contactId) ||
      (schedule.contactId ? [schedule.contactId] : [])
  });
  if (!payload.body || payload.body.trim().length < 5) {
    throw new AppError("ERR_SCHEDULE_INVALID_MESSAGE", 400);
  }
  validateScheduleVariables(payload.body, await customFieldNames(companyId));
  const contacts = await resolveAudience({
    companyId,
    kind: payload.kind,
    audienceMode: payload.audienceMode,
    contactIds: payload.contactIds
  });
  const nextRunAt = await calculateNextRun(payload);

  const started = await ScheduleDelivery.count({
    where: { scheduleId: schedule.id, status: { [Op.in]: ["QUEUED", "SENT"] } }
  });
  if (schedule.kind === "ONCE" && started > 0) {
    throw new AppError("ERR_SCHEDULE_ALREADY_STARTED", 400);
  }

  await sequelize.transaction(async transaction => {
    await schedule.update(
      {
        body: payload.body.trim(),
        kind: payload.kind,
        audienceMode: payload.audienceMode,
        sendAt: payload.kind === "ONCE" ? nextRunAt : null,
        sendTime: payload.kind === "ONCE" ? null : payload.sendTime,
        timezone: payload.timezone,
        nextRunAt,
        commemorativeDateId:
          payload.kind === "COMMEMORATIVE" ? payload.commemorativeDateId : null,
        saveMessage: !!payload.saveMessage,
        mediaPath: payload.mediaPath,
        mediaName: payload.mediaName,
        mediaType: payload.mediaType,
        mediaDeliveryMode: payload.mediaDeliveryMode,
        totalRecipients: contacts.length,
        sentCount: 0,
        errorCount: 0,
        status: payload.kind === "ONCE" ? "PENDENTE" : "ATIVA",
        active: true,
        contactId: null
      },
      { transaction }
    );
    await ScheduleAudienceContact.destroy({
      where: { scheduleId: schedule.id },
      transaction
    });
    if (payload.audienceMode === "SELECTED") {
      await ScheduleAudienceContact.bulkCreate(
        contacts.map(contact => ({
          scheduleId: schedule.id,
          contactId: contact.id
        })),
        { transaction }
      );
    }
    if (payload.kind === "ONCE") {
      await ScheduleDelivery.destroy({
        where: { scheduleId: schedule.id },
        transaction
      });
      await ScheduleDelivery.bulkCreate(
        contacts.map(contact => ({
          scheduleId: schedule.id,
          contactId: contact.id,
          occurrenceKey: `once-${schedule.id}`,
          scheduledAt: nextRunAt,
          status: "PENDING",
          contactName: contact.name,
          contactNumber: contact.number
        })),
        { transaction }
      );
    } else if (wasOnce) {
      await ScheduleDelivery.destroy({
        where: {
          scheduleId: schedule.id,
          status: { [Op.in]: ["PENDING", "ERROR"] }
        },
        transaction
      });
    }
  });
  return ShowService(id, companyId);
};

export default UpdateService;
