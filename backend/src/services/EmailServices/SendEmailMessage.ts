import nodemailer from "nodemailer";
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

const SendEmailMessage = async ({
  body,
  ticket,
  userId
}: Request): Promise<void> => {
  const { whatsapp } = ticket;

  if (!whatsapp) {
    throw new AppError("ERR_WAPP_NOT_FOUND");
  }

  const {
    emailSmtpHost,
    emailSmtpPort,
    emailSmtpUser,
    emailSmtpPass,
    emailFrom
  } = whatsapp;

  if (!emailSmtpHost || !emailSmtpUser || !emailSmtpPass) {
    throw new AppError("ERR_EMAIL_NOT_CONFIGURED");
  }

  const user = userId && (await User.findByPk(userId));
  const formattedBody = formatBody(body, ticket, user);

  const recipientEmail = ticket.contact.email || ticket.contact.number;
  if (!recipientEmail || !recipientEmail.includes("@")) {
    throw new AppError("ERR_EMAIL_INVALID_RECIPIENT");
  }

  const transporter = nodemailer.createTransport({
    host: emailSmtpHost,
    port: emailSmtpPort || 587,
    secure: Number(emailSmtpPort || 587) === 465,
    auth: {
      user: emailSmtpUser,
      pass: emailSmtpPass
    },
    tls: { rejectUnauthorized: false }
  });

  try {
    const info = await transporter.sendMail({
      from: emailFrom || emailSmtpUser,
      to: recipientEmail,
      subject: `Re: ${ticket.contact.name} [#${ticket.id}]`,
      text: formattedBody,
      html: formattedBody.replace(/\n/g, "<br>")
    });

    const messageId = info.messageId || `email-${Date.now()}`;

    const messageData = {
      id: messageId,
      ticketId: ticket.id,
      contactId: undefined,
      body: formattedBody,
      fromMe: true,
      read: true,
      mediaUrl: null,
      mediaType: null,
      ack: 1,
      dataJson: JSON.stringify({ messageId: info.messageId, accepted: info.accepted })
    };

    await CreateMessageService({
      messageData,
      companyId: ticket.companyId
    });

    await ticket.update({ lastMessage: formattedBody });
  } catch (err) {
    Sentry.captureException(err);
    logger.error({ err }, "SendEmailMessage: error");
    throw new AppError("ERR_SENDING_EMAIL_MSG");
  }
};

export default SendEmailMessage;
