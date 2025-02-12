import * as Sentry from "@sentry/node";
import makeWASocket, {
  WASocket,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  isJidBroadcast,
  CacheStore,
  WAMessageKey,
  WAMessageContent,
  proto
} from "@whiskeysockets/baileys";

import { Boom } from "@hapi/boom";
// import MAIN_LOGGER from "@whiskeysockets/baileys/lib/Utils/logger";
import NodeCache from "node-cache";
import { Op } from "sequelize";
import Whatsapp from "../models/Whatsapp";
import { logger, loggerBaileys } from "../utils/logger";
import authState from "../helpers/authState";
import AppError from "../errors/AppError";
import { getIO } from "./socket";
import { Store } from "./store";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import DeleteBaileysService from "../services/BaileysServices/DeleteBaileysService";
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import { GitInfo } from "../gitinfo";
import GetPublicSettingService from "../services/SettingServices/GetPublicSettingService";

// const loggerBaileys = MAIN_LOGGER.child({});
// loggerBaileys.level = process.env.BAILEYS_LOG_LEVEL || "error";

type Session = WASocket & {
  id?: number;
  store?: Store;
};

const sessions: Session[] = [];

const retriesQrCodeMap = new Map<number, number>();

export const getWbot = (whatsappId: number): Session => {
  const sessionIndex = sessions.findIndex(s => s.id === whatsappId);

  if (sessionIndex === -1) {
    throw new AppError("ERR_WAPP_NOT_INITIALIZED");
  }
  return sessions[sessionIndex];
};

export const removeWbot = async (
  whatsappId: number,
  isLogout = true
): Promise<void> => {
  try {
    const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
    if (sessionIndex !== -1) {
      if (isLogout) {
        await sessions[sessionIndex].logout();
      }

      sessions[sessionIndex].end(null);
      await sessions[sessionIndex].ws.close();

      sessions.splice(sessionIndex, 1);
    }
  } catch (err) {
    logger.error(err);
  }
};

function getGreaterVersion(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const numA = a[i] || 0;
    const numB = b[i] || 0;

    if (numA > numB) {
      return a;
    }
    if (numA < numB) {
      return b;
    }
  }

  return a;
}

const waVersion = [2, 3000, 1019954024];

const getProjectWAVersion = async () => {
  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/ticketz-oss/ticketz/refs/heads/main/backend/src/waversion.json"
    );
    const version = await res.json();
    return version;
  } catch (error) {
    logger.warn("Failed to get current WA Version from project repository");
  }
  return waVersion;
};

