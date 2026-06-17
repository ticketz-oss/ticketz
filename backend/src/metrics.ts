import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  collectDefaultMetrics
} from "prom-client";
import { Request, Response, NextFunction } from "express";
import { col, fn, Op } from "sequelize";
import Company from "./models/Company";
import Message from "./models/Message";
import QueueModel from "./models/Queue";
import Ticket from "./models/Ticket";
import UserSocketSession from "./models/UserSocketSession";
import Whatsapp from "./models/Whatsapp";
import {
  messageQueue,
  sendScheduledMessages,
  userMonitor,
  scheduleMonitor
} from "./queues";

type GroupedCount = {
  companyId?: number | string | null;
  status?: string | null;
  queueId?: number | string | null;
  fromMe?: boolean | null;
  count: number | string;
};

type LastMessageRow = {
  companyId?: number | string | null;
  fromMe?: boolean | null;
  lastCreatedAt?: Date | string | null;
};

const register = new Registry();
collectDefaultMetrics({ register, prefix: "ticketz_" });

export const requestCounter = new Counter({
  name: "ticketz_http_requests_total",
  help: "Total HTTP requests received by the Ticketz backend",
  labelNames: ["method", "path", "status"]
});

export const requestDuration = new Histogram({
  name: "ticketz_request_duration_seconds",
  help: "Request duration in seconds for the Ticketz backend",
  labelNames: ["method", "path", "status"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10]
});

export const requestErrorCounter = new Counter({
  name: "ticketz_http_request_errors_total",
  help: "Total backend HTTP requests returning 5xx status codes",
  labelNames: ["method", "path", "status"]
});

export const websocketConnectionsGauge = new Gauge({
  name: "ticketz_websocket_connections_active",
  help: "Current number of active WebSocket connections"
});

export const companiesGauge = new Gauge({
  name: "ticketz_companies_total",
  help: "Total number of company records in the Ticketz backend"
});

export const queueWaitingGauge = new Gauge({
  name: "ticketz_queue_waiting",
  help: "Number of jobs waiting in each Ticketz Bull queue",
  labelNames: ["queue"]
});

export const queueActiveGauge = new Gauge({
  name: "ticketz_queue_active",
  help: "Number of jobs currently active in each Ticketz Bull queue",
  labelNames: ["queue"]
});

export const queueFailedGauge = new Gauge({
  name: "ticketz_queue_failed",
  help: "Number of failed jobs in each Ticketz Bull queue",
  labelNames: ["queue"]
});

export const queueDelayedGauge = new Gauge({
  name: "ticketz_queue_delayed",
  help: "Number of delayed jobs in each Ticketz Bull queue",
  labelNames: ["queue"]
});

export const queueCompletedGauge = new Gauge({
  name: "ticketz_queue_completed",
  help: "Number of completed jobs retained in each Ticketz Bull queue",
  labelNames: ["queue"]
});

export const queueOldestWaitingSecondsGauge = new Gauge({
  name: "ticketz_queue_oldest_waiting_seconds",
  help: "Age in seconds of the oldest waiting job in each Ticketz Bull queue",
  labelNames: ["queue"]
});

export const whatsappSessionsGauge = new Gauge({
  name: "ticketz_whatsapp_sessions_total",
  help: "Total WhatsApp sessions grouped by company and connection status",
  labelNames: ["companyId", "status"]
});

export const ticketsGauge = new Gauge({
  name: "ticketz_tickets_total",
  help: "Total tickets grouped by company and status",
  labelNames: ["companyId", "status"]
});

export const staleTicketsGauge = new Gauge({
  name: "ticketz_tickets_stale_total",
  help: "Tickets with no update in the last 30 minutes grouped by company and status",
  labelNames: ["companyId", "status"]
});

export const unassignedTicketsGauge = new Gauge({
  name: "ticketz_tickets_unassigned_total",
  help: "Open or pending tickets without an assigned user grouped by company and status",
  labelNames: ["companyId", "status"]
});

export const ticketsByQueueGauge = new Gauge({
  name: "ticketz_tickets_by_queue_total",
  help: "Open or pending tickets grouped by company, status and queue",
  labelNames: ["companyId", "status", "queueId", "queueName"]
});

export const ticketsWithoutQueueGauge = new Gauge({
  name: "ticketz_tickets_without_queue_total",
  help: "Open or pending tickets without a queue grouped by company and status",
  labelNames: ["companyId", "status"]
});

export const oldestTicketAgeSecondsGauge = new Gauge({
  name: "ticketz_oldest_ticket_age_seconds",
  help: "Age in seconds of the oldest open or pending ticket grouped by company and status",
  labelNames: ["companyId", "status"]
});

