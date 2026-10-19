import { Op } from "sequelize";
import sequelize from "../../database";
import { getIO } from "../../libs/socket";
import Ticket from "../../models/Ticket";
import TicketTraking from "../../models/TicketTraking";
import VoiceCall from "../../models/VoiceCall";
import { logger } from "../../utils/logger";
import CreateMessageService from "../MessageServices/CreateMessageService";
import { incrementCounter } from "../CounterServices/IncrementCounter";
import ShowTicketService from "../TicketServices/ShowTicketService";
import { resolveVoiceContact } from "./VoiceContactService";

const durationLabel = (seconds: number): string => {
  const safe = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remainder = safe % 60;
  return hours
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(remainder).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(
        2,
        "0"
      )}`;
};

const voiceMessageId = (call: VoiceCall, suffix: string): string =>
  `voice-${call.id}-${suffix}`;

const emitVoiceTicketUpdate = (ticket: Ticket, oldStatus?: string): void => {
  let emitter = getIO()
    .to(ticket.id.toString())
    .to(`user-${ticket.userId}`)
    .to(`queue-${ticket.queueId}-notification`)
    .to(`queue-${ticket.queueId}-${ticket.status}`)
    .to(`company-${ticket.companyId}-notification`)
    .to(`company-${ticket.companyId}-${ticket.status}`);
  if (oldStatus) {
    emitter = emitter
      .to(`company-${ticket.companyId}-${oldStatus}`)
      .to(`queue-${ticket.queueId}-${oldStatus}`);
  }
  emitter.emit(`company-${ticket.companyId}-ticket`, {
    action: "update",
    ticket
  });
};

export const startVoiceHistory = async (
  call: VoiceCall
): Promise<VoiceCall> => {
  let created = false;
  const lockedCall = await sequelize.transaction(async transaction => {
    const current = await VoiceCall.findByPk(call.id, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!current || !current.contactId || !current.acceptedAt) {
      return current || call;
    }
    if (current.ticketId) return current;

    const ticket = await Ticket.create(
      {
        contactId: current.contactId,
        companyId: current.companyId,
        queueId: current.queueId,
        whatsappId: current.whatsappId,
        userId: current.userId,
        status: "open",
        channel: "voice",
        unreadMessages: 0,
        lastMessage: "Ligação",
        isGroup: false
      },
      { transaction }
    );
    const startedAt = current.acceptedAt;
    await TicketTraking.create(
      {
        ticketId: ticket.id,
        companyId: current.companyId,
        whatsappId: current.whatsappId,
        userId: current.userId,
        queuedAt: current.startedAt,
        startedAt
      },
      { transaction }
    );
    await current.update({ ticketId: ticket.id }, { transaction });
    created = true;
    return current;
  });

  if (!lockedCall.contactId || !lockedCall.ticketId) return lockedCall;
  await CreateMessageService({
    companyId: lockedCall.companyId,
    messageData: {
      id: voiceMessageId(lockedCall, "summary"),
      ticketId: lockedCall.ticketId,
      contactId: lockedCall.contactId,
      queueId: lockedCall.queueId,
      channel: "voice",
      fromMe: true,
      read: true,
      ack: 2,
      mediaType: "voice_call",
      body: "📞 Ligação em andamento"
    }
  });
  if (created) {
    await incrementCounter(lockedCall.companyId, "ticket-create");
    await incrementCounter(lockedCall.companyId, "ticket-accept");
  }
  return lockedCall;
};

export const finishVoiceHistory = async (call: VoiceCall): Promise<void> => {
  if (!call.ticketId) return;
  const ticket = await Ticket.findOne({
    where: { id: call.ticketId, companyId: call.companyId }
  });
  if (!ticket) return;
  const duration = durationLabel(call.durationSeconds);
  const stateLabel = call.state === "ended" ? "finalizada" : "interrompida";
  const body = `📞 Ligação ${stateLabel} • ${duration}`;
  await ticket.update({ lastMessage: `Ligação • ${duration}` });
  await CreateMessageService({
    companyId: call.companyId,
    messageData: {
      id: voiceMessageId(call, "summary"),
      ticketId: ticket.id,
      contactId: call.contactId,
      queueId: call.queueId,
      channel: "voice",
      fromMe: true,
      read: true,
      ack: 2,
      mediaType: "voice_call",
      body
    }
  });

  const endedAt = call.endedAt || new Date();
  const oldStatus = ticket.status;
  let closedNow = false;
  await sequelize.transaction(async transaction => {
    const lockedTicket = await Ticket.findByPk(ticket.id, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!lockedTicket || lockedTicket.status === "closed") return;
    const tracking = await TicketTraking.findOne({
      where: { ticketId: ticket.id, finishedAt: null },
      order: [["id", "DESC"]],
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (tracking) {
      await tracking.update(
        {
          finishedAt: endedAt,
          userId: call.userId
        },
        { transaction }
      );
    }
    await lockedTicket.update({ status: "closed" }, { transaction });
    closedNow = true;
  });
  if (!closedNow) return;
  await incrementCounter(call.companyId, "ticket-close");
  const hydrated = await ShowTicketService(ticket.id, call.companyId);
  getIO()
    .to(`company-${call.companyId}-${oldStatus}`)
    .to(`queue-${ticket.queueId}-${oldStatus}`)
    .to(`user-${ticket.userId}`)
    .emit(`company-${call.companyId}-ticket`, {
      action: "removeFromList",
      ticketId: ticket.id
    });
  emitVoiceTicketUpdate(hydrated, oldStatus);
};

export const recoverVoiceHistories = async (): Promise<void> => {
  const calls = await VoiceCall.findAll({
    where: {
      acceptedAt: { [Op.not]: null },
      state: { [Op.in]: ["ended", "failed", "rejected", "missed"] }
    },
    include: [{ model: Ticket, as: "ticket", required: false }],
    order: [["id", "DESC"]],
    limit: 500
  });
  await calls.reduce(async (previous, call) => {
    await previous;
    try {
      if (call.ticketId && call.ticket?.status === "closed") return;
      if (!call.contactId && call.number) {
        const { contact } = await resolveVoiceContact(
          call.companyId,
          call.number
        );
        await call.update({ contactId: contact.id });
      }
      const withTicket = await startVoiceHistory(call);
      if (withTicket.ticketId) await finishVoiceHistory(withTicket);
    } catch (error) {
      logger.error(
        { error, voiceCallId: call.id },
        "Unable to recover voice ticket history"
      );
    }
  }, Promise.resolve());
};

export { durationLabel, voiceMessageId };
