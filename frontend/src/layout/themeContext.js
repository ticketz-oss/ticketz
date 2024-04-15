import React from "react";

const ColorModeContext = React.createContext({
  toggleColorMode: () => { },
  setPrimaryColorLight: (_) => { },
  setPrimaryColorDark: (_) => { },
});

export default ColorModeContext;