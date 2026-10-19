import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useLayoutEffect
} from "react";

import "react-toastify/dist/ReactToastify.css";
import { QueryClient, QueryClientProvider } from "react-query";

import { ptBR } from "@material-ui/core/locale";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import ColorModeContext from "./layout/themeContext";
import { PhoneCallProvider } from "./context/PhoneCall/PhoneCallContext";
import { VoiceCallProvider } from "./context/VoiceCall/VoiceCallContext";
import { SocketContext, socketManager } from "./context/Socket/SocketContext";
import useSettings from "./hooks/useSettings";
import Favicon from "react-favicon";
import { loadBranding } from "./helpers/loadBranding";
import criarAjustesVisuais from "./theme/overrides";
import { coresInterface, tipografiaInterface } from "./theme/identidadeVisual";

import Routes from "./routes";
import getCompanySlug from "./helpers/getCompanySlug";
import {
  applyStardewTheme,
  canUseStardew,
  normalizeTheme
} from "./theme/stardew";
import "./theme/stardew.css";
import "./theme/stardew-conversations.css";
import "./theme/stardew-operations.css";
import "./theme/stardew-business.css";

const queryClient = new QueryClient();
const defaultLogoLight = "/branding/logo-light.png";
const defaultLogoDark = "/branding/logo-dark.png";
const defaultLogoFavicon = "/branding/icon.png";

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

  // Without a saved choice the app starts light, whatever the system prefers.
  const preferredTheme = window.localStorage.getItem("preferredTheme");
  const [selectedTheme, setSelectedTheme] = useState(
    preferredTheme === "dark" || preferredTheme === "light"
      ? preferredTheme
      : "light"
  );
  // Set exclusively by AuthProvider from the authenticated user, never localStorage.
  const [themeCompanyId, setThemeCompany] = useState(null);
  const [preferenceCompanyId, setPreferenceCompany] = useState(null);
  const stardewAllowed = canUseStardew(themeCompanyId, getCompanySlug());
  const isStardew = selectedTheme === "stardew" && stardewAllowed;
  const mode = selectedTheme === "dark" ? "dark" : "light";
  const themeName = isStardew ? "stardew" : mode;
  const setTheme = useCallback(
    value => {
      setSelectedTheme(normalizeTheme(value, stardewAllowed));
    },
    [stardewAllowed]
  );
  useLayoutEffect(() => {
    setPreferenceCompany(themeCompanyId);
    if (!themeCompanyId) {
      setSelectedTheme(
        normalizeTheme(localStorage.getItem("preferredTheme") || "light")
      );
      return;
    }
    const saved = localStorage.getItem(
      `preferredTheme:tenant:${themeCompanyId}`
    );
    setSelectedTheme(
      normalizeTheme(
        saved || localStorage.getItem("preferredTheme") || "light",
        stardewAllowed
      )
    );
  }, [themeCompanyId, stardewAllowed]);
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = themeName;
    document.body.dataset.theme = themeName;
    document.documentElement.style.colorScheme = mode;
  }, [themeName, mode]);
  const [primaryColorLight, setPrimaryColorLight] = useState("#888");
  const [primaryColorDark, setPrimaryColorDark] = useState("#888");
  const [appLogoLight, setAppLogoLight] = useState("");
  const [appLogoDark, setAppLogoDark] = useState("");
  const [appLogoFavicon, setAppLogoFavicon] = useState("");
  const [appName, setAppName] = useState("");
  const { getPublicSetting } = useSettings();

  const colorMode = useMemo(
    () => ({
      setTheme,
      setThemeCompany,
      stardewAllowed,
      themeName,
      toggleColorMode: () => {
        setSelectedTheme(prevMode => (prevMode === "light" ? "dark" : "light"));
      },
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
    [setTheme, stardewAllowed, themeName]
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

  const theme = useMemo(
    () =>
      createTheme(
        applyStardewTheme(
          {
            scrollbarStyles: {
              "&::-webkit-scrollbar": {
                width: "8px",
                height: "8px"
              },
              "&::-webkit-scrollbar-thumb": {
                borderRadius: 8,
                backgroundColor: mode === "light" ? "#D4D4D8" : "#333B47"
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
              text: {
                primary: coresInterface(mode).texto,
                secondary: coresInterface(mode).secundario
              },
              divider: coresInterface(mode).borda,
              primary: {
                main: mode === "light" ? primaryColorLight : primaryColorDark
              },
              textPrimary:
                mode === "light" ? primaryColorLight : primaryColorDark,
              textCommon: mode === "light" ? "#000" : "#fff",
              borderPrimary:
                mode === "light" ? primaryColorLight : primaryColorDark,
              background: {
                default: coresInterface(mode).fundo,
                paper: coresInterface(mode).superficie
              },
              backgroundContrast: {
                default: mode === "light" ? "#ddd" : "#888",
                paper: mode === "light" ? "#ddd" : "#888",
                border: mode === "light" ? "#aaa" : "#444"
              },
              dark: { main: mode === "light" ? "#333333" : "#666" },
              light: { main: mode === "light" ? "#F3F3F3" : "#333333" },
              chatBubbleFromMe: {
                main: mode === "light" ? "#dcf8c6" : "#005c4b"
              },
              chatBubbleReceived: {
                main: mode === "light" ? "#fff" : "#024481"
              },
              chatBackground: { main: mode === "light" ? "#f3f3f3" : "#333" },
              tabHeaderBackground: coresInterface(mode).fundo,
              optionsBackground: coresInterface(mode).superficie,
              options: coresInterface(mode).superficie,
              fontecor: mode === "light" ? primaryColorLight : primaryColorDark,
              fancyBackground: coresInterface(mode).fundo,
              bordabox: mode === "light" ? "#eee" : "#333",
              newmessagebox: coresInterface(mode).fundo,
              inputdigita: coresInterface(mode).superficie,
              contactdrawer: coresInterface(mode).superficie,
              announcements: mode === "light" ? "#ededed" : "#333",
              login: mode === "light" ? "#fff" : "#1C1C1C",
              announcementspopover: coresInterface(mode).superficie,
              chatlist: { main: mode === "light" ? "#dfdfdf" : "#555" },
              boxlist: coresInterface(mode).fundo,
              boxchatlist: coresInterface(mode).fundo,
              total: coresInterface(mode).superficie,
              messageIcons: mode === "light" ? "grey" : "#F3F3F3",
              inputBackground: coresInterface(mode).superficie,
              barraSuperior: mode === "light" ? primaryColorLight : "#666",
              boxticket: coresInterface(mode).fundo,
              campaigntab: coresInterface(mode).fundo,
              ticketzproad: { main: "#39ACE7", contrastText: "white" },
              // Paleta do editor de chatbot, que simula uma conversa do WhatsApp.
              whatsapp: {
                canvas: mode === "light" ? "#efeae2" : "#0b141a",
                toolbar: mode === "light" ? "#f0f2f5" : "#202c33",
                bubble: mode === "light" ? "#d9fdd3" : "#005c4b",
                bubbleMuted: mode === "light" ? "#ffffff" : "#202c33",
                ink: mode === "light" ? "#111b21" : "#e9edef",
                copy: mode === "light" ? "#3b4a54" : "#d1d7db",
                muted: mode === "light" ? "#667781" : "#8696a0",
                line:
                  mode === "light"
                    ? "rgba(17,27,33,.1)"
                    : "rgba(233,237,239,.12)",
                hover:
                  mode === "light"
                    ? "rgba(17,27,33,.06)"
                    : "rgba(233,237,239,.08)",
                badge: mode === "light" ? "#e1f5df" : "#025144",
                status: mode === "light" ? "#008069" : "#00a884",
                switch: "#00a884",
                focus: mode === "light" ? "#0b84ff" : "#53bdeb",
                background:
                  mode === "light"
                    ? "/whatsapp/chat-background.png"
                    : "/whatsapp/chat-background-dark.png"
              }
            },
            overrides: criarAjustesVisuais(mode),
            typography: tipografiaInterface,
            shape: { borderRadius: 8 },
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
          isStardew
        ),
        locale
      ),
    [
      appLogoLight,
      appLogoDark,
      appLogoFavicon,
      appName,
      locale,
      mode,
      primaryColorDark,
      primaryColorLight,
      isStardew
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
    if (themeCompanyId !== preferenceCompanyId) return;
    if (themeCompanyId) {
      window.localStorage.setItem(
        `preferredTheme:tenant:${themeCompanyId}`,
        themeName
      );
    }
    // The global fallback always stays a standard theme for public/other tenant pages.
    if (themeName !== "stardew")
      window.localStorage.setItem("preferredTheme", themeName);
  }, [themeName, themeCompanyId, preferenceCompanyId]);

  useEffect(() => {
    // Marca "master" (empresa 1) para a tela de login (pre-autenticacao).
    // Apos o login, o useAuth reaplica a marca da empresa do usuario.
    loadBranding(colorMode, getPublicSetting);
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
                <VoiceCallProvider>
                  <Routes />
                </VoiceCallProvider>
              </SocketContext.Provider>
            </QueryClientProvider>
          </ThemeProvider>
        </PhoneCallProvider>
      </ColorModeContext.Provider>
    </>
  );
};

export default App;
