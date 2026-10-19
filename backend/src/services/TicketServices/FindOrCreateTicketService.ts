import { subMinutes } from "date-fns";
import { Op } from "sequelize";
import { Mutex } from "async-mutex";
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

type FindOrCreateTicketOptions = {
  groupContact?: Contact;
  incrementUnread?: boolean;
  doNotReopen?: boolean;
  findOnly?: boolean;
  queue?: Queue;
};

export const getConnectionScope = (
  groupContact: Contact | undefined,
  whatsappId: number
): { whatsappId?: number } => (groupContact ? {} : { whatsappId });

const internalFindOrCreateTicketService = async (
  contact: Contact,
  whatsappId: number,
  companyId: number,
  {
    groupContact,
    incrementUnread,
    doNotReopen,
    findOnly,
    queue
  }: FindOrCreateTicketOptions = {}
): Promise<{ ticket: Ticket; justCreated: boolean }> => {
  let justCreated = false;
  let shouldCreateTracking = false;
  const isGroupConversation =
    !!groupContact && groupContact.groupMode !== "ticket";
  const result = await sequelize.transaction(async transaction => {
    if (groupContact) {
      // A group is a tenant-wide conversation. The same WhatsApp group can be
      // present in multiple connections, so serialize creation by tenant and
      // group instead of allowing one ticket per connection.
      await sequelize.query(
        "SELECT pg_advisory_xact_lock(:companyId, :contactId)",
        {
          replacements: { companyId, contactId: groupContact.id },
          transaction
        }
      );
    }

    let ticket = await Ticket.findOne({
      where: {
        status: {
          [Op.or]: ["open", "pending"]
        },
        contactId: groupContact ? groupContact.id : contact.id,
        ...getConnectionScope(groupContact, whatsappId),
        companyId
      },
      order: [["id", "DESC"]],
      transaction
    });

    if (ticket && groupContact && ticket.whatsappId !== whatsappId) {
      // Reply through the connection that most recently received the group.
      await ticket.update({ whatsappId }, { transaction });
    }

    if (ticket && incrementUnread && !isGroupConversation) {
      await ticket.increment("unreadMessages", { transaction });
      ticket = await ticket.reload({ transaction });
    }

    if (!ticket && groupContact) {
      ticket = await Ticket.findOne({
        where: {
          contactId: groupContact.id,
          companyId
        },
        order: [["updatedAt", "DESC"]],
        transaction
      });

      if (ticket) {
        await ticket.update(
          {
            status: isGroupConversation ? "open" : "pending",
            userId: null,
            queueId: isGroupConversation ? null : ticket.queueId,
            unreadMessages: isGroupConversation
              ? 0
              : incrementUnread
                ? ticket.unreadMessages + 1
                : ticket.unreadMessages,
            whatsappId,
            companyId
          },
          { transaction }
        );
        if (!isGroupConversation) {
          shouldCreateTracking = true;
        }
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
            whatsappId,
            companyId
          },
          order: [["updatedAt", "DESC"]],
          transaction
        }));

      if (ticket) {
        await ticket.update(
          {
            status: "pending",
            userId: null,
            unreadMessages: incrementUnread
              ? ticket.unreadMessages + 1
              : ticket.unreadMessages,
            companyId
          },
          { transaction }
        );
        shouldCreateTracking = true;
      }
    }

    let queueId = queue?.id || null;

    if (groupContact && !isGroupConversation) {
      const whatsapp = await Whatsapp.findByPk(whatsappId, {
        include: ["queues"],
        transaction
      });

      if (whatsapp?.queues.length === 1) {
        queueId = whatsapp.queues[0].id;
      }
    }

    if (findOnly && !ticket) {
      return { ticket: null, justCreated: false };
    }

    if (!ticket) {
      ticket = await Ticket.create(
        {
          contactId: groupContact ? groupContact.id : contact.id,
          status: isGroupConversation ? "open" : "pending",
          isGroup: !!groupContact,
          unreadMessages: isGroupConversation || !incrementUnread ? 0 : 1,
          whatsappId,
          queueId: isGroupConversation ? null : queueId,
          companyId
        },
        { transaction }
      );

      justCreated = true;

      if (!isGroupConversation) {
        shouldCreateTracking = true;
      }
    }

    return { ticket, justCreated };
  });

  if (shouldCreateTracking && result.ticket) {
    await FindOrCreateATicketTrakingService({
      ticketId: result.ticket.id,
      companyId,
      whatsappId: result.ticket.whatsappId,
      userId: result.ticket.userId
    });
  }

  if (result.ticket) {
    result.ticket = await ShowTicketService(result.ticket.id, companyId);
  }

  if (result.justCreated && !isGroupConversation) {
    await incrementCounter(companyId, "ticket-create");
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
