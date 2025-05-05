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
import Integration from "../../models/Integration";
import IntegrationSession from "../../models/IntegrationSession";
import Ticket from "../../models/Ticket";
import { logger } from "../../utils/logger";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import Contact from "../../models/Contact";
import { CreateInternalMessageService } from "../MessageServices/CreateInternalMessageService";
import {
  ticketTagAdd,
  ticketTagRemove,
  ticketTagRemoveAll
} from "../TicketTagServices/TicketTagServices";
import { NgrokInstance } from "../../helpers/NgrokInstance";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import {
  contactTagAdd,
  contactTagRemove,
  contactTagRemoveAll
} from "../ContactTagService/ContactTagService";

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

export type IntegrationActionTypes =
  | "endSession"
  | "updateTicket"
  | "note"
  | "addTag"
  | "removeTag"
  | "clearTags"
  | "addContactTag"
  | "removeContactTag"
  | "clearContactTags"
  | "wait"
  | "ping";

export type IntegrationMessage = {
  type: IntegrationMessageTypes;
  content?: string;
  mediaUrl?: string;
};

export type IntegrationCommand = {
  action?: IntegrationActionTypes;
  message?: IntegrationMessage | IntegrationMessage[];
  ticketData?: any;
  tagId?: number;
  // legacy format support
  stopbot?: boolean;
  closeTicket?: boolean;
  queueId?: number;
  userId?: number;
  seconds?: number;
};

export type IntegrationMessageWithTrigger = IntegrationMessage & {
  trigger: IntegrationCommand;
};

export type IntegrationMessageOrCommand =
  | IntegrationMessageWithTrigger
  | IntegrationCommand;

