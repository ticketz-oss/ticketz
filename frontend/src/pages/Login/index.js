import React, { useContext, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
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

import { i18n } from "../../translate/i18n";
import { messages } from "../../translate/languages";

import { AuthContext } from "../../context/Auth/AuthContext";
import useSettings from "../../hooks/useSettings";
import { getBackendURL } from "../../services/config";
import ColorModeContext from "../../layout/themeContext";
import { loadJSON } from "../../helpers/loadJSON";

const gitinfo = loadJSON("/gitinfo.json");

const parseLoginLinks = (value) => {
  if (!value) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(value);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      (link) =>
        typeof link?.title === "string" && typeof link?.url === "string",
    );
  } catch (error) {
    return [];
  }
};

const isVideoFile = (filename = "") => /\.(mp4|webm|ogg)$/i.test(filename);

const getPublicAssetUrl = (filename) => {
  if (!filename) {
    return "";
  }

  return `${getBackendURL()}/public/${filename}`;
};

const useStyles = makeStyles((theme) => ({
  root: {
    position: "fixed",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
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
      animation: "none",
    },
  },
  backgroundLayerImage: {
    position: "absolute",
    inset: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
    animation: "none",
    willChange: "auto",
  },
  backgroundVideo: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
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
      padding: theme.spacing(1.5),
    },
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
          : "rgba(10,18,31,0.68)",
    },
    [theme.breakpoints.down("xs")]: {
      top: theme.spacing(1),
      right: theme.spacing(1),
    },
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
          : "rgba(10,18,31,0.68)",
    },
    [theme.breakpoints.down("xs")]: {
      top: theme.spacing(1),
      right: theme.spacing(7),
    },
  },
  langMenu: {
    zIndex: 3,
  },
  langMenuPaper: {
    minWidth: 160,
    borderRadius: theme.spacing(1),
    overflow: "hidden",
    transformOrigin: "top center",
    transition: "transform 180ms ease, opacity 180ms ease",
  },
  layout: {
    width: "100%",
    maxWidth: 980,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      maxWidth: 440,
    },
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
      maxWidth: 420,
    },
  },
  mediaPane: {
    position: "relative",
    flex: "0 0 clamp(280px, 34vw, 360px)",
    alignSelf: "stretch",
    minHeight: 0,
    overflow: "hidden",
    backgroundColor: theme.palette.background.default,
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  sidePanelImage: {
    position: "absolute",
    inset: 0,
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  formColumn: {
    flex: "0 0 420px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      width: "100%",
    },
  },
  formCardWrap: {
    width: "100%",
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
      borderRadius: 16,
    },
    [theme.breakpoints.down("sm")]: {
      borderRadius: 24,
    },
  },
  form: {
    width: "100%",
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(2, 0, 1),
  },
  logoImg: {
    width: "100%",
    maxWidth: 200,
    margin: "0 auto 8px",
    content: `url("${theme.calculatedLogo()}")`,
  },
  linksContainer: {
    width: "100%",
    maxWidth: 980,
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: theme.spacing(1),
    [theme.breakpoints.down("sm")]: {
      maxWidth: 420,
    },
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
      textDecoration: "none",
    },
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
      fontSize: "11px",
    },
  },
  "@keyframes gradientDrift": {
    "0%": {
      backgroundPosition: "0% 50%",
    },
    "50%": {
      backgroundPosition: "100% 50%",
    },
    "100%": {
      backgroundPosition: "0% 50%",
    },
  },
}));

const Login = () => {
  const classes = useStyles();
  const theme = useTheme();
  const { getPublicSetting } = useSettings();
  const { colorMode } = useContext(ColorModeContext);

  const [langMenuAnchor, setLangMenuAnchor] = useState(null);
  const currentLanguage =
    localStorage.getItem("language") || i18n.language || "en";

  const handleChooseLanguage = (lang) => {
    setLangMenuAnchor(null);
    localStorage.setItem("language", lang);
    window.location.reload(false);
  };

  const [user, setUser] = useState({ email: "", password: "" });
  const [allowSignup, setAllowSignup] = useState(false);
  const [loginLinks, setLoginLinks] = useState([]);
  const [sidePanelImage, setSidePanelImage] = useState("");
  const [backgroundContent, setBackgroundContent] = useState("");

  const { handleLogin } = useContext(AuthContext);

  const handleChangeInput = (event) => {
    setUser((prevUser) => ({
      ...prevUser,
      [event.target.name]: event.target.value.trim(),
    }));
  };

  const handlSubmit = (event) => {
    event.preventDefault();
    handleLogin(user);
  };

  useEffect(() => {
    Promise.all([
      getPublicSetting("allowSignup"),
      getPublicSetting("loginPageLinks"),
      getPublicSetting("loginSidePanelImage"),
      getPublicSetting("loginBackgroundContent"),
    ])
      .then(
        ([
          allowSignupValue,
          loginLinksValue,
          sidePanelImageValue,
          backgroundContentValue,
        ]) => {
          setAllowSignup(allowSignupValue === "enabled");
          setLoginLinks(parseLoginLinks(loginLinksValue));
          setSidePanelImage(sidePanelImageValue || "");
          setBackgroundContent(backgroundContentValue || "");
        },
      )
      .catch((error) => {
        console.log("Error reading setting", error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        onClick={(event) => setLangMenuAnchor(event.currentTarget)}
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
            boxShadow: "none",
          },
        }}
        disableScrollLock
      >
        <Paper className={classes.langMenuPaper} elevation={4}>
          <MenuList>
            {Object.keys(messages).map((lang) => (
              <MenuItem
                key={lang}
                onClick={() => handleChooseLanguage(lang)}
                selected={currentLanguage === lang}
                style={{
                  fontWeight: currentLanguage === lang ? "bold" : "normal",
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
                    {allowSignup && (
                      <Grid container>
                        <Grid item>
                          <Link
                            href="#"
                            variant="body2"
                            component={RouterLink}
                            to="/signup"
                          >
                            {i18n.t("login.buttons.register")}
                          </Link>
                        </Grid>
                      </Grid>
                    )}
                  </form>
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
