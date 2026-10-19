import api from "./api";
import getCompanySlug from "../helpers/getCompanySlug";
import {
  beginMobileIntent,
  requireMobileIntent,
  clearMobileIntent,
  requireMobileConfiguration,
  mobileCallbackURL,
  authorizeMobileGoogle
} from "./mobileAuth";

jest.mock("./api", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("../helpers/getCompanySlug", () => jest.fn(() => "teste"));
const state = "a".repeat(43);
const challenge = "b".repeat(43);
const code = "c".repeat(43);
const query = `?state=${state}&code_challenge=${challenge}&slug=teste`;
const key = "espaco.mobile-login.intent.v1";

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  jest.clearAllMocks();
  getCompanySlug.mockReturnValue("teste");
  Object.defineProperty(window, "location", {
    configurable: true,
    value: new URL("https://teste.dev.espacowhats.com.br/login/mobile")
  });
});

test("binds state and S256 challenge to the current dev tenant in sessionStorage only", () => {
  beginMobileIntent(query);
  expect(requireMobileIntent()).toEqual(
    expect.objectContaining({
      state,
      codeChallenge: challenge,
      slug: "teste",
      origin: window.location.origin
    })
  );
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(1);
});

test("master dev apex accepts only an explicit blank slug matching app configuration", async () => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: new URL("https://dev.espacowhats.com.br/login/mobile")
  });
  getCompanySlug.mockReturnValue("");
  const masterQuery = `?state=${state}&code_challenge=${challenge}&slug=`;
  beginMobileIntent(masterQuery);
  expect(requireMobileIntent()).toEqual(
    expect.objectContaining({
      slug: "",
      origin: "https://dev.espacowhats.com.br"
    })
  );
  api.post
    .mockResolvedValueOnce({ data: { token: "master-app-jwt" } })
    .mockResolvedValueOnce({ data: { code, state } });
  await expect(authorizeMobileGoogle("clerk-master")).resolves.toBe(
    `espacowhats://auth/callback?code=${code}&state=${state}`
  );
  expect(api.post).toHaveBeenNthCalledWith(1, "/auth/social/google", {
    clerkToken: "clerk-master",
    slug: ""
  });
  expect(() => beginMobileIntent(query)).toThrow("ERR_SOCIAL_LOGIN_EXPIRED");
  expect(() =>
    beginMobileIntent(`?state=${state}&code_challenge=${challenge}`)
  ).toThrow("ERR_SOCIAL_LOGIN_EXPIRED");
  getCompanySlug.mockReturnValue("dev");
  expect(() => beginMobileIntent(masterQuery)).toThrow(
    "ERR_SOCIAL_LOGIN_EXPIRED"
  );
});

test("an empty slug never selects the master account from a tenant subdomain", () => {
  getCompanySlug.mockReturnValue("");
  expect(() =>
    beginMobileIntent(`?state=${state}&code_challenge=${challenge}&slug=`)
  ).toThrow("ERR_SOCIAL_LOGIN_EXPIRED");
});

test.each([
  "https://teste.espacowhats.com.br/login/mobile",
  "http://teste.dev.espacowhats.com.br/login/mobile",
  "https://teste.dev.espacowhats.com.br.evil.com/login/mobile",
  "https://teste.dev.espacowhats.com.br:8443/login/mobile",
  "https://dev.espacowhats.com.br/login/mobile"
])("rejects production and unexpected origin %s", url => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: new URL(url)
  });
  expect(() => beginMobileIntent(query)).toThrow("ERR_SOCIAL_LOGIN_EXPIRED");
  expect(sessionStorage.getItem(key)).toBeNull();
});

test.each([
  `?state=short&code_challenge=${challenge}&slug=teste`,
  `?state=${state}&code_challenge=bad+value&slug=teste`,
  `?state=${state}&code_challenge=${challenge}&slug=acnorte`,
  `${query}&state=${state}`,
  ""
])("rejects malformed and conflicting query %s", input => {
  expect(() => beginMobileIntent(input)).toThrow("ERR_SOCIAL_LOGIN_EXPIRED");
});

