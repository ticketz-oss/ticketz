import gracefulShutdown from "http-graceful-shutdown";
import app from "./app";
import { initIO } from "./libs/socket";
import { logger } from "./utils/logger";
import { StartAllWhatsAppsSessions } from "./services/WbotServices/StartAllWhatsAppsSessions";
import Company from "./models/Company";
import { startQueueProcess } from "./queues";
import { checkOpenInvoices, payGatewayInitialize } from "./services/PaymentGatewayServices/PaymentGatewayServices";

const server = app.listen(process.env.PORT, async () => {
  const companies = await Company.findAll();
  const allPromises: Promise<unknown>[] = [];
  companies.map(async c => {
    const promise = StartAllWhatsAppsSessions(c.id);
    allPromises.push(promise);
  });

  Promise.all(allPromises).then(() => {
    startQueueProcess();
  });
  logger.info(`Server started on port: ${process.env.PORT}`);
  
  payGatewayInitialize().catch(
    (e) => {
      logger.error(`Error initializing payment gateway: ${e.message}`);
    }
  );
  
  checkOpenInvoices();
});

initIO(server);
gracefulShutdown(server);
