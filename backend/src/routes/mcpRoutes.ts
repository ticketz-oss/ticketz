import { Router } from "express";
import * as McpController from "../controllers/McpController";
import { mcpCallLimiter } from "../middleware/mcpRateLimit";

const routes = Router();

routes.post(
  "/mcp",
  mcpCallLimiter,
  McpController.authenticate,
  McpController.post
);

export default routes;
