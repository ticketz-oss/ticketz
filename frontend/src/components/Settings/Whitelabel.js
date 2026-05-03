/*

   DO NOT REMOVE / NÃO REMOVER

   VERSÃO EM PORTUGUÊS MAIS ABAIXO

   
   BASIC LICENSE INFORMATION:

   Author: Claudemir Todo Bom
   Email: claudemir@todobom.com
   
   Licensed under the AGPLv3 as stated on LICENSE.md file
   
   Any work that uses code from this file is obligated to 
   give access to its source code to all of its users (not only
   the system's owner running it)
   
   EXCLUSIVE LICENSE to use on closed source derived work can be
   purchased from the author and put at the root of the source
   code tree as proof-of-purchase.



   INFORMAÇÕES BÁSICAS DE LICENÇA

   Autor: Claudemir Todo Bom
   Email: claudemir@todobom.com

   Licenciado sob a licença AGPLv3 conforme arquivo LICENSE.md
    
   Qualquer sistema que inclua este código deve ter o seu código
   fonte fornecido a todos os usuários do sistema (não apenas ao
   proprietário da infraestrutura que o executa)
   
   LICENÇA EXCLUSIVA para uso em produto derivado em código fechado
   pode ser adquirida com o autor e colocada na raiz do projeto
   como prova de compra. 
   
 */

import React, { useContext, useEffect, useRef, useState } from "react";

import Grid from "@material-ui/core/Grid";
import FormControl from "@material-ui/core/FormControl";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core/styles";
import OnlyForSuperUser from "../OnlyForSuperUser";
import useAuth from "../../hooks/useAuth.js";
import useSettings from "../../hooks/useSettings";

import { IconButton, InputAdornment, Typography } from "@material-ui/core";

import { Colorize, AttachFile, Delete } from "@material-ui/icons";
import ColorPicker from "../ColorPicker";
import ColorModeContext from "../../layout/themeContext";
import api from "../../services/api";
import { getBackendURL } from "../../services/config";
import { i18nToast } from "../../helpers/i18nToast";
import { i18n } from "../../translate/i18n.js";

const defaultLogoLight = "/vector/logo.svg";
const defaultLogoDark = "/vector/logo-dark.svg";
const defaultLogoFavicon = "/vector/favicon.svg";
const LOGIN_LINKS_KEY = "loginPageLinks";
const LOGIN_SIDE_PANEL_IMAGE_KEY = "loginSidePanelImage";
const LOGIN_BACKGROUND_CONTENT_KEY = "loginBackgroundContent";

const createEmptyLink = () => ({ title: "", url: "" });

const parseLinksSetting = value => {
  if (!value) {
    return [createEmptyLink()];
  }

  try {
    const parsedValue = JSON.parse(value);

    if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
      return [createEmptyLink()];
    }

    return parsedValue.map(link => ({
      title: typeof link?.title === "string" ? link.title : "",
      url: typeof link?.url === "string" ? link.url : ""
    }));
  } catch (error) {
    return [createEmptyLink()];
  }
};

const serializeLinksSetting = links =>
  JSON.stringify(
    links
      .map(link => ({
        title: link.title.trim(),
        url: link.url.trim()
      }))
      .filter(link => link.title && link.url)
  );

const isVideoFile = (filename = "") => /\.(mp4|webm|ogg)$/i.test(filename);

const getPublicFileUrl = filename => {
  if (!filename) {
    return "";
  }

  return `${getBackendURL()}/public/${filename}`;
};

const useStyles = makeStyles(theme => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4)
  },
  selectContainer: {
    width: "100%",
    textAlign: "left"
  },
  colorAdorment: {
    width: 20,
    height: 20
  },
  uploadInput: {
    display: "none"
  },
  helperText: {
    fontSize: "11px"
  },
  sectionTitle: {
    fontWeight: 600
  },
  sectionDescription: {
    opacity: 0.75
  },
  linkRow: {
    marginBottom: theme.spacing(1)
  },
  linkActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing(2),
    marginTop: theme.spacing(2),
    [theme.breakpoints.down("xs")]: {
      flexDirection: "column",
      alignItems: "stretch"
    }
  },
  linksActionsGroup: {
    display: "flex",
    gap: theme.spacing(1),
    [theme.breakpoints.down("xs")]: {
      flexDirection: "column"
    }
  },
  previewBox: {
    minHeight: 180,
    height: "100%",
    borderRadius: 12,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.default,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(2)
  },
  previewContent: {
    width: "100%",
    height: "100%",
    objectFit: "contain"
  },
  previewContentCover: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  emptyPreview: {
    opacity: 0.6
  },
  appLogoLightPreviewDiv: {
    backgroundColor: "white",
    padding: "10px",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#424242",
    textAlign: "center"
  },

  appLogoDarkPreviewDiv: {
    backgroundColor: "#424242",
    padding: "10px",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "white",
    textAlign: "center"
  },

  appLogoFaviconPreviewDiv: {
    padding: "10px",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "black",
    textAlign: "center"
  },

  appLogoLightPreviewImg: {
    width: "100%",
    maxHeight: 72,
    content: `url("${theme.calculatedLogoLight()}")`
  },
  appLogoDarkPreviewImg: {
    width: "100%",
    maxHeight: 72,
    content: `url("${theme.calculatedLogoDark()}")`
  },
  appLogoFaviconPreviewImg: {
    width: "100%",
    maxHeight: 72,
    content: `url("${theme.appLogoFavicon ? theme.appLogoFavicon : "/vector/favicon.svg"}")`
  }
}));

