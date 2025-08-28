import { head, isNil } from "lodash";
import { Sequelize } from "sequelize-typescript";
import { checkCompanyCompliant } from "../../helpers/CheckCompanyCompliant";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import { emojiNumbers } from "../../helpers/emojiNumbers";
import formatBody from "../../helpers/Mustache";
import Contact from "../../models/Contact";
import Integration from "../../models/Integration";
import Queue from "../../models/Queue";
import QueueOption from "../../models/QueueOption";
import Ticket from "../../models/Ticket";
import {
  IntegrationMessage,
  IntegrationMessageMetadata,
  IntegrationMessageTypes,
  IntegrationServices,
  ReplyHandler
} from "../IntegrationServices/IntegrationServices";
import UpdateTicketService, {
  updateTicket
} from "../TicketServices/UpdateTicketService";
import VerifyCurrentSchedule, {
  ScheduleResult
} from "../CompanyService/VerifyCurrentSchedule";
import { outOfHoursCache } from "../../helpers/outOfHoursCache";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import Message from "../../models/Message";
import Whatsapp from "../../models/Whatsapp";
import ShowContactService from "../ContactServices/ShowContactService";
import IntegrationSession from "../../models/IntegrationSession";
import { logger } from "../../utils/logger";
import { deferredTasks } from "../../helpers/deferredTasks";
import { getFileDetails } from "../../helpers/fileDetails";
import { _t } from "../TranslationServices/i18nService";

import { SubscriptionService } from "../../ticketzPro/services/subscriptionService";

const subscriptionService = SubscriptionService.getInstance();

const integrationServices = IntegrationServices.getInstance();
const downloadMediaTasks = deferredTasks();

export async function sendMenu(
  replyHandler: ReplyHandler,
  ticket: Ticket,
  currentOption: Queue | QueueOption,
  sendBackToMain = true
) {
  const message =
    currentOption instanceof Queue
      ? (currentOption as Queue).greetingMessage
      : (currentOption as QueueOption).message;

  const botText = async () => {
    const showNumericIcons =
      currentOption.options.length <= 10 &&
      (await GetCompanySetting(
        ticket.companyId,
        "showNumericIcons",
        "disabled"
      )) === "enabled";

    let options = "";

    currentOption.options.forEach(option => {
      options += showNumericIcons
        ? `${emojiNumbers(Number(option.option))} - `
        : `*[ ${option.option} ]* - `;
      options += `${option.title}\n`;
    });

    if (sendBackToMain) {
      const mainMenuPhrase = _t("Back to Main Menu", ticket);
      options += showNumericIcons
        ? `\n#️⃣ - ${mainMenuPhrase}`
        : `\n*[ # ]* - ${mainMenuPhrase}`;
    }

    const textMessage = {
      text: formatBody(`${message}\n\n${options}`, ticket)
    };

    await replyHandler(ticket, {
      type: "text",
      content: textMessage.text
    });
  };

  botText();
}

export async function startQueue(
  replyHandler: ReplyHandler,
  ticket: Ticket,
  queue: Queue = null,
  sendBackToMain = true,
  firstMessage: string = null
) {
  if (!queue) {
    queue = await Queue.findByPk(ticket.queueId, {
      include: [
        {
          model: QueueOption,
          as: "options",
          where: { parentId: null },
          required: false
        }
      ],
      order: [["options", "option", "ASC"]]
    });
  }

  const { companyId } = ticket;
  let chatbot = false;

  const integration = await Integration.findOne({
    where: {
      queueId: queue.id
    }
  });

  if (integration) {
    const contact =
      ticket.contact || (await Contact.findByPk(ticket.contactId));

    const integrationMetadata: IntegrationMessageMetadata = {
      channel: contact.channel,
      from: contact,
      ticketId: ticket.id,
      firstMessage
    };

    await UpdateTicketService({
      ticketData: { queueId: queue.id, chatbot: true, status: "pending" },
      ticketId: ticket.id,
      companyId: ticket.companyId,
      dontRunChatbot: true
    });

    await ticket.reload();

    const { message: reply } = await integrationServices.startSession(
      integration,
      ticket,
      null,
      integrationMetadata,
      replyHandler
    );

    if (reply) {
      await replyHandler(ticket, reply);
    }
    return;
  }

  if (queue?.options) {
    chatbot = queue.options.length > 0;
  }
  await UpdateTicketService({
    ticketData: { queueId: queue.id, chatbot, status: "pending" },
    ticketId: ticket.id,
    companyId: ticket.companyId,
    dontRunChatbot: true
  });

  // do not process queue if company is not compliant with payments
  if (!(await checkCompanyCompliant(companyId))) {
    return;
  }

  const { filePath, fileType } = getFileDetails(queue.mediaPath);

  /* Tratamento para envio de mensagem quando a fila está fora do expediente */
  let currentSchedule: ScheduleResult;

  const scheduleType = await GetCompanySetting(
    companyId,
    "scheduleType",
    "disabled"
  );

  if (scheduleType === "queue") {
    currentSchedule = await VerifyCurrentSchedule(ticket.companyId, queue.id);

    if (
      !isNil(currentSchedule) &&
      (!currentSchedule || currentSchedule.inActivity === false)
    ) {
      outOfHoursCache().set(`ticket-${ticket.id}`, true);
      const outOfHoursMessage =
        queue.outOfHoursMessage?.trim() ||
        "Estamos fora do horário de expediente";

      await replyHandler(ticket, {
        type: "text",
        content: formatBody(outOfHoursMessage, ticket)
      });

      const outOfHoursAction = await GetCompanySetting(
        companyId,
        "outOfHoursAction",
        "pending"
      );
      await UpdateTicketService({
        ticketData: {
          queueId: queue.id,
          chatbot: false,
          status: outOfHoursAction
        },
        ticketId: ticket.id,
        companyId: ticket.companyId
      });
      return;
    }
  }

  if (queue.options.length === 0) {
    if (queue.greetingMessage?.trim() || filePath) {
      const body = formatBody(queue.greetingMessage.trim(), ticket);

      await replyHandler(ticket, {
        type: filePath ? fileType : "text",
        content: body,
        mediaUrl: filePath || undefined
      });
    }
  } else {
    if (filePath) {
      await replyHandler(ticket, {
        type: fileType,
        mediaUrl: filePath
      });
    }
    sendMenu(replyHandler, ticket, queue, sendBackToMain);
  }
}

