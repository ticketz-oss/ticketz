import { Op } from "sequelize";
import Contact from "../../models/Contact";
import Queue from "../../models/Queue";
import Ticket from "../../models/Ticket";
import TicketTraking from "../../models/TicketTraking";
import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import formatBody from "../../helpers/Mustache";
import { logger } from "../../utils/logger";
import VerifyCurrentSchedule from "../CompanyService/VerifyCurrentSchedule";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import { _t } from "../TranslationServices/i18nService";
import {
  handleChartbot,
  handleRating,
  quickMessage,
  verifyMessage,
  verifyQueue
} from "../WbotServices/wbotMessageListener";
import { getJidOf } from "../WbotServices/getJidOf";
import { buildMetaWbot, metaInboundStub } from "./MetaWbotAdapter";

interface Request {
  connection: Whatsapp;
  ticket: Ticket;
  contact: Contact;
  body: string;
  justCreated: boolean;
}

// Mesma checagem usada nos tres pontos do fluxo Baileys.
const isOutOfHours = async (
  companyId: number,
  queueId?: number
): Promise<boolean> => {
  const schedule = await VerifyCurrentSchedule(companyId, queueId);
  return !!schedule && schedule.inActivity === false;
};

// Precisa rodar ANTES de criar/reabrir o ticket: a busca exige ticket fechado,
// e a fabrica de ticket reabre o fechado ao receber a mensagem. Sem isso o
// TicketTraking nunca marca rated e o relatorio de satisfacao fica vazio.
// Devolve true quando a mensagem era a resposta da avaliacao e ja foi tratada.
export const captureMetaRating = async (
  connection: Whatsapp,
  contact: Contact,
  body: string
): Promise<boolean> => {
  const enabled = await GetCompanySetting(
    connection.companyId,
    "userRating",
    "disabled"
  );

  if (enabled !== "enabled") return false;

  const tracking = await TicketTraking.findOne({
    where: {
      whatsappId: connection.id,
      rated: false,
      expired: false,
      ratingAt: { [Op.not]: null }
    },
    include: [
      {
        model: Ticket,
        where: { status: "closed", contactId: contact.id },
        include: [
          { model: Contact, as: "contact" },
          { model: User, as: "user" },
          { model: Queue, as: "queue" }
        ]
      }
    ]
  });

  if (!tracking?.ticket) return false;

  const wbot = buildMetaWbot(connection);
  const rate = Number(body);

  if (body.trim() && Number.isFinite(rate)) {
    await handleRating(rate, tracking.ticket, tracking, wbot);
    return true;
  }

  if (body.trim() === "!") {
    await tracking.update({ ratingAt: null });
    await UpdateTicketService({
      ticketData: { status: "open", userId: tracking.userId },
      ticketId: tracking.ticket.id,
      companyId: connection.companyId
    });
    await quickMessage(
      wbot,
      tracking.ticket,
      _t("Service reopened", tracking.ticket),
      true
    );
    return true;
  }

  await tracking.update({ expired: true });
  await quickMessage(
    wbot,
    tracking.ticket,
    _t("Rating Cancelled", tracking.ticket)
  );

  // Mensagem longa nao era resposta de avaliacao: segue o fluxo normal.
  return body.length < 10;
};

// Roda o que o fluxo Baileys faz em volta de uma mensagem recebida: avaliacao,
// fora de horario, menu de fila, saudacao e chatbot. Nada disso existia no
// caminho oficial, entao o cliente nao recebia nem saudacao nem
// menu, e a nota de avaliacao virava mensagem comum.
const HandleMetaInboundFlowService = async ({
  connection,
  ticket,
  contact,
  body,
  justCreated
}: Request): Promise<void> => {
  const companyId = connection.companyId;

  if (ticket.isGroup || contact.disableBot) return;

  // queues so vem carregado por aqui; o webhook resolve a conexao com um
  // findOne cru.
  const whatsapp = await ShowWhatsAppService(connection.id);
  const wbot = buildMetaWbot(connection);
  const msg = metaInboundStub(ticket, body);

  const scheduleType = await GetCompanySetting(companyId, "scheduleType", "");
  const outOfHoursAction = await GetCompanySetting(
    companyId,
    "outOfHoursAction",
    "pending"
  );

  const online = ticket.status === "open" && !!ticket.userId;

  if (scheduleType && !online) {
    const queueLevel = scheduleType === "queue" && !!ticket.queueId;

    if (
      (scheduleType === "company" || queueLevel) &&
      (await isOutOfHours(companyId, queueLevel ? ticket.queueId : undefined))
    ) {
      const fallback = _t("We are out of office hours right now", ticket);
      const text =
        (queueLevel ? ticket.queue?.outOfHoursMessage?.trim() : null) ||
        whatsapp.outOfHoursMessage?.trim() ||
        fallback;

      const sent = await wbot.sendMessage(getJidOf(ticket), {
        text: formatBody(text, ticket)
      });
      await verifyMessage(sent, ticket, ticket.contact);
      await UpdateTicketService({
        ticketData: { chatbot: false, status: outOfHoursAction },
        ticketId: ticket.id,
        companyId,
        dontRunChatbot: true
      });
      return;
    }
  }

  const hadQueueBeforeThisMessage = !!ticket.queueId;

  if (!ticket.queue && !ticket.userId && whatsapp.queues?.length >= 1) {
    await verifyQueue(wbot, msg, ticket, contact);
  }

  await ticket.reload();

  // Saudacao da conexao so existe quando nao ha fila nenhuma; com filas ela ja
  // sai dentro do menu.
  if (justCreated && !whatsapp.queues?.length && !ticket.userId) {
    const greeting = whatsapp.greetingMessage?.trim();

    if (greeting) {
      const sent = await wbot.sendMessage(getJidOf(ticket), {
        text: formatBody(greeting, ticket)
      });
      await verifyMessage(sent, ticket, ticket.contact);
      return;
    }
  }

  if (ticket.queue && ticket.chatbot) {
    // Se esta mesma resposta acabou de escolher a fila, ela nao pode ser
    // reaproveitada como resposta do primeiro nivel dentro da fila. Antes o
    // numero "1" podia escolher a fila e imediatamente atravessar outro bloco.
    await handleChartbot(ticket, msg, wbot, !hadQueueBeforeThisMessage);
  }
};

export default async (request: Request): Promise<void> => {
  try {
    await HandleMetaInboundFlowService(request);
  } catch (error) {
    // O fluxo e complementar: se ele falhar, a mensagem recebida ja esta
    // gravada e o atendimento continua possivel na mao.
    logger.error(
      { error, ticketId: request.ticket.id },
      "Meta inbound flow failed"
    );
  }
};
