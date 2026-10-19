import { checkCompanyCompliant } from "../../helpers/CheckCompanyCompliant";
import { getIO } from "../../libs/socket";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import OldMessage from "../../models/OldMessage";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import GroupQueue from "../../models/GroupQueue";
import { incrementGroupUnread } from "../WhatsappGroupServices/GroupUnreadService";
import { emitContact } from "../ContactServices/CreateOrUpdateContactService";
import NotifyNewMessageService from "../PushNotificationServices/NotifyNewMessageService";

interface MessageData {
  id: string;
  ticketId: number;
  body: string;
  contactId?: number;
  remoteJid?: string;
  participant?: string;
  dataJson?: string;
  quotedMsgId?: string;
  createdAt?: Date;
  fromMe?: boolean;
  read?: boolean;
  mediaType?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  ack?: number;
  queueId?: number;
  channel?: string;
  userId?: number;
}
interface Request {
  messageData: MessageData;
  companyId: number;
  skipWebsocket?: boolean;
}

export const websocketCreateMessage = async (message: Message) => {
  const io = getIO();
  const payload = {
    action: "create",
    message,
    ticket: message.ticket,
    contact: message.ticket.contact
  };
  if (
    message.ticket.isGroup &&
    message.ticket.contact?.groupMode !== "ticket"
  ) {
    const queues = await GroupQueue.findAll({
      where: { groupContactId: message.ticket.contactId },
      attributes: ["queueId"]
    });
    let recipients = io
      .to(message.ticketId.toString())
      .to(`company-${message.companyId}-admin`);
    queues.forEach(item => {
      recipients = recipients.to(`queue-${item.queueId}-notification`);
    });
    recipients.emit(`company-${message.companyId}-appMessage`, payload);
  } else {
    io.to(message.ticketId.toString())
      .to(`company-${message.companyId}-${message.ticket.status}`)
      .to(`company-${message.companyId}-notification`)
      .to(`queue-${message.ticket.queueId}-${message.ticket.status}`)
      .to(`queue-${message.ticket.queueId}-notification`)
      .emit(`company-${message.companyId}-appMessage`, payload);
  }

  // O push vai depois do emit: quem está com o app aberto já foi notificado
  // pelo websocket, e o push atende justamente quem está com o app fechado.
  await NotifyNewMessageService(message);
};

const CreateMessageService = async ({
  messageData,
  companyId,
  skipWebsocket
}: Request): Promise<Message> => {
  const existed = await Message.count({
    where: { id: messageData.id, ticketId: messageData.ticketId }
  });
  await Message.upsert({ ...messageData, companyId });

  const message = await Message.findOne({
    where: {
      id: messageData.id,
      ticketId: messageData.ticketId
    },
    include: [
      "contact",
      {
        model: Ticket,
        as: "ticket",
        include: [
          {
            model: Contact,
            as: "contact",
            include: ["tags", "extraInfo"]
          },
          "queue",
          "tags",
          "user",
          {
            model: Whatsapp,
            as: "whatsapp",
            attributes: ["id", "name", "apiMode"]
          }
        ]
      },
      {
        model: Message,
        as: "quotedMsg",
        include: ["contact"],
        where: {
          companyId
        },
        required: false
      },
      {
        model: OldMessage,
        as: "oldMessages",
        where: {
          ticketId: messageData.ticketId
        },
        required: false
      }
    ]
  });

  if (!message) {
    throw new Error("ERR_CREATING_MESSAGE");
  }

  await message.ticket.contact.update({ presence: "available" });
  await message.ticket.contact.reload();

  if (message.ticket.queueId !== null && message.queueId === null) {
    await message.update({ queueId: message.ticket.queueId });
  }

  if (!existed) {
    await incrementGroupUnread(message.ticket, messageData.userId);
  }

  if (!(await checkCompanyCompliant(companyId))) {
    return message;
  }

  if (!skipWebsocket) {
    await websocketCreateMessage(message);
  }

  await emitContact(message.ticket.contact, "update");
  logger.debug(
    {
      company: companyId,
      ticket: message.ticketId,
      queue: message.ticket.queueId,
      status: message.ticket.status
    },
    "sending appMessage event"
  );
  return message;
};

export default CreateMessageService;
