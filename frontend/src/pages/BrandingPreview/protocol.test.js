import { readBrandingPreviewMessage } from "./protocol";

const origin = "http://localhost:3000";
const parent = {};
const event = (data = {}, overrides = {}) => ({
  origin,
  source: parent,
  data: { type: "espaco-branding-preview", ...data },
  ...overrides
});

test("accepts only a message from the same-origin parent", () => {
  expect(readBrandingPreviewMessage(event(), origin, parent)).not.toBeNull();
  expect(
    readBrandingPreviewMessage(
      event({}, { origin: "https://evil.test" }),
      origin,
      parent
    )
  ).toBeNull();
  expect(
    readBrandingPreviewMessage(event({}, { source: {} }), origin, parent)
  ).toBeNull();
  expect(
    readBrandingPreviewMessage(event({ type: "other" }), origin, parent)
  ).toBeNull();
});

test("allows local draft images without accepting external or script URLs", () => {
  const { settings } = readBrandingPreviewMessage(
    event({
      settings: {
        appLogoFavicon: `blob:${origin}/icon`,
        appLogoLight: "https://evil.test/banner",
        appLogoDark: "javascript:alert(1)",
        loginSidePanelImage: "blob:http://localhost:3001/art"
      }
    }),
    origin,
    parent
  );
  expect(settings.appLogoFavicon).toBe(`blob:${origin}/icon`);
  expect(settings.appLogoLight).toBe("");
  expect(settings.appLogoDark).toBe("");
  expect(settings.loginSidePanelImage).toBe("");
});

test("normalizes configuration and never accepts private data or arbitrary views", () => {
  const data = readBrandingPreviewMessage(
    event({
      view: "admin",
      settings: {
        appName: "A".repeat(300),
        primaryColorLight: "red",
        token: "secret"
      },
      slug: "abc<script>"
    }),
    origin,
    parent
  );
  expect(data.view).toBe("login");
  expect(data.settings.appName).toHaveLength(100);
  expect(data.settings.primaryColorLight).toBe("#5000ff");
  expect(data.settings).not.toHaveProperty("token");
  expect(data.slug).toBe("abcscript");
});
