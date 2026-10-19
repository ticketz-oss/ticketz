import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import useGoogleLogin, { googleErrorMessage } from "./useGoogleLogin";
import * as google from "../services/googleAuth";

jest.mock("../services/googleAuth", () => ({
  ...jest.requireActual("../services/googleAuth"),
  getGoogleConfiguration: jest.fn(),
  loadGoogleClerk: jest.fn(),
  startGoogleSignIn: jest.fn(),
  handleGoogleCallback: jest.fn(),
  requireGoogleIntent: jest.fn(),
  exchangeGoogleSession: jest.fn()
}));
jest.mock("../services/api", () => ({}));
jest.mock("../helpers/getCompanySlug", () => () => "acnorte");
jest.mock("../translate/i18n", () => ({ i18n: { t: key => key } }));
const exchange = jest.fn();
function Harness({ flow = "web" }) {
  const state = useGoogleLogin(exchange, flow);
  return (
    <>
      <button disabled={!state.ready || state.busy} onClick={state.start}>
        Google
      </button>
      <p>{state.error}</p>
      <span>{state.legal ? "legal" : ""}</span>
    </>
  );
}
const mount = (url = "/login", flow = "web") =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Harness flow={flow} />
    </MemoryRouter>
  );
beforeEach(() => {
  jest.clearAllMocks();
  google.getGoogleConfiguration.mockResolvedValue({
    publishableKey: "pk_test_example"
  });
  google.loadGoogleClerk.mockResolvedValue({ client: { signUp: {} } });
  google.requireGoogleIntent.mockReturnValue({});
});
test("button enabled only after configured SDK has loaded", async () => {
  let ready;
  google.loadGoogleClerk.mockReturnValue(
    new Promise(resolve => {
      ready = resolve;
    })
  );
  mount();
  expect(screen.getByText("Google")).toBeDisabled();
  await waitFor(() => expect(ready).toBeDefined());
  ready({});
  await waitFor(() => expect(screen.getByText("Google")).toBeEnabled());
  fireEvent.click(screen.getByText("Google"));
  await waitFor(() =>
    expect(google.startGoogleSignIn).toHaveBeenCalledTimes(1)
  );
});
test("configuration or SDK failure leaves Google disabled without breaking password login", async () => {
  google.loadGoogleClerk.mockRejectedValue(new Error("offline"));
  mount();
  await waitFor(() => expect(google.loadGoogleClerk).toHaveBeenCalled());
  expect(screen.getByText("Google")).toBeDisabled();
  expect(exchange).not.toHaveBeenCalled();
});
test("callback with no intent never initializes Clerk or exchanges a token", async () => {
  google.requireGoogleIntent.mockImplementation(() => {
    throw google.socialError("ERR_SOCIAL_LOGIN_EXPIRED");
  });
  mount("/login/google/complete");
  await screen.findByText("socialLogin.expired");
  expect(google.loadGoogleClerk).not.toHaveBeenCalled();
  expect(google.exchangeGoogleSession).not.toHaveBeenCalled();
});
test("completion exchanges verified session and shows tenant access refusal", async () => {
  google.exchangeGoogleSession.mockRejectedValue({
    response: { data: { error: "ERR_SOCIAL_LOGIN_NO_ACCESS" } }
  });
  mount("/login/google/complete");
  await screen.findByText("socialLogin.noAccess");
  expect(google.exchangeGoogleSession).toHaveBeenCalledTimes(1);
});
test("unknown provider errors are never rendered raw", () => {
  expect(googleErrorMessage({ message: "secret provider details" })).toBe(
    "socialLogin.failed"
  );
  expect(
    googleErrorMessage({
      response: { data: { error: "ERR_COMPANY_INACTIVE" } }
    })
  ).toBe("socialLogin.inactive");
});

test("mobile callback reuses Google session validation with its isolated flow", async () => {
  google.exchangeGoogleSession.mockResolvedValue(undefined);
  mount("/login/mobile/google/complete", "mobile");
  await waitFor(() =>
    expect(google.exchangeGoogleSession).toHaveBeenCalledTimes(1)
  );
  expect(google.requireGoogleIntent).toHaveBeenCalledWith(
    expect.anything(),
    "mobile"
  );
  expect(google.exchangeGoogleSession).toHaveBeenCalledWith(
    expect.anything(),
    expect.anything(),
    expect.any(Function),
    "mobile"
  );
});

test("mobile login cannot load a production Clerk key", async () => {
  google.getGoogleConfiguration.mockResolvedValue({
    publishableKey: "pk_live_not_dev"
  });
  mount("/login/mobile", "mobile");
  await screen.findByText("socialLogin.unavailable");
  expect(google.loadGoogleClerk).not.toHaveBeenCalled();
  expect(screen.getByText("Google")).toBeDisabled();
});
