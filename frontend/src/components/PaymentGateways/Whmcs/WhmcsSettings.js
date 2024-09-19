/*

   DO NOT REMOVE / NÃO REMOVER

   VERSÃO EM PORTUGUÊS MAIS ABAIXO

   PROPRIETARY CODE

   Author: Claudemir Todo Bom
   Email: claudemir@todobom.com
   
   If you had access to this code, you are not allowed to
   share, copy or distribute it. You are not allowed to use
   it in your projects, create your own projects based on
   it or use it in any way without a written authorization.
   
   CÓDIGO PROPRIETÁRIO

   Autor: Claudemir Todo Bom
   Email: claudemir@todobom.com

   Se você teve acesso a este código, não está autorizado a
   compartilhá-lo, copiá-lo ou distribuí-lo. Não está autorizado
   a utilizá-lo em seus projetos, criar projetos baseados nele
   ou utilizá-lo de qualquer forma sem autorização por escrito.
   
 */

import React, { useEffect, useState, useRef } from "react";

import Grid from "@material-ui/core/Grid";
import FormControl from "@material-ui/core/FormControl";
import useSettings from "../../../hooks/useSettings";
import { toast } from 'react-toastify';
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";

import Switch from "@material-ui/core/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel";

const useStyles = makeStyles((_) => ({
  fieldContainer: {
    width: "100%",
    textAlign: "left",
  },

  uploadInput: {
    display: "none",
  },
}));


export default function WhmcsSettings(props) {
  const { settings } = props;
  const classes = useStyles();
  const [whmcsSettings, setWhmcsSettings] = useState({});

  const { update } = useSettings();

  useEffect(() => {
    if (Array.isArray(settings)) {
      const newSettings = {};
      settings.forEach((setting) => {
        if (setting.key.startsWith("_whmcs")) {
          newSettings[setting.key.substring(1)] = setting.value;
        }
      });
      setWhmcsSettings(newSettings);
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
    if (key === "whmcsEnabled") {
      await storeSetting(`_${key}`, whmcsSettings[key] ? "1" : "0");
    } else if (typeof whmcsSettings[key] === "string") {
      await storeSetting(`_${key}`, whmcsSettings[key]);
    }
    toast.success("Setting updated successfully.");
  }

  function setSetting(key, value) {
    const newSettings = { ...whmcsSettings };
    newSettings[key] = value;
    setWhmcsSettings(newSettings);
  }

  return (
    <>
      <Grid spacing={3} container>

        <Grid xs={12} item>
          <FormControlLabel
            control={
              <Switch
                checked={whmcsSettings.whmcsEnabled === "1"}
                onChange={(event) => {
                  setSetting("whmcsEnabled", event.target.checked ? "1" : "0");
                  handleSaveSetting("whmcsEnabled");
                }}
                name="whmcsEnabled"
                color="primary"
              />
            }
            label="Enabled"
          />
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.fieldContainer}>
            <TextField
              id="whmcsBaseUrlField"
              label="Base URL"
              variant="standard"
              name="whmcsBaseUrl"
              value={whmcsSettings.whmcsBaseUrl || ""}
              onChange={(e) => {
                setSetting("whmcsBaseUrl", e.target.value);
              }}
              onBlur={async (_) => {
                await handleSaveSetting("whmcsBaseUrl");
              }}
              disabled={!Number(whmcsSettings.whmcsEnabled)}
            />
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.fieldContainer}>
            <TextField
              id="whmcsApiIdentifierField"
              label="API Identifier"
              variant="standard"
              name="whmcsApiIdentifier"
              value={whmcsSettings.whmcsApiIdentifier || ""}
              onChange={(e) => {
                setSetting("whmcsApiIdentifier", e.target.value);
              }}
              onBlur={async (_) => {
                await handleSaveSetting("whmcsApiIdentifier");
              }}
              disabled={!Number(whmcsSettings.whmcsEnabled)}
            />
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.fieldContainer}>
            <TextField
              id="whmcsApiSecretField"
              label="API Secret"
              variant="standard"
              name="whmcsApiSecret"
              value={whmcsSettings.whmcsApiSecret || ""}
              onChange={(e) => {
                setSetting("whmcsApiSecret", e.target.value);
              }}
              onBlur={async (_) => {
                await handleSaveSetting("whmcsApiSecret");
              }}
              disabled={!Number(whmcsSettings.whmcsEnabled)}
            />
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.fieldContainer}>
            <TextField
              id="whmcsProductCodeField"
              label="Product Code"
              variant="standard"
              name="whmcsProductCode"
              value={whmcsSettings.whmcsProductCode || ""}
              onChange={(e) => {
                setSetting("whmcsProductCode", e.target.value);
              }}
              onBlur={async (_) => {
                await handleSaveSetting("whmcsProductCode");
              }}
              disabled={!Number(whmcsSettings.whmcsEnabled)}
            />
          </FormControl>
        </Grid>
      </Grid>
    </>
  );
}