export default function Whitelabel(props) {
  const { settings } = props;
  const classes = useStyles();
  const [settingsLoaded, setSettingsLoaded] = useState({});
  const [loginLinks, setLoginLinks] = useState([createEmptyLink()]);

  const { getCurrentUserInfo } = useAuth();
  const [currentUser, setCurrentUser] = useState({});

  const { colorMode } = useContext(ColorModeContext);
  const [primaryColorLightModalOpen, setPrimaryColorLightModalOpen] =
    useState(false);
  const [primaryColorDarkModalOpen, setPrimaryColorDarkModalOpen] =
    useState(false);

  const logoLightInput = useRef(null);
  const logoDarkInput = useRef(null);
  const logoFaviconInput = useRef(null);
  const loginSidePanelImageInput = useRef(null);
  const loginBackgroundContentInput = useRef(null);
  const [appName, setAppName] = useState("");

  const { update } = useSettings();

  useEffect(() => {
    getCurrentUserInfo().then(user => {
      setCurrentUser(user);
    });
  }, [getCurrentUserInfo]);

  useEffect(() => {
    if (!Array.isArray(settings) || settings.length === 0) {
      return;
    }

    const primaryColorLight = settings.find(
      setting => setting.key === "primaryColorLight"
    )?.value;
    const primaryColorDark = settings.find(
      setting => setting.key === "primaryColorDark"
    )?.value;
    const appLogoLight = settings.find(
      setting => setting.key === "appLogoLight"
    )?.value;
    const appLogoDark = settings.find(
      setting => setting.key === "appLogoDark"
    )?.value;
    const appLogoFavicon = settings.find(
      setting => setting.key === "appLogoFavicon"
    )?.value;
    const loadedAppName = settings.find(
      setting => setting.key === "appName"
    )?.value;
    const loadedLoginLinks = settings.find(
      setting => setting.key === LOGIN_LINKS_KEY
    )?.value;
    const loginSidePanelImage = settings.find(
      setting => setting.key === LOGIN_SIDE_PANEL_IMAGE_KEY
    )?.value;
    const loginBackgroundContent = settings.find(
      setting => setting.key === LOGIN_BACKGROUND_CONTENT_KEY
    )?.value;

    setAppName(loadedAppName || "");
    setLoginLinks(parseLinksSetting(loadedLoginLinks));
    setSettingsLoaded({
      primaryColorLight,
      primaryColorDark,
      appLogoLight,
      appLogoDark,
      appLogoFavicon,
      appName: loadedAppName,
      loginPageLinks: loadedLoginLinks,
      loginSidePanelImage,
      loginBackgroundContent
    });
  }, [settings]);

  const updateSettingsLoaded = (key, value) => {
    setSettingsLoaded(currentSettings => ({
      ...currentSettings,
      [key]: value
    }));
  };

  const handleSaveSetting = async (key, value) => {
    await update({
      key,
      value
    });
    updateSettingsLoaded(key, value);
    i18nToast.success("settings.success");
  };

  const uploadLogo = async (event, mode) => {
    if (!event.target.files) {
      return;
    }

    const file = event.target.files[0];
    const formData = new FormData();

    formData.append("file", file);
    formData.append("mode", mode);

    api
      .post("/settings/logo", formData, {
        onUploadProgress: progressEvent => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`A imagem está ${progress}% carregada... `);
        }
      })
      .then(response => {
        updateSettingsLoaded(`appLogo${mode}`, response.data);
        colorMode[`setAppLogo${mode}`](
          `${getBackendURL()}/public/${response.data}`
        );
        i18nToast.success("settings.success");
      })
      .catch(error => {
        console.error("Houve um problema ao realizar o upload da imagem.");
        console.log(error);
      })
      .finally(() => {
        event.target.value = "";
      });
  };

  const uploadPublicFile = async (event, settingKey) => {
    if (!event.target.files) {
      return;
    }

    const file = event.target.files[0];
    const formData = new FormData();

    formData.append("file", file);
    formData.append("settingKey", settingKey);

    api
      .post("/settings/publicFile", formData, {
        onUploadProgress: progressEvent => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`O arquivo está ${progress}% carregado... `);
        }
      })
      .then(response => {
        updateSettingsLoaded(settingKey, response.data);
        i18nToast.success("settings.success");
      })
      .catch(error => {
        console.error("Houve um problema ao realizar o upload do arquivo.");
        console.log(error);
      })
      .finally(() => {
        event.target.value = "";
      });
  };

  const handleLinkChange = (index, field, value) => {
    setLoginLinks(currentLinks =>
      currentLinks.map((link, linkIndex) =>
        linkIndex === index ? { ...link, [field]: value } : link
      )
    );
  };

  const handleAddLink = () => {
    setLoginLinks(currentLinks => [...currentLinks, createEmptyLink()]);
  };

  const handleRemoveLink = index => {
    setLoginLinks(currentLinks => {
      if (currentLinks.length === 1) {
        return [createEmptyLink()];
      }

      return currentLinks.filter((_, linkIndex) => linkIndex !== index);
    });
  };

  const handleSaveLinks = async () => {
    const serializedLinks = serializeLinksSetting(loginLinks);

    await handleSaveSetting(LOGIN_LINKS_KEY, serializedLinks);
    setLoginLinks(parseLinksSetting(serializedLinks));
  };

  const renderMediaPreview = (filename, previewMode = "contain") => {
    if (!filename) {
      return (
        <div className={classes.emptyPreview}>
          <Typography variant="body2" color="textSecondary">
            {i18n.t("whitelabel.noFileSelected")}
          </Typography>
        </div>
      );
    }

    const fileUrl = getPublicFileUrl(filename);
    const previewClassName =
      previewMode === "cover"
        ? classes.previewContentCover
        : classes.previewContent;

    if (isVideoFile(filename)) {
      return (
        <video className={previewClassName} controls muted playsInline>
          <source src={fileUrl} />
        </video>
      );
    }

    return <img className={previewClassName} src={fileUrl} alt={filename} />;
  };

  return (
    <>
      <Grid spacing={3} container>
        <OnlyForSuperUser
          user={currentUser}
          yes={() => (
            <>
              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="primary-color-light-field"
                    label={i18n.t("whitelabel.primaryColorLight")}
                    variant="standard"
                    value={settingsLoaded.primaryColorLight || ""}
                    onClick={() => setPrimaryColorLightModalOpen(true)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <div
                            style={{
                              backgroundColor: settingsLoaded.primaryColorLight
                            }}
                            className={classes.colorAdorment}
                          />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <IconButton
                          size="small"
                          color="default"
                          onClick={() => setPrimaryColorLightModalOpen(true)}
                        >
                          <Colorize />
                        </IconButton>
                      )
                    }}
                  />
                </FormControl>
                <ColorPicker
                  open={primaryColorLightModalOpen}
                  handleClose={() => setPrimaryColorDarkModalOpen(false)}
                  onChange={color => {
                    setPrimaryColorLightModalOpen(false);
                    handleSaveSetting("primaryColorLight", color);
                    colorMode.setPrimaryColorLight(color);
                  }}
                />
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="primary-color-dark-field"
                    label={i18n.t("whitelabel.primaryColorDark")}
                    variant="standard"
                    value={settingsLoaded.primaryColorDark || ""}
                    onClick={() => setPrimaryColorDarkModalOpen(true)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <div
                            style={{
                              backgroundColor: settingsLoaded.primaryColorDark
                            }}
                            className={classes.colorAdorment}
                          />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <IconButton
                          size="small"
                          color="default"
                          onClick={() => setPrimaryColorDarkModalOpen(true)}
                        >
                          <Colorize />
                        </IconButton>
                      )
                    }}
                  />
                </FormControl>
                <ColorPicker
                  open={primaryColorDarkModalOpen}
                  handleClose={() => setPrimaryColorDarkModalOpen(false)}
                  onChange={color => {
                    setPrimaryColorDarkModalOpen(false);
                    handleSaveSetting("primaryColorDark", color);
                    colorMode.setPrimaryColorDark(color);
                  }}
                />
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="appname-field"
                    label={i18n.t("whitelabel.appname")}
                    variant="standard"
                    name="appName"
                    value={appName}
                    onChange={event => {
                      setAppName(event.target.value);
                    }}
                    onBlur={async () => {
                      await handleSaveSetting("appName", appName);
                      colorMode.setAppName(appName || "ticketz");
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="logo-light-upload-field"
                    label={i18n.t("whitelabel.lightLogo")}
                    variant="standard"
                    value={settingsLoaded.appLogoLight || ""}
                    InputProps={{
                      endAdornment: (
                        <>
                          {settingsLoaded.appLogoLight && (
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => {
                                handleSaveSetting("appLogoLight", "");
                                colorMode.setAppLogoLight(defaultLogoLight);
                              }}
                            >
                              <Delete />
                            </IconButton>
                          )}
                          <input
                            type="file"
                            id="upload-logo-light-button"
                            ref={logoLightInput}
                            className={classes.uploadInput}
                            onChange={event => uploadLogo(event, "Light")}
                          />
                          <label htmlFor="upload-logo-light-button">
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => {
                                logoLightInput.current.click();
                              }}
                            >
                              <AttachFile />
                            </IconButton>
                          </label>
                        </>
                      )
                    }}
                  />
                </FormControl>
                <Typography className={classes.helperText}>
                  {i18n.t("whitelabel.logoHint")}
                </Typography>
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="logo-dark-upload-field"
                    label={i18n.t("whitelabel.darkLogo")}
                    variant="standard"
                    value={settingsLoaded.appLogoDark || ""}
                    InputProps={{
                      endAdornment: (
                        <>
                          {settingsLoaded.appLogoDark && (
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => {
                                handleSaveSetting("appLogoDark", "");
                                colorMode.setAppLogoDark(defaultLogoDark);
                              }}
                            >
                              <Delete />
                            </IconButton>
                          )}
                          <input
                            type="file"
                            id="upload-logo-dark-button"
                            ref={logoDarkInput}
                            className={classes.uploadInput}
                            onChange={event => uploadLogo(event, "Dark")}
                          />
                          <label htmlFor="upload-logo-dark-button">
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => {
                                logoDarkInput.current.click();
                              }}
                            >
                              <AttachFile />
                            </IconButton>
                          </label>
                        </>
                      )
                    }}
                  />
                </FormControl>
                <Typography className={classes.helperText}>
                  {i18n.t("whitelabel.logoHint")}
                </Typography>
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="logo-favicon-upload-field"
                    label={i18n.t("whitelabel.favicon")}
                    variant="standard"
                    value={settingsLoaded.appLogoFavicon || ""}
                    InputProps={{
                      endAdornment: (
                        <>
                          {settingsLoaded.appLogoFavicon && (
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => {
                                handleSaveSetting("appLogoFavicon", "");
                                colorMode.setAppLogoFavicon(defaultLogoFavicon);
                              }}
                            >
                              <Delete />
                            </IconButton>
                          )}
                          <input
                            type="file"
                            id="upload-logo-favicon-button"
                            ref={logoFaviconInput}
                            className={classes.uploadInput}
                            onChange={event => uploadLogo(event, "Favicon")}
                          />
                          <label htmlFor="upload-logo-favicon-button">
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => {
                                logoFaviconInput.current.click();
                              }}
                            >
                              <AttachFile />
                            </IconButton>
                          </label>
                        </>
                      )
                    }}
                  />
                </FormControl>
                <Typography className={classes.helperText}>
                  {i18n.t("whitelabel.faviconHint")}
                </Typography>
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <div className={classes.appLogoLightPreviewDiv}>
                  <img
                    className={classes.appLogoLightPreviewImg}
                    alt="light-logo-preview"
                  />
                </div>
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <div className={classes.appLogoDarkPreviewDiv}>
                  <img
                    className={classes.appLogoDarkPreviewImg}
                    alt="dark-logo-preview"
                  />
                </div>
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <div className={classes.appLogoFaviconPreviewDiv}>
                  <img
                    className={classes.appLogoFaviconPreviewImg}
                    alt="favicon-preview"
                  />
                </div>
              </Grid>
              <Grid xs={12} item>
                <Typography
                  className={classes.sectionTitle}
                  variant="subtitle1"
                >
                  {i18n.t("whitelabel.loginLinks")}
                </Typography>
                <Typography
                  className={classes.sectionDescription}
                  variant="body2"
                >
                  {i18n.t("whitelabel.loginLinksHint")}
                </Typography>
              </Grid>
              {loginLinks.map((link, index) => (
                <Grid
                  className={classes.linkRow}
                  xs={12}
                  item
                  key={`login-link-${index}`}
                >
                  <Grid container spacing={2} alignItems="flex-end">
                    <Grid xs={12} md={4} item>
                      <TextField
                        fullWidth
                        variant="outlined"
                        label={i18n.t("whitelabel.linkTitle")}
                        value={link.title}
                        onChange={event =>
                          handleLinkChange(index, "title", event.target.value)
                        }
                      />
                    </Grid>
                    <Grid xs={12} md={7} item>
                      <TextField
                        fullWidth
                        variant="outlined"
                        label={i18n.t("whitelabel.linkUrl")}
                        value={link.url}
                        onChange={event =>
                          handleLinkChange(index, "url", event.target.value)
                        }
                      />
                    </Grid>
                    <Grid xs={12} md={1} item>
                      <IconButton
                        aria-label={i18n.t("whitelabel.removeLink")}
                        onClick={() => handleRemoveLink(index)}
                      >
                        <Delete />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Grid>
              ))}
              <Grid xs={12} item>
                <div className={classes.linkActions}>
                  <div className={classes.linksActionsGroup}>
                    <Button
                      color="primary"
                      variant="outlined"
                      onClick={handleAddLink}
                    >
                      {i18n.t("common.add")}
                    </Button>
                    <Button
                      color="primary"
                      variant="contained"
                      onClick={handleSaveLinks}
                    >
                      {i18n.t("common.save")}
                    </Button>
                  </div>
                </div>
              </Grid>
              <Grid xs={12} md={6} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="login-sidepanel-image-upload-field"
                    label={i18n.t("whitelabel.sidePanelImage")}
                    variant="standard"
                    value={settingsLoaded.loginSidePanelImage || ""}
                    InputProps={{
                      endAdornment: (
                        <>
                          {settingsLoaded.loginSidePanelImage && (
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() =>
                                handleSaveSetting(
                                  LOGIN_SIDE_PANEL_IMAGE_KEY,
                                  ""
                                )
                              }
                            >
                              <Delete />
                            </IconButton>
                          )}
                          <input
                            type="file"
                            id="upload-login-sidepanel-image-button"
                            ref={loginSidePanelImageInput}
                            className={classes.uploadInput}
                            accept="image/*"
                            onChange={event =>
                              uploadPublicFile(
                                event,
                                LOGIN_SIDE_PANEL_IMAGE_KEY
                              )
                            }
                          />
                          <label htmlFor="upload-login-sidepanel-image-button">
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => {
                                loginSidePanelImageInput.current.click();
                              }}
                            >
                              <AttachFile />
                            </IconButton>
                          </label>
                        </>
                      )
                    }}
                  />
                </FormControl>
                <Typography className={classes.helperText}>
                  {i18n.t("whitelabel.sidePanelImageHint")}
                </Typography>
              </Grid>
              <Grid xs={12} md={6} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="login-background-content-upload-field"
                    label={i18n.t("whitelabel.backgroundContent")}
                    variant="standard"
                    value={settingsLoaded.loginBackgroundContent || ""}
                    InputProps={{
                      endAdornment: (
                        <>
                          {settingsLoaded.loginBackgroundContent && (
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() =>
                                handleSaveSetting(
                                  LOGIN_BACKGROUND_CONTENT_KEY,
                                  ""
                                )
                              }
                            >
                              <Delete />
                            </IconButton>
                          )}
                          <input
                            type="file"
                            id="upload-login-background-content-button"
                            ref={loginBackgroundContentInput}
                            className={classes.uploadInput}
                            accept="image/*,video/mp4,video/webm,video/ogg"
                            onChange={event =>
                              uploadPublicFile(
                                event,
                                LOGIN_BACKGROUND_CONTENT_KEY
                              )
                            }
                          />
                          <label htmlFor="upload-login-background-content-button">
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => {
                                loginBackgroundContentInput.current.click();
                              }}
                            >
                              <AttachFile />
                            </IconButton>
                          </label>
                        </>
                      )
                    }}
                  />
                </FormControl>
                <Typography className={classes.helperText}>
                  {i18n.t("whitelabel.backgroundContentHint")}
                </Typography>
              </Grid>
              <Grid xs={12} md={6} item>
                <div className={classes.previewBox}>
                  {renderMediaPreview(settingsLoaded.loginSidePanelImage)}
                </div>
              </Grid>
              <Grid xs={12} md={6} item>
                <div className={classes.previewBox}>
                  {renderMediaPreview(
                    settingsLoaded.loginBackgroundContent,
                    "cover"
                  )}
                </div>
              </Grid>
            </>
          )}
        />
      </Grid>
    </>
  );
}
