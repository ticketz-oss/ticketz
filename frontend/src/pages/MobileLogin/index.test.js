import React from "react";
import "@testing-library/jest-dom";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MobileLogin from ".";
import * as mobile from "../../services/mobileAuth";
import useGoogleLogin from "../../hooks/useGoogleLogin";

jest.mock("../../services/api", () => ({
  openApi: { get: jest.fn().mockResolvedValue({ data: "" }) }
}));
jest.mock("../../helpers/getCompanySlug", () => () => "teste");
jest.mock("../../components/LoginExperience/BrandPanel", () => ({
  BrandLogo: ({ name }) => <div>{name}</div>,
  publicBrandAsset: value => value
}));
jest.mock("../../translate/i18n", () => ({ i18n: { t: key => key } }));
jest.mock("../../hooks/useGoogleLogin", () => ({
  __esModule: true,
  default: jest.fn(),
  googleErrorMessage: () => "safe-mobile-error"
}));
jest.mock("../../services/mobileAuth", () => ({
  beginMobileIntent: jest.fn(),
  requireMobileIntent: jest.fn(),
  clearMobileIntent: jest.fn(),
  requireMobileConfiguration: jest.fn(),
  authorizeMobileGoogle: jest.fn()
}));
let state;
const mount = (route = "/login/mobile?state=example") =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <MobileLogin />
    </MemoryRouter>
  );
beforeEach(() => {
  jest.clearAllMocks();
  mobile.requireMobileConfiguration.mockResolvedValue(undefined);
  mobile.beginMobileIntent.mockReturnValue({ state: "example" });
  mobile.requireMobileIntent.mockReturnValue({ state: "example" });
  state = {
    ready: true,
    busy: false,
    callback: false,
    error: "",
    legal: false,
    start: jest.fn()
  };
  useGoogleLogin.mockImplementation(() => state);
});

test("only starts Google after the native intent and dev configuration pass", async () => {
  mount();
  const button = await screen.findByText("mobileLogin.google");
  expect(mobile.beginMobileIntent).toHaveBeenCalledWith("?state=example");
  expect(mobile.requireMobileConfiguration).toHaveBeenCalled();
  expect(useGoogleLogin).toHaveBeenCalledWith(expect.any(Function), "mobile");
  fireEvent.click(button);
  expect(state.start).toHaveBeenCalledTimes(1);
});

test("invalid intent never initializes Google", async () => {
  mobile.beginMobileIntent.mockImplementation(() => {
    throw new Error("bad intent");
  });
  mount();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "safe-mobile-error"
  );
  expect(useGoogleLogin).not.toHaveBeenCalled();
  expect(mobile.clearMobileIntent).toHaveBeenCalled();
});

test("OAuth callback requires the existing handoff, not new URL parameters", async () => {
  state.callback = true;
  mount("/login/mobile/google/complete");
  await waitFor(() => expect(useGoogleLogin).toHaveBeenCalled());
  expect(mobile.requireMobileIntent).toHaveBeenCalledTimes(1);
  expect(mobile.beginMobileIntent).not.toHaveBeenCalled();
});

test("reloading the cleaned entry URL resumes only an existing valid intent", async () => {
  mount("/login/mobile");
  await screen.findByText("mobileLogin.google");
  expect(mobile.requireMobileIntent).toHaveBeenCalledTimes(1);
  expect(mobile.beginMobileIntent).not.toHaveBeenCalled();
});

test("cancel clears context and unmounts the exchange UI", async () => {
  mount();
  fireEvent.click(await screen.findByText("mobileLogin.cancel"));
  expect(mobile.clearMobileIntent).toHaveBeenCalled();
  expect(screen.getByText("mobileLogin.canceled")).toBeInTheDocument();
  expect(screen.queryByText("mobileLogin.google")).not.toBeInTheDocument();
});

test("successful exchange exposes only the return-to-app code link", async () => {
  mobile.authorizeMobileGoogle.mockResolvedValue(
    "espacowhats://auth/callback?code=one-time&state=random"
  );
  mount();
  await screen.findByText("mobileLogin.google");
  const exchange = useGoogleLogin.mock.calls[0][0];
  await act(async () => {
    await exchange("clerk-token");
  });
  const link = await screen.findByText("mobileLogin.returnToApp");
  expect(link.closest("a")).toHaveAttribute(
    "href",
    "espacowhats://auth/callback?code=one-time&state=random"
  );
  expect(screen.queryByText("clerk-token")).not.toBeInTheDocument();
});
