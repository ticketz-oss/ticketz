/*

   DO NOT REMOVE / NÃO REMOVER

   VERSÃO EM PORTUGUÊS MAIS ABAIXO

   
   BASIC LICENSE INFORMATION:

   Author: Claudemir Todo Bom
   Email: claudemir@todobom.com
   
   Licensed under the AGPLv3 as stated on LICENSE.md file
   
   Any work that uses code from this file is obligated to 
   give access to its source code to all of its users (not only
   the system's owner running it)
   
   EXCLUSIVE LICENSE to use on closed source derived work can be
   purchased from the author and put at the root of the source
   code tree as proof-of-purchase.



   INFORMAÇÕES BÁSICAS DE LICENÇA

   Autor: Claudemir Todo Bom
   Email: claudemir@todobom.com

   Licenciado sob a licença AGPLv3 conforme arquivo LICENSE.md
    
   Qualquer sistema que inclua este código deve ter o seu código
   fonte fornecido a todos os usuários do sistema (não apenas ao
   proprietário da infraestrutura que o executa)
   
   LICENÇA EXCLUSIVA para uso em produto derivado em código fechado
   pode ser adquirida com o autor e colocada na raiz do projeto
   como prova de compra. 
   
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

export type OmniMessage = {
  type: "text" | "image" | "video" | "audio" | "document";
  body?: string;
  fileName?: string;
  mediaUrl?: string;
  mimetype?: string;
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

  public async messageHandler(channel: string, data: any) {
    logger.debug("OmniServices:messageHandler");
    const driver = this.drivers[channel];
    if (!driver) {
      throw new Error(`OmniDriver ${channel} not found`);
    }

    const connection = await driver.getConnection(data);

    if (!connection) {
      throw new Error("Connection not found");
    }

    const contact = await driver.findOrCreateContact(connection, data);

    if (!contact) {
      throw new Error("Contact not found or created");
    }

    const { ticket, justCreated } = await driver.findOrCreateTicket(
      contact,
      connection
    );

    if (!ticket) {
      throw new Error("Ticket not found or not created");
    }

    await driver.createMessages(ticket, data);
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
            ticket
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
            body
          };

          await driver.sendMessage(ticket, messageData);
        })
      );
    }

    if (messageBody) {
      const messageData: OmniMessage = {
        type: "text",
        body: messageBody
      };
      const message = await driver.sendMessage(ticket, messageData);

      if (!message) {
        throw new Error("Message not created");
      }
    }

    return res.send();
  }
}
