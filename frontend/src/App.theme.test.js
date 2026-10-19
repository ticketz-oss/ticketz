import React from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen
} from "@testing-library/react";
import App from "./App";

let mockSession;
let mockColorMode;
let mockMaterialTheme;

jest.mock("./hooks/useAuth.js", () => () => mockSession);
jest.mock("./hooks/useSettings", () => () => ({ getPublicSetting: jest.fn() }));
jest.mock("./helpers/loadBranding", () => ({ loadBranding: jest.fn() }));
jest.mock("react-favicon", () => () => null);
jest.mock("./services/config", () => ({
  APP_BASE_DOMAIN: "espacoatos.com.br"
}));
jest.mock("./context/PhoneCall/PhoneCallContext", () => ({
  PhoneCallProvider: ({ children }) => children
}));
jest.mock("./context/VoiceCall/VoiceCallContext", () => ({
  VoiceCallProvider: ({ children }) => children
}));
jest.mock("./context/Socket/SocketContext", () => ({
  SocketContext: require("react").createContext(),
  socketManager: {}
}));
jest.mock("./translate/i18n", () => ({
  i18n: { t: key => key }
}));
jest.mock("./routes", () => {
  const React = require("react");
  const { useTheme } = require("@material-ui/core/styles");
  const { AuthProvider } = require("./context/Auth/AuthContext");
  const ColorModeContext = require("./layout/themeContext").default;
  const { ThemeOptions } = require("./components/ThemeSelector");
  function ThemeProbe() {
    mockColorMode = React.useContext(ColorModeContext).colorMode;
    mockMaterialTheme = useTheme();
    return React.createElement(
      "ul",
      { role: "menu" },
      React.createElement(ThemeOptions)
    );
  }
  return () =>
    React.createElement(AuthProvider, null, React.createElement(ThemeProbe));
});

const originalLocation = window.location;
const originalMatchMedia = window.matchMedia;
const setHost = hostname => {
  delete window.location;
  window.location = {
    ...originalLocation,
    hostname,
    origin: `https://${hostname}`,
    href: `https://${hostname}/tickets`
  };
};
const authenticate = companyId => {
  mockSession = {
    isAuth: true,
    loading: false,
    user: { id: 9, companyId, profile: "admin" }
  };
};
const expectTheme = (name, mode = name) => {
  expect(mockColorMode.themeName).toBe(name);
  expect(mockMaterialTheme.themeName).toBe(name);
  expect(mockMaterialTheme.isStardew).toBe(name === "stardew");
  expect(mockMaterialTheme.mode).toBe(mode);
  expect(mockMaterialTheme.palette.type).toBe(mode);
  expect(document.documentElement.dataset.theme).toBe(name);
  expect(document.body.dataset.theme).toBe(name);
  expect(document.documentElement.style.colorScheme).toBe(mode);
};
const select = label =>
  fireEvent.click(screen.getByRole("menuitemradio", { name: label }));

beforeEach(() => {
  localStorage.clear();
  setHost("teste.espacoatos.com.br");
  window.matchMedia = jest.fn(() => ({
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }));
  mockSession = { isAuth: false, loading: false, user: {} };
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  delete window.location;
  window.location = originalLocation;
  window.matchMedia = originalMatchMedia;
});

it("does not expose Stardew to an unauthenticated session with a forged tenant preference", () => {
  localStorage.setItem("companyId", "1");
  localStorage.setItem("preferredTheme", "stardew");
  localStorage.setItem("preferredTheme:tenant:1", "stardew");
  render(<App />);

  expectTheme("light");
  expect(mockColorMode.stardewAllowed).toBe(false);
  expect(
    screen.queryByRole("menuitemradio", { name: "Stardew Valley" })
  ).toBeNull();
  act(() => mockColorMode.setTheme("stardew"));
  expectTheme("light");
});

it("offers all three themes for the authenticated Teste tenant and keeps MUI palette.type valid", () => {
  authenticate(1);
  render(<App />);
  expect(screen.getAllByRole("menuitemradio")).toHaveLength(3);
  expect(mockColorMode.stardewAllowed).toBe(true);

  select("themes.dark");
  expectTheme("dark");
  expect(localStorage.getItem("preferredTheme:tenant:1")).toBe("dark");
  select("Stardew Valley");
  expectTheme("stardew", "light");
  expect(
    screen
      .getByRole("menuitemradio", { name: "Stardew Valley" })
      .getAttribute("aria-checked")
  ).toBe("true");
  expect(mockMaterialTheme.palette.background.paper).toBe("#fff1c7");
  expect(mockMaterialTheme.typography.fontFamily).toContain("Inter");
  expect(mockMaterialTheme.overrides.MuiButton.root.borderRadius).toBe(0);
  select("themes.light");
  expectTheme("light");
});

