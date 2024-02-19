import { Server as SocketIO } from "socket.io";
import { Server } from "http";
import AppError from "../errors/AppError";
import { logger } from "../utils/logger";
import User from "../models/User";
import Queue from "../models/Queue";
import Ticket from "../models/Ticket";
import { verify } from "jsonwebtoken";
import authConfig from "../config/auth";
import { CounterManager } from "./counter";

let io: SocketIO;

export const initIO = (httpServer: Server): SocketIO => {
  const counters = new CounterManager();
  
  io = new SocketIO(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL
    }
  });

  io.on("connection", async socket => {
    logger.info("Client Connected");
    const { token } = socket.handshake.query;
    let tokenData = null;
    try {
		tokenData=verify(token, authConfig.secret);
		logger.debug(tokenData,"io-onConnection: tokenData");
	} catch (error) {
		logger.error(error,"Error decoding token");
		socket.disconnect();
		return io;
	}
    let user: User = null;
    let userId = tokenData.id;

    if (userId && userId !== "undefined" && userId !== "null") {
      user = await User.findByPk(userId, { include: [ Queue ] });
      if (user) {
        user.online = true;
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

    socket.join(`company-${user.companyId}-mainchannel`);
    socket.join(`user-${user.id}`);

    socket.on("joinChatBox", async (ticketId: string) => {
      if (!ticketId || ticketId === "undefined") {
        return;
      }
      Ticket.findByPk(ticketId).then(
        (ticket) => {
          if (ticket && ticket.companyId === user.companyId
            && (ticket.userId === user.id || user.profile === "admin")) {
            logger.debug(`User ${user.id} of company ${user.company} joined ticket ${ticketId} channel`);
            if (counters.incrementCounter(`ticket-${ticketId}`) === 1) {
              socket.join(ticketId);
            }
          } else {
            logger.info(`Invalid attempt to join channel of ticket ${ticketId} by user ${user.id}`)
          }
        },
        (error) => {
          logger.error(error, `Error fetching ticket ${ticketId}`);
        }
      );
    });
    
    socket.on("leaveChatBox"), async (ticketId: string) => {
      if (!ticketId || ticketId === "undefined") {
        return;
      }

      // o último que sair apaga a luz      
      if (counters.decrementCounter(`ticket-${ticketId}`) === 0) {
        socket.leave(ticketId);
      }
    }

	  socket.on("joinNotification", async () => {
      if (counters.incrementCounter("notification") === 1) {
  		  if (user.profile === "admin") {
  			  logger.debug(`Admin ${user.id} of company ${user.companyId} joined the notification channel.`);
  			  socket.join(`company-${user.companyId}-notification`);
  		  } else {
  			  user.queues.forEach((queue) => {
  				  logger.debug(`User ${user.id} of company ${user.companyId} joined queue ${queue.id} channel.`);
  				  socket.join(`queue-${queue.id}-notification`);
  			  });
  		  }
		  }
	  });
	  
	  socket.on("leaveNotification", async () => {
      if (counters.decrementCounter("notification") === 0) {
        if (user.profile === "admin") {
          logger.debug(`Admin ${user.id} of company ${user.companyId} leaved the notification channel.`);
          socket.leave(`company-${user.companyId}-notification`);
        } else {
          user.queues.forEach((queue) => {
            logger.debug(`User ${user.id} of company ${user.companyId} leaved queue ${queue.id} channel.`);
            socket.leave(`queue-${queue.id}-notification`);
          });
        }
      }
    });
 
	  socket.on("joinTickets", (status: string) => {
      if (counters.incrementCounter(`status-${status}`) === 1) {
        if (user.profile === "admin") {
          logger.debug(`Admin ${user.id} of company ${user.companyId} joined ${status} tickets channel.`);
          socket.join(`company-${user.companyId}-${status}`);
        } else if (status === "pending") {
          user.queues.forEach((queue) => {
            logger.debug(`User ${user.id} of company ${user.companyId} joined queue ${queue.id} pending tickets channel.`);
            socket.join(`queue-${queue.id}-pending`);
          });
        }
		  }
	  });
	  
    socket.on("leaveTickets", (status: string) => {
      if (counters.decrementCounter(`status-${status}`) === 0) {
        if (user.profile === "admin") {
          logger.debug(`Admin ${user.id} of company ${user.companyId} leaved ${status} tickets channel.`);
          socket.leave(`company-${user.companyId}-${status}`);
        } else if (status === "pending") {
          user.queues.forEach((queue) => {
            logger.debug(`User ${user.id} of company ${user.companyId} leaved queue ${queue.id} pending tickets channel.`);
            socket.leave(`queue-${queue.id}-pending`);
          });
        }
      }
    });
	  
  });
  return io;
};

export const getIO = (): SocketIO => {
  if (!io) {
    throw new AppError("Socket IO not initialized");
  }
  return io;
};
