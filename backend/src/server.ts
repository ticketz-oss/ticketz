import gracefulShutdown from "http-graceful-shutdown";
import ngrok from "ngrok";
import app from "./app";
import { initIO } from "./libs/socket";
import { logger } from "./utils/logger";
import { StartAllWhatsAppsSessions } from "./services/WbotServices/StartAllWhatsAppsSessions";
import Company from "./models/Company";
import { startQueueProcess } from "./queues";
import {
  checkOpenInvoices,
  payGatewayInitialize
} from "./services/PaymentGatewayServices/PaymentGatewayServices";
import { i18nReady } from "./services/TranslationServices/i18nService";

import { IntegrationServices } from "./services/IntegrationServices/IntegrationServices";
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { DummyIntegration } from "./services/IntegrationServices/DummyIntegration";
import { WebhookIntegration } from "./services/IntegrationServices/WebhookIntegration";
import { TypebotIntegration } from "./services/IntegrationServices/TypebotIntegration";
import { NgrokInstance } from "./helpers/NgrokInstance";
import { OmniServices } from "./services/OmniServices/OmniServices";
import { NotificamehubDriver } from "./services/OmniDrivers/NotificamehubDriver";
import Message from "./models/Message";

// Environment Variable Validation
if (!process.env.PORT) {
  logger.error("PORT environment variable is not set.");
  process.exit(1);
}

// Function to start server and initialize services
async function startServer() {
  try {
    const companies = await Company.findAll();
    const sessionPromises = companies.map(async company => {
      try {
        await StartAllWhatsAppsSessions(company.id);
        logger.info(`Started WhatsApp session for company ID: ${company.id}`);
      } catch (error) {
        logger.error(
          `Error starting WhatsApp session for company ID: ${company.id} - ${error.message}`
        );
      }
    });

    await Promise.all(sessionPromises);

    startQueueProcess();
    logger.info(`Server started on port: ${process.env.PORT}`);

    try {
      await payGatewayInitialize();
    } catch (error) {
      logger.error(`Error initializing payment gateway: ${error.message}`);
    }

    checkOpenInvoices();
  } catch (error) {
    logger.error(`Error during server startup: ${error.message}`);
    process.exit(1);
  }
}

// Initialize Integration Services
const integrationServices = IntegrationServices.getInstance();
// integrationServices.registerIntegration(new DummyIntegration());
integrationServices.registerIntegration(new WebhookIntegration());
integrationServices.registerIntegration(new TypebotIntegration());

// Initialize Omni Services
const omniServices = OmniServices.getInstance();
omniServices.registerOmniDriver(new NotificamehubDriver());

// Create and start the server
const server = app.listen(process.env.PORT, async () => {
  if (process.env.NGROK_AUTH_TOKEN) {
    logger.info("initializing ngrok...");
    try {
      const url = await ngrok.connect({
        authtoken: process.env.NGROK_AUTH_TOKEN,
        addr: process.env.PORT
      });
      if (url) {
        NgrokInstance.getInstance().setUrl(url);
      }
      logger.info(`Server is publicly accessible at: ${url}`);
    } catch (error) {
      logger.error(`Error initializing ngrok: ${error.message}`);
    }
  }
  // wait for i18n initialization before starting the server
  i18nReady.then(() => {
    // Create and start the server
    const server = app.listen(process.env.PORT, async () => {
      logger.info(`Server is listening on port: ${process.env.PORT}`);

      await startServer();
    });
});

// Allow user to download media from messages the server failed to downloadit
Message.update({ mediaType: "overlimit" }, { where: { mediaType: "wait" } })
  .then(result => {
    logger.debug(`Changed ${result[0]} media type 'wait' to 'overlimit'`);
  })
  .catch(error => {
    logger.error(
      `Error updating media type 'wait' to 'overlimit': ${error.message}`
    );
  });

  initIO(server);

  // Graceful Shutdown Setup
  gracefulShutdown(server, {
    signals: "SIGINT SIGTERM",
    timeout: 30000,
    onShutdown: async () => {
      logger.info("Shutdown initiated. Cleaning up...");
    },
    finally: () => {
      logger.info("Server has shut down.");
    }
  });
});

// Global Exception Handlers
process.on("uncaughtException", err => {
  logger.error({ err }, `Uncaught Exception: ${err.message}`);
  // eslint-disable-next-line dot-notation
  if (err["code"] === "ERR_OSSL_BAD_DECRYPT") {
    return;
  }
  process.exit(1);
});

// Global Exception Handlers for logging only
// eslint-disable-next-line @typescript-eslint/no-explicit-any
process.on("unhandledRejection", (reason: any, promise) => {
  if (reason instanceof TypeError) {
    logger.error(
      { message: reason.message, stack: reason.stack.split("\n") },
      "Unhandled Rejection"
    );
    return;
  }
  logger.debug({ promise, reason }, "Unhandled Rejection");
});
