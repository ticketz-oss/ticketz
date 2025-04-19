import { checkCompanyCompliant } from "../../helpers/CheckCompanyCompliant";
import { getIO } from "../../libs/socket";
import Message from "../../models/Message";
import OldMessage from "../../models/OldMessage";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import { AudioTranscriptionService } from "./AudioTranscriptionService";

export interface MessageData {
  id: string;
  ticketId: number;
  body: string;
  contactId?: number;
  fromMe?: boolean;
  read?: boolean;
  quotedMsgId?: string;
  mediaType?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  ack?: number;
  remoteJid?: string;
  participant?: string;
  dataJson?: string;
  isEdited?: boolean;
  queueId?: number;
  channel?: string;
  userId?: number;
  createdAt?: Date;
}
interface Request {
  messageData: MessageData;
  companyId: number;
}

const CreateMessageService = async ({
  messageData,
  companyId
}: Request): Promise<Message> => {
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
          "contact",
          "queue",
          "tags",
          "user",
          {
            model: Whatsapp,
            as: "whatsapp",
            attributes: ["name", "id"]
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
        required: false,
        include: [
          {
            model: User,
            attributes: { exclude: ["passwordHash"] },
            required: false
          }
        ]
      },
      {
        model: User,
        attributes: { exclude: ["passwordHash"] },
        required: false
      }
    ]
  });

  if (!message) {
    throw new Error("ERR_CREATING_MESSAGE");
  }

  // if is an history ticket, just return the message
  if (messageData.ticketId < 0) {
    return message;
  }

  await message.ticket.contact.update({ presence: "available" });
  await message.ticket.contact.reload();

  if (message.ticket.queueId !== null && message.queueId === null) {
    await message.update({ queueId: message.ticket.queueId });
  }

  if (!(await checkCompanyCompliant(companyId))) {
    return message;
  }

  const io = getIO();
  io.to(message.ticketId.toString())
    .to(`company-${companyId}-${message.ticket.status}`)
    .to(`company-${companyId}-notification`)
    .to(`queue-${message.ticket.queueId}-${message.ticket.status}`)
    .to(`queue-${message.ticket.queueId}-notification`)
    .emit(`company-${companyId}-appMessage`, {
      action: "create",
      message,
      ticket: message.ticket,
      contact: message.ticket.contact
    });

  io.to(`company-${companyId}-mainchannel`).emit(
    `company-${companyId}-contact`,
    {
      action: "update",
      contact: message.ticket.contact
    }
  );
  logger.debug(
    {
      company: companyId,
      ticket: message.ticketId,
      queue: message.ticket.queueId,
      status: message.ticket.status
    },
    "sending appMessage event"
  );

  if (message.mediaType === "audio") {
    AudioTranscriptionService(message).catch(err => {
      logger.error(
        { error: err.message },
        "Error in audio transcription service"
      );
    });
  }

  return message;
};

export default CreateMessageService;
