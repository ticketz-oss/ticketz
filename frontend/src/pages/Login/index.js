import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useHistory, useLocation } from "react-router-dom";

import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import MenuItem from "@material-ui/core/MenuItem";
import Popover from "@material-ui/core/Popover";
import Fade from "@material-ui/core/Fade";
import Paper from "@material-ui/core/Paper";
import MenuList from "@material-ui/core/MenuList";
import IconButton from "@material-ui/core/IconButton";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import Brightness4Icon from "@material-ui/icons/Brightness4";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import LanguageIcon from "@material-ui/icons/Translate";
import Typography from "@material-ui/core/Typography";
import { toast } from "react-toastify";

import { i18n } from "../../translate/i18n";
import { messages } from "../../translate/languages";

import { AuthContext } from "../../context/Auth/AuthContext";
import useSettings from "../../hooks/useSettings";
import { getBackendURL } from "../../services/config";
import ColorModeContext from "../../layout/themeContext";
import { loadJSON } from "../../helpers/loadJSON";
import toastError from "../../errors/toastError";
import { openApi } from "../../services/api";

const gitinfo = loadJSON("/gitinfo.json");

const parseLoginLinks = value => {
  if (!value) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(value);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      link => typeof link?.title === "string" && typeof link?.url === "string"
    );
  } catch (error) {
    return [];
  }
};

const isVideoFile = (filename = "") => /\.(mp4|webm|ogg)$/i.test(filename);

const getPublicAssetUrl = filename => {
  if (!filename) {
    return "";
  }

  return `${getBackendURL()}/public/${filename}`;
};

