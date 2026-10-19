import { Router, urlencoded } from "express";
import * as OAuthController from "../controllers/OAuthController";
import {
  oauthAuthorizeLimiter,
  oauthLoginLimiter,
  oauthRegisterLimiter,
  oauthRevokeLimiter,
  oauthTokenLimiter
} from "../middleware/mcpRateLimit";

const routes = Router();
const formParser = urlencoded({ extended: false, limit: "32kb" });

routes.get(
  "/.well-known/oauth-protected-resource",
  OAuthController.protectedResourceMetadata
);
routes.get(
  "/.well-known/oauth-authorization-server",
  OAuthController.authorizationServerMetadata
);
routes.get("/.well-known/jwks.json", OAuthController.jwks);
routes.post("/oauth/register", oauthRegisterLimiter, OAuthController.register);
routes.get(
  "/oauth/authorize",
  oauthAuthorizeLimiter,
  OAuthController.authorize
);
routes.post(
  "/oauth/authorize/identify",
  oauthLoginLimiter,
  formParser,
  OAuthController.identify
);
routes.post(
  "/oauth/authorize/restart",
  oauthAuthorizeLimiter,
  formParser,
  OAuthController.restart
);
routes.post(
  "/oauth/authorize/approve",
  oauthLoginLimiter,
  formParser,
  OAuthController.approve
);
routes.post(
  "/oauth/authorize/cancel",
  oauthAuthorizeLimiter,
  formParser,
  OAuthController.cancel
);
routes.post(
  "/oauth/token",
  oauthTokenLimiter,
  formParser,
  OAuthController.token
);
routes.post(
  "/oauth/revoke",
  oauthRevokeLimiter,
  formParser,
  OAuthController.revoke
);

export default routes;