export type IntegrationPayload =
  | IntegrationCommand
  | IntegrationMessageOrCommand[];

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
        include: ["contact", "whatsapp"]
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

    metadata.backendUrl =
      NgrokInstance.getInstance().getUrl() || process.env.BACKEND_URL;

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

  public async processCommand(
    integrationSession: IntegrationSession,
    command: IntegrationCommand,
    replyHandler: ReplyHandler
  ) {
    await reloadIntegrationSession(integrationSession);

    // support for legacy commands
    const { stopbot, closeTicket, queueId, userId } = command;

    if (stopbot) {
      await this.endSession(integrationSession);
      return;
    }

    if (closeTicket) {
      await updateTicket(integrationSession.ticket, {
        status: "closed",
        justClose: true
      });
      return;
    }

    if (queueId && userId) {
      await updateTicket(integrationSession.ticket, {
        queueId,
        userId
      });
      return;
    }

    if (queueId) {
      await updateTicket(integrationSession.ticket, {
        queueId
      });
      return;
    }

    const { action, message, ticketData } = command;

    if (action === "endSession") {
      await this.endSession(integrationSession);
      return;
    }

    if (action === "note" && !Array.isArray(message) && message?.content) {
      await CreateInternalMessageService(
        integrationSession.ticket,
        message.content
      );
      return;
    }

    if (action === "addTag") {
      const { tagId } = command;
      if (!tagId) {
        throw new Error("Tag ID is required");
      }

      const tagsMode = await GetCompanySetting(
        integrationSession.ticket.companyId,
        "tagsMode",
        "ticket",
        true
      );

      if (tagsMode === "contact") {
        await contactTagAdd(integrationSession.ticket.contactId, tagId);
      } else {
        await ticketTagAdd(integrationSession.ticket.id, tagId);
      }
    }

    if (action === "removeTag") {
      const { tagId } = command;
      if (!tagId) {
        throw new Error("Tag ID is required");
      }

      const tagsMode = await GetCompanySetting(
        integrationSession.ticket.companyId,
        "tagsMode",
        "ticket",
        true
      );

      if (tagsMode === "contact") {
        await contactTagRemove(integrationSession.ticket.contactId, tagId);
      } else {
        await ticketTagRemove(integrationSession.ticket.id, tagId);
      }
    }

    if (action === "clearTags") {
      const tagsMode = await GetCompanySetting(
        integrationSession.ticket.companyId,
        "tagsMode",
        "ticket",
        true
      );

      if (tagsMode === "contact") {
        await contactTagRemoveAll(integrationSession.ticket.contactId);
      } else {
        await ticketTagRemoveAll(integrationSession.ticket.id);
      }
    }

    if (action === "addContactTag") {
      const { tagId } = command;
      if (!tagId) {
        throw new Error("Tag ID is required");
      }

      const tagsMode = await GetCompanySetting(
        integrationSession.ticket.companyId,
        "tagsMode",
        "ticket",
        true
      );

      if (tagsMode === "ticket") {
        await ticketTagAdd(integrationSession.ticket.id, tagId);
      } else {
        await contactTagAdd(integrationSession.ticket.contactId, tagId);
      }
    }

    if (action === "removeContactTag") {
      const { tagId } = command;
      if (!tagId) {
        throw new Error("Tag ID is required");
      }

      const tagsMode = await GetCompanySetting(
        integrationSession.ticket.companyId,
        "tagsMode",
        "ticket",
        true
      );

      if (tagsMode === "ticket") {
        await ticketTagRemove(integrationSession.ticket.id, tagId);
      } else {
        await contactTagRemove(integrationSession.ticket.contactId, tagId);
      }
    }

    if (action === "clearContactTags") {
      const tagsMode = await GetCompanySetting(
        integrationSession.ticket.companyId,
        "tagsMode",
        "ticket",
        true
      );

      if (tagsMode === "ticket") {
        await ticketTagRemoveAll(integrationSession.ticket.id);
      } else {
        await contactTagRemoveAll(integrationSession.ticket.contactId);
      }
    }

    if (message) {
      if (Array.isArray(message)) {
        // eslint-disable-next-line no-restricted-syntax
        for await (const msg of message) {
          await replyHandler(integrationSession.ticket, msg);
        }
      } else {
        await replyHandler(integrationSession.ticket, message);
      }
    }

    if (action === "updateTicket" && ticketData) {
      await updateTicket(integrationSession.ticket, ticketData);
    }

    if (action === "wait") {
      const { seconds } = command;
      if (!seconds) {
        throw new Error("Seconds is required");
      }
      await new Promise(resolve => {
        setTimeout(resolve, seconds * 1000);
      });
    }

    if (action === "ping") {
      await this.continueSession(
        integrationSession,
        {
          type: "text",
          content: "pong"
        },
        {
          channel: integrationSession.ticket.channel,
          from: integrationSession.ticket.contact,
          ticketId: integrationSession.ticketId
        },
        replyHandler
      );
    }
  }

  public async processMessageOrCommand(
    integrationSession: IntegrationSession,
    message: IntegrationMessageOrCommand,
    replyHandler: ReplyHandler
  ) {
    if (!message) {
      return;
    }

    if ("type" in message) {
      if ("content" in message || "mediaUrl" in message) {
        await replyHandler(integrationSession.ticket, message);
      }
      if ("trigger" in message) {
        await this.processCommand(
          integrationSession,
          message.trigger,
          replyHandler
        );
      }
      return;
    }

    await this.processCommand(integrationSession, message, replyHandler);
  }

  public async processPayload(
    integrationSession: IntegrationSession,
    payload: IntegrationPayload,
    replyHandler: ReplyHandler
  ) {
    // support array of IntegrationMessagesWithTrigger
    if (Array.isArray(payload)) {
      // eslint-disable-next-line no-restricted-syntax
      for await (const item of payload) {
        await this.processMessageOrCommand(
          integrationSession,
          item,
          replyHandler
        );
      }
      return;
    }

    // support single IntegrationMessageWithTrigger
    if ("type" in payload || "trigger" in payload) {
      await this.processMessageOrCommand(
        integrationSession,
        payload as IntegrationMessageWithTrigger,
        replyHandler
      );
      return;
    }

    // finally support IntegrationCommand
    await this.processCommand(integrationSession, payload, replyHandler);
  }
}