export const oldestTicketByQueueAgeSecondsGauge = new Gauge({
  name: "ticketz_oldest_ticket_by_queue_age_seconds",
  help: "Age in seconds of the oldest open or pending ticket grouped by company, status and queue",
  labelNames: ["companyId", "status", "queueId", "queueName"]
});

export const messagesGauge = new Gauge({
  name: "ticketz_messages_total",
  help: "Total messages grouped by company and direction",
  labelNames: ["companyId", "direction"]
});

export const recentMessagesGauge = new Gauge({
  name: "ticketz_messages_recent_total",
  help: "Messages created in the last 5 minutes grouped by company and direction",
  labelNames: ["companyId", "direction"]
});

export const messageErrorsGauge = new Gauge({
  name: "ticketz_message_errors_total",
  help: "Total messages with an error payload grouped by company and direction",
  labelNames: ["companyId", "direction"]
});

export const lastMessageAgeSecondsGauge = new Gauge({
  name: "ticketz_last_message_age_seconds",
  help: "Age in seconds of the last message grouped by company and direction",
  labelNames: ["companyId", "direction"]
});

export const whatsappStatusAgeSecondsGauge = new Gauge({
  name: "ticketz_whatsapp_status_age_seconds",
  help: "Age in seconds since the WhatsApp session status was last updated",
  labelNames: ["companyId", "whatsappId", "whatsappName", "status"]
});

register.registerMetric(requestCounter);
register.registerMetric(requestDuration);
register.registerMetric(requestErrorCounter);
register.registerMetric(websocketConnectionsGauge);
register.registerMetric(companiesGauge);
register.registerMetric(queueWaitingGauge);
register.registerMetric(queueActiveGauge);
register.registerMetric(queueFailedGauge);
register.registerMetric(queueDelayedGauge);
register.registerMetric(queueCompletedGauge);
register.registerMetric(queueOldestWaitingSecondsGauge);
register.registerMetric(whatsappSessionsGauge);
register.registerMetric(ticketsGauge);
register.registerMetric(staleTicketsGauge);
register.registerMetric(unassignedTicketsGauge);
register.registerMetric(ticketsByQueueGauge);
register.registerMetric(ticketsWithoutQueueGauge);
register.registerMetric(oldestTicketAgeSecondsGauge);
register.registerMetric(oldestTicketByQueueAgeSecondsGauge);
register.registerMetric(messagesGauge);
register.registerMetric(recentMessagesGauge);
register.registerMetric(messageErrorsGauge);
register.registerMetric(lastMessageAgeSecondsGauge);
register.registerMetric(whatsappStatusAgeSecondsGauge);

function asCount(value: number | string) {
  return Number(value) || 0;
}

function asLabel(value: number | string | null | undefined) {
  return value == null ? "unknown" : String(value);
}

function messageDirection(fromMe: boolean | null | undefined) {
  return fromMe ? "outbound" : "inbound";
}

async function queueLabelById() {
  const queues = await QueueModel.findAll({ attributes: ["id", "name"] });
  const labels = new Map<string, string>();

  queues.forEach(queue => {
    labels.set(String(queue.id), queue.name || "unknown");
  });

  return labels;
}

async function refreshQueueMetrics() {
  const queueNames = [
    { queue: "MessageQueue", instance: messageQueue },
    { queue: "SendSacheduledMessages", instance: sendScheduledMessages },
    { queue: "UserMonitor", instance: userMonitor },
    { queue: "ScheduleMonitor", instance: scheduleMonitor }
  ];

  await Promise.all(
    queueNames.map(async ({ queue, instance }) => {
      try {
        const counts = await instance.getJobCounts();
        queueWaitingGauge.labels(queue).set(counts.waiting || 0);
        queueActiveGauge.labels(queue).set(counts.active || 0);
        queueFailedGauge.labels(queue).set(counts.failed || 0);
        queueDelayedGauge.labels(queue).set(counts.delayed || 0);
        queueCompletedGauge.labels(queue).set(counts.completed || 0);

        const [oldestWaitingJob] = await instance.getWaiting(0, 0);
        const oldestWaitingSeconds = oldestWaitingJob
          ? Math.max(0, (Date.now() - oldestWaitingJob.timestamp) / 1000)
          : 0;
        queueOldestWaitingSecondsGauge.labels(queue).set(oldestWaitingSeconds);
      } catch {
        queueWaitingGauge.labels(queue).set(0);
        queueActiveGauge.labels(queue).set(0);
        queueFailedGauge.labels(queue).set(0);
        queueDelayedGauge.labels(queue).set(0);
        queueCompletedGauge.labels(queue).set(0);
        queueOldestWaitingSecondsGauge.labels(queue).set(0);
      }
    })
  );
}

