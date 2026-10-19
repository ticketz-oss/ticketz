import * as Sentry from "@sentry/node";
import Queue, { Job } from "bull";
import moment from "moment";
import { Op, WhereOptions } from "sequelize";
import { CronJob } from "cron";
import { subDays, subMinutes } from "date-fns";
import { SendMessage } from "./helpers/SendMessage";
import Whatsapp from "./models/Whatsapp";
import { logger } from "./utils/logger";
import Schedule from "./models/Schedule";
import Contact from "./models/Contact";
import GetDefaultWhatsApp from "./helpers/GetDefaultWhatsApp";
import GetWhatsappWbot from "./helpers/GetWhatsappWbot";
import User from "./models/User";
import Company from "./models/Company";
import TicketTraking from "./models/TicketTraking";
import { GetCompanySetting } from "./helpers/CheckSettings";
import { getWbot } from "./libs/wbot";
import { buildMetaWbot } from "./services/MetaWhatsAppServices/MetaWbotAdapter";
import Ticket from "./models/Ticket";
import QueueModel from "./models/Queue";
import UpdateTicketService, {
  UpdateTicketData
} from "./services/TicketServices/UpdateTicketService";
import { handleMessage } from "./services/WbotServices/wbotMessageListener";
import formatBody from "./helpers/Mustache";
import Setting from "./models/Setting";
import { parseToMilliseconds } from "./helpers/parseToMilliseconds";
import { startCampaignQueues } from "./queues/campaign";
import OutOfTicketMessage from "./models/OutOfTicketMessages";
import { getJidOf } from "./services/WbotServices/getJidOf";
import { makeRandomId } from "./helpers/MakeRandomId";
import McpAudit from "./models/McpAudit";
import ScheduleDelivery from "./models/ScheduleDelivery";
import ScheduleAudienceContact from "./models/ScheduleAudienceContact";
import CommemorativeDate from "./models/CommemorativeDate";
import ContactCustomField from "./models/ContactCustomField";
import { DateTime } from "luxon";
import path from "path";
import {
  birthdayMatches,
  nextBirthdayScan,
  nextCommemorativeOccurrence
} from "./services/ScheduleServices/recurrence";
import { renderScheduleMessage } from "./services/ScheduleServices/variables";
import { getIO } from "./libs/socket";
import {
  getScheduleCadence,
  nextCadenceDelay
} from "./services/ScheduleServices/cadence";
import SendPartnerPayoutsService from "./services/PartnerServices/SendPartnerPayoutsService";
import ReconcilePartnerPayoutsService from "./services/PartnerServices/ReconcilePartnerPayoutsService";
import { processPlatformWebhooks } from "./services/PlatformServices/PlatformWebhookService";
import CreateCompanyInvoiceService from "./services/InvoicesService/CreateCompanyInvoiceService";
import getCompletionMessage from "./helpers/GetCompletionMessage";
import {
  isDedicatedRuntime,
  runtimeCompanyWhere,
  runtimeOwnsCompany,
  runtimeQueueOptions
} from "./helpers/tenantRuntime";
import { startProspeccaoQueue } from "./queues/prospeccao";
import { startWhatsappStatusQueue } from "./queues/whatsappStatus";

const connection = process.env.REDIS_URI || "";
export const userMonitor = new Queue(
  "UserMonitor",
  connection,
  runtimeQueueOptions()
);

export const scheduleMonitor = new Queue(
  "ScheduleMonitor",
  connection,
  runtimeQueueOptions()
);
export const sendScheduledMessages = new Queue(
  "SendSacheduledMessages",
  connection,
  runtimeQueueOptions()
);

// Repasses dos parceiros. Fila Bull (e nao CronJob) porque o lock do Redis
// garante que so uma replica envia o PIX.
export const partnerPayouts = new Queue(
  "PartnerPayouts",
  connection,
  runtimeQueueOptions()
);
export const platformWebhooks = new Queue(
  "PlatformWebhooks",
  connection,
  runtimeQueueOptions()
);

let lastMcpAuditCleanupDate: string | null = null;

const recoverQueuedScheduleDeliveries = async (): Promise<void> => {
  const queued = await ScheduleDelivery.findAll({
    where: { status: "QUEUED" },
    attributes: ["id"],
    include: [
      {
        model: Schedule,
        as: "schedule",
        required: true,
        where: runtimeCompanyWhere(),
        attributes: []
      }
    ],
    limit: 1000,
    order: [["queuedAt", "ASC"]]
  });
  await Promise.all(
    queued.map(delivery =>
      sendScheduledMessages.add(
        "SendMessage",
        { deliveryId: delivery.id },
        {
          jobId: `schedule-delivery-${delivery.id}`,
          removeOnComplete: true
        }
      )
    )
  );
};

