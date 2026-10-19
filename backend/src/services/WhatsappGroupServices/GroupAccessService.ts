import AppError from "../../errors/AppError";
import GroupQueue from "../../models/GroupQueue";
import Queue from "../../models/Queue";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import Contact from "../../models/Contact";

export const getUserQueueIds = async (userId: number): Promise<number[]> => {
  const user = await User.findByPk(userId, {
    include: [{ model: Queue, as: "queues", attributes: ["id"] }]
  });
  return user?.queues?.map(queue => queue.id) || [];
};

export const assertGroupAccess = async (
  ticketId: number | string,
  user: { id: string | number; companyId: number; profile: string }
): Promise<Ticket> => {
  const ticket = await Ticket.findOne({
    where: { id: ticketId, companyId: user.companyId, isGroup: true },
    include: [{ model: Contact, as: "contact" }]
  });

  if (!ticket) {
    throw new AppError("ERR_NO_TICKET_FOUND", 404);
  }
  if (user.profile === "admin") {
    return ticket;
  }

  const queueIds = await getUserQueueIds(Number(user.id));
  const allowed = await GroupQueue.count({
    where: { groupContactId: ticket.contactId, queueId: queueIds }
  });
  if (!allowed) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  return ticket;
};

export default assertGroupAccess;