async function refreshWhatsappMetrics() {
  whatsappSessionsGauge.reset();
  whatsappStatusAgeSecondsGauge.reset();

  const counts = (await Whatsapp.count({
    attributes: ["companyId", "status"],
    group: ["companyId", "status"]
  })) as unknown as GroupedCount[];

  counts.forEach(row => {
    whatsappSessionsGauge
      .labels(asLabel(row.companyId), asLabel(row.status))
      .set(asCount(row.count));
  });

  const whatsapps = await Whatsapp.findAll({
    attributes: ["id", "name", "companyId", "status", "updatedAt"]
  });

  whatsapps.forEach(whatsapp => {
    const updatedAt = whatsapp.updatedAt?.getTime();
    const ageSeconds = updatedAt
      ? Math.max(0, (Date.now() - updatedAt) / 1000)
      : 0;

    whatsappStatusAgeSecondsGauge
      .labels(
        String(whatsapp.companyId),
        String(whatsapp.id),
        whatsapp.name || "unknown",
        whatsapp.status || "unknown"
      )
      .set(ageSeconds);
  });
}

async function refreshTicketMetrics() {
  ticketsGauge.reset();
  staleTicketsGauge.reset();
  unassignedTicketsGauge.reset();
  ticketsByQueueGauge.reset();
  ticketsWithoutQueueGauge.reset();
  oldestTicketAgeSecondsGauge.reset();
  oldestTicketByQueueAgeSecondsGauge.reset();

  const queueLabels = await queueLabelById();

  const ticketCounts = (await Ticket.count({
    attributes: ["companyId", "status"],
    group: ["companyId", "status"]
  })) as unknown as GroupedCount[];

  ticketCounts.forEach(row => {
    ticketsGauge
      .labels(asLabel(row.companyId), asLabel(row.status))
      .set(asCount(row.count));
  });

  const staleSince = new Date(Date.now() - 30 * 60 * 1000);
  const staleTicketCounts = (await Ticket.count({
    attributes: ["companyId", "status"],
    where: {
      status: {
        [Op.in]: ["open", "pending"]
      },
      updatedAt: {
        [Op.lt]: staleSince
      }
    },
    group: ["companyId", "status"]
  })) as unknown as GroupedCount[];

  staleTicketCounts.forEach(row => {
    staleTicketsGauge
      .labels(asLabel(row.companyId), asLabel(row.status))
      .set(asCount(row.count));
  });

  const unassignedTicketCounts = (await Ticket.count({
    attributes: ["companyId", "status"],
    where: {
      status: {
        [Op.in]: ["open", "pending"]
      },
      userId: null
    },
    group: ["companyId", "status"]
  })) as unknown as GroupedCount[];

  unassignedTicketCounts.forEach(row => {
    unassignedTicketsGauge
      .labels(asLabel(row.companyId), asLabel(row.status))
      .set(asCount(row.count));
  });

  const activeTicketWhere = {
    status: {
      [Op.in]: ["open", "pending"]
    }
  };

  const ticketsByQueueCounts = (await Ticket.count({
    attributes: ["companyId", "status", "queueId"],
    where: {
      ...activeTicketWhere,
      queueId: {
        [Op.not]: null
      }
    },
    group: ["companyId", "status", "queueId"]
  })) as unknown as GroupedCount[];

  ticketsByQueueCounts.forEach(row => {
    const queueId = asLabel(row.queueId);
    ticketsByQueueGauge
      .labels(
        asLabel(row.companyId),
        asLabel(row.status),
        queueId,
        queueLabels.get(queueId) || "unknown"
      )
      .set(asCount(row.count));
  });

  const ticketsWithoutQueueCounts = (await Ticket.count({
    attributes: ["companyId", "status"],
    where: {
      ...activeTicketWhere,
      queueId: null
    },
    group: ["companyId", "status"]
  })) as unknown as GroupedCount[];

  ticketsWithoutQueueCounts.forEach(row => {
    ticketsWithoutQueueGauge
      .labels(asLabel(row.companyId), asLabel(row.status))
      .set(asCount(row.count));
  });

  const oldestTickets = await Ticket.findAll({
    attributes: ["companyId", "status", "queueId", "createdAt"],
    where: activeTicketWhere,
    order: [["createdAt", "ASC"]]
  });

  const oldestByStatus = new Map<string, number>();
  const oldestByQueue = new Map<string, number>();

  oldestTickets.forEach(ticket => {
    const ageSeconds = Math.max(
      0,
      (Date.now() - ticket.createdAt.getTime()) / 1000
    );
    const companyId = String(ticket.companyId);
    const status = ticket.status;
    const statusKey = `${companyId}:${status}`;
    const currentStatusAge = oldestByStatus.get(statusKey) || 0;

    oldestByStatus.set(statusKey, Math.max(currentStatusAge, ageSeconds));

    if (ticket.queueId) {
      const queueId = String(ticket.queueId);
      const queueKey = `${companyId}:${status}:${queueId}`;
      const currentQueueAge = oldestByQueue.get(queueKey) || 0;

      oldestByQueue.set(queueKey, Math.max(currentQueueAge, ageSeconds));
    }
  });

  oldestByStatus.forEach((ageSeconds, key) => {
    const [companyId, status] = key.split(":");
    oldestTicketAgeSecondsGauge.labels(companyId, status).set(ageSeconds);
  });

  oldestByQueue.forEach((ageSeconds, key) => {
    const [companyId, status, queueId] = key.split(":");
    oldestTicketByQueueAgeSecondsGauge
      .labels(companyId, status, queueId, queueLabels.get(queueId) || "unknown")
      .set(ageSeconds);
  });
}

