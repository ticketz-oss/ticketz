import * as Sentry from "@sentry/node";
import Queue from "bull";
import moment from "moment";
import { Op, WhereOptions } from "sequelize";
import { CronJob } from "cron";
import { subDays, subMinutes } from "date-fns";
import { MessageData, SendMessage } from "./helpers/SendMessage";
import Whatsapp from "./models/Whatsapp";
import { logger } from "./utils/logger";
import Schedule from "./models/Schedule";
import Contact from "./models/Contact";
import GetDefaultWhatsApp from "./helpers/GetDefaultWhatsApp";
import GetWhatsappWbot from "./helpers/GetWhatsappWbot";
import User from "./models/User";
import Company from "./models/Company";
import Plan from "./models/Plan";
import TicketTraking from "./models/TicketTraking";
import { GetCompanySetting } from "./helpers/CheckSettings";
import { getWbot } from "./libs/wbot";
import Ticket from "./models/Ticket";
import QueueModel from "./models/Queue";
import UpdateTicketService from "./services/TicketServices/UpdateTicketService";
import { handleMessage } from "./services/WbotServices/wbotMessageListener";
import Invoices from "./models/Invoices";
import formatBody, { mustacheFormat } from "./helpers/Mustache";
import Setting from "./models/Setting";
import { parseToMilliseconds } from "./helpers/parseToMilliseconds";
import { startCampaignQueues } from "./queues/campaign";
import OutOfTicketMessage from "./models/OutOfTicketMessages";
import { getJidOf } from "./services/WbotServices/getJidOf";

const connection = process.env.REDIS_URI || "";
const limiterMax = process.env.REDIS_OPT_LIMITER_MAX || 1;
const limiterDuration = process.env.REDIS_OPT_LIMITER_DURATION || 3000;

export const userMonitor = new Queue("UserMonitor", connection);

export const messageQueue = new Queue("MessageQueue", connection, {
  limiter: {
    max: limiterMax as number,
    duration: limiterDuration as number
  }
});

export const scheduleMonitor = new Queue("ScheduleMonitor", connection);
export const sendScheduledMessages = new Queue(
  "SendSacheduledMessages",
  connection
);

async function handleSendMessage(job) {
  try {
    const { data } = job;

    const whatsapp = await Whatsapp.findByPk(data.whatsappId);

    if (whatsapp == null) {
      throw Error("Whatsapp não identificado");
    }

    const messageData: MessageData = data.data;

    await SendMessage(whatsapp, messageData);
  } catch (e: unknown) {
    Sentry.captureException(e);
    logger.error("MessageQueue -> SendMessage: error", (e as Error).message);
    throw e;
  }
}

async function handleVerifySchedules() {
  try {
    const { count, rows: schedules } = await Schedule.findAndCountAll({
      where: {
        status: "PENDENTE",
        sentAt: null,
        sendAt: {
          [Op.gte]: moment().format("YYYY-MM-DD HH:mm:ss"),
          [Op.lte]: moment().add("30", "seconds").format("YYYY-MM-DD HH:mm:ss")
        }
      },
      include: [{ model: Contact, as: "contact" }]
    });
    if (count > 0) {
      schedules.map(async schedule => {
        await schedule.update({
          status: "AGENDADA"
        });
        sendScheduledMessages.add(
          "SendMessage",
          { schedule },
          { delay: 40000 }
        );
        logger.info(`Disparo agendado para: ${schedule.contact.name}`);
      });
    }
  } catch (e: unknown) {
    Sentry.captureException(e);
    logger.error("SendScheduledMessage -> Verify: error", (e as Error).message);
    throw e;
  }
}

async function handleExpireOutOfTicketMessages() {
  OutOfTicketMessage.destroy({
    where: {
      createdAt: {
        [Op.lt]: subDays(new Date(), 1)
      }
    }
  });
}

async function handleSendScheduledMessage(job) {
  handleExpireOutOfTicketMessages();
  const {
    data: { schedule }
  } = job;
  let scheduleRecord: Schedule | null = null;

  try {
    scheduleRecord = await Schedule.findByPk(schedule.id, {
      include: [
        { model: Contact, as: "contact" },
        { model: User, as: "user" }
      ]
    });
  } catch (e) {
    Sentry.captureException(e);
    logger.info(`Erro ao tentar consultar agendamento: ${schedule.id}`);
  }

  try {
    const whatsapp = await GetDefaultWhatsApp(schedule.companyId);

    const message = await SendMessage(whatsapp, {
      number: schedule.contact.number,
      body: mustacheFormat({
        body: schedule.body,
        contact: schedule.contact,
        currentUser: schedule.user
      })
    });

    if (schedule.saveMessage) {
      handleMessage(
        message,
        await GetWhatsappWbot(whatsapp),
        schedule.companyId
      );
    }

    await scheduleRecord?.update({
      sentAt: new Date(),
      status: "ENVIADA"
    });

    logger.info(`Mensagem agendada enviada para: ${schedule.contact.name}`);
    sendScheduledMessages.clean(15000, "completed");
  } catch (e: unknown) {
    Sentry.captureException(e);
    await scheduleRecord?.update({
      status: "ERRO"
    });
    logger.error(
      "SendScheduledMessage -> SendMessage: error",
      (e as Error).message
    );
    throw e;
  }
}

