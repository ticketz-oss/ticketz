export const signupBrandingSettings = (images, name, color) => ({
  appName: name,
  appLogoLight: images.banner || images.logo || "",
  appLogoDark: images.banner || images.logo || "",
  appLogoFavicon: images.logo || "",
  linkPreviewImage: images.logo || images.banner || "",
  loginSidePanelImage: images.sideImage || "",
  primaryColorLight: color,
  primaryColorDark: color,
  loginTemplate: "aurora"
});
