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
  companyId: number;
  body: string;
}

const EditWhatsAppMessage = async ({
  messageId,
  companyId,
  body,
}: Request): Promise<{ ticketId: number , message: Message}> => {
  
  const message = await Message.findOne({
    where: {
      id: messageId,
      companyId
    },
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
    }, {});

    const oldMessage = {
      messageId,
      body: message.body,
      ticketId: message.ticketId,
    }

    await OldMessage.upsert(oldMessage);

    await message.update({ body, isEdited: true });

    const savedMessage = await Message.findOne({
      where: {
        id: messageId,
        companyId
      },
      include: [
        {
          model: Ticket,
          as: "ticket",
          include: ["contact"]
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
            ticketId: message.ticketId,
          },
          required: false,
        },
      ]
    });
	
    return { ticketId: savedMessage.ticketId , message: savedMessage };
  } catch (err) {
	console.log(err);
    throw new AppError("ERR_EDITING_WAPP_MSG");
  }

};

export default EditWhatsAppMessage;
