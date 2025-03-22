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

import GetTicketWbot from "../../helpers/GetTicketWbot";
import { makeRandomId } from "../../helpers/MakeRandomId";
import Integration from "../../models/Integration";
import IntegrationSession from "../../models/IntegrationSession";
import Ticket from "../../models/Ticket";
import { logger } from "../../utils/logger";
import { wbotReplyHandler } from "../WbotServices/wbotMessageListener";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import Contact from "../../models/Contact";
import { CreateInternalMessageService } from "../MessageServices/CreateInternalMessageService";

export type IntegrationOptions = {
  fields: {
    name: string;
    title: string;
    description: string;
    lgWidth?: number;
    type: "text" | "textarea" | "select" | "checkbox";
    options?: { value: string; label: string }[];
    required: boolean;
  }[];
};

export type IntegrationMessageTypes =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "gif"
  | "document";

export type IntegrationMessage = {
  type: IntegrationMessageTypes;
  content?: string;
  mediaUrl?: string;
};

export type IntegrationMessageMetadata = {
  backendUrl?: string;
  channel: string;
  from: Contact;
  ticketId: number;
  customPayload?: any;
  firstMessage?: string;
  extraParams?: any;
};

export interface ReplyHandler {
  (ticket: Ticket, reply: IntegrationMessage): Promise<void>;
}

export interface IntegrationDriver {
  getName(): string;
  getDescription(): string;
  initialize(): void;
  getOptions(): IntegrationOptions;
  startSession(
    ticket: Ticket,
    message: IntegrationMessage,
    metadata: IntegrationMessageMetadata,
    token: string,
    replyHandler: ReplyHandler,
    options: any
  ): Promise<{ sessionId: string; message?: IntegrationMessage; data?: any }>;
  continueSession(
    integrationSession: IntegrationSession,
    message: IntegrationMessage,
    metadata: IntegrationMessageMetadata,
    replyHandler: ReplyHandler
  ): Promise<void>;
  endSession(integrationSession: IntegrationSession): Promise<void>;
}

export type IntegrationWebhookRequest = {
  action?: "endSession" | "updateTicket" | "note";
  message?: IntegrationMessage;
  ticketData?: any;
};

const reloadIntegrationSession = async (
  integrationSession: IntegrationSession
) => {
  await integrationSession.reload({
    include: [
      {
        model: Integration,
        as: "integration"
      },
      {
        model: Ticket,
        as: "ticket",
        include: ["contact"]
      }
    ]
  });
};

const updateTicket = async (ticket: Ticket, ticketData: any) => {
  const { companyId, id: ticketId } = ticket;

  await UpdateTicketService({ ticketData, ticketId, companyId });
};

export class IntegrationServices {
  // eslint-disable-next-line no-use-before-define
  private static instance: IntegrationServices;

  private integrations: any = {};

  private constructor() {
    logger.info("IntegrationServices controller initialized");
  }

  public static getInstance(): IntegrationServices {
    if (!IntegrationServices.instance) {
      IntegrationServices.instance = new IntegrationServices();
    }

    return IntegrationServices.instance;
  }

  public registerIntegration(integration: IntegrationDriver) {
    integration.initialize();
    const name = integration.getName();
    this.integrations[name] = integration;
    logger.info(`Integration ${name} registered`);
  }

  public async listDrivers(): Promise<{ name: string; description: string }[]> {
    return Object.values(this.integrations).map(
      (integration: IntegrationDriver) => ({
        name: integration.getName(),
        description: integration.getDescription()
      })
    );
  }

  public async getDriverOptions(
    driverName: string
  ): Promise<IntegrationOptions> {
    const integration = this.integrations[driverName];
    if (!integration) {
      throw new Error(`Integration ${driverName} not found`);
    }

    return integration.getOptions();
  }

