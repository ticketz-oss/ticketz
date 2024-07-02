import { proto, WASocket } from "@whiskeysockets/baileys";
import { cacheLayer } from "../libs/cache";
import { getIO } from "../libs/socket";
import Message from "../models/Message";
import Ticket from "../models/Ticket";
import { logger } from "../utils/logger";
import GetTicketWbot from "./GetTicketWbot";

const SetTicketMessagesAsRead = async (ticket: Ticket): Promise<void> => {
  await ticket.update({ unreadMessages: 0 });
  await cacheLayer.set(`contacts:${ticket.contactId}:unreads`, "0");
  let companyId: number;
  try {
    const wbot = await GetTicketWbot(ticket);

    const getJsonMessage = await Message.findAll({
      where: {
        ticketId: ticket.id,
        fromMe: false,
        read: false
      },
      order: [["createdAt", "DESC"]]
    });
    companyId = getJsonMessage[0]?.companyId;

    getJsonMessage.map(async m => {
      const message: proto.IWebMessageInfo = JSON.parse(m.dataJson);
      if (message.key) {
        await (wbot as WASocket).readMessages([message.key]);
      }
    });

    if (getJsonMessage.length > 0) {
      const lastMessages: proto.IWebMessageInfo = JSON.parse(
        getJsonMessage[0].dataJson
      );
      if (lastMessages?.key?.remoteJid && lastMessages.key.fromMe === false) {
        await (wbot as WASocket).chatModify(
          { markRead: true, lastMessages: [lastMessages] },
          `${lastMessages.key.remoteJid}`
        );
      }
    }

    await Message.update(
      { read: true },
      {
        where: {
          ticketId: ticket.id,
          read: false
        }
      }
    );
  } catch (err) {
    logger.error(
      { error: err as Error },
      `Could not mark messages as read. Err: ${err?.message}`
    );
  }

  const io = getIO();
  if (companyId) {
    io.to(ticket.id.toString())
      .to(`company-${companyId}-${ticket.status}`)
      .to(`queue-${ticket.queueId}-${ticket.status}`)
      .emit(`company-${companyId}-ticket`, {
        action: "updateUnread",
        ticketId: ticket.id
      });
  }
};

export default SetTicketMessagesAsRead;