export async function verifyQueue(
  replyHandler: ReplyHandler,
  message: string | null,
  ticket: Ticket,
  ignoreMessage = false
) {
  const { queues, greetingMessage, transferMessage } =
    await ShowWhatsAppService(ticket.whatsappId!);

  if (queues.length === 1) {
    await startQueue(replyHandler, ticket, head(queues), false, message);
    return;
  }

  const showNumericIcons =
    queues.length <= 10 &&
    (await GetCompanySetting(
      ticket.companyId,
      "showNumericIcons",
      "disabled"
    )) === "enabled";

  const selectedOption = Number(message);
  const choosenQueue = selectedOption ? queues[+selectedOption - 1] : null;

  const botText = async () => {
    let options = "";

    queues.forEach((queue, index) => {
      options += showNumericIcons
        ? `${emojiNumbers(index + 1)} - `
        : `*[ ${index + 1} ]* - `;
      options += `${queue.name}\n`;
    });

    await replyHandler(ticket, {
      type: "text",
      content: formatBody(`${greetingMessage}\n\n${options}`, ticket)
    });
  };

  const chatbotAutoExit =
    (await GetCompanySetting(
      ticket.companyId,
      "chatbotAutoExit",
      "disabled"
    )) === "enabled";

  if (!ignoreMessage && choosenQueue) {
    await startQueue(replyHandler, ticket, choosenQueue);
  } else if (!ignoreMessage && !choosenQueue && chatbotAutoExit) {
    await updateTicket(ticket, { chatbot: false });
    if (transferMessage) {
      await replyHandler(ticket, {
        type: "text",
        content: formatBody(transferMessage, ticket)
      });
    }
  } else {
    botText();
    await updateTicket(ticket, {
      chatbot: true
    });
  }
}

export async function checkIntegration(
  source: Message | Ticket,
  replyHandler: ReplyHandler
) {
  const message = source instanceof Message ? source : null;
  const ticket = source instanceof Ticket ? source : null;

  if (!message && !ticket) {
    throw new Error("checkIntegration: Invalid source");
  }

  const contactId = message?.contactId || ticket.contactId;
  const contact = await ShowContactService(contactId);

  const integrationSession = await IntegrationSession.findOne({
    where: {
      ticketId: message?.ticketId || ticket.id
    },
    include: [
      {
        model: Integration,
        as: "integration"
      }
    ],
    order: [["id", "DESC"]]
  });

  if (integrationSession) {
    let integrationMessage: IntegrationMessage = null;
    const metadata: IntegrationMessageMetadata = {
      channel: contact.channel,
      from: contact.toJSON(),
      ticketId: integrationSession.ticketId
    };

    if (message) {
      if (message.mediaType === "wait") {
        const mediaPromise = downloadMediaTasks.get(
          `media-${message.ticketId}-${message.id}`
        );
        if (mediaPromise) {
          await mediaPromise;
        }
        await message.reload();
      }
      metadata.customPayload = JSON.parse(message.dataJson);
      integrationMessage = { type: "text" };
      const messagedetails = {
        id: message.id,
        body: message.body,
        mediaType: message.mediaType,
        messageMedia: message.mediaUrl
      };
      logger.debug({ messagedetails }, "Integration message details");
      integrationMessage.content = message.body;
      integrationMessage.type =
        (message.mediaType as IntegrationMessageTypes) || "text";
      if (message.mediaUrl) {
        integrationMessage.mediaUrl = message.mediaUrl;
      }
    }

    await integrationServices.continueSession(
      integrationSession,
      integrationMessage,
      metadata,
      replyHandler
    );

    return true;
  }
  return false;
}

