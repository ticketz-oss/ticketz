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
    token: string,
    replyHandler: ReplyHandler,
    options: any
  ): Promise<{ sessionId: string; message?: IntegrationMessage; data?: any }>;
  continueSession(
    integrationSession: IntegrationSession,
    message: IntegrationMessage,
    replyHandler: ReplyHandler
  ): Promise<void>;
  endSession(integrationSession: IntegrationSession): Promise<void>;
}

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
    replyHandler: ReplyHandler
  ): Promise<{ token: string; message?: IntegrationMessage; data?: any }> {
    const driver = this.integrations[integration.driver];
    if (!integration) {
      throw new Error(`Integration ${integration.driver} not found`);
    }

    const token = `is-${makeRandomId(32)}`;

    const { sessionId, data } = await driver.startSession(
      ticket,
      message,
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
    replyHandler: ReplyHandler
  ): Promise<void> {
    await reloadIntegrationSession(integrationSession);
    const driver = this.integrations[integrationSession.integration.driver];
    if (!driver) {
      throw new Error(
        `Integration ${integrationSession.integration.driver} not available`
      );
    }

    return driver.continueSession(integrationSession, message, replyHandler);
  }

  public async endSession(token: string) {
    const integrationSession = await IntegrationSession.findOne({
      where: { token },
      include: ["integration", "ticket"]
    });

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

  // eslint-disable-next-line class-methods-use-this
  public async webhook(integrationSession: IntegrationSession, body: any) {
    await reloadIntegrationSession(integrationSession);
    const { action, message, ticketData } = body;

    if (action === "endSession") {
      await this.endSession(integrationSession.token);
      return;
    }

    if (action === "updateTicket" && ticketData) {
      updateTicket(integrationSession.ticket, ticketData);
    }

    // this needs modification when the system goes to be multi-channel
    if (integrationSession.ticket.channel === "whatsapp" && message) {
      const wbot = await GetTicketWbot(integrationSession.ticket);
      wbotReplyHandler(wbot, integrationSession.ticket, message);
    }
  }
}