it("preserves a Stardew selection across a full App remount without changing the public fallback", () => {
  localStorage.setItem("preferredTheme", "dark");
  authenticate(1);
  const view = render(<App />);
  select("Stardew Valley");
  expectTheme("stardew", "light");
  expect(localStorage.getItem("preferredTheme:tenant:1")).toBe("stardew");
  expect(localStorage.getItem("preferredTheme")).toBe("dark");
  view.unmount();

  render(<App />);
  expectTheme("stardew", "light");
  expect(localStorage.getItem("preferredTheme:tenant:1")).toBe("stardew");
});

it("uses authenticated company identity rather than localStorage companyId", () => {
  authenticate(2);
  localStorage.setItem("companyId", "1");
  localStorage.setItem("preferredTheme:tenant:2", "stardew");
  render(<App />);
  expectTheme("light");
  expect(mockColorMode.stardewAllowed).toBe(false);
  expect(screen.getAllByRole("menuitemradio")).toHaveLength(2);
  act(() => mockColorMode.setTheme("stardew"));
  expectTheme("light");
});

it("blocks Stardew on another tenant host even when the authenticated company id is 1", () => {
  authenticate(1);
  setHost("acnorte.espacoatos.com.br");
  localStorage.setItem("preferredTheme:tenant:1", "stardew");
  render(<App />);
  expectTheme("light");
  expect(mockColorMode.stardewAllowed).toBe(false);
  expect(
    screen.queryByRole("menuitemradio", { name: "Stardew Valley" })
  ).toBeNull();
  act(() => mockColorMode.setTheme("stardew"));
  expectTheme("light");
});

it("switches tenant preferences and restores Teste's Stardew preference without leaking it", () => {
  authenticate(1);
  localStorage.setItem("preferredTheme:tenant:2", "dark");
  const view = render(<App />);
  select("Stardew Valley");
  expectTheme("stardew", "light");

  authenticate(2);
  view.rerender(<App />);
  expectTheme("dark");
  expect(mockColorMode.stardewAllowed).toBe(false);
  expect(localStorage.getItem("preferredTheme:tenant:2")).toBe("dark");
  expect(localStorage.getItem("preferredTheme:tenant:1")).toBe("stardew");
  expect(
    screen.queryByRole("menuitemradio", { name: "Stardew Valley" })
  ).toBeNull();

  authenticate(1);
  view.rerender(<App />);
  expectTheme("stardew", "light");
  expect(localStorage.getItem("preferredTheme:tenant:2")).toBe("dark");
});

it("removes Stardew on logout while retaining the authenticated tenant's saved choice", () => {
  authenticate(1);
  localStorage.setItem("preferredTheme", "dark");
  const view = render(<App />);
  select("Stardew Valley");
  mockSession = { isAuth: false, loading: false, user: { companyId: 1 } };
  view.rerender(<App />);

  expectTheme("dark");
  expect(mockColorMode.stardewAllowed).toBe(false);
  expect(localStorage.getItem("preferredTheme:tenant:1")).toBe("stardew");
  expect(
    screen.queryByRole("menuitemradio", { name: "Stardew Valley" })
  ).toBeNull();
});

it.each(["garbage", '{"theme":"stardew"}', "STARDEW", "undefined"])(
  "falls back safely when a stored tenant preference is malformed: %s",
  preference => {
    authenticate(1);
    localStorage.setItem("preferredTheme:tenant:1", preference);
    render(<App />);
    expectTheme("light");
    expect(localStorage.getItem("preferredTheme:tenant:1")).toBe("light");
  }
);

it("waits for authenticated company details before enabling the tenant-only theme", () => {
  mockSession = { isAuth: true, loading: true, user: {} };
  localStorage.setItem("companyId", "1");
  localStorage.setItem("preferredTheme:tenant:1", "stardew");
  const view = render(<App />);
  expectTheme("light");
  expect(mockColorMode.stardewAllowed).toBe(false);
  authenticate(1);
  view.rerender(<App />);
  expectTheme("stardew", "light");
});

it("starts in the light theme without a saved choice, even if the system prefers dark", () => {
  window.matchMedia = jest.fn(() => ({
    matches: true,
    addListener: jest.fn(),
    removeListener: jest.fn()
  }));
  authenticate(1);
  render(<App />);
  expectTheme("light");
});
