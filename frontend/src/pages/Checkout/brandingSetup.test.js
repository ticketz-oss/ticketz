import { signupBrandingSettings } from "./brandingSetup";

test("keeps the icon, sidebar banner and login artwork in their actual settings", () => {
  const settings = signupBrandingSettings(
    { logo: "icon", banner: "banner", sideImage: "artwork" },
    "Acme",
    "#5500ff"
  );
  expect(settings).toMatchObject({
    appName: "Acme",
    appLogoLight: "banner",
    appLogoDark: "banner",
    appLogoFavicon: "icon",
    linkPreviewImage: "icon",
    loginSidePanelImage: "artwork",
    primaryColorLight: "#5500ff",
    primaryColorDark: "#5500ff"
  });
  expect(settings).not.toHaveProperty("loginBackgroundContent");
});

test("uses the icon as the full brand when no banner has been uploaded", () => {
  expect(
    signupBrandingSettings({ logo: "icon" }, "Acme", "#5500ff")
  ).toMatchObject({
    appLogoLight: "icon",
    appLogoDark: "icon",
    appLogoFavicon: "icon",
    linkPreviewImage: "icon",
    loginSidePanelImage: ""
  });
});

test("uses the backend link fallback when only the banner is uploaded", () => {
  expect(
    signupBrandingSettings({ banner: "banner" }, "Acme", "#5500ff")
  ).toMatchObject({
    appLogoFavicon: "",
    linkPreviewImage: "banner",
    appLogoLight: "banner"
  });
});
