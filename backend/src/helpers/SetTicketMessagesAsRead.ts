import { WASocket, proto } from "baileys";
import { getIO } from "../libs/socket";
import Message from "../models/Message";
import Ticket from "../models/Ticket";
import { logger } from "../utils/logger";
import GetTicketWbot from "./GetTicketWbot";

const SetTicketMessagesAsRead = async (ticket: Ticket): Promise<void> => {
  await ticket.update({ unreadMessages: 0 }, { silent: true });
  let companyId: number;

  try {
    const wbot = await GetTicketWbot(ticket);

    const messages = await Message.findAll({
      attributes: ["id", "companyId", "dataJson"],
      where: {
        ticketId: ticket.id,
        fromMe: false,
        read: false
      },
      order: [["createdAt", "DESC"]]
    });

    if (messages.length === 0) return;

    companyId = messages[0]?.companyId;

    const messageKeys = messages
      .map(m => {
        const message: proto.IWebMessageInfo = JSON.parse(m.dataJson);
        return message.key;
      })
      .filter(key => key !== undefined);

    logger.debug(
      { messageKeys, ticketId: ticket.id },
      `Marking ${messageKeys.length} messages of ticket ${ticket.id} as read`
    );

    if (wbot) {
      // Process message keys in batches of 250
      const batchSize = 250;
      for (let i = 0; i < messageKeys.length; i += batchSize) {
        const batch = messageKeys.slice(i, i + batchSize);
        try {
          // eslint-disable-next-line no-await-in-loop
          await (wbot as WASocket).readMessages(batch);
        } catch (err) {
          logger.error(
            { error: err as Error },
            `Could not mark messages as read. Err: ${err?.message}`
          );
        }
      }

      const lastMessage: proto.IWebMessageInfo = JSON.parse(
        messages[0].dataJson
      );
      if (lastMessage?.key?.remoteJid && !lastMessage.key.fromMe) {
        // Asynchronous chatModify call
        (wbot as WASocket)
          .chatModify(
            { markRead: true, lastMessages: [lastMessage] },
            lastMessage.key.remoteJid
          )
          .catch(err => {
            logger.error(
              { error: err as Error },
              `Could not modify chat. Err: ${err?.message}`
            );
          });
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
