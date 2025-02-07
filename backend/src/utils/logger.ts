import pino from "pino";

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
    logMethod(inputArgs, method) {
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
    logMethod(inputArgs, method) {
      addSubsystem(inputArgs, "baileys");
      method.apply(this, inputArgs);
    }
  }
});
