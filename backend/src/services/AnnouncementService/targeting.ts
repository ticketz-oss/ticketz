import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import Announcement from "../../models/Announcement";
import AnnouncementQueue from "../../models/AnnouncementQueue";
import AnnouncementUser from "../../models/AnnouncementUser";
import AnnouncementWhatsapp from "../../models/AnnouncementWhatsapp";
import Queue from "../../models/Queue";
import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";

export const VALID_PROFILES = ["admin", "user"];

export interface TargetingData {
  audienceMode?: "ALL" | "SEGMENTED";
  profiles?: string[] | null;
  userIds?: number[];
  queueIds?: number[];
  whatsappIds?: number[];
}

/**
 * Associations needed to render an announcement on the management screen and
 * to prefill the modal when editing.
 */
export const announcementIncludes = [
  {
    model: User,
    as: "users",
    attributes: ["id", "name"],
    through: { attributes: [] }
  },
  {
    model: Queue,
    as: "queues",
    attributes: ["id", "name", "color"],
    through: { attributes: [] }
  },
  {
    model: Whatsapp,
    as: "whatsapps",
    attributes: ["id", "name"],
    through: { attributes: [] }
  }
];

const toIdList = (value: unknown): number[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return [
    ...new Set(
      value.map(item => Number(item)).filter(item => Number.isInteger(item))
    )
  ];
};

export const normalizeProfiles = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...new Set(value.map(String))].filter(item =>
    VALID_PROFILES.includes(item)
  );
};

/**
 * Every targeted entity must belong to the company that owns the announcement,
 * otherwise an admin could aim a notice at another tenant's users.
 */
const assertOwnership = async (
  model: any,
  ids: number[],
  companyId: number,
  errorCode: string
): Promise<void> => {
  if (!ids.length) {
    return;
  }
  const count = await model.count({
    where: { id: { [Op.in]: ids }, companyId }
  });
  if (count !== ids.length) {
    throw new AppError(errorCode, 400);
  }
};

export const parseTargeting = (data: TargetingData) => ({
  audienceMode: (data.audienceMode === "SEGMENTED" ? "SEGMENTED" : "ALL") as
    "ALL" | "SEGMENTED",
  profiles: normalizeProfiles(data.profiles),
  userIds: toIdList(data.userIds),
  queueIds: toIdList(data.queueIds),
  whatsappIds: toIdList(data.whatsappIds)
});

export const validateTargeting = async (
  data: TargetingData,
  companyId: number
) => {
  const targeting = parseTargeting(data);

  if (targeting.audienceMode === "ALL") {
    return {
      ...targeting,
      profiles: [],
      userIds: [],
      queueIds: [],
      whatsappIds: []
    };
  }

  const hasAudience =
    targeting.profiles.length ||
    targeting.userIds.length ||
    targeting.queueIds.length ||
    targeting.whatsappIds.length;

  if (!hasAudience) {
    throw new AppError("ERR_ANNOUNCEMENT_NO_AUDIENCE", 400);
  }

  await assertOwnership(
    User,
    targeting.userIds,
    companyId,
    "ERR_ANNOUNCEMENT_INVALID_USER"
  );
  await assertOwnership(
    Queue,
    targeting.queueIds,
    companyId,
    "ERR_ANNOUNCEMENT_INVALID_QUEUE"
  );
  await assertOwnership(
    Whatsapp,
    targeting.whatsappIds,
    companyId,
    "ERR_ANNOUNCEMENT_INVALID_WHATSAPP"
  );

  return targeting;
};

export const syncTargeting = async (
  announcement: Announcement,
  targeting: ReturnType<typeof parseTargeting>
): Promise<void> => {
  const announcementId = announcement.id;

  await AnnouncementUser.destroy({ where: { announcementId } });
  await AnnouncementQueue.destroy({ where: { announcementId } });
  await AnnouncementWhatsapp.destroy({ where: { announcementId } });

  if (targeting.userIds.length) {
    await AnnouncementUser.bulkCreate(
      targeting.userIds.map(userId => ({ announcementId, userId }))
    );
  }
  if (targeting.queueIds.length) {
    await AnnouncementQueue.bulkCreate(
      targeting.queueIds.map(queueId => ({ announcementId, queueId }))
    );
  }
  if (targeting.whatsappIds.length) {
    await AnnouncementWhatsapp.bulkCreate(
      targeting.whatsappIds.map(whatsappId => ({ announcementId, whatsappId }))
    );
  }
};

const parseDate = (value?: string | Date | null): Date | null => {
  if (!value) {
    return null;
  }
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Publication window. Both ends are optional: no `startsAt` means "show it
 * right away", no `endsAt` means "show it until it is deactivated".
 */
export const parseWindow = (
  startsAt?: string | Date | null,
  endsAt?: string | Date | null
) => {
  const window = { startsAt: parseDate(startsAt), endsAt: parseDate(endsAt) };

  if (window.startsAt && window.endsAt && window.endsAt <= window.startsAt) {
    throw new AppError("ERR_ANNOUNCEMENT_INVALID_WINDOW", 400);
  }

  return window;
};
