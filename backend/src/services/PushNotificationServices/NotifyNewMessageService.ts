import { Op } from "sequelize";
import { isWebPushConfigured } from "../../config/webPush";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import Contact from "../../models/Contact";
import GroupQueue from "../../models/GroupQueue";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import UserQueue from "../../models/UserQueue";
import { logger } from "../../utils/logger";
import SendPushNotificationService from "./SendPushNotificationService";

const MAX_BODY_LENGTH = 180;

const listCompanyAdminIds = async (companyId: number): Promise<number[]> => {
  const admins = await User.findAll({
    where: { companyId, profile: "admin" },
    attributes: ["id"]
  });
  return admins.map(admin => admin.id);
};

const listQueueUserIds = async (
  companyId: number,
  queueIds: number[]
): Promise<number[]> => {
  if (!queueIds.length) {
    return [];
  }
  const links = await UserQueue.findAll({
    where: { queueId: { [Op.in]: queueIds } },
    attributes: ["userId"]
  });
  if (!links.length) {
    return [];
  }
  // UserQueue não guarda companyId, então o filtro por empresa vem do User.
  const users = await User.findAll({
    where: {
      companyId,
      id: { [Op.in]: links.map(link => link.userId) }
    },
    attributes: ["id"]
  });
  return users.map(user => user.id);
};

// Espelha o filtro que o NotificationsPopOver aplica no frontend: atribuído ->
// só o responsável; sem responsável -> a fila; sem responsável e sem fila ->
// os admins. Manter os dois lados iguais evita push de ticket que o usuário
// nem veria na tela.
const resolveRecipients = async (message: Message): Promise<number[]> => {
  const { ticket } = message;

  if (ticket.isGroup && ticket.contact?.groupMode !== "ticket") {
    const groupQueues = await GroupQueue.findAll({
      where: { groupContactId: ticket.contactId },
      attributes: ["queueId"]
    });
    const queueUserIds = await listQueueUserIds(
      message.companyId,
      groupQueues.map(item => item.queueId)
    );
    const adminIds = await listCompanyAdminIds(message.companyId);
    return [...new Set([...queueUserIds, ...adminIds])];
  }

  if (ticket.userId) {
    return [ticket.userId];
  }

  if (ticket.queueId) {
    return listQueueUserIds(message.companyId, [ticket.queueId]);
  }

  return listCompanyAdminIds(message.companyId);
};

const formatPhoneNumber = (number: string): string => {
  const digits = (number || "").replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) {
    return `(${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 12 && digits.startsWith("55")) {
    return `(${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  return digits ? `+${digits}` : "";
};

// Contato que nunca definiu um pushname fica com o identificador do WhatsApp
// (um LID de 15 dígitos) no lugar do nome. Mostrar o telefone formatado é bem
// mais útil na notificação do que esse número interno.
const resolveDisplayName = (contact: Contact): string => {
  const name = contact?.name?.trim();
  if (name && !/^\d+$/.test(name)) {
    return name;
  }
  return formatPhoneNumber(contact?.number) || name || "Contato";
};

// Sem essa linha a notificação não diz se o atendimento já tem dono, que é a
// informação que decide se alguém precisa agir agora.
const resolveStatusLabel = (ticket: Ticket): string => {
  if (ticket.status === "open") {
    return ticket.user?.name
      ? `Em atendimento · ${ticket.user.name}`
      : "Em atendimento";
  }
  if (ticket.status === "pending") {
    return ticket.queue?.name
      ? `Aguardando · ${ticket.queue.name}`
      : "Aguardando";
  }
  return ticket.queue?.name || "";
};

const buildBody = (message: Message): string => {
  if (message.body?.startsWith('{"ticketzvCard"')) {
    return "🪪 Contato";
  }
  if (!message.body && message.mediaType) {
    return "📎 Anexo";
  }
  const body = message.body || "";
  return body.length > MAX_BODY_LENGTH
    ? `${body.slice(0, MAX_BODY_LENGTH)}…`
    : body;
};

const NotifyNewMessageService = async (message: Message): Promise<void> => {
  if (!isWebPushConfigured()) {
    return;
  }

  // Mensagem enviada pelo próprio atendente ou já lida não gera notificação,
  // igual ao que o frontend faz antes de chamar handleNotifications.
  if (message.fromMe || message.read) {
    return;
  }

  const { ticket } = message;
  if (!ticket) {
    return;
  }

  try {
    if (ticket.isGroup) {
      const soundGroupNotifications = await GetCompanySetting(
        message.companyId,
        "soundGroupNotifications",
        "disabled"
      );
      if (soundGroupNotifications !== "enabled") {
        return;
      }
    }

    // O push vai para todos os destinatários, inclusive quem está com o
    // sistema aberto. Filtrar por sessão de socket ativa parecia evitar alerta
    // duplicado, mas o iOS suspende o PWA sem disparar disconnect: a sessão
    // ficava presa em active=true e bloqueava todo push seguinte. Quem está
    // com o app aberto suprime a notificação local no próprio dispositivo.
    const userIds = await resolveRecipients(message);
    if (!userIds.length) {
      return;
    }

    const statusLabel = resolveStatusLabel(ticket);
    const text = buildBody(message);

    await SendPushNotificationService({
      userIds,
      companyId: message.companyId,
      payload: {
        title: resolveDisplayName(ticket.contact),
        body: statusLabel ? `${statusLabel}\n${text}` : text,
        icon: ticket.contact?.profilePicUrl || undefined,
        tag: String(ticket.id),
        url: `/tickets/${ticket.uuid}`
      }
    });
  } catch (error) {
    // Notificação é acessório: uma falha aqui não pode derrubar a criação da
    // mensagem, que já foi persistida e emitida no websocket.
    logger.warn(
      { ticket: message.ticketId, error: error?.message },
      "falha ao notificar nova mensagem por push"
    );
  }
};

export default NotifyNewMessageService;
