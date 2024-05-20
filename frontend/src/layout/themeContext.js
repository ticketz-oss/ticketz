import React from "react";

const ColorModeContext = React.createContext({
  toggleColorMode: () => { },
  setPrimaryColorLight: (_) => { },
  setPrimaryColorDark: (_) => { },
  setAppLogoLight: (_) => { },
  setAppLogoDark: (_) => { },
  setAppLogoFavicon: (_) => { },
});

export default ColorModeContext;