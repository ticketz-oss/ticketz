import {
  isGoogleConfigured,
  startGoogleSignIn,
  loadGoogleClerk,
  requireGoogleIntent,
  clearGoogleIntent,
  exchangeGoogleSession,
  handleGoogleCallback,
  acceptGoogleLegal,
  requiresOnlyLegalConsent,
  GOOGLE_CALLBACK,
  GOOGLE_COMPLETE
} from "./googleAuth";
import getCompanySlug from "../helpers/getCompanySlug";
import { loadClerkBrowser } from "./loadClerkBrowser";

jest.mock("./api", () => ({ get: jest.fn() }));
jest.mock("../helpers/getCompanySlug", () => jest.fn(() => "acnorte"));
jest.mock("./loadClerkBrowser", () => ({ loadClerkBrowser: jest.fn() }));
const config = {
  publishableKey: "pk_test_example",
  providers: { google: { enabled: true } }
};
const clerk = {
  loaded: true,
  load: jest.fn().mockResolvedValue(undefined),
  client: {
    signIn: {
      authenticateWithRedirect: jest.fn().mockResolvedValue(undefined)
    },
    signUp: {}
  },
  handleRedirectCallback: jest.fn().mockResolvedValue(undefined),
  signOut: jest.fn().mockImplementation(async callback => {
    clerk.session = null;
    await callback();
  }),
  setActive: jest.fn().mockResolvedValue(undefined)
};

beforeEach(() => {
  sessionStorage.clear();
  jest.clearAllMocks();
  clerk.session = null;
  clerk.client.signUp = {};
  getCompanySlug.mockReturnValue("acnorte");
  loadClerkBrowser.mockResolvedValue(clerk);
  Object.defineProperty(window, "crypto", {
    configurable: true,
    value: { getRandomValues: array => array.fill(7) }
  });
});

test("mobile Google routes and intents are isolated from ordinary web authentication", async () => {
  await startGoogleSignIn(config);
  const webIntent = sessionStorage.getItem("espaco.google-login.intent");
  await startGoogleSignIn(config, "mobile");
  expect(clerk.client.signIn.authenticateWithRedirect).toHaveBeenLastCalledWith(
    expect.objectContaining({
      redirectUrl: `${window.location.origin}/login/mobile/google/callback`,
      redirectUrlComplete: `${window.location.origin}/login/mobile/google/complete`
    })
  );
  expect(requireGoogleIntent(config, "mobile").slug).toBe("acnorte");
  expect(sessionStorage.getItem("espaco.google-login.intent")).toBe(webIntent);
  await handleGoogleCallback(clerk, config, "mobile");
  expect(clerk.handleRedirectCallback).toHaveBeenLastCalledWith(
    expect.objectContaining({
      continueSignUpUrl: "/login/mobile/google/continue",
      signInForceRedirectUrl: "/login/mobile/google/complete"
    })
  );
  clearGoogleIntent("mobile");
  expect(() => requireGoogleIntent(config, "mobile")).toThrow(
    "ERR_SOCIAL_LOGIN_EXPIRED"
  );
  expect(requireGoogleIntent(config).slug).toBe("acnorte");
});

test("provider configuration fails closed, including string booleans and missing keys", () => {
  expect(isGoogleConfigured(config)).toBe(true);
  expect(
    isGoogleConfigured({ ...config, publishableKey: "sk_live_secret" })
  ).toBe(false);
  expect(
    isGoogleConfigured({ providers: { google: { enabled: "true" } } })
  ).toBe(false);
  expect(isGoogleConfigured(null)).toBe(false);
});

test("starts a fresh account selection with fixed callback URLs and never accepts legal automatically", async () => {
  await loadGoogleClerk(config);
  clerk.session = { id: "old" };
  await startGoogleSignIn(config);
  expect(clerk.signOut).toHaveBeenCalled();
  expect(clerk.client.signIn.authenticateWithRedirect).toHaveBeenCalledWith({
    strategy: "oauth_google",
    oidcPrompt: "select_account",
    redirectUrl: `${window.location.origin}${GOOGLE_CALLBACK}`,
    redirectUrlComplete: `${window.location.origin}${GOOGLE_COMPLETE}`
  });
  expect(requireGoogleIntent(config).slug).toBe("acnorte");
});

