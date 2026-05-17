import React, { useState, useEffect, useMemo } from "react";

import "react-toastify/dist/ReactToastify.css";
import { QueryClient, QueryClientProvider } from "react-query";

import { ptBR } from "@material-ui/core/locale";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import { useMediaQuery } from "@material-ui/core";
import ColorModeContext from "./layout/themeContext";
import { PhoneCallProvider } from "./context/PhoneCall/PhoneCallContext";
import { SocketContext, socketManager } from "./context/Socket/SocketContext";
import useSettings from "./hooks/useSettings";
import Favicon from "react-favicon";
import { getBackendURL } from "./services/config";

import Routes from "./routes";

const queryClient = new QueryClient();
const defaultLogoLight = "/vector/logo.svg";
const defaultLogoDark = "/vector/logo-dark.svg";
const defaultLogoFavicon = "/vector/favicon.svg";

const ATTENDITOP_LIGHT = {
  bg: "#F7F7F4",
  bgAmbient: "#EEEDE7",
  surface1: "#FFFFFF",
  surface2: "#FAFAF7",
  surface3: "#F2F2EE",
  border: "rgba(0,0,0,0.08)",
  text: "#0A0A0A",
  textMuted: "#565660",
  textFaint: "#8B8B95",
  primaryFallback: "#FF7A00",
  primarySoft: "#FFF4E6",
  primarySoft2: "rgba(255,122,0,0.22)",
  chatFromMe: "#FF7A00",
  chatReceived: "#FFFFFF",
  chatBackground: "#EFEAE2"
};

const ATTENDITOP_DARK = {
  bg: "#161617",
  bgAmbient: "#101012",
  surface1: "#1D1E20",
  surface2: "#242529",
  surface3: "#2B2D33",
  border: "rgba(255,255,255,0.10)",
  text: "#F5F5F6",
  textMuted: "#C3C3CB",
  textFaint: "#8E8F98",
  primaryFallback: "#FF9A2F",
  primarySoft: "rgba(255,154,47,0.18)",
  primarySoft2: "rgba(255,154,47,0.32)",
  chatFromMe: "#FF8A1A",
  chatReceived: "#242529",
  chatBackground: "#1A1A1D"
};

const LEGACY_LIGHT = {
  bg: "#fafafa",
  bgAmbient: "#fafafa",
  surface1: "#ffffff",
  surface2: "#F3F3F3",
  surface3: "#e8e8e8",
  border: "rgba(0,0,0,0.12)",
  text: "#303030",
  textMuted: "#687992",
  textFaint: "#7f8fa6",
  primaryFallback: "#39ACE7",
  primarySoft: "rgba(57,172,231,0.14)",
  primarySoft2: "rgba(57,172,231,0.24)",
  chatFromMe: "#dcf8c6",
  chatReceived: "#ffffff",
  chatBackground: "#f3f3f3"
};

const LEGACY_DARK = {
  bg: "#303030",
  bgAmbient: "#303030",
  surface1: "#424242",
  surface2: "#333333",
  surface3: "#2a2a2a",
  border: "rgba(255,255,255,0.14)",
  text: "#ffffff",
  textMuted: "#d0d0d0",
  textFaint: "#b4b4b4",
  primaryFallback: "#39ACE7",
  primarySoft: "rgba(57,172,231,0.2)",
  primarySoft2: "rgba(57,172,231,0.34)",
  chatFromMe: "#005c4b",
  chatReceived: "#024481",
  chatBackground: "#333333"
};

const OCEAN_LIGHT = {
  bg: "#F3FAFF",
  bgAmbient: "#E9F5FF",
  surface1: "#FFFFFF",
  surface2: "#EEF6FF",
  surface3: "#E3EFFB",
  border: "rgba(7,89,133,0.18)",
  text: "#0F172A",
  textMuted: "#334155",
  textFaint: "#64748B",
  primaryFallback: "#0284C7",
  primarySoft: "rgba(2,132,199,0.16)",
  primarySoft2: "rgba(2,132,199,0.32)",
  chatFromMe: "#0284C7",
  chatReceived: "#FFFFFF",
  chatBackground: "#E8F3FC"
};