  public async startSession(
    integration: Integration,
    ticket: Ticket,
    message: IntegrationMessage,
    metadata: IntegrationMessageMetadata,
    replyHandler: ReplyHandler
  ): Promise<{ token: string; message?: IntegrationMessage; data?: any }> {
    const driver = this.integrations[integration.driver];
    if (!integration) {
      throw new Error(`Integration ${integration.driver} not found`);
    }

    const token = `is-${makeRandomId(32)}`;
    metadata.backendUrl = process.env.BACKEND_URL;

    const { sessionId, data } = await driver.startSession(
      ticket,
      message,
      metadata,
      token,
      replyHandler,
      integration.configuration
    );

    await IntegrationSession.create({
      token,
      sessionId,
      data,
      ticketId: ticket.id,
      integrationId: integration.id
    });

    return { token, data };
  }

  public async continueSession(
    integrationSession: IntegrationSession,
    message: IntegrationMessage,
    metadata: IntegrationMessageMetadata,
    replyHandler: ReplyHandler
  ): Promise<void> {
    await reloadIntegrationSession(integrationSession);
    const driver = this.integrations[integrationSession.integration.driver];
    if (!driver) {
      throw new Error(
        `Integration ${integrationSession.integration.driver} not available`
      );
    }

    metadata.backendUrl = process.env.BACKEND_URL;

    return driver.continueSession(
      integrationSession,
      message,
      metadata,
      replyHandler
    );
  }

  public async endSession(
    integrationSession: IntegrationSession
  ): Promise<void> {
    if (!integrationSession) {
      throw new Error("Session not found");
    }

    const { ticket } = integrationSession;

    const driver = this.integrations[integrationSession.integration.driver];
    if (!driver) {
      throw new Error(
        `Integration ${integrationSession.integration.driver} not available`
      );
    }

    await driver.endSession(integrationSession);

    integrationSession.destroy();

    await updateTicket(ticket, { chatbot: false });
  }

  public async endAllSessions(ticket: Ticket) {
    const integrationSessions = await IntegrationSession.findAll({
      where: {
        ticketId: ticket.id
      },
      include: ["integration", "ticket"]
    });

    await Promise.all(
      integrationSessions.map(integrationSession =>
        this.endSession(integrationSession)
      )
    );
  }

  // eslint-disable-next-line class-methods-use-this
  public async webhook(
    integrationSession: IntegrationSession,
    body: IntegrationWebhookRequest
  ) {
    await reloadIntegrationSession(integrationSession);
    const { action, message, ticketData } = body;

    if (action === "endSession") {
      await this.endSession(integrationSession);
      return;
    }

    if (action === "updateTicket" && ticketData) {
      await updateTicket(integrationSession.ticket, ticketData);
    }

    if (action === "note" && message?.content) {
      await CreateInternalMessageService(
        integrationSession.ticket,
        message.content
      );
      return;
    }

    // this needs modification when the system goes to be multi-channel
    if (integrationSession.ticket.channel === "whatsapp" && message) {
      const wbot = await GetTicketWbot(integrationSession.ticket);

      // test if message is an array
      if (Array.isArray(message)) {
        // eslint-disable-next-line no-restricted-syntax
        for await (const msg of message) {
          await wbotReplyHandler(wbot, integrationSession.ticket, msg);
        }
      } else {
        await wbotReplyHandler(wbot, integrationSession.ticket, message);
      }
    }
  }

  public async processTrigger(
    integrationSession: IntegrationSession,
    trigger: any
  ) {
    if (trigger.action) {
      await this.webhook(integrationSession, trigger);
    } else if (trigger.stopbot) {
      await this.endSession(integrationSession);
    } else if (trigger.closeTicket) {
      await this.webhook(integrationSession, {
        action: "updateTicket",
        ticketData: {
          status: "closed",
          justClose: true
        }
      });
    } else if (trigger.userId && trigger.queueId) {
      await this.webhook(integrationSession, {
        action: "updateTicket",
        ticketData: {
          queueId: trigger.queueId,
          userId: trigger.userId
        }
      });
    } else if (trigger.queueId) {
      await this.webhook(integrationSession, {
        action: "updateTicket",
        ticketData: {
          queueId: trigger.queueId
        }
      });
    }
  }
}