async function handleMcpAuditRetention(): Promise<void> {
  if (isDedicatedRuntime()) return;
  const today = new Date().toISOString().slice(0, 10);

  if (lastMcpAuditCleanupDate === today) {
    return;
  }

  await McpAudit.destroy({
    where: {
      createdAt: {
        [Op.lt]: subDays(new Date(), 90)
      }
    }
  });

  lastMcpAuditCleanupDate = today;
}

async function handleVerifySchedules() {
  try {
    await recoverQueuedScheduleDeliveries();
    const schedules = await Schedule.findAll({
      where: {
        active: true,
        ...runtimeCompanyWhere(),
        nextRunAt: { [Op.lte]: new Date() }
      },
      include: [
        { model: CommemorativeDate, as: "commemorativeDate" },
        {
          model: ScheduleAudienceContact,
          as: "audienceContacts",
          include: [{ model: Contact, as: "contact", include: ["extraInfo"] }]
        }
      ]
    });

    // eslint-disable-next-line no-restricted-syntax
    for (const schedule of schedules) {
      const timezone = schedule.timezone || "UTC";
      const localOccurrence = DateTime.fromJSDate(schedule.nextRunAt).setZone(
        timezone
      );
      const localNow = DateTime.now().setZone(timezone);
      const missedRecurringDay =
        schedule.kind !== "ONCE" && !localOccurrence.hasSame(localNow, "day");

      let contacts: Contact[] = [];
      if (!missedRecurringDay) {
        if (schedule.audienceMode === "SELECTED") {
          contacts = schedule.audienceContacts
            .map(item => item.contact)
            .filter(Boolean);
        } else {
          contacts = await Contact.findAll({
            where: {
              companyId: schedule.companyId,
              channel: "whatsapp",
              isGroup: false,
              number: { [Op.regexp]: "^[0-9]{8,20}$" }
            },
            include: [{ model: ContactCustomField, as: "extraInfo" }]
          });
        }
        if (schedule.kind === "BIRTHDAY") {
          contacts = contacts.filter(contact =>
            birthdayMatches(
              contact.birthdayDay,
              contact.birthdayMonth,
              localOccurrence
            )
          );
        }
      }

      const occurrenceKey =
        schedule.kind === "ONCE"
          ? `once-${schedule.id}`
          : localOccurrence.toFormat("yyyy-LL-dd");
      if (schedule.kind !== "ONCE") {
        // eslint-disable-next-line no-restricted-syntax
        for (const contact of contacts) {
          await ScheduleDelivery.findOrCreate({
            where: {
              scheduleId: schedule.id,
              contactId: contact.id,
              occurrenceKey
            },
            defaults: {
              scheduleId: schedule.id,
              contactId: contact.id,
              occurrenceKey,
              scheduledAt: schedule.nextRunAt,
              status: "PENDING",
              contactName: contact.name,
              contactNumber: contact.number
            }
          });
        }
        await schedule.update({
          totalRecipients: contacts.length,
          sentCount: 0,
          errorCount: 0,
          status: missedRecurringDay ? "IGNORADA" : "ATIVA"
        });
      }

      const pending = await ScheduleDelivery.findAll({
        where: {
          scheduleId: schedule.id,
          occurrenceKey,
          status: { [Op.in]: ["PENDING", "QUEUED"] }
        },
        order: [["id", "ASC"]]
      });
      const cadence = await getScheduleCadence(schedule.companyId);
      let delaySeconds = 0;

      logger.info(
        {
          scheduleId: schedule.id,
          kind: schedule.kind,
          plannedAt: schedule.nextRunAt,
          timezone,
          deliveries: pending.length
        },
        "Schedule occurrence queued"
      );

      // eslint-disable-next-line no-restricted-syntax
      for (const [index, delivery] of pending.entries()) {
        if (delivery.status === "PENDING") {
          await delivery.update({ status: "QUEUED", queuedAt: new Date() });
        }
        await sendScheduledMessages.add(
          "SendMessage",
          { deliveryId: delivery.id },
          {
            delay: Math.max(0, delaySeconds * 1000),
            jobId: `schedule-delivery-${delivery.id}`,
            removeOnComplete: true
          }
        );
        delaySeconds = nextCadenceDelay(delaySeconds, index + 1, cadence);
      }

      if (schedule.kind === "ONCE") {
        await schedule.update({ status: "AGENDADA", nextRunAt: null });
      } else if (schedule.kind === "BIRTHDAY") {
        await schedule.update({
          nextRunAt: nextBirthdayScan(
            schedule.sendTime,
            timezone,
            (missedRecurringDay ? localNow : localOccurrence).plus({
              minutes: 1
            })
          ),
          lastRunAt: new Date()
        });
      } else if (schedule.commemorativeDate?.active) {
        await schedule.update({
          nextRunAt: nextCommemorativeOccurrence(
            schedule.commemorativeDate,
            schedule.sendTime,
            timezone,
            localOccurrence.plus({ minutes: 1 })
          ),
          lastRunAt: new Date()
        });
      } else {
        await schedule.update({ active: false, nextRunAt: null });
      }
    }
  } catch (e) {
    logger.error(
      { message: e?.message },
      "SendScheduledMessage -> Verify: error"
    );
    throw e;
  }
}

