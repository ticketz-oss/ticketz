import React, { useEffect, useState } from "react";
import { ThemeProvider, createTheme } from "@material-ui/core/styles";
import { CssBaseline, IconButton } from "@material-ui/core";
import { Globe2, Palette } from "lucide-react";
import { SignInPage } from "../../components/ui/sign-in";
import BrandPanel, {
  publicBrandAsset
} from "../../components/LoginExperience/BrandPanel";
import LoginBrandHeader from "../../components/LoginExperience/LoginBrandHeader";
import { loginBrandStyles } from "../../components/LoginExperience/branding";
import {
  coresInterface,
  tipografiaInterface
} from "../../theme/identidadeVisual";
import criarAjustesVisuais from "../../theme/overrides";
import { i18n } from "../../translate/i18n";
import { readBrandingPreviewMessage } from "./protocol";
import SystemPreview from "./SystemPreview";
import { tenantLoginUrl } from "../Checkout/setup";
import config from "../../services/config";
import "./preview.css";

const t = key => i18n.t(`landing.motion.checkout.identity.${key}`);
export default function BrandingPreviewPage() {
  const [draft, setDraft] = useState(null);
  const [values, setValues] = useState({
    email: "",
    password: "",
    newPassword: "",
    confirmPassword: ""
  });
  useEffect(() => {
    const receive = event => {
      const parsed = readBrandingPreviewMessage(
        event,
        window.location.origin,
        window.parent
      );
      if (parsed) setDraft(parsed);
    };
    window.addEventListener("message", receive);
    if (window.parent !== window)
      window.parent.postMessage(
        { type: "espaco-branding-preview-ready" },
        window.location.origin
      );
    return () => window.removeEventListener("message", receive);
  }, []);
  if (!draft) return null;
  const { settings, dark, view } = draft;
  const mode = dark ? "dark" : "light";
  const colors = coresInterface(mode);
  const theme = createTheme({
    palette: {
      type: mode,
      primary: { main: settings.primaryColorLight },
      background: { default: colors.fundo, paper: colors.superficie },
      text: { primary: colors.texto, secondary: colors.secundario },
      divider: colors.borda
    },
    typography: tipografiaInterface,
    overrides: criarAjustesVisuais(mode)
  });
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {view === "login" ? (
        <SignInPage
          dark={dark}
          style={loginBrandStyles(settings, dark)}
          title={i18n.t("loginExperience.welcome")}
          description={i18n.t("loginExperience.emailHint")}
          values={values}
          onFieldChange={event =>
            setValues(current => ({
              ...current,
              [event.target.name]: event.target.value
            }))
          }
          submitLabel={i18n.t(
            values.password ? "login.buttons.submit" : "login.buttons.continue"
          )}
          toolbar={
            <LoginBrandHeader settings={settings}>
              <div className="login-tools">
                <IconButton
                  aria-label={i18n.t("mainDrawer.appBar.i18n.language")}
                >
                  <Globe2 size={20} />
                </IconButton>
                <IconButton aria-label={i18n.t("themes.label")}>
                  <Palette size={18} />
                </IconButton>
              </div>
            </LoginBrandHeader>
          }
          hero={<BrandPanel settings={settings} />}
          footer={<footer className="login-footer" />}
        />
      ) : view === "system" ? (
        <SystemPreview settings={settings} expanded={draft.sidebarOpen} />
      ) : (
        <div className={`brand-link-preview${dark ? " dark" : ""}`}>
          <div className="brand-link-card">
            {(settings.linkPreviewImage || settings.appLogoLight) && (
              <img
                src={publicBrandAsset(
                  settings.linkPreviewImage || settings.appLogoLight
                )}
                alt={settings.appName}
              />
            )}
            <div>
              <strong>{settings.appName || "Espaço Whats"}</strong>
              <span>
                {
                  new URL(
                    tenantLoginUrl(
                      draft.slug || "sua-empresa",
                      window.location,
                      config.APP_BASE_DOMAIN
                    )
                  ).hostname
                }
              </span>
            </div>
          </div>
          <p>{t("linkCaption")}</p>
        </div>
      )}
    </ThemeProvider>
  );
}
