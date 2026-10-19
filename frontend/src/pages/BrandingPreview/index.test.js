import React from "react";
import { act, render, screen } from "@testing-library/react";
import BrandingPreviewPage from "./index";

jest.mock("../../services/config", () => ({
  __esModule: true,
  default: { APP_BASE_DOMAIN: "" },
  getBackendURL: () => "/backend"
}));
jest.mock("../../translate/i18n", () => ({ i18n: { t: key => key } }));
jest.mock("../../components/ui/interactive-blur-reveal", () => ({
  __esModule: true,
  default: ({ iChannel0 }) => (
    <div data-testid="login-artwork" data-image={iChannel0} />
  )
}));
jest.mock("@material-ui/core/useMediaQuery", () => ({
  __esModule: true,
  default: () => false
}));

const origin = window.location.origin;
const icon = `blob:${origin}/icon`;
const banner = `blob:${origin}/banner`;
const side = `blob:${origin}/side`;
const settings = {
  appName: "Acme",
  appLogoLight: banner,
  appLogoDark: banner,
  appLogoFavicon: icon,
  linkPreviewImage: icon,
  loginSidePanelImage: side,
  primaryColorLight: "#5500ff"
};
const update = data =>
  act(() => {
    window.dispatchEvent(
      new MessageEvent("message", {
        origin,
        source: window.parent,
        data: { type: "espaco-branding-preview", settings, ...data }
      })
    );
  });

test("renders the actual login layout, tenant banner and side artwork from the draft", () => {
  const { container } = render(<BrandingPreviewPage />);
  update({ view: "login" });
  expect(container.querySelector(".ew-sign-in")).not.toBeNull();
  expect(
    container.querySelector(".login-toolbar img").getAttribute("src")
  ).toBe(banner);
  expect(
    container.querySelector(".login-brand-panel img").getAttribute("src")
  ).toBe(banner);
  expect(screen.getByTestId("login-artwork").dataset.image).toBe(side);
  expect(screen.getByLabelText("login.form.email")).not.toBeNull();
  expect(screen.getByLabelText("login.form.password")).not.toBeNull();
  expect(
    container
      .querySelector(".ew-sign-in")
      .style.getPropertyValue("--login-accent")
  ).toBe("#5500ff");
});

test("switches the actual shared sidebar brand between banner and icon", () => {
  const { container } = render(<BrandingPreviewPage />);
  update({ view: "system", sidebarOpen: true });
  expect(
    container.querySelector(".tenant-sidebar-brand--banner").getAttribute("src")
  ).toBe(banner);
  expect(container.querySelector(".estrutura-app").dataset.navegacao).toBe(
    "aberta"
  );
  update({ view: "system", sidebarOpen: false });
  expect(
    container.querySelector(".tenant-sidebar-brand--icon").getAttribute("src")
  ).toBe(icon);
  expect(container.querySelector(".estrutura-app").dataset.navegacao).toBe(
    "fechada"
  );
  expect(container.querySelector("nav a[href='/tickets']")).not.toBeNull();
});

test("the shared link uses the icon instead of the sidebar banner", () => {
  const { container } = render(<BrandingPreviewPage />);
  update({ view: "link", slug: "acme" });
  expect(
    container.querySelector(".brand-link-card img").getAttribute("src")
  ).toBe(icon);
  expect(screen.getByText("Acme")).not.toBeNull();
  expect(screen.getByText("acme.localhost")).not.toBeNull();
  expect(container.querySelector("form")).toBeNull();
});

test("ignores untrusted messages without changing the displayed tenant", () => {
  render(<BrandingPreviewPage />);
  update({ view: "link" });
  act(() => {
    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "https://other.test",
        source: window.parent,
        data: {
          type: "espaco-branding-preview",
          settings: { appName: "Another tenant" },
          view: "link"
        }
      })
    );
  });
  expect(screen.getByText("Acme")).not.toBeNull();
  expect(screen.queryByText("Another tenant")).toBeNull();
});