async function handleExpireOutOfTicketMessages() {
  if (isDedicatedRuntime()) return;
  OutOfTicketMessage.destroy({
    where: {
      createdAt: {
        [Op.lt]: subDays(new Date(), 1)
      }
    }
  });
}

const updateScheduleProgress = async (
  schedule: Schedule,
  occurrenceKey: string
): Promise<void> => {
  const [sentCount, failedCount, pendingCount] = await Promise.all([
    ScheduleDelivery.count({
      where: { scheduleId: schedule.id, occurrenceKey, status: "SENT" }
    }),
    ScheduleDelivery.count({
      where: {
        scheduleId: schedule.id,
        occurrenceKey,
        status: { [Op.in]: ["ERROR", "SKIPPED"] }
      }
    }),
    ScheduleDelivery.count({
      where: {
        scheduleId: schedule.id,
        occurrenceKey,
        status: { [Op.in]: ["PENDING", "QUEUED"] }
      }
    })
  ]);
  const changes: Record<string, unknown> = {
    sentCount,
    errorCount: failedCount
  };
  if (schedule.kind === "ONCE" && pendingCount === 0) {
    changes.sentAt = new Date();
    changes.active = false;
    changes.status = failedCount ? (sentCount ? "PARCIAL" : "ERRO") : "ENVIADA";
  }
  const updated = await schedule.update(changes);
  getIO()
    .to(`company-${schedule.companyId}-mainchannel`)
    .emit(`company-${schedule.companyId}-schedule`, {
      action: "update",
      schedule: updated
    });
};

async function handleSendScheduledMessage(job) {
  handleExpireOutOfTicketMessages();
  const delivery = await ScheduleDelivery.findByPk(job.data.deliveryId, {
    include: [
      { model: Contact, as: "contact", include: ["extraInfo"] },
      {
        model: Schedule,
        as: "schedule",
        include: [
          { model: User, as: "user" },
          { model: CommemorativeDate, as: "commemorativeDate" }
        ]
      }
    ]
  });
  if (!delivery || delivery.status === "SENT") return;
  const schedule = delivery.schedule;
  if (!schedule || !runtimeOwnsCompany(schedule.companyId)) return;
  if (!delivery.contact) {
    await delivery.update({
      status: "SKIPPED",
      errorMessage: "CONTACT_REMOVED"
    });
    await updateScheduleProgress(schedule, delivery.occurrenceKey);
    return;
  }

  try {
    const whatsapp = await GetDefaultWhatsApp(schedule.companyId);
    const body = renderScheduleMessage(schedule.body, {
      contact: delivery.contact,
      currentUser: schedule.user,
      commemorativeDate: schedule.commemorativeDate,
      occurrence: delivery.scheduledAt,
      timezone: schedule.timezone
    });
    const mediaPath = schedule.mediaPath
      ? path.resolve("public", schedule.mediaPath)
      : null;
    const messages: Awaited<ReturnType<typeof SendMessage>>[] = [];
    if (mediaPath && schedule.mediaDeliveryMode === "SEPARATE") {
      messages.push(
        await SendMessage(whatsapp, { number: delivery.contact.number, body })
      );
      messages.push(
        await SendMessage(whatsapp, {
          number: delivery.contact.number,
          body: "",
          mediaPath,
          mediaName: schedule.mediaName
        })
      );
    } else {
      messages.push(
        await SendMessage(whatsapp, {
          number: delivery.contact.number,
          body,
          mediaPath: mediaPath || undefined,
          mediaName: schedule.mediaName
        })
      );
    }
    if (schedule.saveMessage) {
      // eslint-disable-next-line no-restricted-syntax
      for (const message of messages) {
        await handleMessage(
          message,
          await GetWhatsappWbot(whatsapp),
          schedule.companyId
        );
      }
    }
    await delivery.update({
      sentAt: new Date(),
      status: "SENT",
      errorMessage: null
    });
    logger.info(`Scheduled message sent to: ${delivery.contact.name}`);
  } catch (e) {
    Sentry.captureException(e);
    await delivery.update({ status: "ERROR", errorMessage: e?.message });
    logger.error(
      { message: e?.message },
      "SendScheduledMessage -> SendMessage: error"
    );
  } finally {
    await updateScheduleProgress(schedule, delivery.occurrenceKey);
  }
}

