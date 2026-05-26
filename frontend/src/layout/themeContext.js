import React from "react";

const ColorModeContext = React.createContext({
  toggleColorMode: () => {},
  setThemeVariant: _ => {},
  themeVariant: "attenditop",
  availableThemeVariants: [],
  setPrimaryColorLight: _ => {},
  setPrimaryColorDark: _ => {},
  setAppLogoLight: _ => {},
  setAppLogoDark: _ => {},
  setAppLogoFavicon: _ => {}
});

export default ColorModeContext;
