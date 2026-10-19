import Queue, { Job } from "bull";
import { DateTime } from "luxon";
import { Op } from "sequelize";
import { runtimeQueueOptions } from "../helpers/tenantRuntime";
import Company from "../models/Company";
import Message from "../models/Message";
import ProspeccaoAutomation from "../models/ProspeccaoAutomation";
import ProspeccaoExecution from "../models/ProspeccaoExecution";
import ProspeccaoLead from "../models/ProspeccaoLead";
import ProspeccaoSchedule from "../models/ProspeccaoSchedule";
import Tag from "../models/Tag";
import Ticket from "../models/Ticket";
import TicketTag from "../models/TicketTag";
import Whatsapp from "../models/Whatsapp";
import AbrirConversaDoLeadService from "../services/ProspeccaoServices/AbrirConversaDoLeadService";
import {
  criarBusca,
  listarLeads,
  statusDaBusca
} from "../services/ProspeccaoServices/ProspeccaoApi";
import SyncProspeccaoLeadsService from "../services/ProspeccaoServices/SyncProspeccaoLeadsService";
import UpdateTicketService from "../services/TicketServices/UpdateTicketService";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
import { logger } from "../utils/logger";

/* eslint-disable no-restricted-syntax */

const queue = new Queue(
  "ProspeccaoAutomation",
  process.env.REDIS_URI || "",
  runtimeQueueOptions()
);
const TERMINAL = ["ok", "failed", "timeout"];

const randomDelay = (config: ProspeccaoAutomation): number =>
  Math.floor(
    config.minDelaySeconds +
      Math.random() * (config.maxDelaySeconds - config.minDelaySeconds + 1)
  );

const isTestTenant = (company?: Company): boolean => company?.slug === "teste";

const ensureSalesAttemptTag = async (
  companyId: number,
  ticketId: number
): Promise<void> => {
  const [tag] = await Tag.findOrCreate({
    where: {
      companyId,
      name: { [Op.iLike]: "Tentativa de venda" }
    },
    defaults: {
      companyId,
      name: "Tentativa de venda",
      color: "#E91E63",
      kanban: 0
    }
  });
  await TicketTag.findOrCreate({ where: { ticketId, tagId: tag.id } });
};

const finalizeAutomaticSend = async (
  lead: ProspeccaoLead,
  ticketId: number,
  sentAt: Date
): Promise<void> => {
  await lead.update({
    ticketId,
    deliveryStatus: "SENT",
    autoSentAt: sentAt,
    closeDueAt: DateTime.fromJSDate(sentAt).plus({ hours: 120 }).toJSDate(),
    deliveryError: null
  });
  try {
    await ensureSalesAttemptTag(lead.companyId, ticketId);
  } catch (error) {
    // O envio ja foi confirmado. A tag e reparada pelo monitor sem reenviar.
    logger.error(
      { error, leadId: lead.id, ticketId },
      "Falha ao associar tag da prospeccao automatica"
    );
  }
};

const startDueSchedules = async (): Promise<void> => {
  const automations = await ProspeccaoAutomation.findAll({
    where: { enabled: true },
    include: [Company, ProspeccaoSchedule]
  });
  for (const automation of automations) {
    if (!isTestTenant(automation.company)) continue;
    const now = DateTime.now().setZone(
      automation.company.timezone || "America/Rio_Branco"
    );
    const localDate = now.toISODate();
    const currentTime = now.toFormat("HH:mm");
    const enabledAt = automation.enabledAt
      ? DateTime.fromJSDate(automation.enabledAt).setZone(now.zoneName)
      : null;
    const dayStart = now.startOf("day").toUTC().toJSDate();
    const sentToday = await ProspeccaoLead.count({
      where: {
        companyId: automation.companyId,
        origin: "AUTO",
        autoSentAt: { [Op.gte]: dayStart }
      }
    });
    const backlog = await ProspeccaoLead.count({
      where: {
        companyId: automation.companyId,
        deliveryStatus: { [Op.in]: ["QUEUED", "PAUSED", "SENDING"] }
      }
    });
    if (sentToday + backlog >= automation.dailyLimit) continue;
    for (const schedule of automation.schedules || []) {
      if (schedule.time > currentTime) continue;
      const scheduleAt = DateTime.fromISO(`${localDate}T${schedule.time}`, {
        zone: now.zoneName
      });
      if (
        enabledAt?.toISODate() === localDate &&
        scheduleAt.toMillis() < enabledAt.toMillis()
      )
        continue;
      const [execution, created] = await ProspeccaoExecution.findOrCreate({
        where: { scheduleId: schedule.id, localDate },
        defaults: { companyId: automation.companyId, status: "DUE" } as never
      });
      if (!created) continue;
      try {
        const city = [
          schedule.cityName,
          schedule.stateName,
          schedule.countryName
        ]
          .filter(Boolean)
          .join(", ");
        const jobId = await criarBusca({
          nicho: schedule.nicho,
          cidade: city,
          maxResultados: schedule.maxResults,
          somenteComWhatsapp: schedule.onlyWhatsapp,
          tom: schedule.tone,
          produto: schedule.product
        });
        await execution.update({
          status: "RUNNING",
          jobId,
          startedAt: new Date()
        });
      } catch (error) {
        await execution.update({
          status: "FAILED",
          errorMessage: error?.message,
          finishedAt: new Date()
        });
      }
    }
  }
};

