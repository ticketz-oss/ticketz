import { getIO } from "../../libs/socket";
import Message from "../../models/Message";
import OldMessage from "../../models/OldMessage";
import Ticket from "../../models/Ticket";
import { logger } from "../../utils/logger";

interface MessageData {
	id: string;
	ticketId: number;
	body: string;
	contactId?: number;
	fromMe?: boolean;
	read?: boolean;
	mediaType?: string;
	mediaUrl?: string;
	ack?: number;
	queueId?: number;
	channel?: string;
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
      companyId
    },
		include: [
			"contact",
			{
				model: Ticket,
				as: "ticket",
				include: ["contact", "queue", "whatsapp"]
			},
      {
        model: Message, as: "quotedMsg",
        include: ["contact"],
        where: {
          companyId
        },
        required: false,
      },
      {
        model: OldMessage, as: "oldMessages",
        where: {
          ticketId: messageData.ticketId,
        },
        required: false,
      },
		]
	});

	if (message.ticket.queueId !== null && message.queueId === null) {
		await message.update({ queueId: message.ticket.queueId });
	}

	if (!message) {
		throw new Error("ERR_CREATING_MESSAGE");
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
	logger.debug(
		{
			company: companyId,
			ticket: message.ticketId,
			queue: message.ticket.queueId,
			status: message.ticket.status
		},
		"sending create message to clients");
	return message;
};

export default CreateMessageService;
