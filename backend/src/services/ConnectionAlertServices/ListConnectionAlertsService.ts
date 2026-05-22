import { FindOptions, WhereOptions } from "sequelize";

import Company from "../../models/Company";
import ConnectionAlert from "../../models/ConnectionAlert";

interface Request {
  companyId?: number;
  pageNumber?: string;
  limit?: string;
  onlyUnviewed?: string;
  eventType?: string;
  isSuper?: boolean;
}

type Response = {
  alerts: ConnectionAlert[];
  count: number;
  hasMore: boolean;
};

const ListConnectionAlertsService = async ({
  companyId,
  pageNumber = "1",
  limit = "20",
  onlyUnviewed = "false",
  eventType,
  isSuper
}: Request): Promise<Response> => {
  const parsedPageNumber = Number(pageNumber);
  const parsedLimit = Math.min(Number(limit), 100);
  const offset = parsedLimit * (parsedPageNumber - 1);
  const where: WhereOptions = {};

  if (!isSuper && companyId) {
    where.companyId = companyId;
  } else if (companyId) {
    where.companyId = companyId;
  }

  if (onlyUnviewed === "true") {
    where.viewed = false;
  }

  if (eventType) {
    where.eventType = eventType;
  }

  const options: FindOptions = {
    where,
    include: [
      {
        model: Company,
        attributes: ["id", "name"]
      }
    ],
    limit: parsedLimit,
    offset,
    order: [["occurredAt", "DESC"], ["id", "DESC"]]
  };

  const { count, rows } = await ConnectionAlert.findAndCountAll(options);

  return {
    alerts: rows,
    count,
    hasMore: count > offset + rows.length
  };
};

export default ListConnectionAlertsService;