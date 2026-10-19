import { Router } from "express";
import rateLimit from "express-rate-limit";
import isAuth from "../middleware/isAuth";
import * as MobileAuthController from "../controllers/MobileAuthController";

const routes = Router();
const limiter = (limit: number) =>
  rateLimit({
    windowMs: 5 * 60 * 1000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "ERR_MOBILE_AUTH_RATE_LIMIT" }
  });
routes.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});
routes.get("/config", limiter(60), MobileAuthController.configuration);
routes.post("/authorize", limiter(20), isAuth, MobileAuthController.authorize);
routes.post("/exchange", limiter(30), MobileAuthController.exchange);

export default routes;
