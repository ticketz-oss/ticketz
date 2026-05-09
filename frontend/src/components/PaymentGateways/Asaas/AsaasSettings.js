import React, { useEffect, useState } from "react";
import Grid from "@material-ui/core/Grid";
import FormControl from "@material-ui/core/FormControl";
import TextField from "@material-ui/core/TextField";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import InputLabel from "@material-ui/core/InputLabel";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";
import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";
import useSettings from "../../../hooks/useSettings";

const useStyles = makeStyles(_ => ({
  fieldContainer: { width: "100%", textAlign: "left" }
}));

export default function AsaasSettings({ settings }) {
  const classes = useStyles();
  const [s, setS] = useState({});
  const { update } = useSettings();

  useEffect(() => {
    if (Array.isArray(settings)) {
      const ns = {};
      settings.forEach(setting => {
        if (setting.key.startsWith("_asaas")) {
          ns[setting.key.substring(1)] = setting.value;
        }
      });
      setS(ns);
    }
  }, [settings]);

  const setSetting = (key, value) => setS(prev => ({ ...prev, [key]: value }));

  const save = async key => {
    if (typeof s[key] !== "string") return;
    await update({ key: `_${key}`, value: s[key] });
    toast.success("Operação atualizada com sucesso.");
  };

  const saveImmediate = async (key, value) => {
    setSetting(key, value);
    await update({ key: `_${key}`, value });
    toast.success("Operação atualizada com sucesso.");
  };

  return (
    <Grid spacing={3} container>
      <Grid xs={12} sm={6} md={4} item>
        <FormControl className={classes.fieldContainer}>
          <InputLabel>Ambiente</InputLabel>
          <Select
            value={s.asaasSandbox || "false"}
            onChange={e => saveImmediate("asaasSandbox", e.target.value)}
          >
            <MenuItem value="false">Produção</MenuItem>
            <MenuItem value="true">Sandbox (testes)</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid xs={12} md={12} item>
        <FormControl className={classes.fieldContainer}>
          <TextField
            label="API Key"
            variant="standard"
            value={s.asaasApiKey || ""}
            onChange={e => setSetting("asaasApiKey", e.target.value)}
            onBlur={() => save("asaasApiKey")}
            placeholder="$aact_..."
          />
        </FormControl>
      </Grid>

      <Grid xs={12} item>
        <Divider style={{ margin: "16px 0 8px" }} />
        <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
          NFS-e (Nota Fiscal de Serviço)
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Configure no painel Asaas: Configurações → Nota Fiscal. Os campos abaixo complementam a emissão.
        </Typography>
      </Grid>

      <Grid xs={12} md={12} item>
        <FormControl className={classes.fieldContainer}>
          <TextField
            label="Descrição do Serviço"
            variant="standard"
            value={s.asaasNfseServiceDesc || ""}
            onChange={e => setSetting("asaasNfseServiceDesc", e.target.value)}
            onBlur={() => save("asaasNfseServiceDesc")}
            placeholder="Licença de uso de software SaaS"
          />
        </FormControl>
      </Grid>

      <Grid xs={12} sm={6} item>
        <FormControl className={classes.fieldContainer}>
          <TextField
            label="Código do Serviço LC116"
            variant="standard"
            value={s.asaasNfseServiceCode || ""}
            onChange={e => setSetting("asaasNfseServiceCode", e.target.value)}
            onBlur={() => save("asaasNfseServiceCode")}
            placeholder="0107"
          />
        </FormControl>
      </Grid>

      <Grid xs={12} sm={6} item>
        <FormControl className={classes.fieldContainer}>
          <TextField
            label="Alíquota ISS (%)"
            variant="standard"
            type="number"
            value={s.asaasNfseIssRate || ""}
            onChange={e => setSetting("asaasNfseIssRate", e.target.value)}
            onBlur={() => save("asaasNfseIssRate")}
            placeholder="0"
          />
        </FormControl>
      </Grid>
    </Grid>
  );
}
