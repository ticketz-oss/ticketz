import React, { useEffect, useState } from "react";
import Grid from "@material-ui/core/Grid";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import Switch from "@material-ui/core/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import { makeStyles } from "@material-ui/core/styles";
import useSettings from "../../../hooks/useSettings";
import { toast } from "react-toastify";

const useStyles = makeStyles(_ => ({
  fieldContainer: { width: "100%", textAlign: "left" },
  sectionTitle: { marginTop: 24, marginBottom: 4 }
}));

const NFSE_KEYS = [
  "_nfseApiToken",
  "_nfseSandbox",
  "_nfseCnpjEmitente",
  "_nfseInscricaoMunicipal",
  "_nfseCodigoMunicipio",
  "_nfseRegimeTributario",
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
        NFS-e — Focus NFe
      </Typography>
      <Typography variant="caption" color="textSecondary">
        Cadastre-se em focusnfe.com.br, crie uma empresa e gere o token de API.
        Sandbox gratuito para testes; produção ~R$ 0,05 por NFS-e emitida.
      </Typography>

      <Grid spacing={3} container style={{ marginTop: 8 }}>
        {field("_nfseApiToken", "Token da API Focus NFe")}

        <Grid xs={12} sm={6} md={4} item>
          <FormControlLabel
            control={
              <Switch
                checked={cfg["_nfseSandbox"] === "true"}
                onChange={e => {
                  const val = e.target.checked ? "true" : "false";
                  set("_nfseSandbox", val);
                  update({ key: "_nfseSandbox", value: val });
                }}
              />
            }
            label="Usar Sandbox (homologação)"
          />
        </Grid>

        {field("_nfseCnpjEmitente", "CNPJ Emitente")}
        {field("_nfseInscricaoMunicipal", "Inscrição Municipal")}
        {field("_nfseCodigoMunicipio", "Código IBGE do Município")}

        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.fieldContainer}>
            <InputLabel>Regime Tributário</InputLabel>
            <Select
              value={cfg["_nfseRegimeTributario"] || "1"}
              onChange={e => {
                set("_nfseRegimeTributario", e.target.value);
                update({ key: "_nfseRegimeTributario", value: e.target.value });
              }}
            >
              <MenuItem value="MEI">MEI (ISS pago via DAS)</MenuItem>
              <MenuItem value="1">Simples Nacional</MenuItem>
              <MenuItem value="2">Lucro Presumido</MenuItem>
              <MenuItem value="3">Lucro Real</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {field("_nfseCodigoServico", "Item Lista Serviço (LC116, ex: 0107)")}
        {field("_nfseDescricaoServico", "Discriminação do Serviço")}
        {field("_nfseAliquotaIss", "Alíquota ISS (%)", "number")}
      </Grid>
    </>
  );
}