test("stored intent cannot cross tenant, origin, or ten-minute lifetime", () => {
  beginMobileIntent(query);
  getCompanySlug.mockReturnValue("acnorte");
  expect(() => requireMobileIntent()).toThrow("ERR_SOCIAL_LOGIN_EXPIRED");
  getCompanySlug.mockReturnValue("teste");
  beginMobileIntent(query);
  const clock = jest
    .spyOn(Date, "now")
    .mockReturnValue(Date.now() + 11 * 60 * 1000);
  expect(() => requireMobileIntent()).toThrow("ERR_SOCIAL_LOGIN_EXPIRED");
  clock.mockRestore();
  beginMobileIntent(query);
  const future = JSON.parse(sessionStorage.getItem(key));
  future.createdAt = Date.now() + 10000;
  sessionStorage.setItem(key, JSON.stringify(future));
  expect(() => requireMobileIntent()).toThrow("ERR_SOCIAL_LOGIN_EXPIRED");
});

test("clears mobile handoff without destroying an ordinary web login intent", () => {
  beginMobileIntent(query);
  sessionStorage.setItem("espaco.google-login.intent", "preserve-web");
  sessionStorage.setItem("espaco.google-login.intent.mobile", "clear-mobile");
  clearMobileIntent();
  expect(sessionStorage.getItem(key)).toBeNull();
  expect(
    sessionStorage.getItem("espaco.google-login.intent.mobile")
  ).toBeNull();
  expect(sessionStorage.getItem("espaco.google-login.intent")).toBe(
    "preserve-web"
  );
});

test("requires the explicit enabled boolean before any Google handoff", async () => {
  beginMobileIntent(query);
  api.get.mockResolvedValue({ data: { enabled: "true" } });
  await expect(requireMobileConfiguration()).rejects.toThrow(
    "ERR_SOCIAL_LOGIN_DISABLED"
  );
  api.get.mockResolvedValue({ data: { enabled: true } });
  await expect(requireMobileConfiguration()).resolves.toBeUndefined();
});

test("authorization stores no app token and emits only code and state in a constant callback", async () => {
  beginMobileIntent(query);
  localStorage.setItem("token", "existing-web-token");
  api.post
    .mockResolvedValueOnce({ data: { token: "app-jwt" } })
    .mockResolvedValueOnce({ data: { code, state } });
  const url = await authorizeMobileGoogle("clerk-jwt");
  expect(api.post).toHaveBeenNthCalledWith(1, "/auth/social/google", {
    clerkToken: "clerk-jwt",
    slug: "teste"
  });
  expect(api.post).toHaveBeenNthCalledWith(
    2,
    "/auth/mobile/authorize",
    { codeChallenge: challenge, state },
    { headers: { Authorization: "Bearer app-jwt" } }
  );
  expect(url).toBe(`espacowhats://auth/callback?code=${code}&state=${state}`);
  expect(url).not.toContain("jwt");
  expect(localStorage.getItem("token")).toBe("existing-web-token");
  expect(sessionStorage.length).toBe(0);
});

test("access refusal clears the intent and never issues an authorization code", async () => {
  beginMobileIntent(query);
  api.post.mockRejectedValueOnce({
    response: { data: { error: "ERR_SOCIAL_LOGIN_NO_ACCESS" } }
  });
  await expect(authorizeMobileGoogle("clerk")).rejects.toBeDefined();
  expect(api.post).toHaveBeenCalledTimes(1);
  expect(sessionStorage.getItem(key)).toBeNull();
});

test("canceling during the Google exchange stops the mobile authorization request", async () => {
  beginMobileIntent(query);
  api.post.mockImplementationOnce(async () => {
    clearMobileIntent();
    return { data: { token: "app-jwt" } };
  });
  await expect(authorizeMobileGoogle("clerk")).rejects.toThrow(
    "ERR_SOCIAL_LOGIN_EXPIRED"
  );
  expect(api.post).toHaveBeenCalledTimes(1);
});

test("never accepts callback URLs, JWTs, or a different state from the response", () => {
  expect(() =>
    mobileCallbackURL({ callbackUrl: "https://evil.com", token: "jwt" }, state)
  ).toThrow();
  expect(() =>
    mobileCallbackURL({ code: "jwt.with.signature", state }, state)
  ).toThrow();
  expect(() =>
    mobileCallbackURL({ code, state: "d".repeat(43) }, state)
  ).toThrow();
});
