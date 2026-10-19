import { Op } from "sequelize";
import GroupQueue from "../../models/GroupQueue";
import GroupReadState from "../../models/GroupReadState";
import Queue from "../../models/Queue";
import User from "../../models/User";
import Ticket from "../../models/Ticket";
import { getIO } from "../../libs/socket";

export const incrementGroupUnread = async (
  ticket: Ticket,
  senderUserId?: number
): Promise<void> => {
  if (!ticket.isGroup || ticket.contact?.groupMode === "ticket") return;

  const groupQueues = await GroupQueue.findAll({
    where: { groupContactId: ticket.contactId },
    attributes: ["queueId"]
  });
  const queueIds = groupQueues.map(item => item.queueId);
  const users = await User.findAll({
    where: { companyId: ticket.companyId },
    include: [
      { model: Queue, as: "queues", required: false, attributes: ["id"] }
    ]
  });
  const eligible = users.filter(
    user =>
      user.profile === "admin" ||
      user.queues?.some(queue => queueIds.includes(queue.id))
  );

  await Promise.all(
    eligible
      .filter(user => user.id !== senderUserId)
      .map(async user => {
        const [state] = await GroupReadState.findOrCreate({
          where: { ticketId: ticket.id, userId: user.id },
          defaults: {
            ticketId: ticket.id,
            userId: user.id,
            companyId: ticket.companyId,
            unreadCount: 0
          }
        });
        await state.increment("unreadCount");
      })
  );
};

export const markGroupRead = async (
  ticketId: number,
  userId: number,
  companyId: number
): Promise<void> => {
  const [state] = await GroupReadState.findOrCreate({
    where: { ticketId, userId },
    defaults: { ticketId, userId, companyId, unreadCount: 0 }
  });
  await state.update({ unreadCount: 0, lastReadAt: new Date() });
  getIO().to(`user-${userId}`).emit(`company-${companyId}-ticket`, {
    action: "updateUnread",
    ticketId
  });
};

export const resetGroupUnreadForQueues = async (
  ticketIds: number[],
  companyId: number
): Promise<void> => {
  await GroupReadState.update(
    { unreadCount: 0, lastReadAt: new Date() },
    { where: { ticketId: { [Op.in]: ticketIds }, companyId } }
  );
};
