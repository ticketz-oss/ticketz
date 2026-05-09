import React, { useEffect, useState } from "react";
import Grid from "@material-ui/core/Grid";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import useSettings from "../../../hooks/useSettings";
import { toast } from "react-toastify";

const useStyles = makeStyles(_ => ({
  fieldContainer: { width: "100%", textAlign: "left" },
  sectionTitle: { marginTop: 24, marginBottom: 8 }
}));

const NFSE_KEYS = [
  "_nfseConsumerKey",
  "_nfseConsumerSecret",
  "_nfseAccessToken",
  "_nfseAccessTokenSecret",
  "_nfseCnpjEmitente",
  "_nfseInscricaoMunicipal",
  "_nfseRegimeTributario",
  "_nfseNaturezaOperacao",
  "_nfseCodigoServico",
  "_nfseDescricaoServico",
  "_nfseAliquotaIss"
];

export default function NfseSettings({ settings }) {
  const classes = useStyles();
  const { update } = useSettings();
  const [cfg, setCfg] = useState({});

  useEffect(() => {
    if (Array.isArray(settings)) {
      const next = {};
      settings.forEach(s => {
        if (NFSE_KEYS.includes(s.key)) {
          next[s.key] = s.value;
        }
      });
      setCfg(next);
    }
  }, [settings]);

  const set = (key, value) => setCfg(prev => ({ ...prev, [key]: value }));

  const save = async key => {
    await update({ key, value: cfg[key] || "" });
    toast.success("Configuração NFS-e salva.");
  };

  const field = (key, label, type = "text") => (
    <Grid xs={12} sm={6} md={4} item key={key}>
      <FormControl className={classes.fieldContainer}>
        <TextField
          label={label}
          variant="standard"
          type={type}
          value={cfg[key] || ""}
          onChange={e => set(key, e.target.value)}
          onBlur={() => save(key)}
        />
      </FormControl>
    </Grid>
  );

  return (
    <>
      <Typography variant="subtitle1" className={classes.sectionTitle}>
        NFS-e — WebmaniaBR (100 grátis/mês)
      </Typography>
      <Typography variant="caption" color="textSecondary">
        Cadastre-se em webmaniabr.com e obtenha as credenciais OAuth1 no painel
        da API.
      </Typography>
      <Grid spacing={3} container style={{ marginTop: 8 }}>
        {field("_nfseConsumerKey", "Consumer Key")}
        {field("_nfseConsumerSecret", "Consumer Secret")}
        {field("_nfseAccessToken", "Access Token")}
        {field("_nfseAccessTokenSecret", "Access Token Secret")}
        {field("_nfseCnpjEmitente", "CNPJ Emitente")}
        {field("_nfseInscricaoMunicipal", "Inscrição Municipal")}

        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.fieldContainer}>
            <InputLabel>Regime Tributário</InputLabel>
            <Select
              value={cfg["_nfseRegimeTributario"] || "1"}
              onChange={e => {
                set("_nfseRegimeTributario", e.target.value);
                update({
                  key: "_nfseRegimeTributario",
                  value: e.target.value
                });
              }}
            >
              <MenuItem value="1">Simples Nacional</MenuItem>
              <MenuItem value="2">Lucro Presumido</MenuItem>
              <MenuItem value="3">Lucro Real</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {field("_nfseNaturezaOperacao", "Natureza da Operação")}
        {field("_nfseCodigoServico", "Código do Serviço (LC116)")}
        {field("_nfseDescricaoServico", "Descrição do Serviço")}
        {field("_nfseAliquotaIss", "Alíquota ISS (%)", "number")}
      </Grid>
    </>
  );
}