export async function sleep(seconds: number) {
  logger.info(
    `Sleep de ${seconds} segundos iniciado: ${moment().format("HH:mm:ss")}`
  );
  return new Promise(resolve => {
    setTimeout(() => {
      logger.info(
        `Sleep de ${seconds} segundos finalizado: ${moment().format(
          "HH:mm:ss"
        )}`
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

  const wbot = getWbot(tracking.whatsapp.id);

  const complationMessage =
    tracking.whatsapp.complationMessage.trim() || "Atendimento finalizado";

  await wbot.sendMessage(getJidOf(tracking.ticket), {
    text: formatBody(`\u200e${complationMessage}`, tracking.ticket)
  });

  logger.debug({ tracking }, "rating timedout");
}

async function handleRatingsTimeout() {
  const openTrackingRatings = await TicketTraking.findAll({
    where: {
      rated: false,
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

  const groupsTab =
    (await GetCompanySetting(company.id, "groupsTab", "disabled")) ===
    "enabled";

  const where: WhereOptions<Ticket> = {
    status: "pending",
    companyId: company.id,
    queueId: null,
    updatedAt: {
      [Op.lt]: subMinutes(new Date(), timeout)
    }
  };

  if (groupsTab) {
    where.isGroup = false;
  }

  const tickets = await Ticket.findAll({ where });

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
    // eslint-disable-next-line no-await-in-loop
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

  const ticketData: any = {
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
    // eslint-disable-next-line no-await-in-loop
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
      updatedAt: {
        [Op.lt]: subMinutes(new Date(), timeout)
      }
    }
  });

  // eslint-disable-next-line no-restricted-syntax
  for (const ticket of tickets) {
    // eslint-disable-next-line no-await-in-loop
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
  const companies = await Company.findAll();

  // eslint-disable-next-line no-restricted-syntax
  for (const company of companies) {
    logger.trace({ companyId: company?.id }, "handleTicketTimeouts -> company");
    const noQueueTimeout = Number(
      // eslint-disable-next-line no-await-in-loop
      await GetCompanySetting(company.id, "noQueueTimeout", "0")
    );
    if (noQueueTimeout) {
      const noQueueTimeoutAction = Number(
        // eslint-disable-next-line no-await-in-loop
        await GetCompanySetting(company.id, "noQueueTimeoutAction", "0")
      );
      // eslint-disable-next-line no-await-in-loop
      await handleNoQueueTimeout(
        company,
        noQueueTimeout,
        noQueueTimeoutAction || 0
      );
    }
    const openTicketTimeout = Number(
      // eslint-disable-next-line no-await-in-loop
      await GetCompanySetting(company.id, "openTicketTimeout", "0")
    );
    if (openTicketTimeout) {
      // eslint-disable-next-line no-await-in-loop
      const openTicketTimeoutAction = await GetCompanySetting(
        company.id,
        "openTicketTimeoutAction",
        "pending"
      );
      // eslint-disable-next-line no-await-in-loop
      await handleOpenTicketTimeout(
        company,
        openTicketTimeout,
        openTicketTimeoutAction
      );
    }
    const chatbotTicketTimeout = Number(
      // eslint-disable-next-line no-await-in-loop
      await GetCompanySetting(company.id, "chatbotTicketTimeout", "0")
    );
    if (chatbotTicketTimeout) {
      const chatbotTicketTimeoutAction =
        Number(
          // eslint-disable-next-line no-await-in-loop
          await GetCompanySetting(company.id, "chatbotTicketTimeoutAction", "0")
        ) || 0;
      // eslint-disable-next-line no-await-in-loop
      await handleChatbotTicketTimeout(
        company,
        chatbotTicketTimeout,
        chatbotTicketTimeoutAction
      );
    }
  }
}

async function handleEveryMinute() {
  logger.trace("handleEveryMinute: entering");
  try {
    await handleRatingsTimeout();
    await handleTicketTimeouts();
    logger.trace("handleEveryMinute: exiting");
  } catch (e: unknown) {
    logger.error(`handleEveryMinute: error received: ${(e as Error).message}`);
  }
}

const createInvoices = new CronJob("0 * * * * *", async () => {
  const companies = await Company.findAll();
  companies.map(async c => {
    const dueDate = new Date(c.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 20) {
      const plan = await Plan.findByPk(c.planId);

      const invoiceCount = await Invoices.count({
        where: {
          companyId: c.id,
          dueDate: {
            [Op.like]: `${dueDate.toISOString().split("T")[0]}%`
          }
        }
      });

      if (invoiceCount === 0) {
        await Invoices.destroy({
          where: {
            companyId: c.id,
            status: "open"
          }
        });
        await Invoices.create({
          detail: plan.name,
          status: "open",
          value: plan.value,
          dueDate: dueDate.toISOString().split("T")[0],
          companyId: c.id
        });
      }
    }
  });
});

createInvoices.start();

export async function startQueueProcess() {
  logger.info("Iniciando processamento de filas");

  startCampaignQueues().then(() => {
    logger.info("Campaign processing functions started");
  });

  messageQueue.process("SendMessage", handleSendMessage);

  scheduleMonitor.process("Verify", handleVerifySchedules);

  sendScheduledMessages.process("SendMessage", handleSendScheduledMessage);

  userMonitor.process("EveryMinute", handleEveryMinute);

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
}
