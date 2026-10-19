import api from "./api";
import getCompanySlug from "../helpers/getCompanySlug";
import { clearGoogleIntent, socialError } from "./googleAuth";

const KEY = "espaco.mobile-login.intent.v1";
const TTL = 10 * 60 * 1000;
const VALUE = /^[A-Za-z0-9_-]{43}$/;
const DEV_HOST =
  /^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\.dev\.espacowhats\.com\.br$/;

export function clearMobileIntent() {
  sessionStorage.removeItem(KEY);
  clearGoogleIntent("mobile");
}

function validIntent(intent, location = window.location) {
  const match = DEV_HOST.exec(location.hostname);
  const expectedSlug =
    location.hostname === "dev.espacowhats.com.br" ? "" : match?.[1];
  return (
    location.protocol === "https:" &&
    !location.port &&
    expectedSlug !== undefined &&
    intent &&
    intent.origin === location.origin &&
    intent.slug === expectedSlug &&
    intent.slug === getCompanySlug() &&
    VALUE.test(intent.state || "") &&
    VALUE.test(intent.codeChallenge || "") &&
    Number.isFinite(intent.createdAt) &&
    intent.createdAt <= Date.now() &&
    Date.now() - intent.createdAt <= TTL
  );
}

export function requireMobileIntent() {
  let intent;
  try {
    intent = JSON.parse(sessionStorage.getItem(KEY));
  } catch (_) {}
  if (!validIntent(intent)) {
    clearMobileIntent();
    throw socialError("ERR_SOCIAL_LOGIN_EXPIRED");
  }
  return intent;
}

export function beginMobileIntent(search = window.location.search) {
  const query = new URLSearchParams(search);
  const intent = {
    state: query.get("state"),
    codeChallenge: query.get("code_challenge"),
    slug: query.get("slug"),
    origin: window.location.origin,
    createdAt: Date.now()
  };
  if (
    ["state", "code_challenge", "slug"].some(
      key => query.getAll(key).length !== 1
    ) ||
    !validIntent(intent)
  ) {
    clearMobileIntent();
    throw socialError("ERR_SOCIAL_LOGIN_EXPIRED");
  }
  clearMobileIntent();
  sessionStorage.setItem(KEY, JSON.stringify(intent));
  return intent;
}

export async function requireMobileConfiguration() {
  requireMobileIntent();
  const { data } = await api.get("/auth/mobile/config");
  if (data?.enabled !== true) throw socialError("ERR_SOCIAL_LOGIN_DISABLED");
}

export function mobileCallbackURL(result, expectedState) {
  if (
    !VALUE.test(result?.code || "") ||
    result?.state !== expectedState ||
    !VALUE.test(expectedState || "")
  ) {
    throw socialError("ERR_SOCIAL_LOGIN_INVALID");
  }
  const query = new URLSearchParams({
    code: result.code,
    state: expectedState
  });
  return `espacowhats://auth/callback?${query.toString()}`;
}

export async function authorizeMobileGoogle(clerkToken) {
  const intent = requireMobileIntent();
  try {
    const { data: session } = await api.post("/auth/social/google", {
      clerkToken,
      slug: intent.slug
    });
    if (typeof session?.token !== "string" || !session.token)
      throw socialError("ERR_SOCIAL_LOGIN_INVALID");
    // Recheck after provider exchange, including cancellation in another event.
    const current = requireMobileIntent();
    if (
      current.state !== intent.state ||
      current.codeChallenge !== intent.codeChallenge
    ) {
      throw socialError("ERR_SOCIAL_LOGIN_EXPIRED");
    }
    const { data } = await api.post(
      "/auth/mobile/authorize",
      {
        codeChallenge: intent.codeChallenge,
        state: intent.state
      },
      { headers: { Authorization: `Bearer ${session.token}` } }
    );
    return mobileCallbackURL(data, intent.state);
  } finally {
    // App and Clerk tokens are never persisted, logged, or placed in URLs.
    clearMobileIntent();
  }
}