export async function sleep(seconds: number) {
  logger.info(
    `Sleep ${seconds} seconds started: ${moment().format("HH:mm:ss")}`
  );
  return new Promise(resolve => {
    setTimeout(() => {
      logger.info(
        `Sleep ${seconds} seconds completed: ${moment().format("HH:mm:ss")}`
      );
      resolve(true);
    }, parseToMilliseconds(seconds));
  });
}

async function setRatingExpired(tracking: TicketTraking, threshold: Date) {
  await tracking.update({
    expired: true
  });

  if (tracking.ratingAt < subMinutes(threshold, 5)) {
    return;
  }

  const completionMessage = getCompletionMessage(
    tracking.whatsapp.complationMessage
  );

  if (completionMessage) {
    // So envia texto, entao a conexao oficial usa o adaptador em vez da
    // sessao Baileys, que ela nao tem.
    const wbot =
      tracking.whatsapp.apiMode === "official"
        ? buildMetaWbot(tracking.whatsapp)
        : getWbot(tracking.whatsapp.id);

    await wbot.sendMessage(getJidOf(tracking.ticket), {
      text: formatBody(`\u200e${completionMessage}`, tracking.ticket)
    });
  }

  logger.debug({ tracking }, "rating timedout");
}

async function handleRatingsTimeout() {
  const openTrackingRatings = await TicketTraking.findAll({
    where: {
      rated: false,
      ...runtimeCompanyWhere(),
      expired: false,
      ratingAt: { [Op.not]: null }
    },
    include: [
      {
        model: Ticket,
        include: [
          {
            model: Contact
          },
          {
            model: User
          },
          {
            model: QueueModel,
            as: "queue"
          }
        ]
      },
      {
        model: Whatsapp
      }
    ]
  });

  const ratingThresholds = [];
  const currentTime = new Date();

  // eslint-disable-next-line no-restricted-syntax
  for await (const tracking of openTrackingRatings) {
    if (!ratingThresholds[tracking.companyId]) {
      const timeout =
        parseInt(
          await GetCompanySetting(tracking.companyId, "ratingsTimeout", "5"),
          10
        ) || 5;

      ratingThresholds[tracking.companyId] = subMinutes(currentTime, timeout);
    }
    if (tracking.ratingAt < ratingThresholds[tracking.companyId]) {
      await setRatingExpired(tracking, ratingThresholds[tracking.companyId]);
    }
  }
}

