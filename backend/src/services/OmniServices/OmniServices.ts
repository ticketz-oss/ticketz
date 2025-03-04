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

export type OmniMessage = {
  type: "text" | "image" | "video" | "audio" | "document";
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
    connection: Whatsapp
  ): Promise<{ ticket: Ticket; justCreated: boolean }>;
  createMessages(ticket: Ticket, data: any): Promise<Message[]>;
  sendMessage(ticket: Ticket, message: OmniMessage): Promise<Message[]>;
  processStatus(data: any): Promise<Message>;
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

  private static async automationHandler(
    messages: Message[],
    driver: OmniDriver
  ) {
    logger.debug("OmniServices:automationHandler");
    messages.forEach(message => {
      // do nothing
    });
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
            driver
              .findOrCreateTicket(contact, connection)
              .then(({ ticket, justCreated }) => {
                if (!ticket) {
                  throw new Error("Ticket not found or not created");
                }
                driver
                  .createMessages(ticket, data)
                  .then(messages => {
                    OmniServices.automationHandler(messages, driver);
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
      : null;

    const quotedMsg = req.body.quotedMsg
      ? await Message.findOne({
          where: {
            id: req.body.quotedMsg.id,
            ticketId: req.body.quotedMsg.ticketId
          }
        })
      : undefined;

    const medias = req.files as Express.Multer.File[];
    if (medias) {
      await Promise.all(
        medias.map(async media => {
          const body = await firstBodyMutex.runExclusive(async () => {
            if (messageBody) {
              const tmpBody = messageBody;
              messageBody = null;
              return tmpBody;
            }
            return null;
          });

          const mediaUrl = await saveMediaToFile(
            {
              data: fs.createReadStream(media.path),
              mimetype: media.mimetype,
              filename: media.originalname
            },
            ticket.companyId,
            ticket.id
          );

          let type = media.mimetype.split("/")[0] as
            | "image"
            | "video"
            | "audio"
            | "document";

          if (!["image", "video", "audio", "document"].includes(type)) {
            type = "document";
          }

          const messageData: OmniMessage = {
            type,
            mediaUrl,
            mimetype: media.mimetype,
            fileName: media.originalname,
            body,
            quotedMsg
          };

          await driver.sendMessage(ticket, messageData);
        })
      );
    }

    if (messageBody) {
      const messageData: OmniMessage = {
        type: "text",
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
