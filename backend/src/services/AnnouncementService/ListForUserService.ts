import { Op, literal } from "sequelize";
import Announcement from "../../models/Announcement";
import { VALID_PROFILES } from "./targeting";

interface Request {
  companyId: number;
  userId: number;
  profile: string;
  pageNumber?: string;
}

interface Response {
  records: Announcement[];
  count: number;
  hasMore: boolean;
}

/**
 * Feed consumed by the announcements popover: only what the logged user is
 * actually supposed to see right now.
 *
 * A user matches a segmented announcement when ANY of the targets applies —
 * they were picked individually, they belong to one of the targeted queues,
 * they serve a queue attached to one of the targeted connections, or their
 * profile is in the list.
 */
const ListForUserService = async ({
  companyId,
  userId,
  profile,
  pageNumber = "1"
}: Request): Promise<Response> => {
  const now = new Date();
  const safeUserId = Number(userId);

  if (!Number.isInteger(safeUserId)) {
    return { records: [], count: 0, hasMore: false };
  }

  const audienceMatches: any[] = [
    { audienceMode: "ALL" },
    literal(
      `EXISTS (
        SELECT 1 FROM "AnnouncementUsers" au
        WHERE au."announcementId" = "Announcement"."id"
          AND au."userId" = ${safeUserId}
      )`
    ),
    literal(
      `EXISTS (
        SELECT 1 FROM "AnnouncementQueues" aq
        JOIN "UserQueues" uq ON uq."queueId" = aq."queueId"
        WHERE aq."announcementId" = "Announcement"."id"
          AND uq."userId" = ${safeUserId}
      )`
    ),
    literal(
      `EXISTS (
        SELECT 1 FROM "AnnouncementWhatsapps" aw
        JOIN "WhatsappQueues" wq ON wq."whatsappId" = aw."whatsappId"
        JOIN "UserQueues" uq ON uq."queueId" = wq."queueId"
        WHERE aw."announcementId" = "Announcement"."id"
          AND uq."userId" = ${safeUserId}
      )`
    )
  ];

  if (VALID_PROFILES.includes(profile)) {
    audienceMatches.push({ profiles: { [Op.contains]: [profile] } });
  }

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: records } = await Announcement.findAndCountAll({
    where: {
      [Op.and]: [
        { status: true },
        { [Op.or]: [{ startsAt: null }, { startsAt: { [Op.lte]: now } }] },
        { [Op.or]: [{ endsAt: null }, { endsAt: { [Op.gte]: now } }] },
        { [Op.or]: [{ isGlobal: true }, { companyId }] },
        { [Op.or]: audienceMatches }
      ]
    },
    limit,
    offset,
    order: [
      ["priority", "ASC"],
      ["createdAt", "DESC"]
    ]
  });

  const hasMore = count > offset + records.length;

  return { records, count, hasMore };
};

export default ListForUserService;
