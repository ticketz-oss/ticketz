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

import { makeRandomId } from "../../helpers/MakeRandomId";
import IntegrationSession from "../../models/IntegrationSession";
import Ticket from "../../models/Ticket";
import { logger } from "../../utils/logger";

export type IntegrationOptions = {
  fields: {
    name: string;
    title: string;
    description: string;
    type: "text" | "textarea" | "select" | "checkbox";
    options?: { value: string; label: string }[];
    required: boolean;
  }[];
};

export type IntegrationMessage = {
  type: "text" | "image" | "video" | "audio";
  content?: string;
  mediaUrl?: string;
};

export interface IntegrationDriver {
  getName(): string;
  getDescription(): string;
  initialize(): void;
  getOptions(): IntegrationOptions;
  startSession(
    ticket: Ticket,
    message: IntegrationMessage,
    options: IntegrationOptions
  ): Promise<{ sessionId: string; message?: IntegrationMessage; data?: any }>;
  continueSession(
    integrationSession: IntegrationSession,
    message: IntegrationMessage
  ): Promise<IntegrationMessage>;
  endSession(integrationSession: IntegrationSession): Promise<void>;
}

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
    integrationName: string,
    ticket: Ticket,
    message: IntegrationMessage,
    options: IntegrationOptions
  ): Promise<{ token: string; message?: IntegrationMessage; data?: any }> {
    const integration = this.integrations[integrationName];
    if (!integration) {
      throw new Error(`Integration ${integrationName} not found`);
    }

    const {
      sessionId,
      message: reply,
      data
    } = await integration.startSession(ticket, message, options);

    const token = makeRandomId(32);
    await IntegrationSession.create({
      token,
      sessionId,
      data,
      ticketId: ticket.id,
      integrationId: integration.id
    });

    return { token, message: reply, data };
  }

  public async continueSession(
    token: string,
    message: IntegrationMessage
  ): Promise<IntegrationMessage> {
    const integrationSession = await IntegrationSession.findOne({
      where: { token },
      include: ["integration"]
    });

    if (!integrationSession) {
      throw new Error("Session not found");
    }

    const integration =
      this.integrations[integrationSession.integration.driver];
    if (!integration) {
      throw new Error(
        `Integration ${integrationSession.integration.driver} not available`
      );
    }

    return integration.continueSession(integrationSession, message);
  }

  public async endSession(token: string) {
    const integrationSession = await IntegrationSession.findOne({
      where: { token },
      include: ["integration"]
    });

    if (!integrationSession) {
      throw new Error("Session not found");
    }

    const integration =
      this.integrations[integrationSession.integration.driver];
    if (!integration) {
      throw new Error(
        `Integration ${integrationSession.integration.driver} not available`
      );
    }

    await integration.endSession(integrationSession);

    integrationSession.destroy();
  }
}
