import React, { useEffect, useState, useRef } from "react";

import Grid from "@material-ui/core/Grid";
import FormControl from "@material-ui/core/FormControl";
import useSettings from "../../../hooks/useSettings";
import { toast } from 'react-toastify';
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import { AttachFile, Delete } from "@material-ui/icons";
import {
  IconButton,
  InputAdornment,
} from "@material-ui/core";
import api from "../../../services/api";

const useStyles = makeStyles((_) => ({
  fieldContainer: {
    width: "100%",
    textAlign: "left",
  },
  
  uploadInput: {
    display: "none",
  },
}));

export default function EfiSettings(props) {
  const { settings } = props;
  const classes = useStyles();
  const [efiSettings, setEfiSettings] = useState({});
  const efiCertificateFileInput = useRef(null);
  const efiCertificateNameInput = useRef(null);

  const { update } = useSettings();

  const uploadPrivate = async (e, key) => {
    if (!e.target.files) {
      return;
    }
    
    const file = e.target.files[0];
    const formData = new FormData();
    
    formData.append("file", file);
    formData.append("settingKey", key);
    
    api.post("/settings/privateFile", formData, {
      onUploadProgress: (event) => {
        let progress = Math.round(
          (event.loaded * 100) / event.total
        );
        console.log(
          `Upload ${progress}%`
        );
      },
    }).then((response) => {
      const newSettings = { ...efiSettings };
      newSettings[key] = response.data;
      setEfiSettings(newSettings);
    }).catch((err) => {
      console.error(
        `Houve um problema ao realizar o upload da imagem.`
      );
      console.log(err);
    });
  };

  useEffect(() => {
    if (Array.isArray(settings)) {
      const newSettings = {}; 
      settings.forEach( (setting) => {
        if (setting.key.startsWith("_efi")) {
          newSettings[setting.key.substring(1)] = setting.value;
        }
      });
      setEfiSettings(newSettings); 
      console.debug(newSettings);
    }
  }, [settings]);

  async function storeSetting(key, value) {
    await update({
      key,
      value
    });
  }

  async function handleSaveSetting(key) {
    if (typeof efiSettings[key] !== "string") {
      return;
    }
    storeSetting(`_${key}`, efiSettings[key]);
    toast.success("Operação atualizada com sucesso.");
  }
  
  function setSetting(key, value) {
    const newSettings = { ...efiSettings };
    newSettings[key] = value;
    setEfiSettings(newSettings);
  }
  
  async function storeAndSetSetting(key, value) {
    await storeSetting(key, value);
    setSetting(key, value);
  }

  return (
    <>
      <Grid spacing={3} container>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="efi-certificate-upload-field"
              label="Certificate"
              variant="standard"
              value={efiSettings.efiCertFile || ""}
              ref={efiCertificateNameInput}
              InputProps={{
                endAdornment: (
                  <>
                    { efiSettings.efiCertFile &&
                      <IconButton
                        size="small"
                        color="default"
                        onClick={() => {
                            storeAndSetSetting("efiCertFile","");
                          }
                        }  
                      >
                        <Delete />
                      </IconButton>
                    }
                    <input
                      type="file"
                      id="upload-efi-certificate-button"
                      ref={efiCertificateFileInput}
                      className={classes.uploadInput}
                      onChange={(e) => uploadPrivate(e,"efiCertFile")}
                    />
                    <label htmlFor="upload-efi-certificate-button">
                      <IconButton
                        size="small"
                        color="default"
                        onClick={
                          () => {
                            efiCertificateFileInput.current.click();
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

        <Grid xs={12} sm={3} md={12} item>
          <FormControl className={classes.fieldContainer}>
            <TextField
              id="efiClientIdField"
              label="Client ID"
              variant="standard"
              name="efiClientId"
              value={efiSettings.efiClientId || ""}
              onChange={(e) => {
                const newSettings = { ...efiSettings };
                newSettings.efiClientId = e.target.value;
                setEfiSettings(newSettings);
              }}
              onBlur={async (_) => {
                await handleSaveSetting("efiClientId");
              }}
            />
          </FormControl>
        </Grid>
        <Grid xs={12} sm={3} md={12} item>
          <FormControl className={classes.fieldContainer}>
            <TextField
              id="efiClientSecretField"
              label="Client Secret"
              variant="standard"
              name="efiClientSecret"
              value={efiSettings.efiClientSecret || ""}
              onChange={(e) => {
                setSetting("efiClientSecret", e.target.value);
              }}
              onBlur={async (_) => {
                await handleSaveSetting("efiClientSecret");
              }}
            />
          </FormControl>
        </Grid>
        <Grid xs={12} sm={3} md={12} item>
          <FormControl className={classes.fieldContainer}>
            <TextField
              id="efiPixKeyField"
              label="PIX Key"
              variant="standard"
              name="efiPixKey"
              value={efiSettings.efiPixKey || ""}
              onChange={(e) => {
                const newSettings = { ...efiSettings };
                newSettings.efiPixKey = e.target.value;
                setEfiSettings(newSettings);
              }}
              onBlur={async (_) => {
                await handleSaveSetting("efiPixKey");
              }}
            />
          </FormControl>
        </Grid>

      </Grid>
    </>
  );
}