async function handleNoQueueTimeout(
  company: Company,
  timeout: number,
  action: number
) {
  logger.trace(
    {
      timeout,
      action,
      companyId: company?.id
    },
    "handleNoQueueTimeout: entering"
  );

  if (action) {
    const queue = await QueueModel.findOne({
      where: {
        companyId: company.id,
        id: action
      }
    });

    if (!queue) {
      const removed = await Setting.destroy({
        where: {
          companyId: company.id,
          key: {
            [Op.like]: "noQueueTimeout%"
          }
        }
      });
      logger.info(
        { companyId: company.id, action, removed },
        "handleNoQueueTimeout -> removed incorrect setting"
      );
      return;
    }
  }

  const where: WhereOptions<Ticket> = {
    status: "pending",
    companyId: company.id,
    queueId: null,
    updatedAt: {
      [Op.lt]: subMinutes(new Date(), timeout)
    }
  };

  where[Op.or] = [
    { isGroup: false },
    { isGroup: true, "$contact.groupMode$": "ticket" }
  ];

  const tickets = await Ticket.findAll({
    where,
    include: [{ model: Contact, as: "contact", attributes: [], required: true }]
  });

  logger.debug(
    { expiredCount: tickets.length },
    "handleNoQueueTimeout -> tickets"
  );

  const status = action ? "pending" : "closed";
  const queueId = action || null;

  // eslint-disable-next-line no-restricted-syntax
  for (const ticket of tickets) {
    logger.trace(
      { ticket: ticket.id, userId: ticket.userId, status, queueId },
      "handleNoQueueTimeout -> UpdateTicketService"
    );
    const userId = status === "pending" ? null : ticket.userId;

    await UpdateTicketService({
      ticketId: ticket.id,
      ticketData: { status, userId, queueId },
      companyId: company.id
    });
  }

  logger.trace(
    {
      timeout,
      action,
      companyId: company?.id
    },
    "handleNoQueueTimeout: exiting"
  );
}

async function handleChatbotTicketTimeout(
  company: Company,
  timeout: number,
  action: number
) {
  logger.trace(
    {
      timeout,
      action,
      companyId: company?.id
    },
    "handleChatbotTicketTimeout: entering"
  );

  if (action) {
    const queue = await QueueModel.findOne({
      where: {
        companyId: company.id,
        id: action
      }
    });

    if (!queue) {
      const removed = await Setting.destroy({
        where: {
          companyId: company.id,
          key: {
            [Op.like]: "chatbotTicketTimeout%"
          }
        }
      });
      logger.info(
        { companyId: company.id, action, removed },
        "handleChatbotTicketTimeout -> removed incorrect setting"
      );
      return;
    }
  }

  const where: WhereOptions<Ticket> = {
    status: "pending",
    companyId: company.id,
    isGroup: false,
    chatbot: true,
    updatedAt: {
      [Op.lt]: subMinutes(new Date(), timeout)
    }
  };

  if (action) {
    where.queueId = {
      [Op.or]: [{ [Op.ne]: action }, { [Op.is]: null }]
    };
  }

  const tickets = await Ticket.findAll({ where });

  logger.debug(
    { expiredCount: tickets.length },
    "handleChatbotTicketTimeout -> tickets"
  );

  const ticketData: UpdateTicketData = {
    status: action ? "pending" : "closed"
  };

  if (action) {
    ticketData.queueId = action;
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const ticket of tickets) {
    logger.trace(
      { ...ticketData },
      "handleChatbotTicketTimeout -> UpdateTicketService"
    );

    await UpdateTicketService({
      ticketId: ticket.id,
      ticketData,
      companyId: company.id
    });
  }

  logger.trace(
    {
      timeout,
      action,
      companyId: company?.id
    },
    "handleChatbotTicketTimeout: exiting"
  );
}

async function handleOpenTicketTimeout(
  company: Company,
  timeout: number,
  status: string
) {
  logger.trace(
    {
      timeout,
      status,
      companyId: company?.id
    },
    "handleOpenTicketTimeout"
  );
  const tickets = await Ticket.findAll({
    where: {
      status: "open",
      companyId: company.id,
      [Op.or]: [
        { isGroup: false },
        { isGroup: true, "$contact.groupMode$": "ticket" }
      ],
      updatedAt: {
        [Op.lt]: subMinutes(new Date(), timeout)
      }
    },
    include: [{ model: Contact, as: "contact", attributes: [], required: true }]
  });

  // eslint-disable-next-line no-restricted-syntax
  for (const ticket of tickets) {
    await UpdateTicketService({
      ticketId: ticket.id,
      ticketData: {
        status,
        queueId: ticket.queueId,
        userId: status !== "pending" ? ticket.userId : null
      },
      companyId: company.id
    });
  }
}

