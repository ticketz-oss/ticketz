import axios from "axios";
import { makeRandomId } from "../../helpers/MakeRandomId";
import Ticket from "../../models/Ticket";
import {
  IntegrationDriver,
  IntegrationMessage,
  IntegrationMessageMetadata,
  IntegrationOptions,
  ReplyHandler
} from "./IntegrationServices";
import { logger } from "../../utils/logger";
import IntegrationSession from "../../models/IntegrationSession";

export class WebhookIntegration implements IntegrationDriver {
  private name = "webhook";

  private description = "Webhook Integration";

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
    ticket,
    message,
    metadata,
    token,
    replyHandler,
    options
  ) {
    const { webhookUrl, webhookMethod, webhookToken, webhookExtraParams } =
      options;

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
        responseData.forEach(data => {
          if (data?.type && (data?.content || data?.mediaUrl)) {
            replyHandler(ticket, data);
          }
        });
      }

      if (
        responseData?.type &&
        (responseData?.content || responseData?.mediaUrl)
      ) {
        replyHandler(ticket, responseData);
      }
    } catch (error) {
      logger.error({ error }, "Error calling webhook");
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
    this.processMessage(
      integrationSession.ticket,
      message,
      metadata,
      integrationSession.token,
      replyHandler,
      integrationSession.integration.configuration
    );
  }

  // eslint-disable-next-line class-methods-use-this
  async endSession(integrationSession: IntegrationSession): Promise<void> {
    logger.debug({ integrationSession }, "Ending webhook integration session");
  }
}
