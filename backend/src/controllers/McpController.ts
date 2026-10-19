import { NextFunction, Request, Response } from "express";
import mcpConfig from "../config/mcp";
import AppError from "../errors/AppError";
import { validateAccessToken } from "../services/McpServices/OAuthService";
import {
  TOOL_SCOPES,
  handleMcpRequest
} from "../services/McpServices/McpServerService";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const challenge = `Bearer resource_metadata="${mcpConfig.protectedResourceMetadata}"`;
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    res.setHeader("WWW-Authenticate", challenge);
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  try {
    req.mcpAuth = await validateAccessToken(authorization.slice(7));
    const tool = req.body?.params?.name;
    // Mesmo mapa que o registro das ferramentas usa, para o middleware nunca
    // liberar uma chamada que o handler recusaria (ou vice-versa).
    const requiredScope =
      typeof tool === "string" ? TOOL_SCOPES[tool] : undefined;
    if (requiredScope && !req.mcpAuth.scopes.includes(requiredScope)) {
      res.setHeader(
        "WWW-Authenticate",
        `${challenge}, error="insufficient_scope", scope="${requiredScope}"`
      );
      res.status(403).json({ error: "insufficient_scope" });
      return;
    }
    next();
  } catch {
    res.setHeader("WWW-Authenticate", `${challenge}, error="invalid_token"`);
    res.status(401).json({ error: "invalid_token" });
  }
};

export const post = async (req: Request, res: Response): Promise<void> => {
  if (!req.mcpAuth) throw new AppError("unauthorized", 401);
  try {
    await handleMcpRequest(req, res, req.mcpAuth);
  } catch (error) {
    if (!res.headersSent) {
      const status = error instanceof AppError ? error.statusCode : 500;
      res.status(status).json({
        jsonrpc: "2.0",
        error: {
          code: status === 500 ? -32603 : -32602,
          message: status === 500 ? "Internal server error" : error.message
        },
        id: null
      });
    }
  }
};
