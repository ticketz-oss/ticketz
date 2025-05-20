import {
  Op,
  fn,
  where,
  col,
  Filterable,
  Includeable,
  WhereOptions
} from "sequelize";
import { startOfDay, endOfDay, parseISO } from "date-fns";

import { intersection } from "lodash";
import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Queue from "../../models/Queue";
import User from "../../models/User";
import ShowUserService from "../UserServices/ShowUserService";
import Tag from "../../models/Tag";
import TicketTag from "../../models/TicketTag";
import Whatsapp from "../../models/Whatsapp";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import ContactTag from "../../models/ContactTag";

interface Request {
  isSearch?: boolean;
  searchParam?: string;
  pageNumber?: string;
  status?: string;
  groups?: string;
  date?: string;
  updatedAt?: string;
  showAll?: string;
  userId: string;
  withUnreadMessages?: string;
  notClosed?: boolean;
  all?: boolean;
  queueIds: number[];
  tags: number[];
  users: number[];
  companyId: number;
}

interface Response {
  tickets: Ticket[];
  count: number;
  hasMore: boolean;
}

const ListTicketsService = async ({
  isSearch = false,
  searchParam = "",
  pageNumber = "1",
  queueIds,
  tags,
  users,
  status,
  groups,
  date,
  updatedAt,
  showAll,
  userId,
  withUnreadMessages,
  notClosed,
  all,
  companyId
}: Request): Promise<Response> => {
  const groupsTab =
    !isSearch &&
    (await GetCompanySetting(companyId, "groupsTab", "disabled")) === "enabled";

  const user = await ShowUserService(userId);

  const andedOrs: WhereOptions<Ticket>[] = [
    {
      [Op.or]: [{ userId }, { status: "pending" }]
    }
  ];

  let whereCondition: Filterable["where"] = {
    [Op.and]: andedOrs,
    queueId: {
      [Op.or]: user.profile === "admin" ? [queueIds, null] : [queueIds]
    }
  };

  if (groupsTab) {
    whereCondition.isGroup = groups === "true";
  }
  let includeCondition: Includeable[];

  includeCondition = [
    {
      model: Contact,
      as: "contact",
      include: ["tags", "extraInfo"],
      attributes: ["id", "name", "number", "email", "profilePicUrl", "presence"]
    },
    {
      model: Queue,
      as: "queue",
      attributes: ["id", "name", "color"]
    },
    {
      model: User,
      as: "user",
      attributes: ["id", "name"]
    },
    {
      model: Tag,
      as: "tags",
      attributes: ["id", "name", "color"]
    },
    {
      model: Whatsapp,
      as: "whatsapp",
      attributes: ["id", "name"]
    }
  ];

  if (showAll === "true" && user.profile === "admin") {
    andedOrs.length = 0;
    whereCondition = {
      [Op.and]: andedOrs,
      queueId: { [Op.or]: [queueIds, null] }
    };
    if (groupsTab) {
      whereCondition.isGroup = groups === "true";
    }
  }

  if (status) {
    whereCondition = {
      ...whereCondition,
      status
    };
  }

  if (searchParam) {
    const sanitizedSearchParam = searchParam.toLocaleLowerCase().trim();

    includeCondition = [
      ...includeCondition,
      {
        model: Message,
        as: "messages",
        attributes: ["id", "body"],
        where: {
          body: where(
            fn("LOWER", col("body")),
            "LIKE",
            `%${sanitizedSearchParam}%`
          )
        },
        required: false,
        duplicating: false
      }
    ];

    andedOrs.push({
      [Op.or]: [
        {
          "$contact.name$": where(
            fn("LOWER", col("contact.name")),
            "LIKE",
            `%${sanitizedSearchParam}%`
          )
        },
        { "$contact.number$": { [Op.like]: `%${sanitizedSearchParam}%` } },
        {
          "$message.body$": where(
            fn("LOWER", col("body")),
            "LIKE",
            `%${sanitizedSearchParam}%`
          )
        }
      ] as any[]
    });
  }

  if (date) {
    whereCondition = {
      [Op.and]: andedOrs,
      createdAt: {
        [Op.between]: [+startOfDay(parseISO(date)), +endOfDay(parseISO(date))]
      }
    };
  }

  if (updatedAt) {
    whereCondition = {
      [Op.and]: andedOrs,
      updatedAt: {
        [Op.between]: [
          +startOfDay(parseISO(updatedAt)),
          +endOfDay(parseISO(updatedAt))
        ]
      }
    };
  }

  if (withUnreadMessages === "true") {
    whereCondition = {
      ...whereCondition,
      unreadMessages: { [Op.gt]: 0 }
    };
  }

  if (Array.isArray(tags) && tags.length > 0) {
    const ticketsTagFilter: any[] | null = [];
    const contactsTagFilter: any[] | null = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const tag of tags) {
      const ticketTags = await TicketTag.findAll({
        where: { tagId: tag }
      });
      if (ticketTags) {
        ticketsTagFilter.push(ticketTags.map(t => t.ticketId));
      }

      const contactTags = await ContactTag.findAll({
        where: { tagId: tag }
      });

      if (contactTags) {
        contactsTagFilter.push(contactTags.map(c => c.contactId));
      }
    }

    const ticketsIntersection: number[] = intersection(...ticketsTagFilter);
    const contactsIntersection: number[] = intersection(...contactsTagFilter);

    andedOrs.push({
      [Op.or]: [
        {
          id: { [Op.in]: ticketsIntersection }
        },
        {
          contactId: { [Op.in]: contactsIntersection }
        }
      ]
    });
  }

  if (Array.isArray(users) && users.length > 0) {
    const ticketsUserFilter: any[] | null = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const u of users) {
      const ticketUsers = await Ticket.findAll({
        where: { userId: u }
      });
      if (ticketUsers) {
        ticketsUserFilter.push(ticketUsers.map(t => t.id));
      }
    }

    const ticketsIntersection: number[] = intersection(...ticketsUserFilter);

    whereCondition = {
      ...whereCondition,
      id: {
        [Op.in]: ticketsIntersection
      }
    };
  }

  const limit = all ? undefined : 40;
  const offset = all ? undefined : limit * (+pageNumber - 1);

  if (notClosed) {
    whereCondition = {
      ...whereCondition,
      status: { [Op.ne]: "closed" }
    };
  }

  whereCondition = {
    ...whereCondition,
    companyId
  };

  const { count, rows: tickets } = await Ticket.findAndCountAll({
    where: whereCondition,
    include: includeCondition,
    distinct: true,
    col: "id",
    limit,
    offset,
    order: [["updatedAt", "DESC"]],
    subQuery: false
  });

  const hasMore = count > offset + tickets.length;

  return {
    tickets,
    count,
    hasMore
  };
};

export default ListTicketsService;
