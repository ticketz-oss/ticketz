import gracefulShutdown from "http-graceful-shutdown";
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

// Create and start the server
const server = app.listen(process.env.PORT, async () => {
  logger.info(`Server is listening on port: ${process.env.PORT}`);
  await startServer();
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

// Global Exception Handlers
process.on("uncaughtException", err => {
  logger.error({ err }, `Uncaught Exception: ${err.message}`);
  process.exit(1);
});

// Global Exception Handlers for logging only
// eslint-disable-next-line @typescript-eslint/no-explicit-any
process.on("unhandledRejection", (reason: any, promise) => {
  logger.debug({ promise, reason }, "Unhandled Rejection");
});