export const initWASocket = async (whatsapp: Whatsapp): Promise<Session> => {
  return new Promise((resolve, reject) => {
    try {
      (async () => {
        const io = getIO();

        const whatsappUpdate = await Whatsapp.findOne({
          where: { id: whatsapp.id }
        });

        if (!whatsappUpdate) return;

        const { id, name, provider } = whatsappUpdate;

        const autoVersion = await getProjectWAVersion();
        const isLegacy = provider === "stable";

        const version = getGreaterVersion(autoVersion, waVersion);

        logger.info(`using WA v${version.join(".")}`);
        logger.info(`isLegacy: ${isLegacy}`);
        logger.info(`Starting session ${name}`);
        let retriesQrCode = 0;

        let wsocket: Session = null;
        const store = makeInMemoryStore({
          logger: loggerBaileys
        });

        async function getMessage(
          key: WAMessageKey
        ): Promise<WAMessageContent | undefined> {
          if (store) {
            const msg = await store.loadMessage(key.remoteJid!, key.id!);
            logger.debug(
              { key, message: JSON.stringify(msg) },
              `[wbot.ts] getMessage: result of recovering message ${key.remoteJid} ${key.id}`
            );
            return msg?.message || undefined;
          }

          // only if store isn't present
          return proto.Message.fromObject({});
        }

        const { state, saveState } = await authState(whatsapp);

        const msgRetryCounterCache = new NodeCache();
        const userDevicesCache: CacheStore = new NodeCache();
        const internalGroupCache = new NodeCache({
          stdTTL: 5 * 60,
          useClones: false
        });
        const groupCache: CacheStore = {
          get: <T>(key: string): T => {
            logger.debug(`groupCache.get ${key}`);
            const value = internalGroupCache.get(key);
            if (!value) {
              logger.debug(`groupCache.get ${key} not found`);
              wsocket.groupMetadata(key).then(async metadata => {
                logger.debug({ key, metadata }, `groupCache.get ${key} set`);
                internalGroupCache.set(key, metadata);
              });
            }
            return value as T;
          },
          set: async (key: string, value: any) => {
            logger.debug({ key, value }, `groupCache.set ${key}`);
            return internalGroupCache.set(key, value);
          },
          del: async (key: string) => {
            logger.debug(`groupCache.del ${key}`);
            return internalGroupCache.del(key);
          },
          flushAll: async () => {
            logger.debug("groupCache.flushAll");
            return internalGroupCache.flushAll();
          }
        };

        const appName =
          (await GetPublicSettingService({ key: "appName" })) || "Ticketz";
        const hostName = process.env.BACKEND_URL?.split("/")[2];
        const appVersion = GitInfo.tagName || GitInfo.commitHash;
        const clientName = `${appName} ${appVersion}${
          hostName ? ` - ${hostName}` : ""
        }`;

        wsocket = makeWASocket({
          logger: loggerBaileys,
          printQRInTerminal: false,
          emitOwnEvents: false,
          browser: [clientName, "Desktop", appVersion],
          auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, loggerBaileys)
          },
          version,
          defaultQueryTimeoutMs: 60000,
          // retryRequestDelayMs: 250,
          // keepAliveIntervalMs: 1000 * 60 * 10 * 3,
          msgRetryCounterCache,
          // syncFullHistory: true,
          generateHighQualityLinkPreview: true,
          userDevicesCache,
          getMessage,
          cachedGroupMetadata: async jid => groupCache.get(jid),
          shouldIgnoreJid: jid =>
            isJidBroadcast(jid) || jid?.endsWith("@newsletter"),
          transactionOpts: { maxCommitRetries: 1, delayBetweenTriesMs: 10 }
        });

        // wsocket = makeWASocket({
        //   version,
        //   logger: loggerBaileys,
        //   printQRInTerminal: false,
        //   auth: state as AuthenticationState,
        //   generateHighQualityLinkPreview: false,
        //   shouldIgnoreJid: jid => isJidBroadcast(jid),
        //   browser: ["Chat", "Chrome", "10.15.7"],
        //   patchMessageBeforeSending: (message) => {
        //     const requiresPatch = !!(
        //       message.buttonsMessage ||
        //       // || message.templateMessage
        //       message.listMessage
        //     );
        //     if (requiresPatch) {
        //       message = {
        //         viewOnceMessage: {
        //           message: {
        //             messageContextInfo: {
        //               deviceListMetadataVersion: 2,
        //               deviceListMetadata: {},
        //             },
        //             ...message,
        //           },
        //         },
        //       };
        //     }

        //     return message;
        //   },
        // })

        wsocket.ev.on(
          "connection.update",
          async ({ connection, lastDisconnect, qr }) => {
            logger.info(
              { lastDisconnect },
              `Socket  ${name} Connection Update ${connection || ""}`
            );

            if (connection === "close") {
              if ((lastDisconnect?.error as Boom)?.output?.statusCode === 403) {
                await whatsapp.update({ status: "PENDING", session: "" });
                await DeleteBaileysService(whatsapp.id);
                io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
                  action: "update",
                  session: whatsapp
                });
                removeWbot(id, false);
              }
              if (
                (lastDisconnect?.error as Boom)?.output?.statusCode !==
                DisconnectReason.loggedOut
              ) {
                removeWbot(id, false).then(() => {
                  logger.info(`Reconnecting ${name} in 2 seconds`);
                  setTimeout(
                    () => StartWhatsAppSession(whatsapp, whatsapp.companyId),
                    2000
                  );
                });
              } else {
                await whatsapp.update({ status: "PENDING", session: "" });
                await DeleteBaileysService(whatsapp.id);
                io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
                  action: "update",
                  session: whatsapp
                });
                removeWbot(id, false).then(() => {
                  logger.info(`Reconnecting ${name} in 2 seconds`);
                  setTimeout(
                    () => StartWhatsAppSession(whatsapp, whatsapp.companyId),
                    2000
                  );
                });
              }
            }

            if (connection === "open") {
              await whatsapp.update({
                status: "CONNECTED",
                qrcode: "",
                retries: 0
              });

              io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
                action: "update",
                session: whatsapp
              });

              const sessionIndex = sessions.findIndex(
                s => s.id === whatsapp.id
              );
              if (sessionIndex === -1) {
                wsocket.id = whatsapp.id;
                sessions.push(wsocket);
              }

              resolve(wsocket);
            }

            if (qr !== undefined) {
              if (retriesQrCodeMap.get(id) && retriesQrCodeMap.get(id) >= 3) {
                await whatsappUpdate.update({
                  status: "DISCONNECTED",
                  qrcode: ""
                });
                await DeleteBaileysService(whatsappUpdate.id);
                io.emit("whatsappSession", {
                  action: "update",
                  session: whatsappUpdate
                });
                wsocket.ev.removeAllListeners("connection.update");
                wsocket.ws.close();
                wsocket = null;
                retriesQrCodeMap.delete(id);
              } else {
                logger.info(`Session QRCode Generate ${name}`);
                retriesQrCodeMap.set(id, (retriesQrCode += 1));

                await whatsapp.update({
                  qrcode: qr,
                  status: "qrcode",
                  retries: 0
                });
                const sessionIndex = sessions.findIndex(
                  s => s.id === whatsapp.id
                );

                if (sessionIndex === -1) {
                  wsocket.id = whatsapp.id;
                  sessions.push(wsocket);
                }

                io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
                  action: "update",
                  session: whatsapp
                });
              }
            }
          }
        );
        wsocket.ev.on("creds.update", saveState);

        wsocket.ev.on(
          "presence.update",
          async ({ id: remoteJid, presences }) => {
            try {
              logger.debug(
                { remoteJid, presences },
                "Received contact presence"
              );
              if (!presences[remoteJid]?.lastKnownPresence) {
                // ignore presence from groups
                return;
              }
              const contact = await Contact.findOne({
                where: {
                  number: remoteJid.replace(/\D/g, ""),
                  companyId: whatsapp.companyId
                }
              });
              if (!contact) {
                return;
              }
              const ticket = await Ticket.findOne({
                where: {
                  contactId: contact.id,
                  whatsappId: whatsapp.id,
                  status: {
                    [Op.or]: ["open", "pending"]
                  }
                }
              });

              if (ticket) {
                io.to(ticket.id.toString())
                  .to(`company-${whatsapp.companyId}-${ticket.status}`)
                  .to(`queue-${ticket.queueId}-${ticket.status}`)
                  .emit(`company-${whatsapp.companyId}-presence`, {
                    ticketId: ticket.id,
                    presence: presences[remoteJid].lastKnownPresence
                  });
              }
            } catch (error) {
              logger.error(
                { remoteJid, presences },
                "presence.update: error processing"
              );
              if (error instanceof Error) {
                logger.error(`Error: ${error.name} ${error.message}`);
              } else {
                logger.error(`Error was object of type: ${typeof error}`);
              }
            }
          }
        );

        wsocket.ev.on("groups.upsert", groups => {
          logger.debug("Received new group");
          groups.forEach(group => {
            groupCache.set(group.id, group);
          });
        });

        wsocket.ev.on("groups.update", async ([event]) => {
          logger.debug("Received group update");
          const metadata = await wsocket.groupMetadata(event.id);
          groupCache.set(event.id, metadata);
        });

        wsocket.ev.on("group-participants.update", async event => {
          logger.debug("Received group participants update");
          try {
            const metadata = await wsocket.groupMetadata(event.id);
            groupCache.set(event.id, metadata);
          } catch (error) {
            groupCache.del(event.id);
          }
        });

        store.bind(wsocket.ev);
      })();
    } catch (error) {
      Sentry.captureException(error);
      console.log(error);
      reject(error);
    }
  });
};