async function refreshMessageMetrics() {
  messagesGauge.reset();
  recentMessagesGauge.reset();
  messageErrorsGauge.reset();
  lastMessageAgeSecondsGauge.reset();

  const companies = await Company.findAll({ attributes: ["id"] });

  companies.forEach(company => {
    ["inbound", "outbound"].forEach(direction => {
      recentMessagesGauge.labels(String(company.id), direction).set(0);
      messageErrorsGauge.labels(String(company.id), direction).set(0);
    });
  });

  const messageCounts = (await Message.count({
    attributes: ["companyId", "fromMe"],
    group: ["companyId", "fromMe"]
  })) as unknown as GroupedCount[];

  messageCounts.forEach(row => {
    messagesGauge
      .labels(asLabel(row.companyId), messageDirection(row.fromMe))
      .set(asCount(row.count));
  });

  const recentSince = new Date(Date.now() - 5 * 60 * 1000);
  const recentMessageCounts = (await Message.count({
    attributes: ["companyId", "fromMe"],
    where: {
      createdAt: {
        [Op.gte]: recentSince
      }
    },
    group: ["companyId", "fromMe"]
  })) as unknown as GroupedCount[];

  recentMessageCounts.forEach(row => {
    recentMessagesGauge
      .labels(asLabel(row.companyId), messageDirection(row.fromMe))
      .set(asCount(row.count));
  });

  const messageErrorCounts = (await Message.count({
    attributes: ["companyId", "fromMe"],
    where: {
      error: {
        [Op.not]: null
      }
    },
    group: ["companyId", "fromMe"]
  })) as unknown as GroupedCount[];

  messageErrorCounts.forEach(row => {
    messageErrorsGauge
      .labels(asLabel(row.companyId), messageDirection(row.fromMe))
      .set(asCount(row.count));
  });

  const lastMessageRows = (await Message.findAll({
    attributes: [
      "companyId",
      "fromMe",
      [fn("MAX", col("createdAt")), "lastCreatedAt"]
    ],
    group: ["companyId", "fromMe"],
    raw: true
  })) as unknown as LastMessageRow[];

  lastMessageRows.forEach(row => {
    if (!row.lastCreatedAt) {
      return;
    }

    const lastCreatedAt = new Date(row.lastCreatedAt).getTime();
    const ageSeconds = Math.max(0, (Date.now() - lastCreatedAt) / 1000);

    lastMessageAgeSecondsGauge
      .labels(asLabel(row.companyId), messageDirection(row.fromMe))
      .set(ageSeconds);
  });
}

export async function refreshDynamicMetrics() {
  try {
    const companies = await Company.count();
    companiesGauge.set(companies);
  } catch {
    companiesGauge.set(0);
  }

  try {
    const activeSessions = await UserSocketSession.count({
      where: { active: true }
    });
    websocketConnectionsGauge.set(activeSessions);
  } catch {
    websocketConnectionsGauge.set(0);
  }

  await refreshQueueMetrics();
  await refreshWhatsappMetrics();
  await refreshTicketMetrics();
  await refreshMessageMetrics();
}

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.path === "/metrics") {
    return next();
  }

  const end = requestDuration.startTimer();

  res.on("finish", () => {
    const labels = {
      method: req.method,
      path: req.path,
      status: String(res.statusCode)
    };

    requestCounter.inc(labels);
    end(labels);
    if (res.statusCode >= 500) {
      requestErrorCounter.inc(labels);
    }
  });

  next();
}

export async function metricsHandler(req: Request, res: Response) {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
}

export function startMetricRefresh() {
  refreshDynamicMetrics().catch(() => undefined);
  setInterval(() => refreshDynamicMetrics().catch(() => undefined), 15000);
}

export const metricsRegister = register;
