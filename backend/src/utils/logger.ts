import { Mutex } from "async-mutex";
import pino from "pino";
import { getIO } from "../libs/socket";

const state = {
  io: null
};

const stateMutex = new Mutex();

const logBuffer = [];

function expireLog() {
  const now = Date.now();
  const expireTime = 60 * 5000;

  while (logBuffer.length > 0 && now - logBuffer[0].timestamp > expireTime) {
    logBuffer.shift();
  }
}

async function socketSendLog(level: number, logs: any) {
  const haveIO = await stateMutex.runExclusive(async () => {
    if (!state.io) {
      try {
        state.io = getIO();
      } catch (error) {
        return false;
      }
    }
    return true;
  });

  if (!haveIO) {
    return;
  }

  const timestamp = Date.now();

  const logLine = { timestamp, level, logs };
  logBuffer.push(logLine);

  expireLog();

  state.io.to("backendlog").emit("backendlog", logLine);
}

export async function socketSendBuffer() {
  const haveIO = await stateMutex.runExclusive(async () => {
    if (!state.io) {
      try {
        state.io = getIO();
      } catch (error) {
        return false;
      }
    }
    return true;
  });

  if (!haveIO) {
    return;
  }

  expireLog();

  logBuffer.forEach(log => {
    state.io.to("backendlog").emit("backendlog", log);
  });
}

function addSubsystem(inputArgs, subsystem) {
  const item =
    inputArgs.length >= 2 && typeof inputArgs[0] !== "string" ? 1 : 0;

  if (typeof inputArgs[item] === "string") {
    inputArgs[item] = `[${subsystem}]: ${inputArgs[item]}`;
  } else if (typeof inputArgs[item] === "object") {
    inputArgs[item].subsystem = subsystem;
  }
}

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport: {
    target: "pino-pretty",
    options: {
      levelFirst: true,
      translateTime: true,
      colorize: true
    }
  },
  hooks: {
    logMethod(inputArgs, method, level) {
      socketSendLog(level, inputArgs).catch(() => {
        // Ignore errors when sending logs over socket
      });
      addSubsystem(inputArgs, "ticketz");
      method.apply(this, inputArgs);
    }
  }
});

export const loggerBaileys = pino({
  timestamp: () => {
    return `,"time":"${new Date().toJSON()}"`;
  },
  level: process.env.BAILEYS_LOG_LEVEL ?? "error",
  transport: {
    target: "pino-pretty",
    options: {
      levelFirst: true,
      translateTime: true,
      colorize: true
    }
  },
  hooks: {
    logMethod(inputArgs, method, level) {
      socketSendLog(level, inputArgs).catch(() => {
        // Ignore errors when sending logs over socket
      });
      addSubsystem(inputArgs, "baileys");
      method.apply(this, inputArgs);
    }
  }
});
