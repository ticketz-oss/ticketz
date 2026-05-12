import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import { toast } from "react-toastify";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles(theme => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(3),
    maxWidth: 900
  }
}));

const FinanceiroConfig = () => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [fiscal, setFiscal] = useState({
    name: "", document: "", postalCode: "", address: "", addressNumber: "", province: "",
    city: "", state: "", municipalRegistration: "", stateRegistration: "", fiscalEmail: ""
  });

  useEffect(() => {
    api.get("/companies/fiscal/me").then(({ data }) => {
      setFiscal({
        name: data.name || "",
        document: data.document || "",
        postalCode: data.postalCode || "",
        address: data.address || "",
        addressNumber: data.addressNumber || "",
        province: data.province || "",
        city: data.city || "",
        state: data.state || "",
        municipalRegistration: data.municipalRegistration || "",
        stateRegistration: data.stateRegistration || "",
        fiscalEmail: data.fiscalEmail || ""
      });
    }).catch(() => {});
  }, []);

  const handleCepBlur = async () => {
    const cep = fiscal.postalCode.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const data = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(r => r.json());
      if (!data.erro) {
        setFiscal(prev => ({
          ...prev,
          address: data.logradouro || prev.address,
          province: data.bairro || prev.province,
          city: data.localidade || prev.city,
          state: data.uf || prev.state
        }));
      }
    } catch (_) {}
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put("/companies/fiscal/me", fiscal);
      toast.success("Dados fiscais salvos com sucesso.");
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  };

  return (
    <MainContainer>
      <MainHeader>
        <Title>Configurações Financeiras</Title>
      </MainHeader>

      <Paper className={classes.mainPaper} variant="outlined">
        <Typography variant="subtitle1" style={{ fontWeight: 600, marginBottom: 16 }}>
          Dados para Nota Fiscal (NFS-e)
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ marginBottom: 20 }}>
          Esses dados são enviados ao Asaas para emissão da nota fiscal de serviço.
          Preencha com os dados do tomador do serviço (seu cliente).
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Nome / Razão Social" value={fiscal.name}
              onChange={e => setFiscal(p => ({ ...p, name: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="CPF / CNPJ" value={fiscal.document}
              onChange={e => setFiscal(p => ({ ...p, document: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField fullWidth label="CEP" value={fiscal.postalCode}
              onChange={e => setFiscal(p => ({ ...p, postalCode: e.target.value }))}
              onBlur={handleCepBlur} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Rua / Logradouro" value={fiscal.address}
              onChange={e => setFiscal(p => ({ ...p, address: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField fullWidth label="Número" value={fiscal.addressNumber}
              onChange={e => setFiscal(p => ({ ...p, addressNumber: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Bairro" value={fiscal.province}
              onChange={e => setFiscal(p => ({ ...p, province: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Cidade" value={fiscal.city}
              onChange={e => setFiscal(p => ({ ...p, city: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField fullWidth label="UF" value={fiscal.state}
              onChange={e => setFiscal(p => ({ ...p, state: e.target.value }))}
              inputProps={{ maxLength: 2 }} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Inscrição Municipal (opcional)" value={fiscal.municipalRegistration}
              onChange={e => setFiscal(p => ({ ...p, municipalRegistration: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Inscrição Estadual (opcional)" value={fiscal.stateRegistration}
              onChange={e => setFiscal(p => ({ ...p, stateRegistration: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="E-mail para NF (opcional)" value={fiscal.fiscalEmail}
              onChange={e => setFiscal(p => ({ ...p, fiscalEmail: e.target.value }))} />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" color="primary" onClick={handleSave} disabled={loading}>
              Salvar Dados Fiscais
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </MainContainer>
  );
};

export default FinanceiroConfig;