const useStyles = makeStyles(theme => ({
  root: {
    position: "fixed",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  backgroundLayer: {
    position: "absolute",
    inset: 0,
    background: `linear-gradient(to right, ${theme.palette.background.default}, ${theme.palette.background.default}, ${theme.palette.primary.main}, ${theme.palette.background.default}, ${theme.palette.background.default})`,
    backgroundColor: theme.palette.background.default,
    backgroundSize: "200% 200%",
    animation: "$gradientDrift 18s ease-in-out infinite",
    willChange: "background-position",
    "@media (prefers-reduced-motion: reduce)": {
      animation: "none"
    }
  },
  backgroundLayerImage: {
    position: "absolute",
    inset: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
    animation: "none",
    willChange: "auto"
  },
  backgroundVideo: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  content: {
    position: "relative",
    zIndex: 1,
    flex: 1,
    overflowY: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(3),
    [theme.breakpoints.down("xs")]: {
      padding: theme.spacing(1.5)
    }
  },
  themeToggle: {
    position: "absolute",
    top: theme.spacing(2),
    right: theme.spacing(2),
    zIndex: 2,
    color: theme.palette.type === "light" ? "#142033" : "#fff",
    background:
      theme.palette.type === "light"
        ? "rgba(255,255,255,0.68)"
        : "rgba(6,12,22,0.5)",
    border:
      theme.palette.type === "light"
        ? "1px solid rgba(255,255,255,0.8)"
        : "1px solid rgba(255,255,255,0.18)",
    backdropFilter: "blur(12px)",
    "&:hover": {
      background:
        theme.palette.type === "light"
          ? "rgba(255,255,255,0.84)"
          : "rgba(10,18,31,0.68)"
    },
    [theme.breakpoints.down("xs")]: {
      top: theme.spacing(1),
      right: theme.spacing(1)
    }
  },
  languageToggle: {
    position: "absolute",
    top: theme.spacing(2),
    right: theme.spacing(10),
    zIndex: 2,
    color: theme.palette.type === "light" ? "#142033" : "#fff",
    background:
      theme.palette.type === "light"
        ? "rgba(255,255,255,0.68)"
        : "rgba(6,12,22,0.5)",
    border:
      theme.palette.type === "light"
        ? "1px solid rgba(255,255,255,0.8)"
        : "1px solid rgba(255,255,255,0.18)",
    backdropFilter: "blur(12px)",
    "&:hover": {
      background:
        theme.palette.type === "light"
          ? "rgba(255,255,255,0.84)"
          : "rgba(10,18,31,0.68)"
    },
    [theme.breakpoints.down("xs")]: {
      top: theme.spacing(1),
      right: theme.spacing(7)
    }
  },
  langMenu: {
    zIndex: 3
  },
  langMenuPaper: {
    minWidth: 160,
    borderRadius: theme.spacing(1),
    overflow: "hidden",
    transformOrigin: "top center",
    transition: "transform 180ms ease, opacity 180ms ease"
  },
  layout: {
    width: "100%",
    maxWidth: 980,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      maxWidth: 440
    }
  },
  loginBox: {
    width: "fit-content",
    maxWidth: "100%",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: 28,
    backgroundColor: theme.palette.background.paper,
    boxShadow:
      theme.palette.type === "light"
        ? "0 24px 72px rgba(45, 67, 89, 0.18)"
        : "0 24px 80px rgba(0,0,0,0.35)",
    border: `1px solid ${theme.palette.backgroundContrast.border}`,
    [theme.breakpoints.down("sm")]: {
      display: "block",
      maxWidth: 420
    }
  },
  mediaPane: {
    position: "relative",
    flex: "0 0 clamp(280px, 34vw, 360px)",
    alignSelf: "stretch",
    minHeight: 0,
    overflow: "hidden",
    backgroundColor: theme.palette.background.default,
    [theme.breakpoints.down("sm")]: {
      display: "none"
    }
  },
  sidePanelImage: {
    position: "absolute",
    inset: 0,
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  formColumn: {
    flex: "0 0 420px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      width: "100%"
    }
  },
  formCardWrap: {
    width: "100%"
  },
  paper: {
    width: "100%",
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "32px 32px 28px",
    minHeight: 0,
    borderRadius: 0,
    boxShadow: "none",
    border: "none",
    [theme.breakpoints.down("xs")]: {
      padding: "24px 16px 20px",
      borderRadius: 16
    },
    [theme.breakpoints.down("sm")]: {
      borderRadius: 24
    }
  },
  form: {
    width: "100%",
    marginTop: theme.spacing(1)
  },
  formTitle: {
    width: "100%",
    marginTop: theme.spacing(1),
    fontWeight: 600,
    letterSpacing: "-0.02em",
    textAlign: "left"
  },
  formSubtitle: {
    width: "100%",
    marginTop: theme.spacing(1),
    color: theme.palette.messageIcons,
    textAlign: "left"
  },
  helperLinks: {
    marginTop: theme.spacing(1.5),
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1.5)
  },
  feedbackBox: {
    width: "100%",
    marginTop: theme.spacing(1.5),
    padding: theme.spacing(1.25, 1.5),
    borderRadius: 14,
    backgroundColor: theme.palette.background.default,
    border: `1px solid ${theme.palette.backgroundContrast.border}`,
    color: theme.palette.messageIcons
  },
  submit: {
    margin: theme.spacing(2, 0, 1)
  },
  logoImg: {
    width: "100%",
    maxWidth: 200,
    margin: "0 auto 8px",
    content: `url("${theme.calculatedLogo()}")`
  },
  linksContainer: {
    width: "100%",
    maxWidth: 980,
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: theme.spacing(1),
    [theme.breakpoints.down("sm")]: {
      maxWidth: 420
    }
  },
  footerLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    padding: theme.spacing(1, 2),
    borderRadius: 999,
    textDecoration: "none",
    color: theme.palette.type === "light" ? "#142033" : "#fff",
    fontWeight: 600,
    fontSize: "0.85rem",
    letterSpacing: 0.2,
    lineHeight: 1.25,
    textAlign: "center",
    background:
      theme.palette.type === "light"
        ? "rgba(255,255,255,0.72)"
        : "rgba(6,12,22,0.62)",
    border:
      theme.palette.type === "light"
        ? "1px solid rgba(255,255,255,0.82)"
        : "1px solid rgba(255,255,255,0.18)",
    boxShadow:
      theme.palette.type === "light"
        ? "0 12px 28px rgba(45, 67, 89, 0.12)"
        : "none",
    backdropFilter: "blur(14px)",
    transition: "transform 160ms ease, background-color 160ms ease",
    "&:hover": {
      transform: "translateY(-1px)",
      background:
        theme.palette.type === "light"
          ? "rgba(255,255,255,0.9)"
          : "rgba(10,18,31,0.78)",
      textDecoration: "none"
    }
  },
  versionInfo: {
    position: "absolute",
    right: theme.spacing(2),
    bottom: theme.spacing(1.25),
    zIndex: 2,
    fontSize: "12px",
    fontWeight: "bold",
    textAlign: "right",
    color: theme.palette.type === "light" ? "#0e1726" : "#ffffff",
    textShadow:
      theme.palette.type === "light"
        ? "1px 0 2px rgba(255,255,255,0.9), -1px 0 2px rgba(255,255,255,0.9), 0 1px 2px rgba(255,255,255,0.9), 0 -1px 2px rgba(255,255,255,0.9), 0 2px 6px rgba(0,0,0,0.35)"
        : "1px 0 2px rgba(0,0,0,0.9), -1px 0 2px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.9), 0 -1px 2px rgba(0,0,0,0.9), 0 2px 6px rgba(0,0,0,0.65)",
    [theme.breakpoints.down("xs")]: {
      right: theme.spacing(1),
      bottom: theme.spacing(0.75),
      fontSize: "11px"
    }
  },
  "@keyframes gradientDrift": {
    "0%": {
      backgroundPosition: "0% 50%"
    },
    "50%": {
      backgroundPosition: "100% 50%"
    },
    "100%": {
      backgroundPosition: "0% 50%"
    }
  }
}));

