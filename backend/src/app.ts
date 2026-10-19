import "./bootstrap";
import "reflect-metadata";
import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";

import "./database";
import path from "path";
import uploadConfig from "./config/upload";
import AppError from "./errors/AppError";
import PlatformApiError from "./errors/PlatformApiError";
import routes from "./routes";
import { logger } from "./utils/logger";
import { sendScheduledMessages } from "./queues";
import { corsOrigin } from "./helpers/corsOrigin";

class SystemError extends Error {
  code?: string;
}

Sentry.init({ dsn: process.env.SENTRY_DSN });

const app = express();
app.set("trust proxy", 1);

app.set("queues", {
  sendScheduledMessages
});

app.use(
  cors({
    credentials: true,
    origin: corsOrigin,
    exposedHeaders: [
      "Content-Range",
      "X-Content-Range",
      "Date",
      "Accept-Ranges",
      "Content-Length",
      "WWW-Authenticate"
    ]
  })
);
app.use(cookieParser());
app.use(
  express.json({
    limit: "10mb",
    // Guarda o buffer crú do body: usado pelo webhook do WhatsApp Cloud API
    // pra validar a assinatura HMAC (X-Hub-Signature-256) da Meta, que e
    // calculada sobre os bytes exatos recebidos, antes do parse do JSON.
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    }
  })
);
app.use(Sentry.Handlers.requestHandler());
app.get("/public/*", (req, res) => {
  const publicRoot = path.resolve(uploadConfig.directory);
  const filePath = path.resolve(publicRoot, req.params[0]);
  // Uploaded files cannot be used to reach private tenant context documents.
  if (!filePath.startsWith(publicRoot + path.sep)) return res.status(404).end();

  if (filePath.endsWith(".aac")) {
    res.setHeader("Content-Type", "audio/aac");
  }

  // ?inline=1 → serve with Content-Disposition: inline so browsers display
  // the file in-place (e.g. PDF viewer iframe) instead of downloading it.
  if (req.query.inline === "1") {
    res.setHeader("Content-Disposition", "inline");
    return res.sendFile(filePath, err => {
      if (err) {
        const sysErr = err as SystemError;
        if (sysErr.code === "ENOENT") {
          res.status(404).end();
        } else {
          logger.debug(
            { err },
            `Error serving inline file ${req.params[0]}: ${sysErr.message}`
          );
          res.status(500).end();
        }
      }
    });
  }

  res.download(filePath, (err: SystemError) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.status(404).end();
      } else {
        logger.debug(
          { err },
          `Error downloading file ${req.params[0]}: ${err.message}`
        );
        res.status(500).end();
      }
    }
  });
});

app.use((req, _res, next) => {
  const { method, path: requestPath, query, body, headers } = req;
  const safeHeaders = { ...headers };
  delete safeHeaders.authorization;
  delete safeHeaders.cookie;
  delete safeHeaders["x-platform-key"];
  delete safeHeaders["x-signature"];
  logger.trace(
    {
      method,
      path: requestPath,
      queryKeys: Object.keys(query || {}),
      bodyKeys:
        body && typeof body === "object" && !Array.isArray(body)
          ? Object.keys(body)
          : [],
      headers: safeHeaders
    },
    `Incoming request: ${req.method} ${req.path}`
  );
  next();
});

app.use(routes);

app.use(Sentry.Handlers.errorHandler());
app.use(async (err: Error, req: Request, res: Response, _: NextFunction) => {
  if (err instanceof PlatformApiError) {
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {})
    });
  }

  if (err instanceof AppError) {
    logger[err.level](err);
    return res.status(err.statusCode).json({ error: err.message });
  }

  logger.error(err);
  return res.status(500).json({ error: "Internal server error" });
});

export default app;
