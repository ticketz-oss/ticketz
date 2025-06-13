import { WAMessage } from "baileys";
import * as Sentry from "@sentry/node";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";

import formatBody from "../../helpers/Mustache";
import { verifyMediaMessage, verifyMessage } from "./wbotMessageListener";
import User from "../../models/User";
import { getJidOf } from "./getJidOf";

interface Request {
  body: string;
  ticket: Ticket;
  userId?: number;
  quotedMsg?: Message;
}

const SendWhatsAppMessage = async ({
  body,
  ticket,
  userId,
  quotedMsg
}: Request): Promise<WAMessage> => {
  let options = {};

  const wbot = await GetTicketWbot(ticket);

  if (quotedMsg) {
    const chatMessage = await Message.findOne({
      where: {
        id: quotedMsg.id
      }
    });

    if (chatMessage) {
      const msgFound = JSON.parse(chatMessage.dataJson);

      options = {
        quoted: {
          key: msgFound?.key || chatMessage.id,
          message: msgFound?.message
        }
      };
    }
  }

  try {
    const user = userId && (await User.findByPk(userId));
    const formattedBody = formatBody(body, ticket, user);
    const sentMessage = await wbot.sendMessage(
      getJidOf(ticket),
      {
        text: formattedBody
      },
      {
        ...options
      }
    );

    wbot.cacheMessage(sentMessage);

    if (sentMessage?.message?.extendedTextMessage?.thumbnailDirectPath) {
      await verifyMediaMessage(sentMessage, ticket, ticket.contact, wbot);
    } else {
      await verifyMessage(sentMessage, ticket, ticket.contact);
    }
    return sentMessage;
  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMessage;
