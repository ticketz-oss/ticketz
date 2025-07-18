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
import { decode } from "html-entities";
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
import { GetCompanySetting } from "../../helpers/CheckSettings";

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
  switch (msg?.type) {
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

  private description = "Typebot";

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
          name: "debouncetime",
          title: "Debounce Time (seconds)",
          description: "Time to wait before sending to typebot (in seconds)",
          type: "text",
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
      firstMessage: metadata.firstMessage,
      ticketId: metadata.ticketId,
      ticketUuid: ticket.uuid,
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

      switch (message?.type) {
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
        case "image":
        case "video":
        case "document":
          typebotMessage = {
            type: "text",
            text: message.mediaUrl
          };
          break;
        default:
          typebotMessage = {
            type: "text",
            text: message?.content || ""
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

      logger.debug({ data: response?.data }, "Response from Typebot");

      const { messages, clientSideActions, input } = response?.data || {
        messages: []
      };

      if (clientSideActions) {
        const action = clientSideActions.find((a: any) => a.type === "wait");
        if (action?.type === "wait") {
          if (!action.lastBubbleBlockId) {
            replyHandler(integrationSession.ticket, { type: "text" });
            await new Promise(resolve => {
              setTimeout(resolve, action.wait.secondsToWaitFor * 1000);
            });
          }
        }
      }

      let autoStop = true;

      // eslint-disable-next-line no-restricted-syntax
      for await (const msg of messages) {
        const reply = convertTypebotMessage(msg);
        let dontReply = false;

        if (reply?.content?.startsWith("#{")) {
          const triggerString = typebotRichText
            ? reply.content.slice(1)
            : decode(reply.content.slice(1));
          let trigger: any = null;
          try {
            trigger = JSON.parse(triggerString);
            dontReply = true;
          } catch (_) {
            // just do nothing
          }

          if (trigger) {
            await integrations.processCommand(
              integrationSession,
              trigger,
              replyHandler
            );
            if (trigger.queueId) {
              autoStop = false;
            }
          }
        }

        if (reply.content === "Invalid message. Please, try again.\n") {
          const chatbotAutoExit =
            (await GetCompanySetting(
              integrationSession.ticket.companyId,
              "chatbotAutoExit",
              "disabled",
              true
            )) === "enabled";
          if (chatbotAutoExit) {
            await integrations.endSession(integrationSession);
            return;
          }

          reply.content = "Resposta inválida. Por favor, tente novamente.";
        }

        if (reply && !dontReply) {
          await replyHandler(integrationSession.ticket, reply);
        }

        if (clientSideActions) {
          const action = clientSideActions.find(
            (a: any) => a.lastBubbleBlockId === msg.id
          );
          if (action?.type === "wait") {
            replyHandler(integrationSession.ticket, { type: "text" });
            await new Promise(resolve => {
              setTimeout(resolve, action.wait.secondsToWaitFor * 1000);
            });
          }
        }
      }

      if (!input && autoStop) {
        await integrations.endSession(integrationSession);
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
      logger.error({ error }, `Error calling Typebot: ${error.message}`);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async endSession(integrationSession: IntegrationSession): Promise<void> {
    logger.debug({ integrationSession }, "Ending Typebot integration session");
  }
}
