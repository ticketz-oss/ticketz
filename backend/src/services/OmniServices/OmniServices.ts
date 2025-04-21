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
import { IntegrationOptions } from "../IntegrationServices/IntegrationServices";
import formatBody from "../../helpers/Mustache";
import User from "../../models/User";
import { getIO } from "../../libs/socket";
import saveMediaToFile from "../../helpers/saveMediaFile";
import { DebugException } from "../../helpers/DebugException";
import AppError from "../../errors/AppError";
import { ProcessedMedia } from "../../helpers/mediaConversion";
import { FindOrCreateTicketOptions } from "../TicketServices/FindOrCreateTicketService";
import Queue from "../../models/Queue";
import { chatbotHandler } from "./ChatbotServices";

export type OmniMessage = {
  type: "text" | "image" | "video" | "audio" | "document" | "reaction";
  body?: string;
  fileName?: string;
  mediaUrl?: string;
  mimetype?: string;
  quotedMsg?: Message;
};

export interface OmniDriver {
  getName(): string;
  getDescription(): string;
  initialize(): void;
  startService(connection: Whatsapp): Promise<void>;
  getOptions(): IntegrationOptions;
  getConnection(data: any): Promise<Whatsapp>;
  findOrCreateContact(connection: Whatsapp, data: any): Promise<Contact>;
  findOrCreateTicket(
    contact: Contact,
    connection: Whatsapp,
    options: FindOrCreateTicketOptions
  ): Promise<{ ticket: Ticket; justCreated: boolean }>;
  createMessages(ticket: Ticket, data: any): Promise<Message[]>;
  getMediaProcessor(
    type: string,
    channel: string
  ): (media: Express.Multer.File) => Promise<ProcessedMedia>;
  sendMessage(ticket: Ticket, message: OmniMessage): Promise<Message[]>;
  processStatus(data: any): Promise<Message>;
  allowChatbot(ticket: Ticket): Promise<boolean>;
}

const firstBodyMutex = new Mutex();

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
      return Promise.reject(new Error(`OmniDriver ${channel} not found`));
    }

    return driver
      .getConnection(data)
      .then(connection => {
        if (!connection) {
          throw new Error("Connection not found");
        }
        driver
          .findOrCreateContact(connection, data)
          .then(contact => {
            if (!contact) {
              throw new Error("Contact not found or created");
            }

            let defaultQueue: Queue;

            if (connection.queues && connection.queues.length === 1) {
              // eslint-disable-next-line prefer-destructuring
              defaultQueue = connection.queues[0];
            }

            driver
              .findOrCreateTicket(contact, connection, { queue: defaultQueue })
              .then(({ ticket, justCreated }) => {
                if (!ticket) {
                  throw new Error("Ticket not found or not created");
                }
                driver
                  .createMessages(ticket, data)
                  .then(async messages => {
                    if (
                      ((await driver.allowChatbot(ticket)) &&
                        ticket.status === "pending" &&
                        ticket.chatbot) ||
                      justCreated
                    ) {
                      chatbotHandler(messages, driver);
                    }
                  })
                  .catch(error => {
                    if (error instanceof DebugException) {
                      logger.debug(error.message);
                      return;
                    }
                    throw error;
                  });
              })
              .catch(error => {
                if (error instanceof DebugException) {
                  logger.debug(error.message);
                  return;
                }
                throw error;
              });
          })
          .catch(error => {
            if (error instanceof DebugException) {
              logger.debug(error.message);
              return;
            }
            throw error;
          });
      })
      .catch(error => {
        if (error instanceof DebugException) {
          logger.debug(error.message);
          return;
        }
        throw error;
      });
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

          const media = await driver.getMediaProcessor(
            type,
            ticket.contact.channel
          )(originalMedia);

          fs.unlink(originalMedia.path, err => {
            if (err) {
              logger.error(`Error deleting file: ${err}`);
            }
          });

          const mediaUrl = await saveMediaToFile(
            media,
            ticket.companyId,
            ticket.id
          );

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
}
