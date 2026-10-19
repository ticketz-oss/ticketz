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
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import { IconButton, InputAdornment } from "@material-ui/core";
import { FileCopy } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";

import useSettings from "../../../hooks/useSettings";
import { getBackendURL } from "../../../services/config";

const useStyles = makeStyles(theme => ({
  fieldContainer: {
    width: "100%",
    textAlign: "left"
  },
  sectionTitle: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(1),
    fontWeight: "bold"
  },
  helper: {
    marginTop: theme.spacing(1),
    color: theme.palette.text.secondary
  }
}));

// Campos de credenciais/segurança (texto livre)
const credentialFields = [
  {
    key: "abacatePayToken",
    label: "API Key (AbacatePay)",
    helper: "Chave gerada no painel da AbacatePay em Integração > API Keys."
  },
  {
    key: "abacatePayWebhookSecret",
    label: "Webhook Secret",
    helper:
      "Uma senha aleatória que você escolhe e informa no painel ao criar o webhook."
  }
];

// Campos de taxa (numéricos). Defaults espelham o backend.
const feeFields = [
  { key: "abacatePayFeePix", label: "PIX (taxa fixa R$)", def: "0.80" },
  { key: "abacatePayFeeBoleto", label: "Boleto (taxa fixa R$)", def: "2.50" },
  { key: "abacatePayFeeCard1xPct", label: "Cartão 1x (%)", def: "3.5" },
  { key: "abacatePayFeeCard1xFix", label: "Cartão 1x (fixo R$)", def: "0.60" },
  { key: "abacatePayFeeCard2a6Pct", label: "Cartão 2x-6x (%)", def: "4.0" },
  {
    key: "abacatePayFeeCard2a6Fix",
    label: "Cartão 2x-6x (fixo R$)",
    def: "0.60"
  },
  { key: "abacatePayFeeCard7a12Pct", label: "Cartão 7x-12x (%)", def: "4.5" },
  {
    key: "abacatePayFeeCard7a12Fix",
    label: "Cartão 7x-12x (fixo R$)",
    def: "0.60"
  }
];

export default function AbacatePaySettings(props) {
  const { settings } = props;
  const classes = useStyles();
  const [state, setState] = useState({});
  const { update } = useSettings();

  // A AbacatePay exige URL absoluta HTTPS. Em setups com proxy (BACKEND_HOST
  // vazio), getBackendURL() devolve um caminho relativo (/backend) — então
  // prefixamos com a origem atual.
  const backendBase = getBackendURL() || "";
  const absoluteBase = backendBase.startsWith("http")
    ? backendBase
    : `${window.location.origin}${backendBase}`;
  const webhookUrl = `${absoluteBase}/subscription/ticketz/webhook?webhookSecret=${
    state.abacatePayWebhookSecret || "SEU_SECRET"
  }`;

  useEffect(() => {
    if (Array.isArray(settings)) {
      const newState = {};
      settings.forEach(setting => {
        if (setting.key.startsWith("_abacatePay")) {
          newState[setting.key.substring(1)] = setting.value;
        }
      });
      setState(newState);
    }
  }, [settings]);

  function setSetting(key, value) {
    setState(prev => ({ ...prev, [key]: value }));
  }

  async function handleSaveSetting(key) {
    if (typeof state[key] !== "string") {
      return;
    }
    await update({ key: `_${key}`, value: state[key] });
    toast.success("Operação atualizada com sucesso.");
  }

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success("URL do webhook copiada!");
  };

  return (
    <>
      <Typography className={classes.sectionTitle}>Credenciais</Typography>
      <Grid spacing={3} container>
        {credentialFields.map(field => (
          <Grid xs={12} md={6} item key={field.key}>
            <FormControl className={classes.fieldContainer}>
              <TextField
                id={`${field.key}Field`}
                label={field.label}
                variant="standard"
                value={state[field.key] || ""}
                onChange={e => setSetting(field.key, e.target.value)}
                onBlur={() => handleSaveSetting(field.key)}
                helperText={field.helper}
              />
            </FormControl>
          </Grid>
        ))}

        <Grid xs={12} item>
          <FormControl className={classes.fieldContainer}>
            <TextField
              label="URL do Webhook (cole no painel da AbacatePay)"
              variant="standard"
              value={webhookUrl}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleCopyWebhook}>
                      <FileCopy fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </FormControl>
        </Grid>
      </Grid>

      <Typography className={classes.sectionTitle}>
        Taxas (somadas por cima do valor da fatura)
      </Typography>
      <Typography variant="body2" className={classes.helper}>
        O cliente paga o valor do plano + a taxa do método escolhido, para que
        você receba o valor cheio. Ajuste conforme as taxas reais da sua conta.
      </Typography>
      <Grid spacing={3} container>
        {feeFields.map(field => (
          <Grid xs={12} sm={6} md={3} item key={field.key}>
            <FormControl className={classes.fieldContainer}>
              <TextField
                id={`${field.key}Field`}
                label={field.label}
                variant="standard"
                type="number"
                placeholder={field.def}
                value={state[field.key] || ""}
                onChange={e => setSetting(field.key, e.target.value)}
                onBlur={() => handleSaveSetting(field.key)}
              />
            </FormControl>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
