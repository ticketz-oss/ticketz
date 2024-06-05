import { WASocket, WAMessage } from "@whiskeysockets/baileys";
import * as Sentry from "@sentry/node";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";

import formatBody from "../../helpers/Mustache";

interface Request {
  body: string;
  ticket: Ticket;
  quotedMsg?: Message;
}

const SendWhatsAppMessage = async ({
  body,
  ticket,
  quotedMsg
}: Request): Promise<WAMessage> => {
  let options = {};

  const wbot = await GetTicketWbot(ticket);

  const number = ticket.isGroup ? `${ticket.contact.number}@g.us` : `${ticket.contact.number}@s.whatsapp.net`
  // const number = `${ticket.contact.number.substring(12,0)}-${ticket.contact.number.substring(12)}@${

  //   ticket.isGroup ? "g.us" : "s.whatsapp.net"
  // }`;
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
            message: {
              extendedTextMessage: msgFound?.message.extendedTextMessage
            }
          }
        };
          }
  }

  try {

    const sentMessage = await wbot.sendMessage(number,{
        text: formatBody(body, ticket.contact)
      },
      {
        ...options
      }
    );

    await ticket.update({ lastMessage: formatBody(body, ticket.contact) });

    return sentMessage;
  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMessage;
