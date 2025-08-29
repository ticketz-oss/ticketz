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

import React, { useEffect, useState } from "react";

import Grid from "@material-ui/core/Grid";
import FormControl from "@material-ui/core/FormControl";
import useSettings from "../../../hooks/useSettings";
import { toast } from 'react-toastify';
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import { Typography } from "@material-ui/core";
import { getBackendURL } from "../../../services/config";

const useStyles = makeStyles((_) => ({
  fieldContainer: {
    width: "100%",
    textAlign: "left",
  },
  
  uploadInput: {
    display: "none",
  },
  
  createAccount: {
    paddingTop: "10px",
    paddingBottom: "5px"
  },
  
  title: {
    paddingTop: "10px",
  }
}));


export default function OwenSettings(props) {
  const { settings } = props;
  const classes = useStyles();
  const [owenSettings, setOwenSettings] = useState({});
  const { update } = useSettings();

  useEffect(() => {
    if (Array.isArray(settings)) {
      const newSettings = {}; 
      settings.forEach( (setting) => {
        if (setting.key.startsWith("_owen")) {
          newSettings[setting.key.substring(1)] = setting.value;
        }
      });
      setOwenSettings(newSettings);
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
    if (typeof owenSettings[key] !== "string") {
      return;
    }
    storeSetting(`_${key}`, owenSettings[key]);
    toast.success("Operação atualizada com sucesso.");
  }
  
  return (
    <>
      <>
      <Grid spacing={3} container>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.fieldContainer}>
            <TextField
              id="owenCnpj"
              label="CNPJ"
              variant="standard"
              name="owenCnpj"
              value={owenSettings.owenCnpj || ""}
              onChange={(e) => {
                const newSettings = { ...owenSettings };
                newSettings.owenCnpj = e.target.value;
                setOwenSettings(newSettings);
              }}
              onBlur={async (_) => {
                await handleSaveSetting("owenCnpj");
              }}
            />
          </FormControl>
        </Grid>
        <Grid xs={12} sm={3} md={12} item>
          <FormControl className={classes.fieldContainer}>
            <TextField
              id="owenTokenField"
              label="Token"
              variant="standard"
              name="owenToken"
              value={owenSettings.owenToken || ""}
              onChange={(e) => {
                const newSettings = { ...owenSettings };
                newSettings.owenToken = e.target.value;
                setOwenSettings(newSettings);
              }}
              onBlur={async (_) => {
                await handleSaveSetting("owenToken");
              }}
            />
          </FormControl>
        </Grid>
        <Grid xs={12} sm={3} md={12} item>
          <FormControl className={classes.fieldContainer}>
            <TextField
              id="owenSecretKeyField"
              label="Secret Key"
              variant="standard"
              name="owenSecretKey"
              value={owenSettings.owenSecretKey || ""}
              onChange={(e) => {
                const newSettings = { ...owenSettings };
                newSettings.owenSecretKey = e.target.value;
                setOwenSettings(newSettings);
              }}
              onBlur={async (_) => {
                await handleSaveSetting("owenSecretKey");
              }}
            />
          </FormControl>
        </Grid>
        <Grid xs={12} sm={3} md={12} item>
          <Typography variant="h5" color="primary" gutterBottom>
            Configuração do Webhook
          </Typography>
          <Typography variant="body1">
            No painel de configurações da sua conta você precisa configurar o
            webhook para o seguinte conteúdo:
          </Typography>
          <Typography variant="pre">
            {getBackendURL()}/subscription/ticketz/webhook
          </Typography>
        </Grid>
      </Grid>
      </>
    </>
  );
}
