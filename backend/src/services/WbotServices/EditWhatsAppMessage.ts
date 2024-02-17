import { WASocket, WAMessage } from "@whiskeysockets/baileys";
import * as Sentry from "@sentry/node";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import GetWbotMessage from "../../helpers/GetWbotMessage";
import Message from "../../models/Message";
import OldMessage from "../../models/OldMessage";
import Ticket from "../../models/Ticket";

import formatBody from "../../helpers/Mustache";

interface Request {
  messageId: string;
  body: string;
}

const EditWhatsAppMessage = async ({
  messageId,
  body,
}: Request): Promise<{ ticketId: number , message: Message}> => {
  
  const message = await Message.findByPk(messageId, {
    include: [
      {
        model: Ticket,
        as: "ticket",
        include: ["contact"]
      }
    ]
  });
  
  if (!message) {
    throw new AppError("No message found with this ID.");
  }

  const { ticket } = message;

  const wbot = await GetTicketWbot(ticket);
  
  const msg = JSON.parse(message.dataJson);
  
  try {
	await wbot.sendMessage(message.remoteJid, {
	  text: body,
	  edit: msg.key,
	},{});
	
    const oldMessage = {
      messageId: messageId,
      body: message.body
	}

    await OldMessage.upsert(oldMessage);

	message.update({ body: body, isEdited: true});
	
    return { ticketId: message.ticketId , message: message };
  } catch (err) {
	console.log(err);
    throw new AppError("ERR_EDITING_WAPP_MSG");
  }

};

export default EditWhatsAppMessage;
