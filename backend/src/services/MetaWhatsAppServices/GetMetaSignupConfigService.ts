import AppError from "../../errors/AppError";

export const getMetaSignupConfig = () => {
  const appId = process.env.META_APP_ID?.trim() || null;
  const configId = process.env.META_CONFIG_ID?.trim() || null;
  const graphApiVersion = process.env.META_GRAPH_API_VERSION?.trim() || "v21.0";
  // Runtime readiness, not proof of Meta approval or customer billing.
  const signupAvailable = Boolean(
    appId &&
    /^\d+$/.test(appId) &&
    configId &&
    /^\d+$/.test(configId) &&
    /^v\d+\.\d+$/.test(graphApiVersion) &&
    process.env.META_APP_SECRET?.trim() &&
    process.env.ENCRYPTION_KEY?.trim()
  );
  return {
    appId,
    configId,
    graphApiVersion,
    billingMode: "direct" as const,
    signupAvailable
  };
};

export const assertMetaSignupConfigured = (): void => {
  if (!getMetaSignupConfig().signupAvailable) {
    throw new AppError("ERR_META_APP_NOT_CONFIGURED", 503);
  }
};
