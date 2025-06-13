import { Op, fn, col, WhereOptions, literal, QueryTypes } from "sequelize";
import Ticket from "../../models/Ticket";
import Queue from "../../models/Queue";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import User from "../../models/User";
import TicketTraking from "../../models/TicketTraking";
import sequelize from "../../database";
import { listCounterSerie } from "../CounterServices/ListCounterSerie";

type TicketTrackingStatistics = {
  avgWaitTime: number;
  avgServiceTime: number;
  totalClosed: number;
  newContacts: number;
};

export type DashboardDateRange = {
  date_from?: string;
  date_to?: string;
  tz?: string;
};

type TicketsStatisticsData = {
  start: string;
  end: string;
  ticketCounters: {
    create: any;
    accept: any;
    transfer: any;
    close: any;
  };
  ticketStatistics: {
    avgWaitTime: number;
    avgServiceTime: number;
    totalClosed: number;
  };
};

type UserStatistics = {
  id: number;
  name: string;
  avgWaitTime: number;
  avgServiceTime: number;
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  averageRating: number;
  online: boolean;
};

type UserReportData = {
  start: string;
  end: string;
  userReport: UserStatistics[];
};

export async function calculateTicketStatistics(
  companyId: number,
  start: Date,
  end: Date
): Promise<TicketTrackingStatistics> {
  const ticketStatistics = (await TicketTraking.findOne({
    attributes: [
      [fn("AVG", col("waitTime")), "avgWaitTime"],
      [fn("AVG", col("serviceTime")), "avgServiceTime"],
      [fn("COUNT", col("id")), "totalClosed"]
    ],
    where: {
      companyId,
      createdAt: {
        [Op.between]: [start, end]
      },
      finishedAt: {
        [Op.between]: [start, end]
      }
    },
    raw: true
  })) as unknown as TicketTrackingStatistics;

  // force to numbers
  ticketStatistics.avgWaitTime = Number(ticketStatistics.avgWaitTime) || null;
  ticketStatistics.avgServiceTime =
    Number(ticketStatistics.avgServiceTime) || null;
  ticketStatistics.totalClosed = Number(ticketStatistics.totalClosed) || null;

  const countContactsQuery = `
  SELECT COUNT(*) AS count FROM (SELECT FROM (
    SELECT 
        t.id AS "ticketId",
        t."contactId",
        c."createdAt"
    FROM 
        "TicketTraking" tt
    JOIN 
        "Tickets" t ON tt."ticketId" = t.id
    JOIN 
        "Contacts" c ON t."contactId" = c.id
    WHERE 
        (tt."createdAt" BETWEEN :startDate AND :endDate)
        AND (tt."companyId" = :companyId)
        AND (tt."finishedAt" BETWEEN :startDate AND :endDate)
        AND (c."createdAt" BETWEEN :startDate AND :endDate)
  ) GROUP BY "contactId")
  `;

  const newContacts = (await sequelize.query(countContactsQuery, {
    replacements: {
      companyId,
      startDate: start,
      endDate: end
    },
    type: QueryTypes.SELECT
  })) as unknown as [{ count: number }];

  ticketStatistics.newContacts = Number(newContacts[0]?.count) || null;

  return ticketStatistics;
}

export async function ticketsStatusSummary(companyId: number) {
  const where: WhereOptions<Ticket> = {
    companyId,
    status: {
      [Op.or]: ["open", "pending"]
    }
  };

  const groupsEnabled =
    (await GetCompanySetting(companyId, "groupsTab", "disabled")) === "enabled";

  if (groupsEnabled) {
    where.isGroup = false;
  }

  const ticketsSummary = await Ticket.findAll({
    attributes: ["status", "queueId", [fn("COUNT", "*"), "count"]],
    where,
    include: [
      {
        model: Queue,
        attributes: ["id", "name", "color"],
        required: false
      }
    ],
    group: ["status", "queueId", "queue.id", "queue.name"]
  });

  return ticketsSummary;
}

export async function usersStatusSummary(companyId) {
  const usersSummary = await User.findAll({
    attributes: [
      "id",
      "name",
      [
        literal(`(
          SELECT COUNT(*)
          FROM "UserSocketSessions"
          WHERE "UserSocketSessions"."userId" = "User"."id"
            AND "UserSocketSessions"."active" = true
        ) > 0`),
        "online"
      ],
      [fn("COUNT", col("tickets.id")), "openTicketsCount"]
    ],
    where: {
      companyId
    },
    include: [
      {
        model: Ticket,
        as: "tickets",
        attributes: [],
        where: {
          status: "open"
        },
        required: false
      }
    ],
    group: ["User.id"]
  });

  return usersSummary;
}

