import React from "react";

const ColorModeContext = React.createContext({
  setTheme: () => {},
  setThemeCompany: () => {},
  stardewAllowed: false,
  themeName: "light",
  toggleColorMode: () => {},
  setPrimaryColorLight: _ => {},
  setPrimaryColorDark: _ => {},
  setAppLogoLight: _ => {},
  setAppLogoDark: _ => {},
  setAppLogoFavicon: _ => {}
});

export default ColorModeContext;
