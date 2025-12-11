import { WASocket, proto } from "libzapitu-rf";
import { Op, WhereOptions } from "sequelize";
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

    if (wbot) {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const batchSize = 250;
      let hasMore = true;
      let lastCreatedAt: Date = null;
      let isFirstBatch = true;

      while (hasMore) {
        const whereClause: WhereOptions<Message> = {
          ticketId: ticket.id,
          fromMe: false,
          read: false
        };
        if (lastCreatedAt) {
          whereClause[Op.and] = [
            { createdAt: { [Op.lt]: lastCreatedAt } },
            { createdAt: { [Op.gte]: oneWeekAgo } }
          ];
        }

        // eslint-disable-next-line no-await-in-loop
        const messages = await Message.findAll({
          attributes: ["id", "companyId", "dataJson", "createdAt"],
          where: whereClause,
          order: [
            ["createdAt", "DESC"],
            ["id", "DESC"]
          ],
          limit: batchSize
        });

        if (messages.length === 0) break;

        if (isFirstBatch) {
          const lastMessage: proto.IWebMessageInfo = JSON.parse(
            messages[0].dataJson
          );
          if (lastMessage?.key?.remoteJid && !lastMessage.key.fromMe) {
            (wbot as WASocket)
              .chatModify(
                { markRead: true, lastMessages: [lastMessage] },
                lastMessage.key.remoteJid
              )
              .catch(err => {
                if (err.output?.statusCode === 404) return;
                logger.error(
                  { error: err as Error },
                  `Could not modify chat. Err: ${err?.message}`
                );
              });
          }
          companyId = messages[0]?.companyId;
          isFirstBatch = false;
        }

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

        try {
          // eslint-disable-next-line no-await-in-loop
          await (wbot as WASocket).readMessages(messageKeys);
        } catch (err) {
          logger.error(
            { error: err as Error },
            `Could not mark messages as read. Err: ${err?.message}`
          );
          break;
        }

        const lastMsg = messages[messages.length - 1];
        lastCreatedAt = lastMsg.createdAt;
        hasMore = messages.length === batchSize;
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
