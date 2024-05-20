import React, { useEffect, useState, useContext, useRef } from "react";

import Grid from "@material-ui/core/Grid";
import FormControl from "@material-ui/core/FormControl";
import TextField from "@material-ui/core/TextField";
import useSettings from "../../hooks/useSettings";
import { toast } from 'react-toastify';
import { makeStyles } from "@material-ui/core/styles";
import { grey, blue } from "@material-ui/core/colors";
import OnlyForSuperUser from "../OnlyForSuperUser";
import useAuth from "../../hooks/useAuth.js";

import {
  IconButton,
  InputAdornment,
} from "@material-ui/core";

import { Colorize, AttachFile, Delete } from "@material-ui/icons";
import ColorPicker from "../ColorPicker";
import ColorModeContext from "../../layout/themeContext";
import api from "../../services/api";
import { getBackendURL } from "../../services/config";

const logo = "/vector/logo.svg";
const logoDark = "/vector/logo-dark.svg";
const logoFavicon = "/vector/favicon.svg";

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: 240,
  },
  tab: {
    borderRadius: 4,
    width: "100%",
    "& .MuiTab-wrapper": {
      color: "#128c7e"
    },
    "& .MuiTabs-flexContainer": {
      justifyContent: "center"
    }


  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  cardAvatar: {
    fontSize: "55px",
    color: grey[500],
    backgroundColor: "#ffffff",
    width: theme.spacing(7),
    height: theme.spacing(7),
  },
  cardTitle: {
    fontSize: "18px",
    color: blue[700],
  },
  cardSubtitle: {
    color: grey[600],
    fontSize: "14px",
  },
  alignRight: {
    textAlign: "right",
  },
  fullWidth: {
    width: "100%",
  },
  selectContainer: {
    width: "100%",
    textAlign: "left",
  },
  colorAdorment: {
    width: 20,
    height: 20,
  },
  
  uploadInput: {
    display: "none",
  },

  appLogoLightPreviewDiv: {
    backgroundColor: "white",
    padding: "10px",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#424242",
    textAlign: "center",
  },
  
  appLogoDarkPreviewDiv: {
    backgroundColor: "#424242",
    padding: "10px",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "white",
    textAlign: "center",
  },
  
  appLogoFaviconPreviewDiv: {
    padding: "10px",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "black",
    textAlign: "center",
  },
  
  appLogoLightPreviewImg: {
    width: "100%",
    maxHeight: 72,
    content: "url(" + ((theme.appLogoLight || theme.appLogoDark) ? getBackendURL()+"/public/"+ (theme.appLogoLight || theme.appLogoDark) : logo ) + ")"
  },
  
  appLogoDarkPreviewImg: {
    width: "100%",
    maxHeight: 72,
    content: "url(" + ((theme.appLogoLight || theme.appLogoDark) ? getBackendURL()+"/public/"+ (theme.appLogoDark || theme.appLogoLight) : logoDark ) + ")"
  },

  appLogoFaviconPreviewImg: {
    width: "100%",
    maxHeight: 72,
    content: "url(" + ((theme.appLogoFavicon) ? getBackendURL()+"/public/" + theme.appLogoFavicon : logoFavicon ) + ")"
  }
}));

