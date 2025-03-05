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

export function initLogger(subsystem: string, level: string) {
  return pino({
    level,
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
        addSubsystem(inputArgs, subsystem);
        method.apply(this, inputArgs);
      }
    }
  });
}

export const logger = initLogger("ticketz", process.env.LOG_LEVEL ?? "info");

export const loggerBaileys = initLogger(
  "baileys",
  process.env.BAILEYS_LOG_LEVEL ?? "error"
);
