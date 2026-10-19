import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography
} from "@material-ui/core";
import { toast } from "react-toastify";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { formatCurrency, METODOS } from "./format";

const proximoVencimento = cliente => {
  if (cliente?.dueDate) return moment(cliente.dueDate).format("YYYY-MM-DD");
  return moment().add(5, "days").format("YYYY-MM-DD");
};

const ModalLancarCobranca = ({
  aberto,
  aoFechar,
  clientes,
  gatewayPronto,
  aoLancar
}) => {
  const [companyId, setCompanyId] = useState("");
  const [detail, setDetail] = useState("");
  const [value, setValue] = useState("");
  const [dueDate, setDueDate] = useState(
    moment().add(5, "days").format("YYYY-MM-DD")
  );
  const [gerarCobranca, setGerarCobranca] = useState(true);
  const [method, setMethod] = useState("pix");
  const [taxId, setTaxId] = useState("");
  const [salvando, setSalvando] = useState(false);

  const cliente = useMemo(
    () => clientes.find(item => item.id === Number(companyId)),
    [clientes, companyId]
  );

  useEffect(() => {
    if (!aberto) return;
    setCompanyId("");
    setDetail("");
    setValue("");
    setDueDate(moment().add(5, "days").format("YYYY-MM-DD"));
    setGerarCobranca(true);
    setMethod("pix");
    setTaxId("");
  }, [aberto]);

  // Ao escolher o cliente já sugerimos o que vai ser cobrado dele: plano,
  // mensalidade contratada e o vencimento do ciclo.
  useEffect(() => {
    if (!cliente) return;
    setDetail(cliente.planName || "Mensalidade");
    setValue(String(cliente.monthlyValue || ""));
    setDueDate(proximoVencimento(cliente));
  }, [cliente]);

  const handleSalvar = async () => {
    if (!companyId) {
      toast.error("Escolha o cliente.");
      return;
    }
    if (!(Number(value) > 0)) {
      toast.error("Informe um valor maior que zero.");
      return;
    }
    if (gerarCobranca && method === "boleto" && !taxId.trim()) {
      toast.error("Boleto exige o CPF/CNPJ do cliente.");
      return;
    }

    setSalvando(true);
    try {
      const { data } = await api.post("/billing-admin/invoices", {
        companyId: Number(companyId),
        detail: detail.trim() || undefined,
        value: Number(value),
        dueDate,
        method: gerarCobranca && gatewayPronto ? method : undefined,
        taxId: gerarCobranca ? taxId.replace(/\D/g, "") || undefined : undefined
      });
      toast.success("Cobrança lançada.");
      aoLancar(data.invoice);
      aoFechar();
    } catch (err) {
      toastError(err);
    }
    setSalvando(false);
  };

  return (
    <Dialog
      PaperProps={{ className: "sd-billing-dialog" }}
      open={aberto}
      onClose={aoFechar}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Lançar cobrança</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="cobranca-cliente">Cliente</InputLabel>
              <Select
                labelId="cobranca-cliente"
                label="Cliente"
                value={companyId}
                onChange={e => setCompanyId(e.target.value)}
              >
                {clientes.map(item => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                    {item.planName ? ` — ${item.planName}` : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              label="Descrição"
              value={detail}
              onChange={e => setDetail(e.target.value)}
              helperText="Aparece na fatura e na mensagem enviada ao cliente."
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              type="number"
              variant="outlined"
              label="Valor (R$)"
              value={value}
              inputProps={{ min: 0, step: "0.01" }}
              onChange={e => setValue(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              type="date"
              variant="outlined"
              label="Vencimento"
              InputLabelProps={{ shrink: true }}
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  color="primary"
                  checked={gerarCobranca && gatewayPronto}
                  disabled={!gatewayPronto}
                  onChange={e => setGerarCobranca(e.target.checked)}
                />
              }
              label="Gerar cobrança no AbacatePay agora"
            />
            {!gatewayPronto && (
              <Typography variant="caption" color="error" display="block">
                Gateway de pagamento não configurado — a fatura será apenas
                registrada.
              </Typography>
            )}
          </Grid>

          {gerarCobranca && gatewayPronto && (
            <>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="cobranca-metodo">Forma</InputLabel>
                  <Select
                    labelId="cobranca-metodo"
                    label="Forma"
                    value={method}
                    onChange={e => setMethod(e.target.value)}
                  >
                    {METODOS.map(item => (
                      <MenuItem key={item.value} value={item.value}>
                        {item.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  label="CPF/CNPJ do cliente"
                  value={taxId}
                  onChange={e => setTaxId(e.target.value)}
                  helperText={
                    method === "boleto"
                      ? "Obrigatório para boleto."
                      : "Opcional."
                  }
                />
              </Grid>
            </>
          )}

          {cliente && (
            <Grid item xs={12}>
              <Typography variant="caption" color="textSecondary">
                Mensalidade contratada: {formatCurrency(cliente.monthlyValue)} ·
                Vencimento do ciclo:{" "}
                {cliente.dueDate
                  ? moment(cliente.dueDate).format("DD/MM/YYYY")
                  : "-"}
                {cliente.inTrial
                  ? ` · Em teste até ${moment(cliente.trialEndsAt).format(
                      "DD/MM/YYYY"
                    )}`
                  : ""}
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={aoFechar} disabled={salvando}>
          Cancelar
        </Button>
        <Button
          onClick={handleSalvar}
          color="primary"
          variant="contained"
          disabled={salvando}
        >
          {salvando ? <CircularProgress size={18} /> : "Lançar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalLancarCobranca;
