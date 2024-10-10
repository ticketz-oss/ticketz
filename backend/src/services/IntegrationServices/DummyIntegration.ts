import { makeRandomId } from "../../helpers/MakeRandomId";
import Ticket from "../../models/Ticket";
import {
  IntegrationDriver,
  IntegrationMessage,
  IntegrationOptions
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
    options: IntegrationOptions
  ): Promise<{ sessionId: string; message?: IntegrationMessage; data?: any }> {
    logger.debug(
      { ticket, message, options },
      "Starting dummy integration session"
    );
    return {
      sessionId: makeRandomId(32),
      message: {
        type: "text",
        content: "Hello, I am a dummy integration"
      }
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async continueSession(
    integrationSession: IntegrationSession,
    message: IntegrationMessage
  ): Promise<IntegrationMessage> {
    logger.debug(
      { integrationSession, message },
      "Continuing dummy integration session"
    );

    return {
      type: "text",
      content: "This is a dummy response"
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async endSession(integrationSession: IntegrationSession): Promise<void> {
    logger.debug({ integrationSession }, "Ending dummy integration session");
  }
}
