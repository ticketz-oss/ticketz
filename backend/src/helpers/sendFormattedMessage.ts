import Ticket from "../models/Ticket";
import User from "../models/User";
import { OmniServices } from "../services/OmniServices/OmniServices";
import { verifyMessage } from "../services/WbotServices/wbotMessageListener";
import GetTicketWbot from "./GetTicketWbot";
import formatBody from "./Mustache";

const omniServices = OmniServices.getInstance();

/**
 * Sends a formatted message to a ticket's contact using the appropriate Omni driver or WhatsApp bot.
 * @param {string} message - The message to be sent.
 * @param {Ticket} ticket - The ticket to which the message is associated.
 * @param {User} [user] - The user sending the message (optional).
 * @param {boolean} [saveOnTicket=false] - Whether to save the message on the ticket.
 * @return {Promise<void>} - A promise that resolves when the message has been sent.
 * @throws {Error} - If the Omni driver is not found or if sending the message fails.
 */
export async function sendFormattedMessage(
  message: string,
  ticket: Ticket,
  user?: User,
  saveOnTicket = false
): Promise<void> {
  const messageText = formatBody(message, ticket, user);
  const omniDriver = omniServices.getOmniDriver(ticket);

  if (omniDriver) {
    await omniDriver.sendMessage(
      ticket,
      {
        type: "text",
        body: messageText
      },
      { dontSaveOnTicket: !saveOnTicket }
    );
    return;
  }

  const wbot = await GetTicketWbot(ticket);
  const queueChangedMessage = await wbot.sendMessage(
    `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
    {
      text: messageText
    }
  );

  if (!saveOnTicket) {
    return;
  }

  await verifyMessage(queueChangedMessage, ticket, ticket.contact);
}
