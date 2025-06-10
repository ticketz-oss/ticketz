import { subMinutes } from "date-fns";
import { Op, WhereOptions } from "sequelize";
import { Mutex } from "async-mutex";
import moment from "moment";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import ShowTicketService from "./ShowTicketService";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import sequelize from "../../database";
import Whatsapp from "../../models/Whatsapp";
import Queue from "../../models/Queue";
import { incrementCounter } from "../CounterServices/IncrementCounter";

const createTicketMutex = new Mutex();

export type FindOrCreateTicketOptions = {
  groupContact?: Contact;
  incrementUnread?: boolean;
  doNotReopen?: boolean;
  findOnly?: boolean;
  queue?: Queue;
  history?: boolean;
  timestamp?: number;
};

const internalFindOrCreateTicketService = async (
  contact: Contact,
  whatsappId: number,
  companyId: number,
  {
    groupContact,
    incrementUnread,
    doNotReopen,
    findOnly,
    queue,
    history,
    timestamp
  }: FindOrCreateTicketOptions = {}
): Promise<{ ticket: Ticket; justCreated: boolean }> => {
  let justCreated = false;
  const result = await sequelize.transaction(async () => {
    const where: WhereOptions<Ticket> = {
      id: { [Op.gt]: 0 },
      status: {
        [Op.or]: ["open", "pending"]
      },
      contactId: groupContact ? groupContact.id : contact.id,
      whatsappId
    };

    if (history) {
      where.id = { [Op.lt]: 0 };
      where.status = "closed";
    }

    let ticket = await Ticket.findOne({
      where,
      order: [["id", "DESC"]]
    });

    if (history) {
      if (!ticket) {
        const minTicketId = Number(await Ticket.min("id")) || 0;

        ticket = await Ticket.create({
          id: minTicketId > 0 ? -1 : minTicketId - 1,
          contactId: groupContact ? groupContact.id : contact.id,
          status: "closed",
          isGroup: !!groupContact,
          unreadMessages,
          whatsappId,
          companyId,
          createdAt: timestamp ? moment.unix(timestamp).toDate() : undefined,
          updatedAt: timestamp ? moment.unix(timestamp).toDate() : undefined
        });

        justCreated = true;
      }

      ticket = await ShowTicketService(ticket.id, companyId);

      return { ticket, justCreated };
    }

    if (ticket && incrementUnread) {
      await ticket.increment("unreadMessages");
      ticket = await ticket.reload();
    }

    if (!ticket && groupContact) {
      ticket = await Ticket.findOne({
        where: {
          contactId: groupContact.id,
          whatsappId
        },
        order: [["updatedAt", "DESC"]]
      });

      if (ticket) {
        await ticket.update({
          status: "pending",
          userId: null,
          unreadMessages: incrementUnread
            ? ticket.unreadMessages + 1
            : ticket.unreadMessages,
          companyId
        });
        await FindOrCreateATicketTrakingService({
          ticketId: ticket.id,
          companyId,
          whatsappId: ticket.whatsappId,
          userId: ticket.userId
        });
      }
    }

    if (!doNotReopen && !ticket && !groupContact) {
      const reopenTimeout = parseInt(
        await GetCompanySetting(companyId, "autoReopenTimeout", "0"),
        10
      );
      ticket =
        reopenTimeout &&
        (await Ticket.findOne({
          where: {
            updatedAt: {
              [Op.between]: [
                +subMinutes(new Date(), reopenTimeout),
                +new Date()
              ]
            },
            contactId: contact.id,
            whatsappId
          },
          order: [["updatedAt", "DESC"]]
        }));

      if (ticket) {
        await ticket.update({
          status: "pending",
          userId: null,
          unreadMessages: incrementUnread
            ? ticket.unreadMessages + 1
            : ticket.unreadMessages,
          companyId
        });
        await FindOrCreateATicketTrakingService({
          ticketId: ticket.id,
          companyId,
          whatsappId: ticket.whatsappId,
          userId: ticket.userId
        });
      }
    }

    let queueId = queue?.id || null;

    if (groupContact || contact.channel !== "whatsapp") {
      const whatsapp = await Whatsapp.findByPk(whatsappId, {
        include: ["queues"]
      });

      if (whatsapp?.queues.length === 1) {
        queueId = whatsapp.queues[0].id;
      }
    }

    if (findOnly && !ticket) {
      return { ticket: null, justCreated: false };
    }

    if (!ticket) {
      ticket = await Ticket.create({
        contactId: groupContact ? groupContact.id : contact.id,
        status: "pending",
        isGroup: !!groupContact,
        unreadMessages: incrementUnread ? 1 : 0,
        whatsappId,
        queueId,
        companyId
      });

      justCreated = true;

      await FindOrCreateATicketTrakingService({
        ticketId: ticket.id,
        companyId,
        whatsappId,
        userId: ticket.userId
      });
    }

    ticket = await ShowTicketService(ticket.id, companyId);

    return { ticket, justCreated };
  });

  if (result.justCreated) {
    incrementCounter(companyId, "ticket-create");
  }

  return result;
};

const FindOrCreateTicketService = async (
  contact: Contact,
  whatsappId: number,
  companyId: number,
  options: FindOrCreateTicketOptions = {}
): Promise<{ ticket: Ticket; justCreated: boolean }> => {
  const release = await createTicketMutex.acquire();

  try {
    return await internalFindOrCreateTicketService(
      contact,
      whatsappId,
      companyId,
      options
    );
  } finally {
    release();
  }
};

export default FindOrCreateTicketService;
