import { Router, RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import isAuth from "../middleware/isAuth";
import User from "../models/User";
import AppError from "../errors/AppError";
import * as AgentController from "../controllers/AgentController";

const routes = Router();
const safeHandler =
  (handler: RequestHandler): RequestHandler =>
  async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(
        error instanceof AppError
          ? error
          : new AppError("ERR_AGENT_QUERY_FAILED", 503)
      );
    }
  };
const agentSuper = async (req, _res, next) => {
  const user = await User.findOne({
    where: { id: req.user.id, companyId: req.user.companyId, super: true },
    attributes: ["id"]
  });
  if (!user) throw new AppError("ERR_AGENT_PERMISSION_DENIED", 403);
  next();
};
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  keyGenerator: req => `${req.user.companyId}:${req.user.id}`,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({ error: "ERR_AGENT_RATE_LIMIT" })
});

routes.get(
  "/agent/availability",
  isAuth,
  safeHandler(AgentController.availability)
);

routes.post(
  "/agent/chat",
  isAuth,
  chatLimiter,
  safeHandler(AgentController.chat)
);
routes.post(
  "/agent/sessions",
  isAuth,
  chatLimiter,
  safeHandler(AgentController.session)
);
routes.post(
  "/agent/sessions/:sessionId/heartbeat",
  isAuth,
  safeHandler(AgentController.heartbeat)
);
routes.delete(
  "/agent/sessions/:sessionId",
  isAuth,
  safeHandler(AgentController.close)
);
const toolLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  keyGenerator: req => req.headers.authorization?.slice(7) || "anonymous",
  standardHeaders: "draft-8",
  legacyHeaders: false
});
routes.post("/agent/tools", toolLimiter, safeHandler(AgentController.tools));
routes.get(
  "/agent/admin/companies",
  isAuth,
  safeHandler(agentSuper),
  safeHandler(AgentController.companies)
);
routes.get(
  "/agent/admin/companies/:companyId/context",
  isAuth,
  safeHandler(agentSuper),
  safeHandler(AgentController.context)
);
routes.put(
  "/agent/admin/companies/:companyId/context",
  isAuth,
  safeHandler(agentSuper),
  safeHandler(AgentController.updateContext)
);
routes.post(
  "/agent/admin/companies/:companyId/context/rebuild",
  isAuth,
  safeHandler(agentSuper),
  safeHandler(AgentController.rebuild)
);

export default routes;