const OCEAN_DARK = {
  bg: "#0B1320",
  bgAmbient: "#0A111D",
  surface1: "#111D2E",
  surface2: "#162335",
  surface3: "#1B2A40",
  border: "rgba(125,211,252,0.2)",
  text: "#E2E8F0",
  textMuted: "#CBD5E1",
  textFaint: "#94A3B8",
  primaryFallback: "#38BDF8",
  primarySoft: "rgba(56,189,248,0.18)",
  primarySoft2: "rgba(56,189,248,0.3)",
  chatFromMe: "#0EA5E9",
  chatReceived: "#1E293B",
  chatBackground: "#0F172A"
};

const GRAPHITE_LIGHT = {
  bg: "#F5F6F8",
  bgAmbient: "#ECEEF1",
  surface1: "#FFFFFF",
  surface2: "#F1F3F7",
  surface3: "#E6E9EE",
  border: "rgba(17,24,39,0.14)",
  text: "#111827",
  textMuted: "#4B5563",
  textFaint: "#6B7280",
  primaryFallback: "#111827",
  primarySoft: "rgba(17,24,39,0.1)",
  primarySoft2: "rgba(17,24,39,0.2)",
  chatFromMe: "#374151",
  chatReceived: "#FFFFFF",
  chatBackground: "#E5E7EB"
};

const GRAPHITE_DARK = {
  bg: "#111315",
  bgAmbient: "#0D0F11",
  surface1: "#181B20",
  surface2: "#20242A",
  surface3: "#2A2F36",
  border: "rgba(255,255,255,0.13)",
  text: "#F3F4F6",
  textMuted: "#D1D5DB",
  textFaint: "#9CA3AF",
  primaryFallback: "#9CA3AF",
  primarySoft: "rgba(156,163,175,0.2)",
  primarySoft2: "rgba(156,163,175,0.32)",
  chatFromMe: "#4B5563",
  chatReceived: "#1F2937",
  chatBackground: "#111827"
};

const THEME_VARIANT_TOKENS = {
  legacy: {
    light: LEGACY_LIGHT,
    dark: LEGACY_DARK
  },
  attenditop: {
    light: ATTENDITOP_LIGHT,
    dark: ATTENDITOP_DARK
  },
  ocean: {
    light: OCEAN_LIGHT,
    dark: OCEAN_DARK
  },
  graphite: {
    light: GRAPHITE_LIGHT,
    dark: GRAPHITE_DARK
  }
};

const THEME_VARIANT_LABELS = {
  legacy: "Modelo Clássico",
  attenditop: "AtendiTop",
  ocean: "Ocean",
  graphite: "Graphite"
};

function useViewportHeight() {
  useEffect(() => {
    const setVh = () => {
      const h = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty("--vh", `${h}px`);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", setVh);
      window.visualViewport.addEventListener("scroll", setVh);
    }
    window.addEventListener("resize", setVh);

    setVh(); // initial

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", setVh);
        window.visualViewport.removeEventListener("scroll", setVh);
      }
      window.removeEventListener("resize", setVh);
    };
  }, []);
}