async function handleTicketTimeouts() {
  logger.trace("handleTicketTimeouts");
  const companies = await Company.findAll({ where: runtimeCompanyWhere("id") });

  // eslint-disable-next-line no-restricted-syntax
  for (const company of companies) {
    logger.trace({ companyId: company?.id }, "handleTicketTimeouts -> company");
    const noQueueTimeout = Number(
      await GetCompanySetting(company.id, "noQueueTimeout", "0")
    );
    if (noQueueTimeout) {
      const noQueueTimeoutAction = Number(
        await GetCompanySetting(company.id, "noQueueTimeoutAction", "0")
      );

      await handleNoQueueTimeout(
        company,
        noQueueTimeout,
        noQueueTimeoutAction || 0
      );
    }
    const openTicketTimeout = Number(
      await GetCompanySetting(company.id, "openTicketTimeout", "0")
    );
    if (openTicketTimeout) {
      const openTicketTimeoutAction = await GetCompanySetting(
        company.id,
        "openTicketTimeoutAction",
        "pending"
      );

      await handleOpenTicketTimeout(
        company,
        openTicketTimeout,
        openTicketTimeoutAction
      );
    }
    const chatbotTicketTimeout = Number(
      await GetCompanySetting(company.id, "chatbotTicketTimeout", "0")
    );
    if (chatbotTicketTimeout) {
      const chatbotTicketTimeoutAction =
        Number(
          await GetCompanySetting(company.id, "chatbotTicketTimeoutAction", "0")
        ) || 0;

      await handleChatbotTicketTimeout(
        company,
        chatbotTicketTimeout,
        chatbotTicketTimeoutAction
      );
    }
  }
}

async function handleEveryMinute(job: Job) {
  const now = Date.now();
  const delay = now - ((job.opts as { prevMillis?: number }).prevMillis || now);

  // only start jobs that are up to 10s after its scheduled time
  if (delay > 10 * 1000) {
    logger.warn(
      `handleEveryMinute: job skipped due to delay - delay: ${delay}ms`
    );
    return;
  }

  const executionId = makeRandomId(10);
  logger.trace(`handleEveryMinute: entering - executionId: ${executionId}`);
  try {
    await handleMcpAuditRetention();
    await handleRatingsTimeout();
    await handleTicketTimeouts();
    logger.trace(`handleEveryMinute: exiting - executionId: ${executionId}`);
  } catch (e) {
    logger.error(
      { message: e?.message },
      `handleEveryMinute: error received - executionId: ${executionId}`
    );
  }
}

/**
 * Ciclo dos repasses: envia o que esta pronto (incluindo o fechamento dos
 * parceiros agendados, que o proprio service filtra pelo dia do mes) e depois
 * reconcilia as transferencias que ainda estao em transito.
 */
async function handlePartnerPayouts(): Promise<void> {
  try {
    await SendPartnerPayoutsService();
  } catch (error) {
    logger.error(`[partnerPayouts] erro no envio: ${error?.message}`);
  }

  try {
    await ReconcilePartnerPayoutsService();
  } catch (error) {
    logger.error(`[partnerPayouts] erro na reconciliacao: ${error?.message}`);
  }
}

const createInvoices = new CronJob("0 * * * * *", async () => {
  const companies = await Company.findAll({
    where: { platformBilling: { [Op.ne]: "plataforma" } }
  });
  // eslint-disable-next-line no-restricted-syntax
  for (const c of companies) {
    const dueDate = new Date(c.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 20) {
      await CreateCompanyInvoiceService(c.id);
    }
  }
});

if (!isDedicatedRuntime()) createInvoices.start();

export async function startQueueProcess() {
  logger.info("Starting queue processing");

  startCampaignQueues().then(() => {
    logger.info("Campaign processing functions started");
  });
  await startProspeccaoQueue();
  await startWhatsappStatusQueue();

  scheduleMonitor.process("Verify", handleVerifySchedules);

  sendScheduledMessages.process("SendMessage", handleSendScheduledMessage);

  userMonitor.process("EveryMinute", handleEveryMinute);

  // Concorrencia 1: os envios sao espacados por causa do rate limit da API.
  if (!isDedicatedRuntime()) {
    partnerPayouts.process("Process", 1, handlePartnerPayouts);
    platformWebhooks.process("Process", 1, processPlatformWebhooks);
  }

  scheduleMonitor.add(
    "Verify",
    {},
    {
      repeat: { cron: "*/5 * * * * *" },
      removeOnComplete: true
    }
  );

  userMonitor.add(
    "EveryMinute",
    {},
    {
      repeat: { cron: "* * * * *" },
      removeOnComplete: true
    }
  );

  if (!isDedicatedRuntime()) {
    partnerPayouts.add(
      "Process",
      {},
      {
        repeat: { cron: "*/5 * * * *" },
        removeOnComplete: true
      }
    );

    platformWebhooks.add(
      "Process",
      {},
      {
        repeat: { cron: "* * * * *" },
        removeOnComplete: true
      }
    );
  }
}
