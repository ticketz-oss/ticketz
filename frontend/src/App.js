import React, { useState, useEffect, useMemo } from "react";

import "react-toastify/dist/ReactToastify.css";
import { QueryClient, QueryClientProvider } from "react-query";

import { ptBR } from "@material-ui/core/locale";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import { useMediaQuery } from "@material-ui/core";
import ColorModeContext from "./layout/themeContext";
import { SocketContext, socketManager } from './context/Socket/SocketContext';
import useSettings from "./hooks/useSettings";
import Favicon from "react-favicon";
import { getBackendURL } from "./services/config";

import Routes from "./routes";

const queryClient = new QueryClient();
const logoFavicon = "/vector/favicon.svg";

const App = () => {
  const [locale, setLocale] = useState();

  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const preferredTheme = window.localStorage.getItem("preferredTheme");
  const [mode, setMode] = useState(preferredTheme ? preferredTheme : prefersDarkMode ? "dark" : "light");
  const [primaryColorLight, setPrimaryColorLight] = useState("#0000FF");
  const [primaryColorDark, setPrimaryColorDark] = useState("#39ACE7");
  const [appLogoLight, setAppLogoLight] = useState("");
  const [appLogoDark, setAppLogoDark] = useState("");
  const [appLogoFavicon, setAppLogoFavicon] = useState("");
  const [appName, setAppName] = useState("");
  const { getPublicSetting } = useSettings();

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
      },
      setPrimaryColorLight: (color) => {
        setPrimaryColorLight(color);
      },
      setPrimaryColorDark: (color) => {
        setPrimaryColorDark(color);
      },
      setAppLogoLight: (file) => {
        setAppLogoLight(file); 
      },
      setAppLogoDark: (file) => {
        setAppLogoDark(file); 
      },
      setAppLogoFavicon: (file) => {
        setAppLogoFavicon(file);
      },
      setAppName: (name) => {
        setAppName(name);
      }
    }),
    []
  );

  const theme = useMemo(() => createTheme(
    {
      scrollbarStyles: {
        "&::-webkit-scrollbar": {
          width: '8px',
          height: '8px',
        },
        "&::-webkit-scrollbar-thumb": {
          boxShadow: 'inset 0 0 6px rgba(0, 0, 0, 0.3)',
          backgroundColor: mode === "light" ? primaryColorLight : primaryColorDark,
        },
      },
      scrollbarStylesSoft: {
        "&::-webkit-scrollbar": {
          width: "8px",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: mode === "light" ? "#F3F3F3" : "#333333",
        },
      },
      palette: {
        type: mode,
        primary: { main: mode === "light" ? primaryColorLight : primaryColorDark },
        textPrimary: mode === "light" ? primaryColorLight : primaryColorDark,
        borderPrimary: mode === "light" ? primaryColorLight : primaryColorDark,
        dark: { main: mode === "light" ? "#333333" : "#666" },
        light: { main: mode === "light" ? "#F3F3F3" : "#333333" },
        tabHeaderBackground: mode === "light" ? "#EEE" : "#666",
        optionsBackground: mode === "light" ? "#fafafa" : "#333",
        options: mode === "light" ? "#fafafa" : "#666",
        fontecor: mode === "light" ? primaryColorLight : primaryColorDark,
        fancyBackground: mode === "light" ? "#fafafa" : "#333",
        bordabox: mode === "light" ? "#eee" : "#333",
        newmessagebox: mode === "light" ? "#eee" : "#333",
        inputdigita: mode === "light" ? "#fff" : "#666",
        contactdrawer: mode === "light" ? "#fff" : "#666",
        announcements: mode === "light" ? "#ededed" : "#333",
        login: mode === "light" ? "#fff" : "#1C1C1C",
        announcementspopover: mode === "light" ? "#fff" : "#666",
        chatlist: mode === "light" ? "#eee" : "#666",
        boxlist: mode === "light" ? "#ededed" : "#666",
        boxchatlist: mode === "light" ? "#ededed" : "#333",
        total: mode === "light" ? "#fff" : "#222",
        messageIcons: mode === "light" ? "grey" : "#F3F3F3",
        inputBackground: mode === "light" ? "#FFFFFF" : "#333",
        barraSuperior: mode === "light" ? primaryColorLight : "#666",
        boxticket: mode === "light" ? "#EEE" : "#666",
        campaigntab: mode === "light" ? "#ededed" : "#666",
      },
      mode,
      appLogoLight,
      appLogoDark,
      appLogoFavicon,
      appName,
    },
    locale
  ), [appLogoLight, appLogoDark, appLogoFavicon, appName, locale, mode, primaryColorDark, primaryColorLight]);

  useEffect(() => {
    const i18nlocale = localStorage.getItem("i18nextLng");
    const browserLocale =
      i18nlocale.substring(0, 2) + i18nlocale.substring(3, 5);

    if (browserLocale === "ptBR") {
      setLocale(ptBR);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("preferredTheme", mode);
  }, [mode]);

  useEffect(() => {
    getPublicSetting("primaryColorLight")
      .then((color) => { color && setPrimaryColorLight(color) })
      .catch((error) => { console.log("Error reading setting", error); });
    getPublicSetting("primaryColorDark")
      .then((color) => { color && setPrimaryColorDark(color) })
      .catch((error) => { console.log("Error reading setting", error); });
    getPublicSetting("appLogoLight")
      .then((file) => { file && setAppLogoLight(file) }, (_) => { })
      .catch((error) => { console.log("Error reading setting", error); });
    getPublicSetting("appLogoDark")
      .then((file) => { file && setAppLogoDark(file) })
      .catch((error) => { console.log("Error reading setting", error); });
    getPublicSetting("appLogoFavicon")
      .then((file) => { file && setAppLogoFavicon(file) })
      .catch((error) => { console.log("Error reading setting", error); });
    getPublicSetting("appName").then((name) => { setAppName(name || "ticketz") })
      .catch((error) => { console.log("Error reading setting", error); setAppName("whitelabel chat") });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
    <Favicon url={ ((appLogoFavicon) ? getBackendURL()+"/public/" + theme.appLogoFavicon : logoFavicon ) } />
    <ColorModeContext.Provider value={{ colorMode }}>
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <SocketContext.Provider value={socketManager}>
            <Routes />
          </SocketContext.Provider>
        </QueryClientProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
    </>
  );
};

export default App;
