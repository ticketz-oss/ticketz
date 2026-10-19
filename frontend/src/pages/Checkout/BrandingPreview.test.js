import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import BrandingPreview from "./BrandingPreview";

jest.mock("../../translate/i18n", () => ({
  i18n: { t: key => key.split("identity.")[1] }
}));
const props = {
  images: { logo: "icon", banner: "banner", sideImage: "artwork" },
  name: "Acme",
  color: "#5500ff",
  slug: "acme"
};
beforeEach(() => {
  global.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
});

test("isolates the real login form inside a frame rather than nesting it inside signup", () => {
  const { container } = render(
    <form>
      <BrandingPreview {...props} />
    </form>
  );
  const frame = screen.getByTitle("previewTitle");
  expect(frame.getAttribute("src")).toBe("/preview/branding");
  expect(container.querySelectorAll("form")).toHaveLength(1);
  const send = jest.spyOn(frame.contentWindow, "postMessage");
  fireEvent.load(frame);
  expect(send).toHaveBeenLastCalledWith(
    expect.objectContaining({
      settings: expect.objectContaining({
        appLogoLight: "banner",
        appLogoFavicon: "icon",
        linkPreviewImage: "icon",
        loginSidePanelImage: "artwork"
      })
    }),
    window.location.origin
  );
});

test("updates preview view, sidebar state, device width and theme with accessible controls", () => {
  render(<BrandingPreview {...props} />);
  const frame = screen.getByTitle("previewTitle");
  const send = jest.spyOn(frame.contentWindow, "postMessage");
  fireEvent.click(screen.getByRole("tab", { name: "views.system" }));
  fireEvent.click(screen.getByRole("button", { name: "closeSidebar" }));
  fireEvent.click(screen.getByRole("button", { name: "mobile" }));
  fireEvent.click(screen.getByRole("button", { name: "darkMode" }));
  expect(send).toHaveBeenLastCalledWith(
    expect.objectContaining({ view: "system", sidebarOpen: false, dark: true }),
    window.location.origin
  );
  expect(frame.style.width).toBe("390px");
  const active = screen.getByRole("tab", { name: "views.system" });
  fireEvent.keyDown(active, { key: "ArrowRight" });
  expect(
    screen
      .getByRole("tab", { name: "views.link" })
      .getAttribute("aria-selected")
  ).toBe("true");
  expect(document.activeElement).toBe(
    screen.getByRole("tab", { name: "views.link" })
  );
});
