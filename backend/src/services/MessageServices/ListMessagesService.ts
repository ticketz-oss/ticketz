import { FindAndCountOptions, Op, WhereOptions } from "sequelize";
import AppError from "../../errors/AppError";
import Message from "../../models/Message";
import OldMessage from "../../models/OldMessage";
import Ticket from "../../models/Ticket";
import ShowTicketService from "../TicketServices/ShowTicketService";
import Queue from "../../models/Queue";
import User from "../../models/User";
import { GetCompanySetting } from "../../helpers/CheckSettings";

interface Request {
  ticketId: string;
  companyId: number;
  user: User;
  pageNumber?: string;
  queues?: number[];
}

interface Response {
  messages: Message[];
  ticket: Ticket;
  count: number;
  hasMore: boolean;
}

const ListMessagesService = async ({
  pageNumber = "1",
  ticketId,
  user,
  companyId,
  queues = []
}: Request): Promise<Response> => {
  const ticket = await ShowTicketService(ticketId, companyId);

  if (!ticket) {
    throw new AppError("ERR_NO_TICKET_FOUND", 404);
  }

  if (ticket.companyId !== companyId) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  if (
    ticket.status === "open" &&
    user.profile !== "admin" &&
    ticket.userId !== user.id
  ) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  if (user.profile !== "admin" && ticket.status === "closed") {
    const closedTicketVisibility = await GetCompanySetting(
      companyId,
      "closedTicketVisibility",
      "User"
    );

    if (closedTicketVisibility === "User" && ticket.userId !== user.id) {
      throw new AppError("ERR_NO_PERMISSION", 403);
    } else if (closedTicketVisibility === "Queue") {
      const userQueues = user.queues.map(queue => queue.id);
      if (!userQueues.includes(ticket.queueId)) {
        throw new AppError("ERR_NO_PERMISSION", 403);
      }
    }
  }

  if (ticket.status === "pending" && user.profile !== "admin") {
    const groupsTab = await GetCompanySetting(
      companyId,
      "groupsTab",
      "disabled"
    );

    if (groupsTab === "enabled") {
      const userQueues = user.queues.map(queue => queue.id);
      if (!userQueues.includes(ticket.queueId)) {
        throw new AppError("ERR_NO_PERMISSION", 403);
      }
    } else {
      throw new AppError("ERR_NO_PERMISSION", 403);
    }
  }

  const limit = 100;
  const offset = limit * (+pageNumber - 1);

  const showPrevTickets =
    (await GetCompanySetting(companyId, "showPrevTickets", "disabled")) ===
    "enabled";

  let prevTicketCondition: WhereOptions = { id: ticketId };

  let options: FindAndCountOptions;

  if (showPrevTickets) {
    const closedTicketVisibility = await GetCompanySetting(
      companyId,
      "closedTicketVisibility",
      "User"
    );

    if (user.profile === "user" && closedTicketVisibility === "User") {
      // add ticketId <= ticketId condition
      prevTicketCondition = {
        [Op.or]: [
          { id: ticketId },
          {
            [Op.and]: [
              { id: { [Op.lt]: ticketId } },
              { status: "closed" },
              { userId: user.id },
              { contactId: ticket.contactId }
            ]
          }
        ]
      };
    } else if (user.profile === "user" && closedTicketVisibility === "Queue") {
      const userQueueIds = user?.queues.map(queue => queue.id) || [];
      prevTicketCondition = {
        [Op.or]: [
          { id: ticketId },
          {
            [Op.and]: [
              { id: { [Op.lt]: ticketId } },
              { status: "closed" },
              { [Op.or]: [{ queueId: userQueueIds }, { userId: user.id }] },
              { contactId: ticket.contactId }
            ]
          }
        ]
      };
    } else {
      // "Company" or "Admin"
      prevTicketCondition = {
        [Op.or]: [
          { id: ticketId },
          {
            [Op.and]: [
              { id: { [Op.lt]: ticketId } },
              { status: "closed" },
              { contactId: ticket.contactId }
            ]
          }
        ]
      };
    }

    options = {
      where: {
        ticketId: { [Op.lte]: ticketId },
        companyId,
        mediaType: {
          [Op.or]: {
            [Op.ne]: "reactionMessage",
            [Op.is]: null
          }
        }
      }
    };
  } else {
    options = {
      where: {
        ticketId,
        companyId,
        mediaType: {
          [Op.or]: {
            [Op.ne]: "reactionMessage",
            [Op.is]: null
          }
        }
      }
    };
  }

  if (
    queues.length > 0 &&
    (await GetCompanySetting(companyId, "messageVisibility", "message")) ===
      "message"
  ) {
    // eslint-disable-next-line dot-notation
    options.where["queueId"] = {
      [Op.or]: {
        [Op.in]: queues,
        [Op.eq]: null
      }
    };
  }

  const { count, rows: messages } = await Message.findAndCountAll({
    ...options,
    limit,
    include: [
      "contact",
      {
        model: Ticket,
        as: "ticket",
        where: prevTicketCondition
      },
      {
        model: Message,
        as: "quotedMsg",
        include: ["contact"],
        where: {
          companyId: ticket.companyId
        },
        required: false
      },
      {
        model: OldMessage,
        as: "oldMessages",
        required: false
      },
      {
        model: Message,
        as: "replies",
        where: {
          ticketId: ticket.id
        },
        include: ["contact"],
        required: false
      },
      {
        model: Message,
        as: "replies",
        where: {
          ticketId: ticket.id
        },
        include: ["contact"],
        required: false
      },
      {
        model: Queue,
        as: "queue"
      }
    ],
    offset,
    order: [["createdAt", "DESC"]]
  });

  const hasMore = count > offset + messages.length;

  return {
    messages: messages.reverse(),
    ticket,
    count,
    hasMore
  };
};

export default ListMessagesService;
