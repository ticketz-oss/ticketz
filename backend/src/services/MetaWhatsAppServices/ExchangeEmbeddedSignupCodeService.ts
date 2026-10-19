import { getMetaGraphApiClient } from "./MetaGraphApiClient";
import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";

interface Response {
  accessToken: string;
  expiresInSeconds: number | null;
}

// Facebook Login for Business exchanges the one-use code directly for the
// customer's business integration token. It is not a short-lived personal
// token: do not run the fb_exchange_token flow on the returned credential.
const ExchangeEmbeddedSignupCodeService = async (
  code: string
): Promise<Response> => {
  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  if (!appId || !appSecret)
    throw new AppError("ERR_META_APP_NOT_CONFIGURED", 500);
  if (
    typeof code !== "string" ||
    !code ||
    code.length > 4096 ||
    /\s/.test(code)
  ) {
    throw new AppError("ERR_META_CONNECT_MISSING_FIELDS", 400);
  }

  try {
    const { data } = await getMetaGraphApiClient().get("/oauth/access_token", {
      params: { client_id: appId, client_secret: appSecret, code }
    });
    if (typeof data?.access_token !== "string" || !data.access_token.trim()) {
      throw new AppError("ERR_META_CODE_EXCHANGE_FAILED", 502);
    }
    const expires = Number(data.expires_in);
    return {
      accessToken: data.access_token,
      expiresInSeconds: Number.isFinite(expires) && expires > 0 ? expires : null
    };
  } catch {
    // Even mocked/custom HTTP clients may throw raw Axios config containing
    // code, app secret and token. Never log or rethrow that object.
    logger.error("Failed to exchange Meta Embedded Signup code");
    throw new AppError("ERR_META_CODE_EXCHANGE_FAILED", 502);
  }
};

export default ExchangeEmbeddedSignupCodeService;