export default function Whitelabel(props) {
  const { settings } = props;
  const classes = useStyles();
  const [settingsLoaded, setSettingsLoaded] = useState({});

  const { getCurrentUserInfo } = useAuth();
  const [currentUser, setCurrentUser] = useState({});

  const { colorMode } = useContext(ColorModeContext);
  const [primaryColorLightModalOpen, setPrimaryColorLightModalOpen] = useState(false);
  const [primaryColorDarkModalOpen, setPrimaryColorDarkModalOpen] = useState(false);

  const logoLightInput = useRef(null);
  const logoDarkInput = useRef(null);
  const logoFaviconInput = useRef(null);
  const appNameInput = useRef(null);
  const [appName, setAppName] = useState(settingsLoaded.appName || "");

  const { update } = useSettings();

  function updateSettingsLoaded(key, value) {
    const newSettings = { ...settingsLoaded };
    newSettings[key] = value;
    setSettingsLoaded(newSettings);
    console.debug(key, value, newSettings, settingsLoaded);
  }

  useEffect(() => {
    getCurrentUserInfo().then(
      (u) => {
        setCurrentUser(u);
      }
    );

    console.debug("settings", settings);

    if (Array.isArray(settings) && settings.length) {
      const primaryColorLight = settings.find((s) => s.key === "primaryColorLight")?.value;
      const primaryColorDark = settings.find((s) => s.key === "primaryColorDark")?.value;
      const appLogoLight = settings.find((s) => s.key === "appLogoLight")?.value;
      const appLogoDark = settings.find((s) => s.key === "appLogoDark")?.value;
      const appLogoFavicon = settings.find((s) => s.key === "appLogoFavicon")?.value;
      const appName = settings.find((s) => s.key === "appName")?.value;
      setAppName(appName || "");
      setSettingsLoaded( { ...settingsLoaded , primaryColorLight, primaryColorDark, appLogoLight, appLogoDark, appLogoFavicon, appName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  async function handleSaveSetting(key, value) {
    await update({
      key,
      value,
    });
    updateSettingsLoaded(key, value);
    toast.success("Operação atualizada com sucesso.");
  }

  const uploadLogo = async (e, mode) => {
    if (!e.target.files) {
      return;
    }
    
    const file = e.target.files[0];
    const formData = new FormData();
    
    formData.append("file", file);
    formData.append("mode", mode);
    
    api.post("/settings/logo", formData, {
      onUploadProgress: (event) => {
        let progress = Math.round(
          (event.loaded * 100) / event.total
        );
        console.log(
          `A imagem  está ${progress}% carregada... `
        );
      },
    }).then((response) => {
      updateSettingsLoaded(`appLogo${mode}`, response.data);
      colorMode[`setAppLogo${mode}`](response.data);
    }).catch((err) => {
      console.error(
        `Houve um problema ao realizar o upload da imagem.`
      );
      console.log(err);
    });
  };

  return (
    <>
      <Grid spacing={3} container>
        {/* <Grid xs={12} item>
                    <Title>Configurações Gerais</Title>
                </Grid> */}
        <OnlyForSuperUser
          user={currentUser}
          yes={() => (
            <>
              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="primary-color-light-field"
                    label="Cor Primária Modo Claro"
                    variant="standard"
                    value={settingsLoaded.primaryColorLight || ""}
                    onClick={() => setPrimaryColorLightModalOpen(true)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <div
                            style={{ backgroundColor: settingsLoaded.primaryColorLight }}
                            className={classes.colorAdorment}
                          ></div>
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
                      ),
                    }}
                  />
                </FormControl>
                <ColorPicker
                  open={primaryColorLightModalOpen}
                  handleClose={() => setPrimaryColorDarkModalOpen(false)}
                  onChange={(color) => {
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
                    label="Cor Primária Modo Escuro"
                    variant="standard"
                    value={settingsLoaded.primaryColorDark || ""}
                    onClick={() => setPrimaryColorDarkModalOpen(true)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <div
                            style={{ backgroundColor: settingsLoaded.primaryColorDark }}
                            className={classes.colorAdorment}
                          ></div>
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
                      ),
                    }}
                  />
                </FormControl>
                <ColorPicker
                  open={primaryColorDarkModalOpen}
                  handleClose={() => setPrimaryColorDarkModalOpen(false)}
                  onChange={(color) => {
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
                    label="Nome do sistema"
                    variant="standard"
                    name="appName"
                    value={appName}
                    inputRef={appNameInput}
                    onChange={(e) => {
                      setAppName(e.target.value);
                    }}
                    onBlur={async (_) => {
                      await handleSaveSetting("appName",appName);
                      colorMode.setAppName(appName || "ticketz");
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="logo-light-upload-field"
                    label="Logotipo claro"
                    variant="standard"
                    value={settingsLoaded.appLogoLight || ""}
                    InputProps={{
                      endAdornment: (
                        <>
                          { settingsLoaded.appLogoLight &&
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => { 
                                  handleSaveSetting("appLogoLight","");
                                  colorMode.setAppLogoLight("");
                                }
                              }  
                            >
                              <Delete />
                            </IconButton>
                          }
                          <input
                            type="file"
                            id="upload-logo-light-button"
                            ref={logoLightInput}
                            className={classes.uploadInput}
                            onChange={(e) => uploadLogo(e,"Light")}
                          />
                          <label htmlFor="upload-logo-light-button">
                            <IconButton
                              size="small"
                              color="default"
                              onClick={
                                () => {
                                  logoLightInput.current.click();
                                }
                              }
                            >
                              <AttachFile />
                            </IconButton>
                          </label>
                        </>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="logo-dark-upload-field"
                    label="Logotipo escuro"
                    variant="standard"
                    value={settingsLoaded.appLogoDark || ""}
                    InputProps={{
                      endAdornment: (
                        <>
                          { settingsLoaded.appLogoDark &&
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => { 
                                  handleSaveSetting("appLogoDark","");
                                  colorMode.setAppLogoDark("");
                                }
                              }  
                            >
                              <Delete />
                            </IconButton>
                          }
                          <input
                            type="file"
                            id="upload-logo-dark-button"
                            ref={logoDarkInput}
                            className={classes.uploadInput}
                            onChange={(e) => uploadLogo(e,"Dark")}
                          />
                          <label htmlFor="upload-logo-dark-button">
                            <IconButton
                              size="small"
                              color="default"
                              onClick={
                                () => {
                                  logoDarkInput.current.click();
                                }
                              }
                            >
                              <AttachFile />
                            </IconButton>
                          </label>
                        </>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="logo-favicon-upload-field"
                    label="Favicon"
                    variant="standard"
                    value={settingsLoaded.appLogoFavicon || ""}
                    InputProps={{
                      endAdornment: (
                        <>
                          { settingsLoaded.appLogoFavicon &&
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => { 
                                  handleSaveSetting("appLogoFavicon","");
                                  colorMode.setAppLogoFavicon("");
                                }
                              }  
                            >
                              <Delete />
                            </IconButton>
                          }
                          <input
                            type="file"
                            id="upload-logo-favicon-button"
                            ref={logoFaviconInput}
                            className={classes.uploadInput}
                            onChange={(e) => uploadLogo(e,"Favicon")}
                          />
                          <label htmlFor="upload-logo-favicon-button">
                            <IconButton
                              size="small"
                              color="default"
                              onClick={
                                () => {
                                  logoFaviconInput.current.click();
                                }
                              }
                            >
                              <AttachFile />
                            </IconButton>
                          </label>
                        </>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <div className={classes.appLogoLightPreviewDiv}>
                  <img className={classes.appLogoLightPreviewImg} alt="dark-logo-preview" />
                </div>
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <div className={classes.appLogoDarkPreviewDiv}>
                  <img className={classes.appLogoDarkPreviewImg} alt="dark-logo-preview" />
                </div>
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <div className={classes.appLogoFaviconPreviewDiv}>
                  <img className={classes.appLogoFaviconPreviewImg} alt="favicon-preview" />
                </div>
              </Grid>
            </>
          )}
        />
      </Grid>
    </>
  );
}
