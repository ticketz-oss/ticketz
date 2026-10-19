// Social authentication is opt-in per deployment. Never derive trusted origins
// from a request header or expose the secret key in public configuration.
export const getClerkConfig = () => {
  const secretKey = process.env.CLERK_SECRET_KEY || "";
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY || "";
  const issuer = process.env.CLERK_ISSUER || "";
  const environment = process.env.CLERK_ENVIRONMENT || "";
  const keyType =
    environment === "production"
      ? "live"
      : environment === "development"
        ? "test"
        : "";
  const tenantBaseDomain = (process.env.CLERK_TENANT_BASE_DOMAIN || "")
    .trim()
    .toLowerCase();
  const authorizedParties = (process.env.CLERK_AUTHORIZED_PARTIES || "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  const validOrigin = (value: string, allowLocal = false): boolean => {
    try {
      const url = new URL(value);
      return (
        value === url.origin &&
        !url.username &&
        !url.password &&
        !url.hostname.includes("*") &&
        (url.protocol === "https:" ||
          (allowLocal &&
            url.protocol === "http:" &&
            ["localhost", "127.0.0.1"].includes(url.hostname)))
      );
    } catch {
      return false;
    }
  };
  let keyMatchesIssuer = false;
  try {
    const domain = Buffer.from(
      publishableKey.replace(/^pk_(test|live)_/, ""),
      "base64"
    )
      .toString("utf8")
      .replace(/\$$/, "");
    keyMatchesIssuer = issuer === `https://${domain}`;
  } catch {
    keyMatchesIssuer = false;
  }
  const enabled =
    process.env.CLERK_GOOGLE_ENABLED === "true" &&
    /^sk_(test|live)_\S+$/.test(secretKey) &&
    /^pk_(test|live)_\S+$/.test(publishableKey) &&
    Boolean(keyType) &&
    secretKey.split("_")[1] === keyType &&
    publishableKey.split("_")[1] === keyType &&
    validOrigin(issuer) &&
    keyMatchesIssuer &&
    /^[a-z0-9]+([.-][a-z0-9]+)*\.[a-z]{2,}$/.test(tenantBaseDomain) &&
    authorizedParties.length > 0 &&
    authorizedParties.every(origin =>
      validOrigin(origin, environment === "development")
    );
  return {
    enabled,
    secretKey,
    publishableKey,
    issuer,
    authorizedParties,
    tenantBaseDomain,
    environment
  };
};

export const getSocialProviders = () => {
  const config = getClerkConfig();
  return {
    publishableKey: config.enabled ? config.publishableKey : null,
    providers: {
      google: { enabled: config.enabled },
      apple: { enabled: false },
      microsoft: { enabled: false }
    }
  };
};
