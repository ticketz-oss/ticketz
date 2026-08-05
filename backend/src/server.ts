import gracefulShutdown from "http-graceful-shutdown";
import app from "./app";
import { initIO, closeIO } from "./libs/socket";
import { logger } from "./utils/logger";
import { StartAllWhatsAppsSessions } from "./services/WbotServices/StartAllWhatsAppsSessions";
import Company from "./models/Company";
import { startQueueProcess, closeAllQueues } from "./queues";
import { closeAllSessions } from "./libs/wbot";
import {
  checkOpenInvoices,
  payGatewayInitialize
} from "./services/PaymentGatewayServices/PaymentGatewayServices";
import { i18nReady } from "./services/TranslationServices/i18nService";
import { cacheLayer } from "./libs/cache";
import { registerShutdownTrigger } from "./utils/shutdown";
import CleanupReplacedContainerService from "./services/DockerServices/CleanupReplacedContainerService";

// Hard-exit safety timer for graceful shutdown. Set in preShutdown and cleared
// in finally so the process can never hang during a restart.
let forceExitTimer: NodeJS.Timeout | null = null;

// Environment Variable Validation
if (!process.env.PORT) {
  logger.error("PORT environment variable is not set.");
  process.exit(1);
}

// Function to start server and initialize services
async function startServer() {
  try {
    await cacheLayer.runMandatoryClearIfNeeded();

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

// wait for i18n initialization before starting the server
i18nReady.then(() => {
  // Create and start the server
  const server = app.listen(process.env.PORT, async () => {
    logger.info(`Server is listening on port: ${process.env.PORT}`);

    // Remove the old container after a self-update via the interface
    CleanupReplacedContainerService();

    await startServer();
  });

  initIO(server);

  // Graceful Shutdown Setup
  const shutdown = gracefulShutdown(server, {
    signals: "SIGINT SIGTERM",
    timeout: 30000,
    // Hard-exit safety net: set it up first so the process can never hang,
    // regardless of where the shutdown stalls (connection draining, cleanup,
    // etc.). Cleared in `finally` once shutdown completes.
    preShutdown: async () => {
      logger.info("Shutdown initiated. Cleaning up...");

      forceExitTimer = setTimeout(() => {
        logger.warn("Shutdown timed out; forcing exit.");
        process.exit(0);
      }, 10000);
      forceExitTimer.unref();

      // Close Socket.IO first so open WebSocket connections are released and
      // don't keep the HTTP server from draining.
      logger.info("Closing Socket.IO connections...");
      await closeIO();
    },
    onShutdown: async () => {
      // Close WhatsApp sessions (without logout, so credentials are kept)
      // and drain Bull queues so in-flight jobs can finish.
      await Promise.allSettled([closeAllSessions(), closeAllQueues()]);
    },
    finally: () => {
      if (forceExitTimer) {
        clearTimeout(forceExitTimer);
        forceExitTimer = null;
      }
      logger.info("Server has shut down.");
    }
  });

  // Expose the trigger so the restart endpoint can shut down gracefully
  // instead of calling process.exit(0) directly.
  registerShutdownTrigger(shutdown);
});

// Global Exception Handlers
process.on("uncaughtException", err => {
  logger.error({ err }, `Uncaught Exception: ${err.message}`);
  if (err["code"] && ["ERR_OSSL_BAD_DECRYPT", "ENOENT"].includes(err["code"])) {
    return;
  }
  process.exit(1);
});

// Global Exception Handlers for logging only
// eslint-disable-next-line @typescript-eslint/no-explicit-any
process.on("unhandledRejection", (reason: any, promise) => {
  logger.debug({ promise, reason }, "Unhandled Rejection");
});
