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

import axios from "axios";
import { makeRandomId } from "../../helpers/MakeRandomId";
import Ticket from "../../models/Ticket";
import {
  IntegrationDriver,
  IntegrationMessage,
  IntegrationMessageMetadata,
  IntegrationOptions,
  IntegrationServices,
  ReplyHandler
} from "./IntegrationServices";
import { logger } from "../../utils/logger";
import IntegrationSession from "../../models/IntegrationSession";
import { fileToBase64 } from "../../helpers/fileToBase64";

const integrations = IntegrationServices.getInstance();

export type WebhookIntegrationMessage = IntegrationMessage & {
  mediaB64?: string;
};

export class WebhookIntegration implements IntegrationDriver {
  private name = "webhook";

  private description = "Webhook / N8N";

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
          name: "webhookUrl",
          title: "Webhook URL",
          description: "The URL of the webhook",
          type: "text",
          lgWidth: 12,
          required: true
        },
        {
          name: "webhookMethod",
          title: "Webhook Method",
          description: "The HTTP method to use (GET or POST)",
          type: "select",
          lgWidth: 4,
          options: [
            { value: "GET", label: "GET" },
            { value: "POST", label: "POST" }
          ],
          required: true
        },
        {
          name: "webhookToken",
          title: "Webhook Token",
          description: "The token for authentication (if required)",
          type: "text",
          lgWidth: 8,
          required: false
        },
        null,
        {
          name: "webhookFileB64",
          title: "Use base64 for file",
          description: "Use base64 for file",
          type: "checkbox",
          lgWidth: 4,
          required: false
        },
        null,
        {
          name: "webhookExtraParams",
          title: "Extra Parameters (JSON)",
          description: "Extra parameters formatted in JSON",
          lgWidth: 4,
          type: "textarea",
          required: false
        }
      ]
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async processMessage(
    integrationSession: IntegrationSession,
    message: WebhookIntegrationMessage,
    metadata: IntegrationMessageMetadata,
    replyHandler: ReplyHandler
  ) {
    const { ticket, token } = integrationSession;
    const {
      webhookUrl,
      webhookMethod,
      webhookToken,
      webhookFileB64,
      webhookExtraParams
    } = integrationSession.integration.configuration;

    try {
      if (webhookExtraParams) {
        metadata.extraParams = JSON.parse(webhookExtraParams);
      }
    } catch (_) {
      // do nothing
    }

    try {
      let response;
      if (webhookMethod === "GET") {
        response = await axios.get(webhookUrl, {
          headers: webhookToken
            ? {
                "x-tz-metadata": JSON.stringify(metadata),
                Authorization: `Bearer ${webhookToken}`
              }
            : { "x-tz-metadata": JSON.stringify(metadata) },
          params: message
        });
      } else if (webhookMethod === "POST") {
        if (message.mediaUrl && webhookFileB64) {
          message.mediaB64 = await fileToBase64(message.mediaUrl);
        }
        response = await axios.post(
          webhookUrl,
          { ...message, token, metadata },
          {
            headers: webhookToken
              ? { Authorization: `Bearer ${webhookToken}` }
              : {}
          }
        );
      }

      const responseData = response?.data;

      if (Array.isArray(responseData)) {
        // eslint-disable-next-line no-restricted-syntax
        for await (const data of responseData) {
          if (data?.type && (data?.content || data?.mediaUrl)) {
            await replyHandler(ticket, data);
          }
          if (data.trigger) {
            await integrations.processTrigger(integrationSession, data.trigger);
          }
        }
        return;
      }

      if (
        responseData?.type &&
        (responseData?.content || responseData?.mediaUrl)
      ) {
        replyHandler(ticket, responseData);
      }
      if (responseData.trigger) {
        await integrations.processTrigger(
          integrationSession,
          responseData.trigger
        );
      }
    } catch (error) {
      logger.error({ message: error?.message }, "Error calling webhook");
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async startSession(
    ticket: Ticket,
    message: IntegrationMessage,
    metadata: IntegrationMessageMetadata,
    token: string,
    replyHandler: ReplyHandler,
    options: any
  ): Promise<{ sessionId: string; message?: IntegrationMessage; data?: any }> {
    logger.debug(
      { ticket, message, token, options },
      "Starting webhook integration session"
    );

    const sessionId = makeRandomId(32);
    return {
      sessionId
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async continueSession(
    integrationSession: IntegrationSession,
    message: IntegrationMessage,
    metadata: IntegrationMessageMetadata,
    replyHandler: ReplyHandler
  ): Promise<void> {
    this.processMessage(integrationSession, message, metadata, replyHandler);
  }

  // eslint-disable-next-line class-methods-use-this
  async endSession(integrationSession: IntegrationSession): Promise<void> {
    logger.debug({ integrationSession }, "Ending webhook integration session");
  }
}
