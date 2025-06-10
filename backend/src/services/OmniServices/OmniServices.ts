/*

   DO NOT REMOVE / NÃO REMOVER

   VERSÃO EM PORTUGUÊS MAIS ABAIXO

   PROPRIETARY CODE

   Author: Claudemir Todo Bom
   Email: claudemir@todobom.com
   
   If you had access to this code, you are not allowed to
   share, copy or distribute it. You are not allowed to use
   it in your projects, create your own projects based on
   it or use it in any way without a written authorization.
   
   CÓDIGO PROPRIETÁRIO

   Autor: Claudemir Todo Bom
   Email: claudemir@todobom.com

   Se você teve acesso a este código, não está autorizado a
   compartilhá-lo, copiá-lo ou distribuí-lo. Não está autorizado
   a utilizá-lo em seus projetos, criar projetos baseados nele
   ou utilizá-lo de qualquer forma sem autorização por escrito.
   
 */

import { Request, Response } from "express";
import { Mutex } from "async-mutex";
import fs from "fs";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import {
  IntegrationMessage,
  IntegrationOptions
} from "../IntegrationServices/IntegrationServices";
import formatBody from "../../helpers/Mustache";
import User from "../../models/User";
import { getIO } from "../../libs/socket";
import saveMediaToFile from "../../helpers/saveMediaFile";
import { DebugException } from "../../helpers/DebugException";
import AppError from "../../errors/AppError";
import { MediaSource, ProcessedMedia } from "../../helpers/mediaConversion";
import { FindOrCreateTicketOptions } from "../TicketServices/FindOrCreateTicketService";
import Queue from "../../models/Queue";
import { multerPassthrough } from "../../helpers/multerPassthrough";
import { checkRating } from "../TicketServices/TicketRatingServices";
import { handleChatbot, verifyQueue } from "../QueueService/ChatbotService";
import VerifyCurrentSchedule, {
  ScheduleResult
} from "../CompanyService/VerifyCurrentSchedule";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import { cacheLayer } from "../../libs/cache";

import { SubscriptionService } from "../../ticketzPro/services/subscriptionService";

const subscriptionService = SubscriptionService.getInstance();

export type OmniMessage = {
  type: "text" | "image" | "video" | "audio" | "document" | "reaction";
  body?: string;
  fileName?: string;
  mediaUrl?: string;
  mimetype?: string;
  quotedMsg?: Message;
};

export type OmniSendMessageOptions = {
  dontSaveOnTicket?: boolean;
};

export interface OmniDriver {
  getName(): string;
  getDescription(): string;
  initialize(): void;
  startService(connection: Whatsapp): Promise<void>;
  getOptions(): IntegrationOptions;
  getConnection(data: any): Promise<Whatsapp>;
  findOrCreateContact(connection: Whatsapp, data: any): Promise<Contact>;
  getMessageText(data: any): Promise<string>;
  findOrCreateTicket(
    contact: Contact,
    connection: Whatsapp,
    options: FindOrCreateTicketOptions
  ): Promise<{ ticket: Ticket; justCreated: boolean }>;
  createMessages(ticket: Ticket, data: any): Promise<Message[]>;
  getMediaProcessor(
    type: string,
    channel: string
  ): (media: MediaSource) => Promise<ProcessedMedia>;
  sendMessage(
    ticket: Ticket,
    message: OmniMessage,
    options?: OmniSendMessageOptions
  ): Promise<Message[]>;
  processStatus(data: any): Promise<Message>;
  allowChatbot(ticket: Ticket): Promise<boolean>;
}

const firstBodyMutex = new Mutex();

export function getOmniReplyHandler(driver: OmniDriver) {
  return async function replyHandler(
    ticket: Ticket,
    reply: IntegrationMessage
  ) {
    if (ticket && reply) {
      let { mediaUrl } = reply;
      let media: ProcessedMedia;
      const type = reply.type === "gif" ? "image" : reply.type;
      if (mediaUrl && type !== "text" && !mediaUrl.startsWith("http")) {
        const processor =
          driver.getMediaProcessor(reply.type, ticket.contact.channel) ||
          multerPassthrough;

        media = await processor(mediaUrl);

        mediaUrl = await saveMediaToFile(media, ticket.companyId, ticket.id);
      }

      await driver.sendMessage(ticket, {
        type,
        body: reply.content || undefined,
        mediaUrl: mediaUrl || undefined,
        mimetype: media?.mimetype || undefined,
        fileName: media?.filename || undefined
      });
    }
  };
}

