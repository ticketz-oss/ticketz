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

import { Op } from "sequelize";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import { IntegrationOptions } from "../IntegrationServices/IntegrationServices";
import { OmniDriver } from "./OmniServices";

export type NotificamehubVisitor = {
  name: string;
  firstName: string;
  lastName: string;
  picture: string;
};

export type NotificamehubGroup = {
  id: string;
  name: string;
};

export type NotificamehubContent = {
  type: "text" | "photo";
  text?: string;
  fileUrl?: string;
  fileMimeType?: string;
  fileName?: string;
};

export type NotificamehubMessage = {
  id: string;
  from: string;
  to: string;
  direction: "IN" | "OUT";
  channel: string;
  visitor: NotificamehubVisitor;
  group: NotificamehubGroup;
  isGroup: boolean;
  contents: NotificamehubContent[];
  timestamp: string;
};

export class NotificamehubDriver implements OmniDriver {
  private name = "notificamehub";

  private description = "Notificamehub";

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  // eslint-disable-next-line class-methods-use-this
  initialize(): void {
    // do nothing
  }

  // eslint-disable-next-line class-methods-use-this
  getOptions(): IntegrationOptions {
    return {
      fields: [
        {
          name: "hubToken",
          title: "Hub Token",
          description: "Token to access the Notificamehub API",
          type: "text",
          required: true
        },
        {
          name: "channelId",
          title: "Channel ID",
          description: "Channel ID to access the Notificamehub API",
          type: "text",
          required: true
        }
      ]
    };
  }

  private static normalizeMessage(data: any): NotificamehubMessage {
    const message = data?.message || data?.body?.message;

    if (!message) {
      logger.error({ data }, "Invalid notificamehub data");
      throw new Error("Invalid notificamehub data");
    }

    return message;
  }

  // eslint-disable-next-line class-methods-use-this
  async getConnection(data: any): Promise<Whatsapp> {
    const message = NotificamehubDriver.normalizeMessage(data);

    const whatsapp = await Whatsapp.findOne({
      where: {
        session: {
          [Op.like]: `%${message.to}%`
        }
      }
    });

    return whatsapp;
  }

  // eslint-disable-next-line class-methods-use-this
  async findOrCreateContact(connection: Whatsapp, data: any): Promise<Contact> {
    const message = NotificamehubDriver.normalizeMessage(data);

    const contact = await Contact.findOne({
      where: {
        companyId: connection.companyId,
        channel: message.channel,
        number: message.from
      }
    });

    if (contact) {
      return contact;
    }

    return Contact.create({
      companyId: connection.companyId,
      name: message.visitor.name || message.from,
      channel: message.channel,
      number: message.from
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async findOrCreateTicket(contact: Contact, connection: Whatsapp): Promise<Ticket> {
    return null;
  }

  // eslint-disable-next-line class-methods-use-this
  async createMessage(contact: Contact, connection: Whatsapp, data: any): Promise<Message> {
    return null;
  }
}
