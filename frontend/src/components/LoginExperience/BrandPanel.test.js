import React from "react";
import { readFileSync } from "fs";
import path from "path";
import { fireEvent, render, screen } from "@testing-library/react";
import { useMediaQuery, useTheme } from "@material-ui/core";
import BrandPanel, { BrandLogo } from "./BrandPanel";

jest.mock("../../translate/i18n", () => ({ i18n: { t: key => key } }));
jest.mock("../../services/config", () => ({
  getBackendURL: () => "https://test.example/backend"
}));
jest.mock("@material-ui/core", () => ({
  ...jest.requireActual("@material-ui/core"),
  useMediaQuery: jest.fn(),
  useTheme: jest.fn()
}));
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ initial, animate, transition, ...props }) => <div {...props} />,
    path: ({ initial, animate, transition, ...props }) => <path {...props} />
  }
}));
jest.mock("../ui/interactive-blur-reveal", () => ({
  __esModule: true,
  default: ({ iChannel0, enabled, mouseRadius, duration }) => (
    <div
      data-testid="interactive-blur"
      data-image={iChannel0}
      data-enabled={String(enabled)}
      data-radius={mouseRadius}
      data-duration={duration}
    />
  )
}));

let mutedSetter;
beforeAll(() => {
  // JSDOM fires volumechange synchronously during React's mount, unlike browsers.
  mutedSetter = jest
    .spyOn(HTMLMediaElement.prototype, "muted", "set")
    .mockImplementation(() => {});
});
afterAll(() => mutedSetter.mockRestore());
beforeEach(() => {
  useMediaQuery.mockImplementation(() => false);
  useTheme.mockReturnValue({ palette: { type: "light" } });
});

test("uses the tenant logo, texts and uploaded background in the real preview", () => {
  const { container } = render(
    <BrandPanel
      preview
      settings={{
        appName: "AC Norte",
        appLogoDark: "branding/2/logo.png",
        loginHeadline: "Sua marca",
        loginDescription: "Sua mensagem",
        loginSidePanelImage: "branding/2/background.png"
      }}
    />
  );
  expect(
    screen.getByRole("img", { name: "AC Norte" }).getAttribute("src")
  ).toBe("https://test.example/backend/public/branding/2/logo.png");
  expect(screen.getByRole("heading", { name: "Sua marca" })).toBeTruthy();
  expect(screen.getByText("Sua mensagem")).toBeTruthy();
  expect(screen.getByTestId("interactive-blur").dataset.image).toBe(
    "https://test.example/backend/public/branding/2/background.png"
  );
  expect(screen.getByTestId("interactive-blur").dataset.enabled).toBe("true");
  expect(container.querySelector("video")).toBeNull();
  expect(screen.getByRole("complementary").className).toContain(
    "login-brand-panel--preview"
  );
});

test("uses Espaço Whats and translated defaults when no custom branding exists", () => {
  const { container } = render(<BrandPanel />);
  expect(screen.getByText("Espaço Whats")).toBeTruthy();
  expect(container.querySelector("img").getAttribute("src")).toBe(
    "/branding/espaco-whats.png"
  );
  expect(screen.getByText("loginExperience.headline")).toBeTruthy();
  expect(screen.getByText("loginExperience.description")).toBeTruthy();
  expect(screen.getByTestId("interactive-blur").dataset).toMatchObject({
    image: "/branding/login-desert.jpg",
    enabled: "true",
    radius: "130",
    duration: "0.7"
  });
  expect(screen.getByRole("complementary").className).toContain(
    "login-brand-panel--reveal"
  );
  expect(container.querySelector(".login-brand-orbits")).toBeNull();
});

