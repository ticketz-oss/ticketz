import axios from "axios";
import * as Sentry from "@sentry/node";
import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import Message from "../../models/Message";
import CreateMessageService from "../MessageServices/CreateMessageService";
import { logger } from "../../utils/logger";
import formatBody from "../../helpers/Mustache";
import User from "../../models/User";

interface Request {
  body: string;
  ticket: Ticket;
  userId?: number;
}

const GRAPH_API_URL = "https://graph.facebook.com/v19.0";

const SendInstagramMessage = async ({
  body,
  ticket,
  userId
}: Request): Promise<void> => {
  const { whatsapp } = ticket;

  if (!whatsapp) {
    throw new AppError("ERR_WAPP_NOT_FOUND");
  }

  const {
    facebookUserToken,
    instagramBusinessAccountId,
    facebookPageUserId: pageId
  } = whatsapp;

  const igPageId = instagramBusinessAccountId || pageId;

  if (!facebookUserToken || !igPageId) {
    throw new AppError("ERR_INSTAGRAM_NOT_CONFIGURED");
  }

  const user = userId && (await User.findByPk(userId));
  const formattedBody = formatBody(body, ticket, user);

  try {
    const response = await axios.post(
      `${GRAPH_API_URL}/${igPageId}/messages`,
      {
        recipient: { id: ticket.contact.number },
        message: { text: formattedBody }
      },
      {
        headers: {
          Authorization: `Bearer ${facebookUserToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    const messageId = response.data?.message_id;

    const messageData = {
      id: messageId || `instagram-${Date.now()}`,
      ticketId: ticket.id,
      contactId: undefined,
      body: formattedBody,
      fromMe: true,
      read: true,
      mediaUrl: null,
      mediaType: null,
      ack: 1,
      dataJson: JSON.stringify(response.data)
    };

    await CreateMessageService({
      messageData,
      companyId: ticket.companyId
    });

    await ticket.update({ lastMessage: formattedBody });
  } catch (err) {
    Sentry.captureException(err);
    logger.error({ err }, "SendInstagramMessage: error sending message");
    throw new AppError("ERR_SENDING_INSTAGRAM_MSG");
  }
};

export default SendInstagramMessage;