export class OmniServices {
  // eslint-disable-next-line no-use-before-define
  private static instance: OmniServices;

  private drivers: { [key: string]: OmniDriver } = {};

  private constructor() {
    logger.info("OmniServices initialized");
  }

  public static getInstance(): OmniServices {
    if (!OmniServices.instance) {
      OmniServices.instance = new OmniServices();
    }

    return OmniServices.instance;
  }

  public registerOmniDriver(driver: OmniDriver) {
    driver.initialize();
    const name = driver.getName();
    this.drivers[name] = driver;
    logger.info(`OmniDriver ${name} registered`);
  }

  public getOmniDriver(input: Ticket | Whatsapp | string): OmniDriver {
    logger.debug("OmniServices:getOmniDriver");
    const channel =
      // eslint-disable-next-line no-nested-ternary
      typeof input === "string"
        ? input
        : input instanceof Ticket
        ? input.whatsapp?.channel
        : input.channel;

    if (!channel) {
      throw new Error("Unable to determine the channel");
    }

    const driver = this.drivers[channel];
    if (!driver) {
      return null;
    }

    return driver;
  }

  public async startService(connection: Whatsapp): Promise<void> {
    logger.debug("OmniServices:startService");
    const driver = this.drivers[connection.channel];
    if (!driver) {
      throw new Error(`OmniDriver ${connection.channel} not found`);
    }

    return driver.startService(connection);
  }

  public async messageStatusHandler(channel: string, data: any) {
    logger.debug("OmniServices:messageStatusHandler");
    const driver = this.drivers[channel];
    if (!driver) {
      throw new Error(`OmniDriver ${channel} not found`);
    }

    const message = await driver.processStatus(data);

    if (!message) {
      return;
    }

    const io = getIO();
    io.to(message.ticketId.toString()).emit(
      `company-${message.companyId}-appMessage`,
      {
        action: "update",
        message
      }
    );
  }

  public async messageHandler(channel: string, data: any) {
    logger.debug({ data }, "OmniServices:messageHandler");
    const driver = this.drivers[channel];
    if (!driver) {
      Promise.reject(new Error(`OmniDriver ${channel} not found`));
      return;
    }

    try {
      const connection = await driver.getConnection(data);
      if (!connection) {
        throw new Error("Connection not found");
      }

      const { companyId } = connection;

      const contact = await driver.findOrCreateContact(connection, data);
      if (!contact) {
        throw new Error("Contact not found or created");
      }

      const unreadCacheId = `omnicontact:${connection.id}:${contact.id}:unreads`;

      const bodyMessage = await driver.getMessageText(data);

      const fromMe = false; // TODO: detect message fromMe

      let unreadMessages = 0;

      if (fromMe) {
        await cacheLayer.set(unreadCacheId, "0");
      } else {
        const unreads = await cacheLayer.get(unreadCacheId);
        unreadMessages = +unreads + 1;
        await cacheLayer.set(unreadCacheId, `${unreadMessages}`);
      }

      if (
        bodyMessage &&
        !contact.isGroup &&
        (await checkRating(bodyMessage, contact, connection))
      ) {
        return;
      }

      const scheduleType = await GetCompanySetting(
        companyId,
        "scheduleType",
        "disabled"
      );

      let currentSchedule: ScheduleResult = null;

      if (scheduleType === "company") {
        currentSchedule = await VerifyCurrentSchedule(companyId);
      }

      let defaultQueue: Queue;

      if (
        // msg.key.fromMe ||
        (contact.disableBot || currentSchedule?.inActivity === false) &&
        !contact.isGroup &&
        connection.queues.length === 1
      ) {
        // eslint-disable-next-line prefer-destructuring
        defaultQueue = connection.queues[0];
      }

      const { ticket, justCreated } = await driver.findOrCreateTicket(
        contact,
        connection,
        {
          incrementUnread: !fromMe,
          queue: defaultQueue
        }
      );
      if (!ticket) {
        throw new Error("Ticket not found or not created");
      }

      const messages = await driver.createMessages(ticket, data);

      await ticket.update({
        lastMessage: messages[0].body
      });

      if (!subscriptionService.isValid()) {
        return;
      }

      if (!(await driver.allowChatbot(ticket)) || !messages[0]) {
        return;
      }

      const replyHandler = getOmniReplyHandler(driver);

      if (justCreated) {
        // TODO: checkSchedule(ticket);
      }

      if (
        !ticket.queueId &&
        !messages[0].fromMe &&
        !ticket.userId &&
        connection.queues.length >= 1
      ) {
        await verifyQueue(replyHandler, messages[0].body, ticket, justCreated);
      }

      const dontReadTheFirstQuestion = justCreated || ticket.queue === null;

      await ticket.reload();

      if (
        justCreated &&
        connection.greetingMessage &&
        !connection.queues.length &&
        !ticket.userId &&
        !messages[0].fromMe
      ) {
        await replyHandler(ticket, {
          type: "text",
          content: formatBody(connection.greetingMessage, ticket)
        });
      }

      if (ticket.status === "pending" && (ticket.chatbot || justCreated)) {
        handleChatbot(
          ticket,
          messages[0].body,
          messages[0],
          replyHandler,
          dontReadTheFirstQuestion
        );
      }
    } catch (error) {
      if (error instanceof DebugException) {
        logger.debug(error.message);
      } else {
        throw error;
      }
    }

    Promise.resolve();
  }

