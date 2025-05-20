import { col, fn, literal, Op } from "sequelize";
import Ticket from "../../models/Ticket";
import TicketTraking from "../../models/TicketTraking";
import Queue from "../../models/Queue";
import { DashboardDateRange } from "./DashboardService";

type QueueStatistics = {
  id: number;
  name: string;
  avgWaitTime: number;
  avgServiceTime: number;
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  averageRating: number;
};

type QueueReportData = {
  start: string;
  end: string;
  queuesReport: QueueStatistics[];
};

async function queuesReport(companyId: number, start: Date, end: Date) {
  const result = await Queue.findAll({
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
          WHERE t."queueId" = "Queue"."id"
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
          WHERE t."queueId" = "Queue"."id"
            AND tt."finishedAt" BETWEEN :startDate AND :endDate
        )`),
        "closedTickets"
      ],
      [
        literal(`(
          SELECT AVG("UserRatings"."rate")
          FROM "UserRatings"
          JOIN "Tickets" ON "UserRatings"."ticketId" = "Tickets"."id"
          WHERE "Tickets"."queueId" = "Queue"."id"
            AND "UserRatings"."createdAt" BETWEEN :startDate AND :endDate
        )`),
        "averageRating"
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
    group: ["Queue.id"]
  });

  return result as unknown[] as QueueStatistics[];
}

export async function queuesReportService(
  companyId: number,
  params: DashboardDateRange
): Promise<QueueReportData> {
  let start: Date;
  let end = new Date();

  if (params.date_from && params.date_to) {
    start = new Date(`${params.date_from}T00:00:00Z`);
    end = new Date(`${params.date_to}T23:59:59Z`);
  } else {
    throw new Error("Invalid date range");
  }

  return {
    start: params.date_from,
    end: params.date_to,
    queuesReport: await queuesReport(companyId, start, end)
  };
}
