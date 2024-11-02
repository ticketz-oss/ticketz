import axios from "axios";
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
import { cacheLayer } from "../../libs/cache";

const integrations = IntegrationServices.getInstance();

const formatElement = element => {
  let text = "";

  if (element.text) {
    text = element.text;
  }

  if (element.type && element.children) {
    element.children.forEach(child => {
      text += formatElement(child);
    });
  }

  if (!text.trim()) {
    return text;
  }

  // regex to separate leading and ending spaces
  const ls = text.match(/^\s*/)[0];
  const es = text.match(/\s*$/)[0];

  if (element.bold) {
    text = `${ls}*${text.trim()}*${es}`;
  }
  if (element.italic) {
    text = `${ls}_${text.trim()}_${es}`;
  }
  if (element.underline) {
    text = `${ls}~${text.trim()}~${es}`;
  }

  if (element.url) {
    const linkText = element.children[0].text;
    text = `[${linkText}](${element.url})`;
  }

  return text;
};

const formatRichText = richMessage => {
  let formattedText = "";
  richMessage.forEach((richText: { children: any[] }) => {
    richText.children.forEach(element => {
      formattedText += formatElement(element);
    });
    formattedText += "\n";
  });
  return formattedText;
};

const convertTypebotMessage = (msg: any): IntegrationMessage => {
  switch (msg.type) {
    case "text":
      return {
        type: "text",
        content: msg.content.markdown || formatRichText(msg.content.richText)
      };
    case "embed":
      return {
        type: "document",
        mediaUrl: msg.content.url
      };
    case "image":
    case "video":
    case "audio":
      return {
        type: msg.type,
        mediaUrl: msg.content.url
      };
    default:
      return null;
  }
};

export class TypebotIntegration implements IntegrationDriver {
  private name = "typebot";

  private description = "Typebot Integration";

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
          name: "typebotUrl",
          title: "Typebot Base URL",
          description: "The URL of the Typebot",
          type: "text",
          lgWidth: 12,
          required: true
        },
        {
          name: "typebotPublicId",
          title: "Typebot Public Id",
          description: "The Id of your typebot flow",
          type: "text",
          lgWidth: 4,
          required: true
        },
        null,
        {
          name: "typebotRichText",
          title: "Process rich text",
          description: "Process rich text messages",
          type: "checkbox",
          lgWidth: 4,
          required: false
        },
        null,
        {
          name: "typebotExtraParams",
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
      "Starting Typebot integration session"
    );
    const { typebotUrl, typebotPublicId, typebotRichText, typebotExtraParams } =
      options;

    let jsonParams = {};

    try {
      if (typebotExtraParams) {
        jsonParams = JSON.parse(typebotExtraParams);
      }
    } catch (_) {
      // do nothing
    }

    const prefilledVariables = {
      token,
      backendURL: process.env.BACKEND_URL,
      number: metadata.from.number,
      pushName: metadata.from.name,
      ticketId: ticket.id,
      metadata: JSON.stringify(metadata),
      ...jsonParams
    };

    const response = await axios.post(
      `${typebotUrl}/api/v1/typebots/${typebotPublicId}/startChat`,
      {
        isOnlyRegistering: true,
        prefilledVariables,
        textBubbleContentFormat: typebotRichText ? "richText" : "markdown"
      }
    );

    const { sessionId } = response.data;
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
    const config: any = integrationSession.integration.configuration;
    const { typebotUrl, typebotRichText } = config;

    try {
      let typebotMessage: { type: string; text?: string; url?: string };

      switch (message.type) {
        case "text":
          {
            const optionNumber = Number(message.content);
            let optionText = null;
            if (optionNumber) {
              const items = await cacheLayer.get(`ci-${integrationSession.id}`);
              if (items) {
                const parsedItems = JSON.parse(items);
                if (parsedItems[optionNumber - 1]) {
                  optionText = parsedItems[optionNumber - 1].content;
                }
              }
            }
            typebotMessage = {
              type: "text",
              text: optionText || message.content
            };
          }
          break;
        case "audio":
          typebotMessage = {
            type: "audio",
            url: message.mediaUrl
          };
          break;
        case "image":
        case "video":
        default:
          typebotMessage = {
            type: "text",
            text: "<unsupported>"
          };
          break;
      }

      await cacheLayer.del(`ci-${integrationSession.id}`);

      const response = await axios.post(
        `${typebotUrl}/api/v1/sessions/${integrationSession.sessionId}/continueChat`,
        {
          message: typebotMessage,
          textBubbleContentFormat: typebotRichText ? "richText" : "markdown"
        }
      );

      logger.debug({ response }, "Response from Typebot");

      const { messages, clientSideActions, input } = response?.data || {
        messages: []
      };

      // eslint-disable-next-line no-restricted-syntax
      for await (const msg of messages) {
        const reply = convertTypebotMessage(msg);
        let dontReply = false;

        if (reply.content?.startsWith("#")) {
          let trigger: any = null;
          try {
            trigger = JSON.parse(reply.content.slice(1));
            dontReply = true;
          } catch (_) {
            // just do nothing
          }

          if (trigger) {
            if (trigger.action) {
              await integrations.webhook(integrationSession, trigger);
            } else if (trigger.stopbot) {
              await integrations.endSession(integrationSession);
            } else if (trigger.closeTicket) {
              await integrations.webhook(integrationSession, {
                action: "updateTicket",
                ticketData: {
                  status: "closed",
                  justClose: true
                }
              });
            } else if (trigger.userId && trigger.queueId) {
              await integrations.webhook(integrationSession, {
                action: "updateTicket",
                ticketData: {
                  queueId: trigger.queueId,
                  userId: trigger.userId
                }
              });
            } else if (trigger.queueId) {
              await integrations.webhook(integrationSession, {
                action: "updateTicket",
                ticketData: {
                  queueId: trigger.queueId
                }
              });
            }
          }
        }

        if (reply && !dontReply) {
          await replyHandler(integrationSession.ticket, reply);
        }

        if (clientSideActions) {
          const action = clientSideActions.find(
            (a: any) => a.lastBubbleBlockId === msg.id
          );
          if (action?.type === "wait") {
            await new Promise(resolve => {
              setTimeout(resolve, action.wait.secondsToWaitFor * 1000);
            });
          }
        }
      }

      if (input && input.type === "choice input") {
        let content = input.options?.buttonLabel
          ? `*${input.options.buttonLabel}*\n\n`
          : "";
        let counter = 1;

        input.items.forEach((item: any) => {
          content += `${counter} - ${item.content}\n`;
          counter += 1;
        });

        if (!input.options?.isMultipleChoice) {
          await cacheLayer.set(
            `ci-${integrationSession.id}`,
            JSON.stringify(input.items)
          );
        }

        await replyHandler(integrationSession.ticket, {
          type: "text",
          content
        });
      }
    } catch (error) {
      logger.error({ error }, "Error calling Typebot");
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async endSession(integrationSession: IntegrationSession): Promise<void> {
    logger.debug({ integrationSession }, "Ending Typebot integration session");
  }
}
