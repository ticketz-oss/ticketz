import api from "./api";
import getCompanySlug from "../helpers/getCompanySlug";
import { loadClerkBrowser } from "./loadClerkBrowser";

export const GOOGLE_CALLBACK = "/login/google/callback";
export const GOOGLE_COMPLETE = "/login/google/complete";
export const GOOGLE_CONTINUE = "/login/google/continue";
export const GOOGLE_ERROR = "/login/google/error";
const INTENT_KEY = "espaco.google-login.intent";
const INTENT_TTL = 10 * 60 * 1000;
let clerkPromise;
let loadedKey;

// Only these two internal destinations are accepted; never use a caller URL.
export function googleFlowPaths(flow = "web") {
  if (flow !== "web" && flow !== "mobile")
    throw socialError("ERR_SOCIAL_LOGIN_INVALID");
  const root = flow === "mobile" ? "/login/mobile/google" : "/login/google";
  return {
    root,
    callback: `${root}/callback`,
    complete: `${root}/complete`,
    continue: `${root}/continue`,
    error: `${root}/error`
  };
}

const intentKey = flow =>
  flow === "mobile" ? `${INTENT_KEY}.mobile` : INTENT_KEY;

export const socialError = code => Object.assign(new Error(code), { code });

export function isGoogleConfigured(config) {
  return (
    config?.providers?.google?.enabled === true &&
    /^pk_(test|live)_[A-Za-z0-9_-]+$/.test(config?.publishableKey || "")
  );
}

export async function getGoogleConfiguration() {
  const { data } = await api.get("/auth/social/providers");
  if (!isGoogleConfigured(data)) throw socialError("ERR_SOCIAL_LOGIN_DISABLED");
  return data;
}

export async function loadGoogleClerk(config) {
  if (!isGoogleConfigured(config))
    throw socialError("ERR_SOCIAL_LOGIN_DISABLED");
  if (clerkPromise && loadedKey !== config.publishableKey) {
    // A deployment changed instance while this tab was open: reload, never mix clients.
    throw socialError("ERR_SOCIAL_LOGIN_INVALID");
  }
  if (!clerkPromise) {
    loadedKey = config.publishableKey;
    // The mobile bridge is a standalone full-page entry outside AuthProvider.
    // Its SDK defaults must also remain in that flow during OAuth redirects.
    const mobileEntry = window.location.pathname.startsWith("/login/mobile");
    const paths = googleFlowPaths(mobileEntry ? "mobile" : "web");
    clerkPromise = loadClerkBrowser(config.publishableKey)
      .then(async clerk => {
        await clerk.load({
          signInUrl: mobileEntry ? "/login/mobile/google/error" : "/login",
          signUpUrl: mobileEntry ? "/login/mobile/google/error" : "/login",
          signInForceRedirectUrl: paths.complete,
          signUpForceRedirectUrl: paths.complete,
          allowedRedirectOrigins: [window.location.origin],
          localization: { locale: "pt-BR" }
        });
        if (!clerk.loaded || !clerk.client)
          throw socialError("ERR_SOCIAL_LOGIN_DISABLED");
        return clerk;
      })
      .catch(error => {
        clerkPromise = undefined;
        loadedKey = undefined;
        throw error;
      });
  }
  return clerkPromise;
}

export function clearGoogleIntent(flow = "web") {
  googleFlowPaths(flow);
  sessionStorage.removeItem(intentKey(flow));
}

export function requireGoogleIntent(config, flow = "web") {
  googleFlowPaths(flow);
  let intent;
  try {
    intent = JSON.parse(sessionStorage.getItem(intentKey(flow)));
  } catch (_) {}
  if (
    !intent ||
    intent.origin !== window.location.origin ||
    intent.slug !== getCompanySlug() ||
    intent.key !== config.publishableKey ||
    typeof intent.nonce !== "string" ||
    intent.nonce.length < 16 ||
    !Number.isFinite(intent.createdAt) ||
    intent.createdAt > Date.now() ||
    Date.now() - intent.createdAt > INTENT_TTL
  ) {
    clearGoogleIntent(flow);
    throw socialError("ERR_SOCIAL_LOGIN_EXPIRED");
  }
  return intent;
}

export async function startGoogleSignIn(config, flow = "web") {
  const paths = googleFlowPaths(flow);
  const clerk = await loadGoogleClerk(config);
  // Always start a fresh provider selection; an old Clerk session is not an app login.
  if (clerk.session) await clerk.signOut(() => Promise.resolve());
  const nonce = Array.from(
    window.crypto.getRandomValues(new Uint8Array(24)),
    value => value.toString(16).padStart(2, "0")
  ).join("");
  sessionStorage.setItem(
    intentKey(flow),
    JSON.stringify({
      origin: window.location.origin,
      slug: getCompanySlug(),
      key: config.publishableKey,
      createdAt: Date.now(),
      nonce
    })
  );
  try {
    await clerk.client.signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      oidcPrompt: "select_account",
      redirectUrl: new URL(paths.callback, window.location.origin).href,
      redirectUrlComplete: new URL(paths.complete, window.location.origin).href
    });
  } catch (error) {
    clearGoogleIntent(flow);
    throw error;
  }
}

export async function handleGoogleCallback(clerk, config, flow = "web") {
  const paths = googleFlowPaths(flow);
  requireGoogleIntent(config, flow);
  await clerk.handleRedirectCallback({
    signInUrl: paths.error,
    signUpUrl: paths.error,
    signInForceRedirectUrl: paths.complete,
    signUpForceRedirectUrl: paths.complete,
    continueSignUpUrl: paths.continue,
    firstFactorUrl: paths.error,
    secondFactorUrl: paths.error,
    resetPasswordUrl: paths.error,
    verifyEmailAddressUrl: paths.error,
    verifyPhoneNumberUrl: paths.error,
    signInProtectCheckUrl: paths.error,
    signUpProtectCheckUrl: paths.error
  });
}

export function requiresOnlyLegalConsent(clerk) {
  const signup = clerk.client?.signUp;
  return (
    signup?.status === "missing_requirements" &&
    signup.missingFields?.length === 1 &&
    signup.missingFields[0] === "legal_accepted"
  );
}

export async function acceptGoogleLegal(clerk, config, accepted, flow = "web") {
  requireGoogleIntent(config, flow);
  if (!accepted || !requiresOnlyLegalConsent(clerk))
    throw socialError("ERR_SOCIAL_LOGIN_INVALID");
  const result = await clerk.client.signUp.update({ legalAccepted: true });
  if (result.status !== "complete" || !result.createdSessionId)
    throw socialError("ERR_SOCIAL_LOGIN_INVALID");
  await clerk.setActive({ session: result.createdSessionId });
}

export async function exchangeGoogleSession(
  clerk,
  config,
  exchange,
  flow = "web"
) {
  requireGoogleIntent(config, flow);
  if (
    !clerk.session ||
    clerk.session.status !== "active" ||
    clerk.session.currentTask
  ) {
    throw socialError("ERR_SOCIAL_LOGIN_INVALID");
  }
  const token = await clerk.session.getToken({ skipCache: true });
  if (!token) throw socialError("ERR_SOCIAL_LOGIN_INVALID");
  // Consume before exchange: a callback cannot silently log in again on reload.
  clearGoogleIntent(flow);
  await exchange(token);
}

export async function signOutGoogle() {
  clearGoogleIntent();
  if (clerkPromise) {
    const clerk = await clerkPromise;
    await clerk.signOut(() => Promise.resolve());
  }
}