  public async sendMessageFromRequest(
    ticket: Ticket,
    req: Request,
    res: Response
  ): Promise<Response> {
    logger.debug("OmniServices:sendMessageFromRequest");

    const { channel } = ticket.whatsapp;
    const driver = this.drivers[channel];
    if (!driver) {
      throw new Error(`OmniDriver ${channel} not found`);
    }

    const user = await User.findByPk(Number(req.user.id));

    let messageBody = req.body.body
      ? formatBody(req.body.body || "", ticket, user)
      : req.body.emoji || null;

    const quotedMsgId = req.body.quotedMsg?.id || req.params.messageId;

    const quotedMsg = quotedMsgId
      ? await Message.findOne({
          where: {
            id: quotedMsgId,
            ticketId: ticket.id
          }
        })
      : undefined;

    const medias = req.files as Express.Multer.File[];
    if (medias) {
      await Promise.all(
        medias.map(async originalMedia => {
          const body = await firstBodyMutex.runExclusive(async () => {
            if (messageBody) {
              const tmpBody = messageBody;
              messageBody = null;
              return tmpBody;
            }
            return null;
          });

          let type =
            (originalMedia.mimetype.split("/")[0] as
              | "image"
              | "video"
              | "audio"
              | "document") || "document";

          const processor =
            driver.getMediaProcessor(type, ticket.contact.channel) ||
            multerPassthrough;

          const media = await processor(originalMedia);

          const mediaUrl = await saveMediaToFile(
            media,
            ticket.companyId,
            ticket.id
          );

          fs.unlink(originalMedia.path, err => {
            if (err) {
              logger.error(`Error deleting file: ${err}`);
            }
          });

          if (!["image", "video", "audio", "document"].includes(type)) {
            type = "document";
          }

          const messageData: OmniMessage = {
            type,
            mediaUrl,
            mimetype: media.mimetype,
            fileName: media.filename,
            body,
            quotedMsg
          };

          await driver.sendMessage(ticket, messageData);
        })
      );
    }

    if (messageBody) {
      const messageData: OmniMessage = {
        type: req.body.emoji ? "reaction" : "text",
        body: messageBody,
        quotedMsg
      };
      try {
        await driver.sendMessage(ticket, messageData);
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        if (error instanceof DebugException) {
          logger.debug(error.message);
          throw new AppError("Error sending message", 500);
        }
        throw error;
      }
    }

    return res.send();
  }

  // eslint-disable-next-line class-methods-use-this
  public convertIntegrationMessage(message: IntegrationMessage): OmniMessage {
    const omniMessage: OmniMessage = {
      type: message.type === "gif" ? "video" : message.type,
      body: message.content,
      mediaUrl: message.mediaUrl
    };

    return omniMessage;
  }
}
