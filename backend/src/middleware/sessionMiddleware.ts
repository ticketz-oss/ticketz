import express from "express";
import jwtConfig from "../config/auth";

export function sessionMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  if (!jwtConfig.secret) {
    res.status(500).json({ error: "ERR_SESSION_SECRET_UNAVAILABLE" });
    return;
  }

  next();
}
