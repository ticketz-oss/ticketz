import gracefulShutdown from "http-graceful-shutdown";
import app from "./app";
import { initIO } from "./libs/socket";
import { logger } from "./utils/logger";
import { StartAllWhatsAppsSessions } from "./services/WbotServices/StartAllWhatsAppsSessions";
import Company from "./models/Company";
import { startQueueProcess } from "./queues";
import https from "https"
import fs from "fs"
// const privatkey = fs.readFileSync("./certs/key.pem","utf-8")
// const certificate = fs.readFileSync("./certs/cert.pem","utf-8")
// const credentials = { key: privatkey, cert: certificate };
// const server = https.createServer(credentials, app);


const server = app.listen(process.env.PORT, async () => {
  const companies = await Company.findAll();
  const allPromises: any[] = [];
  companies.map(async c => {
    const promise = StartAllWhatsAppsSessions(c.id);
    allPromises.push(promise);
  });

  Promise.all(allPromises).then(() => {
    startQueueProcess();
  });
  logger.info(`Server started on port: ${process.env.PORT}`);
});

// server.listen(process.env.PORT, async () => {
//   const companies = await Company.findAll();
//   const allPromises: any[] = [];
//   companies.map(async c => {
//     const promise = StartAllWhatsAppsSessions(c.id);
//     allPromises.push(promise);
//   });

//   Promise.all(allPromises).then(() => {
//     startQueueProcess();
//   });
//   logger.info(`Server started on port: ${process.env.PORT}`);
// });


initIO(server);
gracefulShutdown(server);