test("falls back on a broken tenant logo and accepts a later valid replacement", () => {
  const { container, rerender } = render(
    <BrandLogo logo="/broken.png" name="Tenant" />
  );
  fireEvent.error(screen.getByRole("img", { name: "Tenant" }));
  expect(container.querySelector("img").getAttribute("src")).toBe(
    "/branding/espaco-whats.png"
  );
  expect(screen.getByText("Tenant")).toBeTruthy();
  rerender(<BrandLogo logo="/replacement.png" name="Tenant" />);
  expect(screen.getByRole("img", { name: "Tenant" }).getAttribute("src")).toBe(
    "/replacement.png"
  );
});

test("plays a finite video introduction without looping and stops at four seconds", () => {
  const { container } = render(
    <BrandPanel settings={{ loginBackgroundContent: "branding/2/video.mp4" }} />
  );
  expect(screen.getByRole("complementary").dataset.animated).toBe("true");
  const video = container.querySelector("video");
  expect(video.autoplay).toBe(true);
  expect(video.loop).toBe(false);
  expect(video.getAttribute("src")).toBe(
    "https://test.example/backend/public/branding/2/video.mp4"
  );
  expect(screen.queryByTestId("interactive-blur")).toBeNull();
  expect(container.querySelector(".login-brand-orbits")).not.toBeNull();
  expect(screen.queryByRole("button")).toBeNull();
  const pause = jest.spyOn(video, "pause").mockImplementation(() => {});
  video.currentTime = 3.9;
  fireEvent.timeUpdate(video);
  expect(pause).not.toHaveBeenCalled();
  video.currentTime = 4;
  fireEvent.timeUpdate(video);
  expect(pause).toHaveBeenCalledTimes(1);
  pause.mockRestore();
});

test("respects live reduced-motion preference and disables video autoplay", () => {
  const settings = { loginBackgroundContent: "branding/2/video.mp4" };
  const { container, rerender } = render(<BrandPanel settings={settings} />);
  useMediaQuery.mockImplementation(
    query => query === "(prefers-reduced-motion: reduce)"
  );
  rerender(<BrandPanel settings={settings} />);
  expect(screen.getByRole("complementary").dataset.animated).toBe("false");
  expect(container.querySelector("video").autoplay).toBe(false);
  expect(screen.queryByRole("button")).toBeNull();
});

test("does not mount hidden mobile media or animation elements", () => {
  useMediaQuery.mockImplementation(query => query === "(max-width: 767px)");
  const { container } = render(
    <BrandPanel settings={{ loginBackgroundContent: "branding/2/video.mp4" }} />
  );
  expect(container.firstChild).toBeNull();
  expect(container.querySelector("video")).toBeNull();
  expect(useMediaQuery).toHaveBeenCalledWith("(max-width: 767px)");
});

test("keeps a static editor preview visible on mobile without enabling the interactive effect", () => {
  useMediaQuery.mockImplementation(query => query === "(max-width: 767px)");
  render(<BrandPanel preview />);
  expect(screen.getByRole("complementary").className).toContain(
    "login-brand-panel--preview"
  );
  expect(screen.getByTestId("interactive-blur").dataset.enabled).toBe("false");
  expect(screen.getByTestId("interactive-blur").dataset.image).toBe(
    "/branding/login-desert.jpg"
  );
});

test.each([
  ["light", "", false, "light.png", "light"],
  ["dark", "", false, "dark.png", "dark"],
  ["light", "background.png", false, "light.png", "light"],
  ["dark", "background.png", false, "dark.png", "dark"],
  ["light", "", true, "light.png", "light"],
  ["dark", "", true, "light.png", "light"],
  ["light", "background.png", true, "light.png", "light"],
  ["dark", "background.png", true, "light.png", "light"]
])(
  "matches the image surface and logo to the app theme while keeping editor previews light (%s, %s, preview=%s)",
  (mode, background, preview, logo, surface) => {
    useTheme.mockReturnValue({ palette: { type: mode } });
    render(
      <BrandPanel
        preview={preview}
        settings={{
          appName: "Tenant",
          appLogoLight: "light.png",
          appLogoDark: "dark.png",
          loginSidePanelImage: background
        }}
      />
    );
    expect(
      screen.getByRole("img", { name: "Tenant" }).getAttribute("src")
    ).toBe(`https://test.example/backend/public/${logo}`);
    expect(screen.getByRole("complementary").dataset.theme).toBe(surface);
    expect(screen.getByRole("complementary").className).toContain(
      "login-brand-panel--reveal"
    );
  }
);

