import React from "react";

const ColorModeContext = React.createContext({
  toggleColorMode: () => { },
  setPrimaryColorLight: (_) => { },
  setPrimaryColorDark: (_) => { },
  setAppLogoLight: (_) => { },
  setAppLogoDark: (_) => { },
});

export default ColorModeContext;