const Login = () => {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const location = useLocation();
  const { getPublicSetting } = useSettings();
  const { colorMode } = useContext(ColorModeContext);

  const [langMenuAnchor, setLangMenuAnchor] = useState(null);
  const currentLanguage =
    localStorage.getItem("language") || i18n.language || "en";

  const handleChooseLanguage = lang => {
    setLangMenuAnchor(null);
    localStorage.setItem("language", lang);
    window.location.reload(false);
  };

  const [user, setUser] = useState({ email: "", password: "" });
  const [resetRequestEmail, setResetRequestEmail] = useState("");
  const [resetForm, setResetForm] = useState({
    token: "",
    password: "",
    confirmPassword: ""
  });
  const [allowSignup, setAllowSignup] = useState(false);
  const [loginLinks, setLoginLinks] = useState([]);
  const [sidePanelImage, setSidePanelImage] = useState("");
  const [backgroundContent, setBackgroundContent] = useState("");
  const [requestInFlight, setRequestInFlight] = useState(false);
  const [resetInFlight, setResetInFlight] = useState(false);
  const [requestFeedbackVisible, setRequestFeedbackVisible] = useState(false);
  const [forceTokenForm, setForceTokenForm] = useState(false);

  const { handleLogin } = useContext(AuthContext);

  const resetTokenFromUrl =
    new URLSearchParams(location.search).get("token") || "";
  const isPasswordResetRoute = location.pathname === "/password-reset";
  const showResetPasswordForm =
    isPasswordResetRoute && (Boolean(resetTokenFromUrl) || forceTokenForm);

  const resetLabels = useMemo(() => {
    const isPortuguese = currentLanguage.toLowerCase().startsWith("pt");

    return isPortuguese
      ? {
          requestTitle: "Recuperar senha",
          requestDescription:
            "Informe o e-mail do usuario para receber um token de redefinicao.",
          requestSubmit: "Enviar token por e-mail",
          requestSuccess:
            "Se o e-mail existir, enviamos um token de redefinicao para ele.",
          forgotPassword: "Esqueceu sua senha?",
          haveToken: "Ja tenho um token",
          resetTitle: "Definir nova senha",
          resetDescription:
            "Informe o token recebido por e-mail e cadastre a nova senha.",
          tokenLabel: "Token",
          newPassword: "Nova senha",
          confirmPassword: "Confirmar nova senha",
          resetSubmit: "Redefinir senha",
          resetSuccess: "Senha redefinida com sucesso. Entre com a nova senha.",
          backToLogin: "Voltar para login",
          requestAccess: "Solicitar token por e-mail",
          mismatch: "As senhas nao coincidem.",
          invalidToken: "O token informado e invalido ou expirou.",
          requestUnavailable:
            "A recuperacao de senha nao esta configurada no servidor."
        }
      : {
          requestTitle: "Recover password",
          requestDescription: "Enter the user email to receive a reset token.",
          requestSubmit: "Send token by email",
          requestSuccess: "If the email exists, we sent a reset token to it.",
          forgotPassword: "Forgot your password?",
          haveToken: "I already have a token",
          resetTitle: "Set a new password",
          resetDescription:
            "Enter the token received by email and choose the new password.",
          tokenLabel: "Token",
          newPassword: "New password",
          confirmPassword: "Confirm new password",
          resetSubmit: "Reset password",
          resetSuccess:
            "Password reset successfully. Sign in with your new password.",
          backToLogin: "Back to login",
          requestAccess: "Request token by email",
          mismatch: "Passwords do not match.",
          invalidToken: "The provided token is invalid or expired.",
          requestUnavailable:
            "Password recovery is not configured on the server."
        };
  }, [currentLanguage]);

  const handleChangeInput = event => {
    setUser(prevUser => ({
      ...prevUser,
      [event.target.name]: event.target.value.trim()
    }));
  };

  const handlSubmit = event => {
    event.preventDefault();
    handleLogin(user);
  };

  const handleResetRequestSubmit = async event => {
    event.preventDefault();
    setRequestInFlight(true);

    try {
      await openApi.post("/auth/request-password-reset", {
        email: resetRequestEmail.trim()
      });
      setRequestFeedbackVisible(true);
      toast.success(resetLabels.requestSuccess);
    } catch (err) {
      if (
        [
          "ERR_SMTP_NOT_CONFIGURED",
          "ERR_SMTP_FROM_NOT_CONFIGURED",
          "ERR_FRONTEND_URL_NOT_CONFIGURED"
        ].includes(err?.response?.data?.error)
      ) {
        toast.error(resetLabels.requestUnavailable);
      } else {
        toastError(err);
      }
    } finally {
      setRequestInFlight(false);
    }
  };

  const handleResetFormChange = event => {
    const { name, value } = event.target;
    setResetForm(prevState => ({
      ...prevState,
      [name]: name === "token" ? value.trim() : value
    }));
  };

  const handlePasswordResetSubmit = async event => {
    event.preventDefault();

    if (resetForm.password !== resetForm.confirmPassword) {
      toast.error(resetLabels.mismatch);
      return;
    }

    setResetInFlight(true);

    try {
      await openApi.post("/auth/reset-password", {
        token: resetForm.token.trim(),
        password: resetForm.password
      });
      toast.success(resetLabels.resetSuccess);
      history.push("/login");
      setForceTokenForm(false);
      setRequestFeedbackVisible(false);
      setResetForm({ token: "", password: "", confirmPassword: "" });
    } catch (err) {
      if (err?.response?.data?.error === "ERR_INVALID_PASSWORD_RESET_TOKEN") {
        toast.error(resetLabels.invalidToken);
      } else {
        toastError(err);
      }
    } finally {
      setResetInFlight(false);
    }
  };

  useEffect(() => {
    Promise.all([
      getPublicSetting("allowSignup"),
      getPublicSetting("loginPageLinks"),
      getPublicSetting("loginSidePanelImage"),
      getPublicSetting("loginBackgroundContent")
    ])
      .then(
        ([
          allowSignupValue,
          loginLinksValue,
          sidePanelImageValue,
          backgroundContentValue
        ]) => {
          setAllowSignup(allowSignupValue === "enabled");
          setLoginLinks(parseLoginLinks(loginLinksValue));
          setSidePanelImage(sidePanelImageValue || "");
          setBackgroundContent(backgroundContentValue || "");
        }
      )
      .catch(error => {
        console.log("Error reading setting", error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resetTokenFromUrl) {
      setForceTokenForm(true);
      setResetForm(prevState => ({
        ...prevState,
        token: resetTokenFromUrl
      }));
      return;
    }

    if (!isPasswordResetRoute) {
      setForceTokenForm(false);
      setRequestFeedbackVisible(false);
    }
  }, [isPasswordResetRoute, resetTokenFromUrl]);

  const backgroundAssetUrl = getPublicAssetUrl(backgroundContent);
  const sidePanelImageUrl = getPublicAssetUrl(sidePanelImage);
  const shouldRenderBackgroundVideo = isVideoFile(backgroundContent);
  const showSidePanelImage = !!sidePanelImageUrl;
  const isLightMode = theme.palette.type === "light";

  return (
    <div className={classes.root}>
      <CssBaseline />
      <IconButton
        className={classes.languageToggle}
        onClick={event => setLangMenuAnchor(event.currentTarget)}
        aria-label={i18n.t("mainDrawer.appBar.i18n.language")}
      >
        <LanguageIcon />
      </IconButton>
      <Popover
        className={classes.langMenu}
        open={Boolean(langMenuAnchor)}
        anchorEl={langMenuAnchor}
        onClose={() => setLangMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 180 }}
        PaperProps={{
          style: {
            marginTop: 6,
            overflow: "visible",
            background: "transparent",
            boxShadow: "none"
          }
        }}
        disableScrollLock
      >
        <Paper className={classes.langMenuPaper} elevation={4}>
          <MenuList>
            {Object.keys(messages).map(lang => (
              <MenuItem
                key={lang}
                onClick={() => handleChooseLanguage(lang)}
                selected={currentLanguage === lang}
                style={{
                  fontWeight: currentLanguage === lang ? "bold" : "normal"
                }}
              >
                {messages[lang].translations.mainDrawer.appBar.i18n.language}
              </MenuItem>
            ))}
          </MenuList>
        </Paper>
      </Popover>
      <IconButton
        className={classes.themeToggle}
        onClick={colorMode.toggleColorMode}
        aria-label={
          isLightMode ? "Switch to dark mode" : "Switch to light mode"
        }
      >
        {isLightMode ? <Brightness4Icon /> : <Brightness7Icon />}
      </IconButton>
      {shouldRenderBackgroundVideo ? (
        <video
          className={classes.backgroundVideo}
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={backgroundAssetUrl} />
        </video>
      ) : (
        <div
          className={`${classes.backgroundLayer}${backgroundAssetUrl ? ` ${classes.backgroundLayerImage}` : ""}`}
          style={
            backgroundAssetUrl
              ? { backgroundImage: `url("${backgroundAssetUrl}")` }
              : undefined
          }
        />
      )}
      <div className={classes.content}>
        <div
          className={classes.layout}
          style={!showSidePanelImage ? { maxWidth: 440 } : undefined}
        >
          <div
            className={classes.loginBox}
            style={!showSidePanelImage ? { maxWidth: 420 } : undefined}
          >
            {showSidePanelImage && (
              <div className={classes.mediaPane}>
                <img
                  className={classes.sidePanelImage}
                  src={sidePanelImageUrl}
                  alt={i18n.t("login.title")}
                />
              </div>
            )}
            <div className={classes.formColumn}>
              <div className={classes.formCardWrap}>
                <div className={classes.paper}>
                  <div>
                    <img
                      className={classes.logoImg}
                      alt={i18n.t("login.title")}
                    />
                  </div>
                  <Typography variant="h5" className={classes.formTitle}>
                    {isPasswordResetRoute
                      ? showResetPasswordForm
                        ? resetLabels.resetTitle
                        : resetLabels.requestTitle
                      : i18n.t("login.title")}
                  </Typography>
                  <Typography variant="body2" className={classes.formSubtitle}>
                    {isPasswordResetRoute
                      ? showResetPasswordForm
                        ? resetLabels.resetDescription
                        : resetLabels.requestDescription
                      : i18n.t("login.buttons.submit")}
                  </Typography>
                  {!isPasswordResetRoute && (
                    <form
                      className={classes.form}
                      noValidate
                      onSubmit={handlSubmit}
                    >
                      <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label={i18n.t("login.form.email")}
                        name="email"
                        value={user.email}
                        onChange={handleChangeInput}
                        autoComplete="email"
                        autoFocus
                      />
                      <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label={i18n.t("login.form.password")}
                        type="password"
                        id="password"
                        value={user.password}
                        onChange={handleChangeInput}
                        autoComplete="current-password"
                      />
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        className={classes.submit}
                      >
                        {i18n.t("login.buttons.submit")}
                      </Button>
                      <div className={classes.helperLinks}>
                        <Link
                          href="#"
                          variant="body2"
                          component={RouterLink}
                          to="/password-reset"
                        >
                          {resetLabels.forgotPassword}
                        </Link>
                        {allowSignup && (
                          <Link
                            href="#"
                            variant="body2"
                            component={RouterLink}
                            to="/signup"
                          >
                            {i18n.t("login.buttons.register")}
                          </Link>
                        )}
                      </div>
                    </form>
                  )}
                  {isPasswordResetRoute && !showResetPasswordForm && (
                    <form
                      className={classes.form}
                      noValidate
                      onSubmit={handleResetRequestSubmit}
                    >
                      <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="reset-email"
                        label={i18n.t("login.form.email")}
                        name="email"
                        value={resetRequestEmail}
                        onChange={event =>
                          setResetRequestEmail(event.target.value.trim())
                        }
                        autoComplete="email"
                        autoFocus
                      />
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        className={classes.submit}
                        disabled={requestInFlight}
                      >
                        {resetLabels.requestSubmit}
                      </Button>
                      {requestFeedbackVisible && (
                        <div className={classes.feedbackBox}>
                          <Typography variant="body2">
                            {resetLabels.requestSuccess}
                          </Typography>
                        </div>
                      )}
                      <div className={classes.helperLinks}>
                        <Link
                          href="#"
                          variant="body2"
                          component={RouterLink}
                          to="/login"
                        >
                          {resetLabels.backToLogin}
                        </Link>
                        <Link
                          href="#"
                          variant="body2"
                          onClick={event => {
                            event.preventDefault();
                            setForceTokenForm(true);
                          }}
                        >
                          {resetLabels.haveToken}
                        </Link>
                      </div>
                    </form>
                  )}
                  {showResetPasswordForm && (
                    <form
                      className={classes.form}
                      noValidate
                      onSubmit={handlePasswordResetSubmit}
                    >
                      <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="reset-token"
                        label={resetLabels.tokenLabel}
                        name="token"
                        value={resetForm.token}
                        onChange={handleResetFormChange}
                        autoFocus={!resetTokenFromUrl}
                      />
                      <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label={resetLabels.newPassword}
                        type="password"
                        id="reset-password"
                        value={resetForm.password}
                        onChange={handleResetFormChange}
                        autoComplete="new-password"
                      />
                      <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        name="confirmPassword"
                        label={resetLabels.confirmPassword}
                        type="password"
                        id="reset-confirm-password"
                        value={resetForm.confirmPassword}
                        onChange={handleResetFormChange}
                        autoComplete="new-password"
                      />
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        className={classes.submit}
                        disabled={resetInFlight}
                      >
                        {resetLabels.resetSubmit}
                      </Button>
                      <div className={classes.helperLinks}>
                        <Link
                          href="#"
                          variant="body2"
                          component={RouterLink}
                          to="/password-reset"
                          onClick={() => setForceTokenForm(false)}
                        >
                          {resetLabels.requestAccess}
                        </Link>
                        <Link
                          href="#"
                          variant="body2"
                          component={RouterLink}
                          to="/login"
                        >
                          {resetLabels.backToLogin}
                        </Link>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
          {loginLinks.length > 0 && (
            <div className={classes.linksContainer}>
              {loginLinks.map((link, index) => (
                <a
                  className={classes.footerLink}
                  href={link.url}
                  key={`${link.url}-${index}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.title}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      <Typography className={classes.versionInfo}>
        {`${gitinfo.tagName || `${gitinfo.branchName || "N/A"} ${gitinfo.commitHash || "N/A"}`}`}
        {" / "}
        {`${gitinfo.buildTimestamp || "N/A"}`}
      </Typography>
    </div>
  );
};

export default Login;