export async function userReport(companyId: number, start: Date, end: Date) {
  const result = await User.findAll({
    attributes: [
      "id",
      "name",
      [fn("AVG", col("tickets.ticketTrakings.waitTime")), "avgWaitTime"],
      [fn("AVG", col("tickets.ticketTrakings.serviceTime")), "avgServiceTime"],
      [fn("COUNT", col("tickets.id")), "totalTickets"],
      [
        literal(`(
          SELECT COUNT(*)
          FROM "TicketTraking" AS tt
          JOIN "Tickets" AS t ON tt."ticketId" = t.id
          WHERE t."userId" = "User"."id"
            AND tt."startedAt" < :endDate
            AND (tt."finishedAt" > :endDate OR tt."finishedAt" IS NULL)
        )`),
        "openTickets"
      ],
      [
        literal(`(
          SELECT COUNT(*)
          FROM "TicketTraking" AS tt
          JOIN "Tickets" AS t ON tt."ticketId" = t.id
          WHERE t."userId" = "User"."id"
            AND tt."finishedAt" BETWEEN :startDate AND :endDate
        )`),
        "closedTickets"
      ],
      [
        literal(`(
          SELECT AVG("rate")
          FROM "UserRatings"
          WHERE "UserRatings"."userId" = "User"."id"
            AND "UserRatings"."createdAt" BETWEEN :startDate AND :endDate
        )`),
        "averageRating"
      ],
      [
        literal(`(
          SELECT COUNT(*)>0
          FROM "UserSocketSessions"
          WHERE "UserSocketSessions"."userId" = "User"."id"
            AND "UserSocketSessions"."active" = true
        )`),
        "online"
      ]
    ],
    where: {
      companyId
    },
    include: [
      {
        model: Ticket,
        as: "tickets",
        attributes: [],
        required: false,
        include: [
          {
            model: TicketTraking,
            as: "ticketTrakings",
            attributes: [],
            where: {
              [Op.or]: [
                {
                  startedAt: { [Op.between]: [start, end] }
                },
                {
                  finishedAt: { [Op.between]: [start, end] }
                },
                {
                  startedAt: { [Op.lt]: end },
                  finishedAt: { [Op.gt]: end }
                },
                {
                  startedAt: { [Op.lt]: end },
                  finishedAt: null
                }
              ]
            }
          }
        ]
      }
    ],
    replacements: {
      startDate: start,
      endDate: end
    },
    group: ["User.id"]
  });

  return result as unknown[] as UserStatistics[];
}

export async function statusSummaryService(companyId: number) {
  return {
    ticketsStatusSummary: await ticketsStatusSummary(companyId),
    usersStatusSummary: await usersStatusSummary(companyId)
  };
}

export async function ticketsStatisticsService(
  companyId: number,
  params: DashboardDateRange
): Promise<TicketsStatisticsData> {
  let start: Date;
  let end = new Date();
  const tz = params.tz || "Z";

  if (params.date_from && params.date_to) {
    start = new Date(`${params.date_from}T00:00:00${tz}`);
    end = new Date(`${params.date_to}T23:59:59${tz}`);
  } else {
    throw new Error("Invalid date range");
  }

  return {
    start: params.date_from,
    end: params.date_to,
    ticketCounters: {
      create: await listCounterSerie(companyId, "ticket-create", start, end),
      accept: await listCounterSerie(companyId, "ticket-accept", start, end),
      transfer: await listCounterSerie(
        companyId,
        "ticket-transfer",
        start,
        end
      ),
      close: await listCounterSerie(companyId, "ticket-close", start, end)
    },
    ticketStatistics: await calculateTicketStatistics(companyId, start, end)
  };
}

export async function usersReportService(
  companyId: number,
  params: DashboardDateRange
): Promise<UserReportData> {
  let start: Date;
  let end = new Date();
  const tz = params.tz || "Z";

  if (params.date_from && params.date_to) {
    start = new Date(`${params.date_from}T00:00:00${tz}`);
    end = new Date(`${params.date_to}T23:59:59${tz}`);
  } else {
    throw new Error("Invalid date range");
  }

  return {
    start: params.date_from,
    end: params.date_to,
    userReport: await userReport(companyId, start, end)
  };
}