const pollExecutions = async (): Promise<void> => {
  const executions = await ProspeccaoExecution.findAll({
    where: { status: { [Op.in]: ["RUNNING", "ENRICHING"] } },
    order: [["createdAt", "ASC"]],
    limit: 30
  });
  for (const execution of executions) {
    const company = await Company.findByPk(execution.companyId);
    if (!isTestTenant(company)) continue;
    try {
      const externalStatus = await statusDaBusca(execution.jobId);
      if (!TERMINAL.includes(externalStatus)) continue;
      if (externalStatus !== "ok") {
        await execution.update({
          status: "FAILED",
          errorMessage: externalStatus,
          finishedAt: new Date()
        });
        continue;
      }
      const leads = await listarLeads(execution.jobId);
      const pending = leads.filter(item => item.status === "pendente").length;
      if (!leads.length || pending) {
        await execution.update({
          status: "ENRICHING",
          totalLeads: leads.length
        });
        continue;
      }
      const result = await SyncProspeccaoLeadsService({
        companyId: execution.companyId,
        jobId: execution.jobId,
        leads,
        executionId: execution.id,
        origin: "AUTO"
      });
      await execution.update({
        status: "COMPLETED",
        totalLeads: leads.length,
        newLeads: result.novos,
        finishedAt: new Date()
      });
    } catch (error) {
      logger.error(
        { error, executionId: execution.id },
        "Falha no poll da prospeccao automatica"
      );
    }
  }
};

const monitorRepliesAndClosures = async (): Promise<void> => {
  const leads = await ProspeccaoLead.findAll({
    where: { deliveryStatus: "SENT", ticketId: { [Op.ne]: null } },
    order: [["autoSentAt", "ASC"]],
    limit: 200
  });
  for (const lead of leads) {
    const company = await Company.findByPk(lead.companyId);
    if (!isTestTenant(company)) continue;
    const inbound = await Message.findOne({
      where: {
        ticketId: lead.ticketId,
        fromMe: false,
        createdAt: { [Op.gt]: lead.autoSentAt }
      }
    });
    if (inbound) {
      await lead.update({
        deliveryStatus: "REPLIED",
        repliedAt: inbound.createdAt
      });
      continue;
    }
    try {
      await ensureSalesAttemptTag(lead.companyId, lead.ticketId);
    } catch (error) {
      logger.error(
        { error, leadId: lead.id, ticketId: lead.ticketId },
        "Falha ao reparar tag da prospeccao automatica"
      );
    }
    if (!lead.closeDueAt || lead.closeDueAt > new Date()) continue;
    const ticket = await Ticket.findOne({
      where: { id: lead.ticketId, companyId: lead.companyId }
    });
    if (ticket && ["open", "pending"].includes(ticket.status)) {
      await UpdateTicketService({
        ticketData: { status: "closed", justClose: true },
        ticketId: ticket.id,
        companyId: lead.companyId
      });
    }
    await lead.update({ deliveryStatus: "CLOSED_NO_REPLY" });
  }
};

