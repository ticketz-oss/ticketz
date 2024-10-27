import axios from "axios";
import { makeRandomId } from "../../helpers/MakeRandomId";
import Ticket from "../../models/Ticket";
import {
  IntegrationDriver,
  IntegrationMessage,
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
        }
      ]
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async processMessage(ticket, message, replyHandler, options) {
    const { webhookUrl, webhookMethod, webhookToken } = options;
    try {
      let response;
      if (webhookMethod === "GET") {
        response = await axios.get(webhookUrl, {
          headers: webhookToken
            ? { Authorization: `Bearer ${webhookToken}` }
            : {},
          params: message
        });
      } else if (webhookMethod === "POST") {
        response = await axios.post(webhookUrl, message, {
          headers: webhookToken
            ? { Authorization: `Bearer ${webhookToken}` }
            : {},
          params: message
        });
      }

      const responseData = response?.data;

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
    token: string,
    replyHandler: ReplyHandler,
    options: any
  ): Promise<{ sessionId: string; message?: IntegrationMessage; data?: any }> {
    logger.debug(
      { ticket, message, token, options },
      "Starting webhook integration session"
    );

    const sessionId = makeRandomId(32);
    this.processMessage(ticket, message, replyHandler, options);

    return {
      sessionId
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async continueSession(
    integrationSession: IntegrationSession,
    message: IntegrationMessage,
    replyHandler: ReplyHandler
  ): Promise<void> {
    this.processMessage(
      integrationSession.ticket,
      message,
      replyHandler,
      integrationSession.integration.configuration
    );
  }

  // eslint-disable-next-line class-methods-use-this
  async endSession(integrationSession: IntegrationSession): Promise<void> {
    logger.debug({ integrationSession }, "Ending webhook integration session");
  }
}
