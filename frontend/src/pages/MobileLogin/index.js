import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Link,
  Paper,
  Typography,
  makeStyles,
  useTheme
} from "@material-ui/core";
import { i18n } from "../../translate/i18n";
import useGoogleLogin, { googleErrorMessage } from "../../hooks/useGoogleLogin";
import { openApi } from "../../services/api";
import getCompanySlug from "../../helpers/getCompanySlug";
import {
  BrandLogo,
  publicBrandAsset
} from "../../components/LoginExperience/BrandPanel";
import {
  beginMobileIntent,
  requireMobileIntent,
  clearMobileIntent,
  requireMobileConfiguration,
  authorizeMobileGoogle
} from "../../services/mobileAuth";

const useStyles = makeStyles(theme => ({
  page: {
    minHeight: "100dvh",
    boxSizing: "border-box",
    display: "grid",
    placeItems: "center",
    padding: theme.spacing(3),
    background: theme.palette.background.default,
    color: theme.palette.text.primary
  },
  card: {
    width: "100%",
    maxWidth: 440,
    padding: theme.spacing(4),
    borderRadius: 24,
    boxSizing: "border-box",
    display: "grid",
    gap: theme.spacing(3),
    [theme.breakpoints.down("xs")]: { padding: theme.spacing(3) }
  },
  label: {
    color: theme.palette.primary.main,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontSize: 11,
    fontWeight: 700
  },
  button: {
    minHeight: 50,
    borderRadius: 14,
    textTransform: "none",
    fontWeight: 600
  },
  note: { fontSize: 13, lineHeight: 1.6, color: theme.palette.text.secondary },
  error: { color: theme.palette.error.main },
  progress: { display: "flex", alignItems: "center", gap: 12 },
  legal: { display: "grid", gap: 12 }
}));
const t = key => i18n.t(`mobileLogin.${key}`, { lng: "pt" });

function MobileGoogleFlow({ onCancel }) {
  const classes = useStyles();
  const [callbackURL, setCallbackURL] = useState("");
  const canceled = useRef(false);
  const google = useGoogleLogin(async token => {
    const url = await authorizeMobileGoogle(token);
    if (!canceled.current) {
      setCallbackURL(url);
    }
  }, "mobile");
  useEffect(() => {
    if (google.error) clearMobileIntent();
  }, [google.error]);
  useEffect(
    () => () => {
      canceled.current = true;
    },
    []
  );
  // A single-use authorization code is only retained in this component's memory.
  // Explicit user activation reliably opens ASWebAuthenticationSession's callback.
  if (callbackURL)
    return (
      <>
        <Typography role="status">{t("returning")}</Typography>
        <Button
          className={classes.button}
          color="primary"
          variant="contained"
          href={callbackURL}
        >
          {t("returnToApp")}
        </Button>
      </>
    );
  return (
    <>
      {google.busy && (
        <div className={classes.progress} role="status">
          <CircularProgress size={22} />
          <Typography>{t("loading")}</Typography>
        </div>
      )}
      {google.error && (
        <Typography role="alert" className={classes.error}>
          {google.error}
        </Typography>
      )}
      {google.legal ? (
        <form className={classes.legal} onSubmit={google.accept}>
          <Typography>
            {i18n.t("socialLogin.legalDescription", { lng: "pt" })}
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                color="primary"
                checked={google.accepted}
                onChange={event => google.setAccepted(event.target.checked)}
              />
            }
            label={
              <span>
                {i18n.t("socialLogin.accept", { lng: "pt" })}{" "}
                <Link
                  href="https://espacowhats.com.br/termos/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {i18n.t("socialLogin.terms", { lng: "pt" })}
                </Link>{" "}
                {i18n.t("socialLogin.and", { lng: "pt" })}{" "}
                <Link
                  href="https://espacowhats.com.br/privacidade/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {i18n.t("socialLogin.privacy", { lng: "pt" })}
                </Link>
              </span>
            }
          />
          <Button
            type="submit"
            color="primary"
            variant="contained"
            className={classes.button}
            disabled={!google.accepted || google.busy}
          >
            {t("finishLegal")}
          </Button>
        </form>
      ) : (
        !google.callback && (
          <Button
            className={classes.button}
            color="primary"
            variant="contained"
            disabled={!google.ready || google.busy || !!google.error}
            onClick={google.start}
          >
            {t("google")}
          </Button>
        )
      )}
      <div id="clerk-captcha" />
      <Button
        className={classes.button}
        onClick={() => {
          canceled.current = true;
          clearMobileIntent();
          onCancel();
        }}
      >
        {t("cancel")}
      </Button>
    </>
  );
}

export default function MobileLogin() {
  const classes = useStyles();
  const theme = useTheme();
  const { pathname, search } = useLocation();
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [branding, setBranding] = useState({});
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        if (pathname === "/login/mobile") {
          // A reload after URL cleanup may resume only the same fresh,
          // origin-bound sessionStorage intent; it cannot invent a destination.
          if (search) beginMobileIntent(search);
          else requireMobileIntent();
          // Remove PKCE intent parameters from history before any provider redirect.
          window.history.replaceState(null, "", "/login/mobile");
        } else {
          requireMobileIntent();
        }
        await requireMobileConfiguration();
        if (live) setStatus("ready");
      } catch (err) {
        clearMobileIntent();
        if (live) {
          setError(googleErrorMessage(err, "pt"));
          setStatus("error");
        }
      }
    })();
    return () => {
      live = false;
    };
    // Each OAuth redirect performs a full page navigation; no live URL destination is accepted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    let live = true;
    Promise.all(
      ["appName", "appLogoLight", "appLogoDark"].map(async key => {
        try {
          const { data } = await openApi.get(`/public-settings/${key}`, {
            params: { slug: getCompanySlug() }
          });
          return [key, data];
        } catch (_) {
          return [key, ""];
        }
      })
    ).then(values => {
      if (live) setBranding(Object.fromEntries(values));
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const dark = theme.palette.type === "dark";
  const logo = publicBrandAsset(
    dark
      ? branding.appLogoDark || branding.appLogoLight
      : branding.appLogoLight || branding.appLogoDark
  );
  return (
    <main className={classes.page} lang="pt-BR">
      <Paper elevation={0} className={classes.card}>
        <BrandLogo
          logo={logo}
          name={branding.appName || "Espaço Whats"}
          compact
        />
        <Typography className={classes.label}>{t("environment")}</Typography>
        <div>
          <Typography variant="h5" component="h1" gutterBottom>
            {status === "canceled" ? t("canceled") : t("title")}
          </Typography>
          <Typography color="textSecondary">
            {status === "canceled"
              ? t("canceledDescription")
              : t("description")}
          </Typography>
        </div>
        {status === "loading" && (
          <div className={classes.progress} role="status">
            <CircularProgress size={22} />
            {t("loading")}
          </div>
        )}
        {status === "error" && (
          <Typography role="alert" className={classes.error}>
            {error || t("unavailable")}
          </Typography>
        )}
        {status === "ready" && (
          <MobileGoogleFlow onCancel={() => setStatus("canceled")} />
        )}
        <Typography className={classes.note}>{t("membership")}</Typography>
        <Typography className={classes.note}>
          {t("noAutomaticSignup")}
        </Typography>
      </Paper>
    </main>
  );
}