const enqueueNext = async (): Promise<void> => {
  await ProspeccaoLead.update(
    { deliveryStatus: "QUEUED" },
    {
      where: {
        deliveryStatus: "SENDING",
        updatedAt: { [Op.lt]: DateTime.now().minus({ minutes: 10 }).toJSDate() }
      }
    }
  );
  const automations = await ProspeccaoAutomation.findAll({
    where: { enabled: true },
    include: [Company, Whatsapp]
  });
  for (const automation of automations) {
    if (
      !isTestTenant(automation.company) ||
      automation.whatsapp?.status !== "CONNECTED"
    )
      continue;
    const timezone = automation.company.timezone || "America/Rio_Branco";
    const today = DateTime.now().setZone(timezone).startOf("day");
    const sent = await ProspeccaoLead.count({
      where: {
        companyId: automation.companyId,
        origin: "AUTO",
        autoSentAt: { [Op.gte]: today.toUTC().toJSDate() }
      }
    });
    if (sent >= automation.dailyLimit) continue;
    const sending = await ProspeccaoLead.count({
      where: {
        companyId: automation.companyId,
        deliveryStatus: "SENDING"
      }
    });
    if (sending > 0) continue;
    const scheduled = await ProspeccaoLead.findOne({
      where: {
        companyId: automation.companyId,
        deliveryStatus: "QUEUED",
        status: "ok",
        rascunho: { [Op.ne]: null },
        scheduledSendAt: { [Op.ne]: null }
      },
      order: [["scheduledSendAt", "ASC"]]
    });
    if (scheduled) {
      if (scheduled.scheduledSendAt > new Date()) continue;
      await scheduled.update({ deliveryStatus: "SENDING" });
      try {
        await queue.add(
          "SendLead",
          { leadId: scheduled.id },
          {
            jobId: `prospeccao-send-${scheduled.id}-${scheduled.sendAttempts}`,
            removeOnComplete: true,
            removeOnFail: true
          }
        );
      } catch (error) {
        await scheduled.update({
          deliveryStatus: "QUEUED",
          deliveryError: error?.message || "Falha ao enfileirar envio"
        });
        throw error;
      }
      continue;
    }
    const lead = await ProspeccaoLead.findOne({
      where: {
        companyId: automation.companyId,
        deliveryStatus: "QUEUED",
        status: "ok",
        rascunho: { [Op.ne]: null },
        scheduledSendAt: null
      },
      order: [["createdAt", "ASC"]]
    });
    if (!lead) continue;
    await lead.update({
      scheduledSendAt: DateTime.now()
        .plus({ seconds: randomDelay(automation) })
        .toJSDate()
    });
  }
};

const sendLead = async (job: Job<{ leadId: number }>): Promise<void> => {
  const lead = await ProspeccaoLead.findByPk(job.data.leadId);
  if (!lead || lead.deliveryStatus !== "SENDING") return;
  const automation = await ProspeccaoAutomation.findOne({
    where: { companyId: lead.companyId },
    include: [Company, Whatsapp]
  });
  if (!automation?.enabled || !isTestTenant(automation.company)) {
    await lead.update({ deliveryStatus: "PAUSED", scheduledSendAt: null });
    return;
  }
  try {
    const previous = lead.contactId
      ? await Message.findOne({
          where: { contactId: lead.contactId, fromMe: true }
        })
      : null;
    if (previous) {
      const isRecoveredAutomaticSend =
        previous.ticketId === lead.ticketId &&
        previous.body?.trim() === lead.rascunho?.trim();
      if (isRecoveredAutomaticSend) {
        await finalizeAutomaticSend(
          lead,
          previous.ticketId,
          previous.createdAt || new Date()
        );
      } else {
        await lead.update({ deliveryStatus: "SENT", deliveryError: null });
      }
      return;
    }
    const opened = await AbrirConversaDoLeadService({
      leadId: lead.id,
      companyId: lead.companyId,
      userId: automation.userId,
      whatsappId: automation.whatsappId,
      rascunho: lead.rascunho
    });
    const ticket = await Ticket.findByPk(opened.ticketId, {
      include: ["contact"]
    });
    if (!ticket) throw new Error("Ticket nao encontrado");
    await SendWhatsAppMessage({
      body: lead.rascunho,
      ticket,
      userId: automation.userId
    });
    await finalizeAutomaticSend(lead, ticket.id, new Date());
  } catch (error) {
    const attempts = lead.sendAttempts + 1;
    await lead.update({
      sendAttempts: attempts,
      deliveryStatus: attempts >= 3 ? "FAILED" : "QUEUED",
      scheduledSendAt:
        attempts >= 3 ? null : DateTime.now().plus({ minutes: 5 }).toJSDate(),
      deliveryError: error?.message || "Falha no envio"
    });
  }
};

const monitor = async (): Promise<void> => {
  await monitorRepliesAndClosures();
  await startDueSchedules();
  await pollExecutions();
  await enqueueNext();
};

export const startProspeccaoQueue = async (): Promise<void> => {
  queue.process("Monitor", 1, monitor);
  queue.process("SendLead", 1, sendLead);
  await queue.add(
    "Monitor",
    {},
    {
      repeat: { cron: "* * * * *" },
      jobId: "prospeccao-monitor",
      removeOnComplete: true
    }
  );
};
