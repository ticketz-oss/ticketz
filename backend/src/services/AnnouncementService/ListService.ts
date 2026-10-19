import { Op, fn, col, where } from "sequelize";
import { isEmpty } from "lodash";
import Announcement from "../../models/Announcement";
import { announcementIncludes } from "./targeting";

interface Request {
  companyId: number;
  isSuper?: boolean;
  searchParam?: string;
  pageNumber?: string;
  status?: string;
  priority?: string;
  periodFrom?: string;
  periodTo?: string;
}

interface Response {
  records: Announcement[];
  count: number;
  hasMore: boolean;
}

/**
 * Management listing. Unlike the popover feed this returns inactive and
 * out-of-window announcements too, otherwise they could never be edited back
 * into circulation.
 */
const ListService = async ({
  companyId,
  isSuper = false,
  searchParam = "",
  pageNumber = "1",
  status = "",
  priority = "",
  periodFrom = "",
  periodTo = ""
}: Request): Promise<Response> => {
  const conditions: any[] = [];

  if (!isSuper) {
    conditions.push({ companyId });
  }

  if (!isEmpty(searchParam)) {
    const term = `%${searchParam.toLowerCase().trim()}%`;
    conditions.push({
      [Op.or]: [
        where(fn("LOWER", col("Announcement.title")), "LIKE", term),
        where(fn("LOWER", col("Announcement.text")), "LIKE", term)
      ]
    });
  }

  if (status === "true" || status === "false") {
    conditions.push({ status: status === "true" });
  }

  if (!isEmpty(priority)) {
    conditions.push({ priority: Number(priority) });
  }

  // Period filters match announcements whose publication window overlaps the
  // requested range; open-ended windows always overlap.
  if (!isEmpty(periodFrom)) {
    conditions.push({
      [Op.or]: [
        { endsAt: null },
        { endsAt: { [Op.gte]: new Date(`${periodFrom}T00:00:00`) } }
      ]
    });
  }

  if (!isEmpty(periodTo)) {
    conditions.push({
      [Op.or]: [
        { startsAt: null },
        { startsAt: { [Op.lte]: new Date(`${periodTo}T23:59:59.999`) } }
      ]
    });
  }

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: records } = await Announcement.findAndCountAll({
    where: conditions.length ? { [Op.and]: conditions } : {},
    include: announcementIncludes,
    distinct: true,
    limit,
    offset,
    order: [["createdAt", "DESC"]]
  });

  const hasMore = count > offset + records.length;

  return {
    records,
    count,
    hasMore
  };
};

export default ListService;
