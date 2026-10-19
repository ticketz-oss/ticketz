import { createHash } from "crypto";
import { getClerkConfig } from "./clerk";

export const getMobileAuthConfig = () => {
  const clerk = getClerkConfig();
  // NODE_ENV is production in dev Docker images too. This bridge is deliberately
  // unavailable to live Clerk keys and to production tenant domains.
  const enabled =
    process.env.MOBILE_AUTH_ENABLED === "true" &&
    clerk.enabled &&
    clerk.environment === "development" &&
    clerk.tenantBaseDomain === "dev.espacowhats.com.br";
  const namespace = createHash("sha256")
    .update(
      `${clerk.issuer}|${clerk.tenantBaseDomain}|${process.env.QUEUE_PREFIX || "bull"}`
    )
    .digest("hex");
  return {
    enabled,
    origins: clerk.authorizedParties,
    baseDomain: clerk.tenantBaseDomain,
    keyPrefix: `mobile-auth:v1:${namespace}:`,
    ttl: 90
  };
};