const App = () => {
  const [locale, setLocale] = useState();

  const prefersDarkMode = !!window.matchMedia("(prefers-color-scheme: dark)")
    .matches;
  const preferredTheme = window.localStorage.getItem("preferredTheme");
  const preferredThemeVariant = window.localStorage.getItem(
    "preferredThemeVariant"
  );
  const userCompanyId = Number(window.localStorage.getItem("companyId") || 0);
  const canUseThemeVariantSelection = userCompanyId === 1;
  const [mode, setMode] = useState(
    preferredTheme ? preferredTheme : prefersDarkMode ? "dark" : "light"
  );
  const [themeVariant, setThemeVariant] = useState(
    canUseThemeVariantSelection &&
      preferredThemeVariant &&
      THEME_VARIANT_TOKENS[preferredThemeVariant]
      ? preferredThemeVariant
      : "attenditop"
  );
  const [primaryColorLight, setPrimaryColorLight] = useState("#888");
  const [primaryColorDark, setPrimaryColorDark] = useState("#888");
  const [appLogoLight, setAppLogoLight] = useState("");
  const [appLogoDark, setAppLogoDark] = useState("");
  const [appLogoFavicon, setAppLogoFavicon] = useState("");
  const [appName, setAppName] = useState("");
  const { getPublicSetting } = useSettings();

  const availableThemeVariants = canUseThemeVariantSelection
    ? Object.keys(THEME_VARIANT_TOKENS)
    : ["attenditop"];

  const activeTokens =
    THEME_VARIANT_TOKENS[themeVariant]?.[mode] || ATTENDITOP_LIGHT;

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode(prevMode => (prevMode === "light" ? "dark" : "light"));
      },
      setThemeVariant: variant => {
        if (canUseThemeVariantSelection && THEME_VARIANT_TOKENS[variant]) {
          setThemeVariant(variant);
        }
      },
      themeVariant,
      availableThemeVariants: availableThemeVariants.map(variant => ({
        value: variant,
        label: THEME_VARIANT_LABELS[variant] || variant
      })),
      setPrimaryColorLight: color => {
        setPrimaryColorLight(color);
      },
      setPrimaryColorDark: color => {
        setPrimaryColorDark(color);
      },
      setAppLogoLight: file => {
        setAppLogoLight(file);
      },
      setAppLogoDark: file => {
        setAppLogoDark(file);
      },
      setAppLogoFavicon: file => {
        setAppLogoFavicon(file);
      },
      setAppName: name => {
        setAppName(name);
      }
    }),
    [canUseThemeVariantSelection, themeVariant]
  );

  const calculatedLogoDark = () => {
    if (appLogoDark === defaultLogoDark && appLogoLight !== defaultLogoLight) {
      return appLogoLight;
    }
    return appLogoDark;
  };
  const calculatedLogoLight = () => {
    if (appLogoDark !== defaultLogoDark && appLogoLight === defaultLogoLight) {
      return appLogoDark;
    }
    return appLogoLight;
  };

  const bodyBackgroundImage =
    mode !== "light"
      ? "none"
      : themeVariant === "attenditop"
        ? "radial-gradient(900px at 10% 10%, rgba(255,122,0,0.08), transparent 60%), radial-gradient(1000px at 90% 90%, rgba(255,122,0,0.05), transparent 60%)"
        : themeVariant === "ocean"
          ? "radial-gradient(900px at 8% 8%, rgba(2,132,199,0.12), transparent 62%), radial-gradient(1200px at 94% 92%, rgba(56,189,248,0.08), transparent 66%)"
          : "none";

  const typographyFamily =
    themeVariant === "legacy"
      ? "'Roboto', 'Segoe UI', sans-serif"
      : "'Geist', 'Segoe UI', sans-serif";

  const theme = useMemo(
    () =>
      createTheme(
        {
          attenditop: activeTokens,
          themeVariant,
          scrollbarStyles: {
            "&::-webkit-scrollbar": {
              width: "8px",
              height: "8px"
            },
            "&::-webkit-scrollbar-thumb": {
              boxShadow: "inset 0 0 6px rgba(0, 0, 0, 0.3)",
              backgroundColor:
                mode === "light" ? primaryColorLight : primaryColorDark
            }
          },
          scrollbarStylesSoft: {
            "&::-webkit-scrollbar": {
              width: "8px"
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: mode === "light" ? "#F3F3F3" : "#333333"
            }
          },
          palette: {
            type: mode,
            primary: {
              main: mode === "light" ? primaryColorLight : primaryColorDark
            },
            secondary: {
              main: activeTokens.primaryFallback
            },
            textPrimary:
              mode === "light" ? primaryColorLight : primaryColorDark,
            textCommon: activeTokens.text,
            borderPrimary:
              mode === "light" ? primaryColorLight : primaryColorDark,
            background: {
              default: activeTokens.bg,
              paper: activeTokens.surface1
            },
            backgroundContrast: {
              default: activeTokens.surface3,
              paper: activeTokens.surface2,
              border: activeTokens.border
            },
            dark: { main: mode === "light" ? "#333333" : "#666" },
            light: {
              main: activeTokens.surface2
            },
            chatBubbleFromMe: {
              main: activeTokens.chatFromMe
            },
            chatBubbleReceived: {
              main: activeTokens.chatReceived
            },
            chatBackground: {
              main: activeTokens.chatBackground
            },
            tabHeaderBackground: activeTokens.surface2,
            optionsBackground: activeTokens.surface1,
            options: activeTokens.surface2,
            fontecor: mode === "light" ? primaryColorLight : primaryColorDark,
            fancyBackground: activeTokens.bg,
            bordabox: activeTokens.border,
            newmessagebox: activeTokens.surface2,
            inputdigita: activeTokens.surface1,
            contactdrawer: activeTokens.surface1,
            announcements: activeTokens.surface2,
            login: activeTokens.surface1,
            announcementspopover: activeTokens.surface1,
            chatlist: {
              main: activeTokens.surface3
            },
            boxlist: activeTokens.surface2,
            boxchatlist: activeTokens.surface2,
            total: activeTokens.surface1,
            messageIcons: mode === "light" ? activeTokens.textFaint : activeTokens.textMuted,
            inputBackground: activeTokens.surface1,
            barraSuperior: mode === "light" ? primaryColorLight : "#666",
            boxticket: activeTokens.surface2,
            campaigntab: activeTokens.surface2,
            ticketzproad: { main: "#39ACE7", contrastText: "white" }
          },
          shape: {
            borderRadius: 10
          },
          typography: {
            fontFamily: typographyFamily,
            h1: { fontWeight: 600, letterSpacing: "-0.03em" },
            h2: { fontWeight: 600, letterSpacing: "-0.02em" },
            h3: { fontWeight: 600, letterSpacing: "-0.02em" },
            h4: { fontWeight: 600, letterSpacing: "-0.02em" },
            h5: { fontWeight: 600, letterSpacing: "-0.015em" },
            h6: { fontWeight: 600, letterSpacing: "-0.01em" },
            button: { fontWeight: 600, textTransform: "none" }
          },
          overrides: {
            MuiCssBaseline: {
              "@global": {
                "html, body": {
                  backgroundColor: activeTokens.bgAmbient,
                  color: activeTokens.text,
                  fontFeatureSettings: "'cv11','ss01','ss03'"
                },
                body: {
                  backgroundImage: bodyBackgroundImage
                }
              }
            }
          },
          mode,
          appLogoLight,
          appLogoDark,
          appLogoFavicon,
          appName,
          calculatedLogoLight,
          calculatedLogoDark,
          calculatedLogo: () => {
            if (mode === "light") {
              return calculatedLogoLight();
            }
            return calculatedLogoDark();
          }
        },
        locale
      ),
    [
      appLogoLight,
      appLogoDark,
      appLogoFavicon,
      appName,
      locale,
      mode,
      themeVariant,
      primaryColorDark,
      primaryColorLight
    ]
  );

  useEffect(() => {
    const i18nlocale = localStorage.getItem("language");
    if (!i18nlocale) {
      return;
    }

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
    if (!canUseThemeVariantSelection && themeVariant !== "attenditop") {
      setThemeVariant("attenditop");
      window.localStorage.setItem("preferredThemeVariant", "attenditop");
    }
  }, [canUseThemeVariantSelection, themeVariant]);

  useEffect(() => {
    window.localStorage.setItem("preferredThemeVariant", themeVariant);
  }, [themeVariant]);

  useEffect(() => {
    getPublicSetting("primaryColorLight")
      .then(color => {
        setPrimaryColorLight(color || "#0000FF");
      })
      .catch(error => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("primaryColorDark")
      .then(color => {
        setPrimaryColorDark(color || "#39ACE7");
      })
      .catch(error => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("appLogoLight")
      .then(
        file => {
          setAppLogoLight(
            file ? `${getBackendURL()}/public/${file}` : defaultLogoLight
          );
        },
        _ => {}
      )
      .catch(error => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("appLogoDark")
      .then(file => {
        setAppLogoDark(
          file ? `${getBackendURL()}/public/${file}` : defaultLogoDark
        );
      })
      .catch(error => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("appLogoFavicon")
      .then(file => {
        setAppLogoFavicon(file ? `${getBackendURL()}/public/${file}` : null);
      })
      .catch(error => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("appName")
      .then(name => {
        setAppName(name || "ticketz");
      })
      .catch(error => {
        console.log("Error reading setting", error);
        setAppName("whitelabel chat");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useViewportHeight();

  return (
    <>
      <Favicon
        url={appLogoFavicon ? theme.appLogoFavicon : defaultLogoFavicon}
      />
      <ColorModeContext.Provider value={{ colorMode }}>
        <PhoneCallProvider>
          <ThemeProvider theme={theme}>
            <QueryClientProvider client={queryClient}>
              <SocketContext.Provider value={socketManager}>
                <Routes />
              </SocketContext.Provider>
            </QueryClientProvider>
          </ThemeProvider>
        </PhoneCallProvider>
      </ColorModeContext.Provider>
    </>
  );
};

export default App;