/**
 * Handles the chatbot interaction for a ticket.
 * This function processes the user's message, updates the ticket's queue option,
 * and sends the appropriate responses based on the current queue option.
 * @param {Ticket} ticket - The ticket object representing the user's interaction.
 * @param {string} messageBody - The user's message body.
 * @param {Message} newMessage - The new message object to be processed.
 * @param {ReplyHandler} replyHandler - The function to handle sending replies.
 * @param {boolean} [dontReadTheFirstQuestion=false] - If true, skips reading the first question in the queue.
 * @return {Promise<void>} - A promise that resolves when the chatbot interaction is handled.
 */
export async function handleChatbot(
  ticket: Ticket,
  messageBody: string,
  newMessage: Message,
  replyHandler: ReplyHandler,
  dontReadTheFirstQuestion = false
) {
  if (!subscriptionService.isValid()) {
    return;
  }

  const queue = await Queue.findByPk(ticket.queueId, {
    include: [
      {
        model: QueueOption,
        as: "options",
        where: { parentId: null }
      }
    ],
    order: [["options", "option", "ASC"]]
  });

  if (await checkIntegration(newMessage, replyHandler)) {
    return;
  }

  if (messageBody === "#") {
    // voltar para o menu inicial
    await updateTicket(ticket, {
      queueOptionId: null,
      chatbot: false,
      queueId: null
    });
    await verifyQueue(replyHandler, messageBody, ticket);
    return;
  }

  // voltar para o menu anterior
  if (!isNil(queue) && !isNil(ticket.queueOptionId) && messageBody === "#") {
    const option = await QueueOption.findByPk(ticket.queueOptionId);
    await ticket.update({ queueOptionId: option?.parentId });

    // escolheu uma opção
  } else if (!isNil(queue) && !isNil(ticket.queueOptionId)) {
    const count = await QueueOption.count({
      where: { parentId: ticket.queueOptionId }
    });
    let option: QueueOption = null;
    if (count === 1) {
      option = await QueueOption.findOne({
        where: { parentId: ticket.queueOptionId }
      });
    } else {
      option = await QueueOption.findOne({
        where: {
          option: messageBody || "",
          parentId: ticket.queueOptionId
        }
      });
    }
    if (option) {
      await ticket.update({ queueOptionId: option?.id });
    }
  } else if (
    !isNil(queue) &&
    isNil(ticket.queueOptionId) &&
    !dontReadTheFirstQuestion
  ) {
    const option = queue?.options.find(o => o.option === messageBody);
    if (option) {
      await ticket.update({ queueOptionId: option?.id });
    } else if (
      (await GetCompanySetting(
        ticket.companyId,
        "chatbotAutoExit",
        "disabled"
      )) === "enabled"
    ) {
      // message didn't identified an option and company setting to exit chatbot
      await updateTicket(ticket, { chatbot: false });
      const whatsapp = await Whatsapp.findByPk(ticket.whatsappId);
      if (whatsapp.transferMessage) {
        await replyHandler(ticket, {
          type: "text",
          content: formatBody(`${whatsapp.transferMessage}`, ticket)
        });
      }
    } else {
      await sendMenu(replyHandler, ticket, queue);
    }
  }

  await ticket.reload();

  if (!isNil(queue) && !isNil(ticket.queueOptionId)) {
    const currentOption = await QueueOption.findByPk(ticket.queueOptionId, {
      include: [
        {
          model: Queue,
          as: "forwardQueue",
          include: [
            {
              model: QueueOption,
              as: "options",
              where: { parentId: null },
              required: false
            }
          ]
        },
        {
          model: QueueOption,
          as: "options",
          required: false
        }
      ],
      order: [
        [
          Sequelize.cast(
            Sequelize.col("forwardQueue.options.option"),
            "INTEGER"
          ),
          "ASC"
        ],
        [Sequelize.cast(Sequelize.col("options.option"), "INTEGER"), "ASC"]
      ]
    });

    const { filePath, fileType } = getFileDetails(currentOption.mediaPath);

    if (currentOption.exitChatbot || currentOption.forwardQueueId) {
      const text = formatBody(`${currentOption.message.trim()}`, ticket);

      if (filePath || text) {
        await replyHandler(ticket, {
          type: filePath ? fileType : "text",
          mediaUrl: filePath || undefined,
          content: text || undefined
        });
      }

      if (currentOption.exitChatbot) {
        await updateTicket(ticket, {
          chatbot: false,
          queueOptionId: null
        });
      } else if (currentOption.forwardQueueId) {
        await updateTicket(ticket, {
          queueOptionId: null,
          chatbot: false,
          queueId: currentOption.forwardQueueId
        });
        await startQueue(replyHandler, ticket, currentOption.forwardQueue);
        await checkIntegration(newMessage, replyHandler);
      }
      return;
    }

    if (filePath) {
      await replyHandler(ticket, {
        type: fileType,
        mediaUrl: filePath
      });
    }

    if (currentOption.options.length > -1) {
      sendMenu(replyHandler, ticket, currentOption);
    }
  }
}
