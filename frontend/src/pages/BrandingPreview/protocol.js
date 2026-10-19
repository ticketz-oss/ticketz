const imageKeys = [
  "appLogoLight",
  "appLogoDark",
  "appLogoFavicon",
  "linkPreviewImage",
  "loginSidePanelImage"
];
export const readBrandingPreviewMessage = (event, origin, parent) => {
  if (
    event.origin !== origin ||
    event.source !== parent ||
    event.data?.type !== "espaco-branding-preview"
  )
    return null;
  const data = event.data;
  const source = data.settings || {};
  const color = /^#[0-9a-f]{6}$/i.test(source.primaryColorLight || "")
    ? source.primaryColorLight
    : "#5000ff";
  const settings = {
    appName: String(source.appName || "").slice(0, 100),
    primaryColorLight: color,
    primaryColorDark: color,
    loginTemplate: "aurora"
  };
  imageKeys.forEach(key => {
    settings[key] =
      typeof source[key] === "string" &&
      source[key].startsWith(`blob:${origin}/`)
        ? source[key]
        : "";
  });
  return {
    settings,
    view: ["login", "system", "link"].includes(data.view) ? data.view : "login",
    dark: data.dark === true,
    sidebarOpen: data.sidebarOpen !== false,
    slug: String(data.slug || "")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 63)
  };
};