test("callback requires a fresh intent bound to this tenant and Clerk instance", async () => {
  expect(() => requireGoogleIntent(config)).toThrow("ERR_SOCIAL_LOGIN_EXPIRED");
  await startGoogleSignIn(config);
  getCompanySlug.mockReturnValue("other");
  expect(() => requireGoogleIntent(config)).toThrow("ERR_SOCIAL_LOGIN_EXPIRED");
  getCompanySlug.mockReturnValue("acnorte");
  await startGoogleSignIn(config);
  expect(() =>
    requireGoogleIntent({ ...config, publishableKey: "pk_live_other" })
  ).toThrow("ERR_SOCIAL_LOGIN_EXPIRED");
});

test("expired and future intents are rejected", async () => {
  await startGoogleSignIn(config);
  const now = Date.now();
  const clock = jest.spyOn(Date, "now").mockReturnValue(now + 11 * 60 * 1000);
  expect(() => requireGoogleIntent(config)).toThrow("ERR_SOCIAL_LOGIN_EXPIRED");
  clock.mockRestore();
  await startGoogleSignIn(config);
  const future = jest.spyOn(Date, "now").mockReturnValue(now - 10000);
  expect(() => requireGoogleIntent(config)).toThrow("ERR_SOCIAL_LOGIN_EXPIRED");
  future.mockRestore();
});

test("SDK callback handles OAuth state; completion URLs remain in the application", async () => {
  await startGoogleSignIn(config);
  await handleGoogleCallback(clerk, config);
  expect(clerk.handleRedirectCallback).toHaveBeenCalledWith(
    expect.objectContaining({
      signInForceRedirectUrl: GOOGLE_COMPLETE,
      signUpForceRedirectUrl: GOOGLE_COMPLETE,
      continueSignUpUrl: "/login/google/continue",
      secondFactorUrl: "/login/google/error"
    })
  );
});

test("only active sessions without unfinished tasks may be exchanged; intent is single use", async () => {
  const exchange = jest.fn().mockResolvedValue(undefined);
  await startGoogleSignIn(config);
  clerk.session = { status: "pending", getToken: jest.fn() };
  await expect(exchangeGoogleSession(clerk, config, exchange)).rejects.toThrow(
    "ERR_SOCIAL_LOGIN_INVALID"
  );
  expect(exchange).not.toHaveBeenCalled();
  clerk.session = {
    status: "active",
    currentTask: { key: "choose-organization" },
    getToken: jest.fn()
  };
  await expect(exchangeGoogleSession(clerk, config, exchange)).rejects.toThrow(
    "ERR_SOCIAL_LOGIN_INVALID"
  );
  clerk.session = {
    status: "active",
    getToken: jest.fn().mockResolvedValue("verified-clerk-token")
  };
  await exchangeGoogleSession(clerk, config, exchange);
  expect(exchange).toHaveBeenCalledWith("verified-clerk-token");
  await expect(exchangeGoogleSession(clerk, config, exchange)).rejects.toThrow(
    "ERR_SOCIAL_LOGIN_EXPIRED"
  );
  expect(exchange).toHaveBeenCalledTimes(1);
});

test("explicit legal consent required; unknown requirements cannot be bypassed", async () => {
  await startGoogleSignIn(config);
  clerk.client.signUp = {
    status: "missing_requirements",
    missingFields: ["legal_accepted"],
    update: jest.fn().mockResolvedValue({
      status: "complete",
      createdSessionId: "session-new"
    })
  };
  expect(requiresOnlyLegalConsent(clerk)).toBe(true);
  await expect(acceptGoogleLegal(clerk, config, false)).rejects.toThrow(
    "ERR_SOCIAL_LOGIN_INVALID"
  );
  expect(clerk.client.signUp.update).not.toHaveBeenCalled();
  await acceptGoogleLegal(clerk, config, true);
  expect(clerk.client.signUp.update).toHaveBeenCalledWith({
    legalAccepted: true
  });
  expect(clerk.setActive).toHaveBeenCalledWith({ session: "session-new" });
  clerk.client.signUp.missingFields.push("email_address");
  expect(requiresOnlyLegalConsent(clerk)).toBe(false);
  clearGoogleIntent();
});
