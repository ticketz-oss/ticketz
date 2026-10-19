import { Op, QueryTypes } from "sequelize";
import sequelize from "../../database";
import Contact from "../../models/Contact";
import GroupQueue from "../../models/GroupQueue";
import GroupReadState from "../../models/GroupReadState";
import Queue from "../../models/Queue";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";
import { getUserQueueIds } from "./GroupAccessService";
import AppError from "../../errors/AppError";

interface Request {
  companyId: number;
  userId: number;
  profile: string;
  mode?: "conversation" | "ticket";
  status?: string;
  searchParam?: string;
  pageNumber?: number;
  nextUpdatedAt?: string;
  nextTicketId?: number;
  minUpdatedAt?: string;
}

const ListGroupsService = async ({
  companyId,
  userId,
  profile,
  mode = "conversation",
  status,
  searchParam = "",
  pageNumber = 1,
  nextUpdatedAt,
  nextTicketId,
  minUpdatedAt
}: Request) => {
  let contactIds: number[] | undefined;
  if (profile !== "admin") {
    const userQueueIds = await getUserQueueIds(userId);
    const access = await GroupQueue.findAll({
      where: { companyId, queueId: userQueueIds },
      attributes: ["groupContactId"]
    });
    contactIds = [...new Set(access.map(item => item.groupContactId))];
    if (!contactIds.length) return { groups: [], count: 0, hasMore: false };
  }

  const contactWhere: Record<string | symbol, unknown> = {
    companyId,
    isGroup: true,
    groupMode: mode
  };
  if (contactIds) contactWhere.id = { [Op.in]: contactIds };
  if (searchParam.trim()) {
    contactWhere.name = { [Op.iLike]: `%${searchParam.trim()}%` };
  }
  const where: Record<string | symbol, unknown> = { companyId, isGroup: true };
  if (mode === "ticket" && status) where.status = status;
  if (minUpdatedAt) {
    const minimumDate = new Date(minUpdatedAt);
    if (Number.isNaN(minimumDate.getTime())) {
      throw new AppError("ERR_INVALID_MIN_UPDATED_AT", 400);
    }
    where.updatedAt = { [Op.gte]: minimumDate };
  } else if (nextUpdatedAt && nextTicketId) {
    const cursorDate = new Date(nextUpdatedAt);
    if (Number.isNaN(cursorDate.getTime())) {
      throw new AppError("ERR_INVALID_UPDATED_AT", 400);
    }
    where[Op.or] = [
      { updatedAt: { [Op.lt]: cursorDate } },
      { updatedAt: cursorDate, id: { [Op.lt]: nextTicketId } }
    ];
  }

  const limit = 40;
  const { rows, count } = await Ticket.findAndCountAll({
    where,
    include: [
      {
        model: Contact,
        as: "contact",
        required: true,
        where: contactWhere,
        include: [
          {
            model: GroupQueue,
            as: "groupQueues",
            include: [
              { model: Queue, as: "queue", attributes: ["id", "name", "color"] }
            ]
          }
        ]
      },
      { model: Queue, as: "queue", attributes: ["id", "name", "color"] },
      { model: User, as: "user", attributes: ["id", "name"] },
      { model: Whatsapp, as: "whatsapp", attributes: ["id", "name", "status"] }
    ],
    distinct: true,
    limit,
    offset:
      nextUpdatedAt || minUpdatedAt
        ? undefined
        : (Math.max(pageNumber, 1) - 1) * limit,
    order: [
      ["updatedAt", "DESC"],
      ["id", "DESC"]
    ]
  });

  const states = await GroupReadState.findAll({
    where: { ticketId: rows.map(ticket => ticket.id), userId },
    attributes: ["ticketId", "unreadCount"]
  });
  const unreadByTicket = new Map(
    states.map(state => [state.ticketId, state.unreadCount])
  );
  const ticketIds = rows.map(ticket => ticket.id);
  const lastSenders = ticketIds.length
    ? ((await sequelize.query(
        `
          SELECT DISTINCT ON (message."ticketId")
            message."ticketId",
            message."fromMe",
            COALESCE(contact.name, message.participant) AS "senderName"
          FROM "Messages" message
          LEFT JOIN "Contacts" contact ON contact.id = message."contactId"
          WHERE message."ticketId" IN (:ticketIds)
          ORDER BY message."ticketId", message."createdAt" DESC
        `,
        { replacements: { ticketIds }, type: QueryTypes.SELECT }
      )) as Array<{
        ticketId: number;
        fromMe: boolean;
        senderName: string | null;
      }>)
    : [];
  const senderByTicket = new Map(
    lastSenders.map(sender => [sender.ticketId, sender.senderName])
  );
  const groups = rows.map(ticket => ({
    ...ticket.toJSON(),
    groupMode: ticket.contact.groupMode,
    queueIds: ticket.contact.groupQueues?.map(item => item.queueId) || [],
    lastSenderName: senderByTicket.get(ticket.id) || null,
    lastSenderFromMe:
      lastSenders.find(sender => sender.ticketId === ticket.id)?.fromMe ||
      false,
    unreadCount:
      mode === "conversation"
        ? unreadByTicket.get(ticket.id) || 0
        : ticket.unreadMessages || 0,
    unreadMessages:
      mode === "conversation"
        ? unreadByTicket.get(ticket.id) || 0
        : ticket.unreadMessages || 0
  }));

  return { groups, count, hasMore: count > limit };
};

export default ListGroupsService;
