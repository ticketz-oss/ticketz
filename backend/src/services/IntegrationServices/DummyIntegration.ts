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

export class DummyIntegration implements IntegrationDriver {
  private name = "dummy";

  private description = "Dummy Integration";

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
          name: "dummy_field",
          title: "Dummy Field",
          description: "This is a dummy field",
          type: "text",
          required: true
        },
        null,
        {
          name: "dummy_checkbox",
          title: "Dummy Checkbox",
          description: "This is a dummy checkbox",
          type: "checkbox",
          required: true
        },
        null,
        {
          name: "dummy_select",
          title: "Dummy Select",
          description: "This is a dummy select",
          type: "select",
          options: [
            { value: "1", label: "Option 1" },
            { value: "2", label: "Option 2" }
          ],
          required: true
        },
        {
          name: "dummy_textarea",
          title: "Dummy Textarea",
          description: "This is a dummy textarea",
          lgWidth: 12,
          type: "textarea",
          required: true
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
      "Starting dummy integration session"
    );

    const sessionId = makeRandomId(32);

    replyHandler(ticket, {
      type: "text",
      content: `Hello, I am a dummy integration.\n\nI've received this parameters: \`\`\`\n${JSON.stringify(
        { sessionId, token, ticket, message, metadata, options },
        null,
        2
      )}\n\`\`\``
    });

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
    logger.debug(
      { integrationSession, message },
      "Continuing dummy integration session"
    );

    await replyHandler(integrationSession.ticket, {
      type: "text",
      content: `Now i'm received this': \`\`\`\n${JSON.stringify(
        { message, metadata },
        null,
        2
      )}\n\`\`\``
    });

    if (message.content === "!image") {
      await replyHandler(integrationSession.ticket, {
        type: "image",
        content: "This is an image",
        mediaUrl: "https://picsum.photos/200"
      });
    }

    if (message.content === "!audio") {
      await replyHandler(integrationSession.ticket, {
        type: "audio",
        content: "This is an audio",
        mediaUrl: "https://static.ww.inf.br/skanews.ogg"
      });
    }

    if (message.content === "!video") {
      await replyHandler(integrationSession.ticket, {
        type: "video",
        content: "This is a video",
        mediaUrl:
          "https://videos.pexels.com/video-files/6950902/6950902-uhd_2560_1440_25fps.mp4"
      });
    }

    if (message.content === "!gif") {
      await replyHandler(integrationSession.ticket, {
        type: "gif",
        content: "This is a gif",
        mediaUrl: "https://i.giphy.com/cZ7rmKfFYOvYI.mp4"
      });
    }

    if (message.content === "!document") {
      await replyHandler(integrationSession.ticket, {
        type: "document",
        content: "This is a pdf document",
        mediaUrl: "https://www.sjgames.com/illuminati/img/illuminati_rules.pdf"
      });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async endSession(integrationSession: IntegrationSession): Promise<void> {
    logger.debug({ integrationSession }, "Ending dummy integration session");
  }
}