test("minimal template stays static and has no motion toggle", () => {
  render(<BrandPanel settings={{ loginTemplate: "minimal" }} />);
  expect(screen.getByRole("complementary").dataset.animated).toBe("false");
  expect(screen.getByTestId("interactive-blur").dataset.enabled).toBe("false");
  expect(screen.queryByRole("button")).toBeNull();
});

test("turns off the interactive image immediately when reduced motion is enabled", () => {
  const { rerender } = render(<BrandPanel />);
  expect(screen.getByTestId("interactive-blur").dataset.enabled).toBe("true");
  useMediaQuery.mockImplementation(
    query => query === "(prefers-reduced-motion: reduce)"
  );
  rerender(<BrandPanel />);
  expect(screen.getByTestId("interactive-blur").dataset.enabled).toBe("false");
  expect(screen.getByRole("complementary").dataset.animated).toBe("false");
});

test("the actual reveal stylesheet uses dark ink on light surfaces and white ink on dark surfaces", () => {
  const style = document.createElement("style");
  style.textContent = readFileSync(path.join(__dirname, "login.css"), "utf8");
  document.head.appendChild(style);
  try {
    const { rerender } = render(<BrandPanel />);
    expect(
      getComputedStyle(screen.getByRole("complementary"))
        .getPropertyValue("--login-ink")
        .trim()
    ).toBe("#242426");
    useTheme.mockReturnValue({ palette: { type: "dark" } });
    rerender(<BrandPanel />);
    expect(
      getComputedStyle(screen.getByRole("complementary"))
        .getPropertyValue("--login-ink")
        .trim()
    ).toBe("#fff");
    rerender(<BrandPanel preview />);
    expect(screen.getByRole("complementary").dataset.theme).toBe("light");
    expect(
      getComputedStyle(screen.getByRole("complementary"))
        .getPropertyValue("--login-ink")
        .trim()
    ).toBe("#242426");
  } finally {
    style.remove();
  }
});

test("uses a configured side image before legacy background video", () => {
  const { container } = render(
    <BrandPanel
      settings={{
        loginSidePanelImage: "branding/2/side.jpg",
        loginBackgroundContent: "branding/2/legacy-video.mp4"
      }}
    />
  );
  expect(screen.getByTestId("interactive-blur").dataset.image).toBe(
    "https://test.example/backend/public/branding/2/side.jpg"
  );
  expect(container.querySelector("video")).toBeNull();
});

test("does not mount the image effect on the mobile login", () => {
  useMediaQuery.mockImplementation(query => query === "(max-width: 767px)");
  const { container } = render(<BrandPanel />);
  expect(container.firstChild).toBeNull();
  expect(screen.queryByTestId("interactive-blur")).toBeNull();
});

test.each([
  ["light", false, "light.png"],
  ["dark", false, "dark.png"],
  ["light", true, "light.png"],
  ["dark", true, "light.png"]
])(
  "preserves logo selection on the existing video surface (%s, preview=%s)",
  (mode, preview, logo) => {
    useTheme.mockReturnValue({ palette: { type: mode } });
    render(
      <BrandPanel
        preview={preview}
        settings={{
          appName: "Tenant",
          appLogoLight: "light.png",
          appLogoDark: "dark.png",
          loginBackgroundContent: "branding/2/video.webm"
        }}
      />
    );
    expect(
      screen.getByRole("img", { name: "Tenant" }).getAttribute("src")
    ).toBe(`https://test.example/backend/public/${logo}`);
    expect(screen.getByRole("complementary").className).not.toContain(
      "login-brand-panel--reveal"
    );
    expect(screen.queryByTestId("interactive-blur")).toBeNull();
  }
);
