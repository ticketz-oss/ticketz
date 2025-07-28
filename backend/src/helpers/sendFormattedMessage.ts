import Ticket from "../models/Ticket";
import User from "../models/User";
import Whatsapp from "../models/Whatsapp";
import { OmniServices } from "../services/OmniServices/OmniServices";
import { getJidOf } from "../services/WbotServices/getJidOf";
import { verifyMessage } from "../services/WbotServices/wbotMessageListener";
import GetTicketWbot from "./GetTicketWbot";
import formatBody from "./Mustache";

const omniServices = OmniServices.getInstance();

/**
 * Options for sending a formatted message to a ticket's contact.
 * @typedef {Object} SendFormattedMessageOptions
 * @property {User|null} [user=null] - The user sending the message (optional).
 * @property {boolean} [dontSaveOnTicket=false] - Whether to prevent saving the message on the ticket.
 * @property {boolean} [dontReopen=false] - Whether to prevent reopening the ticket after sending the message.
 */
type SendFormattedMessageOptions = {
  user?: User | null;
  dontSaveOnTicket?: boolean;
  dontReopen?: boolean;
};

/**
 * Sends a formatted message to a ticket's contact using the appropriate Omni driver or WhatsApp bot.
 * @param {string} message - The message to be sent.
 * @param {Ticket} ticket - The ticket to which the message is associated.
 * @param {SendFormattedMessageOptions} [options={}] - Options for sending the message.
 * @return {Promise<void>} - A promise that resolves when the message has been sent.
 * @throws {Error} - If the Omni driver is not found or if sending the message fails.
 */
export async function sendFormattedMessage(
  message: string,
  ticket: Ticket,
  { user, dontSaveOnTicket, dontReopen }: SendFormattedMessageOptions = {}
): Promise<void> {
  const messageText = formatBody(message, ticket, user);
  const omniDriver = omniServices.getOmniDriver(ticket);

  const connection = await Whatsapp.findByPk(ticket.whatsappId);

  if (!connection) {
    throw new Error("Connection not found for the ticket.");
  }

  if (connection.status !== "CONNECTED") {
    throw new Error("Connection is not connected.");
  }

  if (omniDriver) {
    if (await omniDriver.allowChatbot(ticket)) {
      await omniDriver.sendMessage(
        ticket,
        {
          type: "text",
          body: messageText
        },
        { dontSaveOnTicket, dontReopen }
      );
    }
    return;
  }

  const wbot = await GetTicketWbot(ticket);
  const queueChangedMessage = await wbot.sendMessage(getJidOf(ticket), {
    text: messageText
  });

  if (dontSaveOnTicket) {
    return;
  }

  await verifyMessage(
    queueChangedMessage,
    ticket,
    ticket.contact,
    user?.id,
    dontReopen
  );
}
