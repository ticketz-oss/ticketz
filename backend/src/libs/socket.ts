/*

   DO NOT REMOVE / NÃO REMOVER

   VERSÃO EM PORTUGUÊS MAIS ABAIXO

   
   BASIC LICENSE INFORMATION:

   Author: Claudemir Todo Bom
   Email: claudemir@todobom.com
   
   Licensed under the AGPLv3 as stated on LICENSE.md file
   
   Any work that uses code from this file is obligated to 
   give access to its source code to all of its users (not only
   the system's owner running it)
   
   EXCLUSIVE LICENSE to use on closed source derived work can be
   purchased from the author and put at the root of the source
   code tree as proof-of-purchase.



   INFORMAÇÕES BÁSICAS DE LICENÇA

   Autor: Claudemir Todo Bom
   Email: claudemir@todobom.com

   Licenciado sob a licença AGPLv3 conforme arquivo LICENSE.md
    
   Qualquer sistema que inclua este código deve ter o seu código
   fonte fornecido a todos os usuários do sistema (não apenas ao
   proprietário da infraestrutura que o executa)
   
   LICENÇA EXCLUSIVA para uso em produto derivado em código fechado
   pode ser adquirida com o autor e colocada na raiz do projeto
   como prova de compra. 
   
 */

import { Server as SocketIO } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import { Server } from "http";
import { verify } from "jsonwebtoken";
import AppError from "../errors/AppError";
import { logger, socketSendBuffer } from "../utils/logger";
import User from "../models/User";
import Queue from "../models/Queue";
import Ticket from "../models/Ticket";
import authConfig from "../config/auth";
import { CounterManager } from "./counter";
import UserSocketSession from "../models/UserSocketSession";
import { GetCompanySetting } from "../helpers/CheckSettings";

let io: SocketIO;

const joinTicketChannel = async (
  socket,
  ticketId: string,
  user: User,
  counters: CounterManager
) => {
  const c = counters.incrementCounter(`ticket-${ticketId}`);
  if (c === 1) {
    socket.join(ticketId);
  }
  logger.debug(`joinChatbox[${c}]: Channel: ${ticketId} by user ${user.id}`);
};

const notifyOnlineChange = (companyId: number) => {
  io.to("super").to(`company-${companyId}-admin`).emit("userOnlineChange");
};

