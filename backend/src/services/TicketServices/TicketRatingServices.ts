import { Op } from "sequelize";
import Ticket from "../../models/Ticket";
import TicketTraking from "../../models/TicketTraking";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import UserRating from "../../models/UserRating";
import { logger } from "../../utils/logger";
import { sendFormattedMessage } from "../../helpers/sendFormattedMessage";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import Contact from "../../models/Contact";
import Whatsapp from "../../models/Whatsapp";
import User from "../../models/User";
import Queue from "../../models/Queue";
import { updateTicket } from "./UpdateTicketService";

async function handleRating(
  rate: number,
  ticket: Ticket,
  ticketTraking: TicketTraking
) {
  const whatsapp = await ShowWhatsAppService(
    ticket.whatsappId,
    ticket.companyId
  );

  let finalRate = rate;

  if (rate < 1) {
    finalRate = 1;
  }
  if (rate > 5) {
    finalRate = 5;
  }

  await UserRating.create({
    ticketId: ticketTraking.ticketId,
    companyId: ticketTraking.companyId,
    userId: ticketTraking.userId,
    rate: finalRate
  });

  ticketTraking.update({
    rated: true
  });

  const complationMessage =
    whatsapp.complationMessage.trim() || "Atendimento finalizado";

  sendFormattedMessage(complationMessage, ticket);
}

/**
 * Check if the user has a pending rating process for a closed ticket and process the rating received
 * @param {string} message - The message containing the rating or command.
 * @param {Contact} contact - The contact associated with the rating.
 * @param {Whatsapp} whatsapp - The connection instance associated with the contact.
 * @return {Promise<boolean>} - Returns true if the rating was processed, false otherwise.
 */
export async function checkRating(
  message: string,
  contact: Contact,
  whatsapp: Whatsapp
): Promise<boolean> {
  const userRatingEnabled =
    (await GetCompanySetting(contact.companyId, "userRating", "")) ===
    "enabled";

  const ticketTracking =
    userRatingEnabled &&
    (await TicketTraking.findOne({
      where: {
        whatsappId: whatsapp.id,
        rated: false,
        expired: false,
        ratingAt: { [Op.not]: null }
      },
      include: [
        {
          model: Ticket,
          where: {
            status: "closed",
            contactId: contact.id
          },
          include: [
            {
              model: Contact
            },
            {
              model: User
            },
            {
              model: Queue
            },
            {
              model: Whatsapp
            }
          ]
        }
      ]
    }));

  if (ticketTracking) {
    try {
      /**
       * Tratamento para avaliação do atendente
       */

      logger.debug(
        { ticketTracking },
        `start handling tracking rating for ticket ${ticketTracking.ticketId}`
      );

      const rate = Number(message);

      if (Number.isFinite(rate)) {
        logger.debug(
          `received rate ${rate} for ticket ${ticketTracking.ticketId}`
        );
        handleRating(rate, ticketTracking.ticket, ticketTracking);
        return true;
      }
      if (message.trim() === "!") {
        // abort rating and reopen ticket
        logger.debug(
          `ticket ${ticketTracking.ticketId} reopen by contact request`
        );
        ticketTracking.update({
          ratingAt: null
        });
        updateTicket(
          ticketTracking.ticket,
          {
            status: "open",
            userId: ticketTracking.userId
          },
          true
        );
        sendFormattedMessage("Atendimento reaberto", ticketTracking.ticket);
        return true;
      }
      // cancel rating
      logger.debug(
        `rating of ticket ${ticketTracking.ticketId} canceled by wrong rate ${message}`
      );
      ticketTracking.update({
        expired: true
      });
      sendFormattedMessage(
        "Avaliação cancelada",
        ticketTracking.ticket,
        null,
        false
      );
      if (message.length < 10) {
        return true;
      }
    } catch (e) {
      logger.error({ message: e.message }, "Error handling rating");
    }
  }
  return false;
}
