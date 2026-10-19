import { Router } from "express";
import * as SessionController from "../controllers/SessionController";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isAdmin";
import * as SocialAuthController from "../controllers/SocialAuthController";
import mobileAuthRoutes from "./mobileAuthRoutes";
import {
  loginIdentifyLimiter,
  passwordSetupLimiter
} from "../middleware/mcpRateLimit";

const authRoutes = Router();
authRoutes.use("/mobile", mobileAuthRoutes);

authRoutes.get("/social/providers", SocialAuthController.providers);
authRoutes.post(
  "/social/google",
  loginIdentifyLimiter,
  SocialAuthController.google
);

authRoutes.post("/login", SessionController.store);
authRoutes.post(
  "/login/identify",
  loginIdentifyLimiter,
  SessionController.identify
);
authRoutes.get(
  "/activation/:token",
  passwordSetupLimiter,
  SessionController.activation
);
authRoutes.post(
  "/password/setup",
  passwordSetupLimiter,
  SessionController.setupPassword
);
authRoutes.get(
  "/impersonate/:companyId",
  isAuth,
  isSuper,
  SessionController.impersonate
);
/**
 * @openapi
 * /auth/impersonate/back:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Return from impersonation to super session
 *     description: Restores the original super user from refresh token metadata when the current session is impersonated.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Super session restored
 *       400:
 *         description: Not currently impersonating
 *       401:
 *         description: Unauthorized or expired session
 */
authRoutes.post("/impersonate/back", isAuth, SessionController.backToSuper);
authRoutes.post("/refresh_token", SessionController.update);
authRoutes.delete("/logout", isAuth, SessionController.remove);
authRoutes.get("/me", isAuth, SessionController.me);

export default authRoutes;