export const initIO = (httpServer: Server): SocketIO => {
  io = new SocketIO(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL
    }
  });

  if (process.env.SOCKET_ADMIN && JSON.parse(process.env.SOCKET_ADMIN)) {
    User.findByPk(1).then(adminUser => {
      instrument(io, {
        auth: {
          type: "basic",
          username: adminUser.email,
          password: adminUser.passwordHash
        },
        mode: "development"
      });
    });
  }

  UserSocketSession.update({ active: false }, { where: { active: true } }).then(
    _ => {
      logger.debug("Clossing all socket sessions");
    }
  );

  io.on("connection", async socket => {
    logger.info("Client Connected");
    const { token } = socket.handshake.query;
    let tokenData = null;
    try {
      tokenData = verify(token as string, authConfig.secret);
      logger.debug(tokenData, "io-onConnection: tokenData");
    } catch (error) {
      logger.debug(`Error decoding token: ${error?.message}`);
      socket.disconnect();
      return io;
    }
    const counters = new CounterManager();

    let user: User = null;
    const userId = tokenData.id;

    if (userId && userId !== "undefined" && userId !== "null") {
      user = await User.findByPk(userId, { include: [Queue] });
      if (user) {
        await user.save();
      } else {
        logger.info(`onConnect: User ${userId} not found`);
        socket.disconnect();
        return io;
      }
    } else {
      logger.info("onConnect: Missing userId");
      socket.disconnect();
      return io;
    }

    UserSocketSession.create({
      id: socket.id,
      userId,
      active: true
    }).then(_ => {
      logger.debug(`started session ${socket.id} for user ${userId}`);
      notifyOnlineChange(user.companyId);
    });

    socket.on("disconnect", async () => {
      UserSocketSession.update(
        { active: false },
        { where: { id: socket.id } }
      ).then(() => {
        logger.debug(`finished session ${socket.id} for user ${userId}`);
        notifyOnlineChange(user.companyId);
      });
    });

    socket.join(`company-${user.companyId}-mainchannel`);
    socket.join(`user-${user.id}`);

    if (user.super) {
      socket.join("super");
    }

    if (user.profile === "admin") {
      socket.join(`company-${user.companyId}-admin`);
    }

    socket.on("joinBackendlog", () => {
      if (user.super) {
        socket.join("backendlog");
        io.to("backendlog").emit("backendlog", {
          timestamp: Date.now(),
          level: 30,
          logs: [
            { currentLevel: logger.level },
            "started transmission of backend logs"
          ]
        });
        socketSendBuffer();
      } else {
        logger.info(`User ${user.id} tried to join superlog channel.`);
      }
    });

    socket.on("leaveBackendlog", () => {
      if (user.super) {
        io.to("backendlog").emit("backendlog", {
          timestamp: Date.now(),
          level: 30,
          logs: ["finished transmission of backend logs"]
        });
        socket.leave("backendlog");
      } else {
        logger.info(`User ${user.id} tried to leave superlog channel.`);
      }
    });

    socket.on("setLoglevel", (level: string) => {
      if (user.super) {
        if (logger.level === level) return;

        logger.level = level;
        io.to("backendlog").emit("backendlog", {
          timestamp: Date.now(),
          level: 30,
          logs: [`Log level changed to ${level}`]
        });
      } else {
        logger.info(`User ${user.id} tried to set log level.`);
      }
    });

    socket.on("joinChatBox", async (ticketId: string) => {
      if (!ticketId || ticketId === "undefined") {
        return;
      }
      Ticket.findByPk(ticketId).then(
        async ticket => {
          if (
            ticket &&
            ticket.companyId === user.companyId &&
            (ticket.userId === user.id || user.profile === "admin")
          ) {
            joinTicketChannel(socket, ticketId, user, counters);
          } else if (
            ticket.isGroup &&
            (await GetCompanySetting(
              user.companyId,
              "groupsTab",
              "disabled"
            )) === "enabled"
          ) {
            let queueFound = false;
            user.queues.forEach(queue => {
              if (queue.id === ticket.queueId) {
                queueFound = true;
              }
            });
            if (queueFound) {
              joinTicketChannel(socket, ticketId, user, counters);
            } else {
              logger.info(
                `Invalid attempt to join channel of ticket ${ticketId} by user ${user.id}`
              );
            }
          } else {
            logger.info(
              `Invalid attempt to join channel of ticket ${ticketId} by user ${user.id}`
            );
          }
        },
        error => {
          logger.error(error, `Error fetching ticket ${ticketId}`);
        }
      );
    });

    socket.on("leaveChatBox", async (ticketId: string) => {
      if (!ticketId || ticketId === "undefined") {
        return;
      }

      // o último que sair apaga a luz
      const c = counters.decrementCounter(`ticket-${ticketId}`);
      if (c === 0) {
        socket.leave(ticketId);
      }

      logger.debug(
        `leaveChatbox[${c}]: Channel: ${ticketId} by user ${user.id}`
      );
    });

    socket.on("joinNotification", async () => {
      const c = counters.incrementCounter("notification");
      if (c === 1) {
        if (user.profile === "admin") {
          socket.join(`company-${user.companyId}-notification`);
        } else {
          user.queues.forEach(queue => {
            logger.debug(
              `User ${user.id} of company ${user.companyId} joined queue ${queue.id} channel.`
            );
            socket.join(`queue-${queue.id}-notification`);
          });
        }
      }
      logger.debug(`joinNotification[${c}]: User: ${user.id}`);
    });

    socket.on("leaveNotification", async () => {
      const c = counters.decrementCounter("notification");
      if (c === 0) {
        if (user.profile === "admin") {
          socket.leave(`company-${user.companyId}-notification`);
        } else {
          user.queues.forEach(queue => {
            logger.debug(
              `User ${user.id} of company ${user.companyId} leaved queue ${queue.id} channel.`
            );
            socket.leave(`queue-${queue.id}-notification`);
          });
        }
      }
      logger.debug(`leaveNotification[${c}]: User: ${user.id}`);
    });

    socket.on("joinTickets", (status: string) => {
      if (counters.incrementCounter(`status-${status}`) === 1) {
        if (user.profile === "admin") {
          logger.debug(
            `Admin ${user.id} of company ${user.companyId} joined ${status} tickets channel.`
          );
          socket.join(`company-${user.companyId}-${status}`);
        } else if (status === "pending") {
          user.queues.forEach(queue => {
            logger.debug(
              `User ${user.id} of company ${user.companyId} joined queue ${queue.id} pending tickets channel.`
            );
            socket.join(`queue-${queue.id}-pending`);
          });
        } else {
          logger.debug(`User ${user.id} cannot subscribe to ${status}`);
        }
      }
    });

    socket.on("leaveTickets", (status: string) => {
      if (counters.decrementCounter(`status-${status}`) === 0) {
        if (user.profile === "admin") {
          logger.debug(
            `Admin ${user.id} of company ${user.companyId} leaved ${status} tickets channel.`
          );
          socket.leave(`company-${user.companyId}-${status}`);
        } else if (status === "pending") {
          user.queues.forEach(queue => {
            logger.debug(
              `User ${user.id} of company ${user.companyId} leaved queue ${queue.id} pending tickets channel.`
            );
            socket.leave(`queue-${queue.id}-pending`);
          });
        }
      }
    });

    socket.emit("ready");
    return io;
  });
  return io;
};

export const getIO = (): SocketIO => {
  if (!io) {
    throw new AppError("Socket IO not initialized");
  }
  return io;
};
