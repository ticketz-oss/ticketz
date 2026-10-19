import React, { useEffect, useState } from "react";
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
import { formatCurrency } from "./format";

const RECORRENCIAS = [
  "MENSAL",
  "BIMESTRAL",
  "TRIMESTRAL",
  "SEMESTRAL",
  "ANUAL"
];

const ModalCliente = ({ cliente, aberto, aoFechar, planos, aoSalvar }) => {
  const [form, setForm] = useState({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!cliente) return;
    setForm({
      planId: cliente.planId || "",
      saleValue: cliente.saleValue ?? "",
      trialDays: cliente.trialDays ?? 0,
      dueDay: cliente.dueDay || 1,
      dueDate: cliente.dueDate
        ? moment(cliente.dueDate).format("YYYY-MM-DD")
        : "",
      recurrence: cliente.recurrence || "MENSAL",
      status: cliente.status !== false
    });
  }, [cliente]);

  const set = (campo, valor) =>
    setForm(atual => ({ ...atual, [campo]: valor }));

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      const payload = {
        planId: form.planId ? Number(form.planId) : undefined,
        saleValue:
          form.saleValue === "" || form.saleValue === null
            ? null
            : Number(form.saleValue),
        trialDays: Number(form.trialDays) || 0,
        dueDay: Number(form.dueDay) || 1,
        recurrence: form.recurrence,
        status: !!form.status
      };
      if (form.dueDate) payload.dueDate = form.dueDate;

      const { data } = await api.put(
        `/billing-admin/clients/${cliente.id}`,
        payload
      );
      toast.success("Cliente atualizado.");
      aoSalvar(data);
      aoFechar();
    } catch (err) {
      toastError(err);
    }
    setSalvando(false);
  };

  const planoEscolhido = planos.find(
    plano => Number(plano.id) === Number(form.planId)
  );

  return (
    <Dialog
      PaperProps={{ className: "sd-billing-dialog" }}
      open={aberto}
      onClose={aoFechar}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{cliente?.name}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="cliente-plano">Plano</InputLabel>
              <Select
                labelId="cliente-plano"
                label="Plano"
                value={form.planId ?? ""}
                onChange={e => set("planId", e.target.value)}
              >
                {planos.map(plano => (
                  <MenuItem key={plano.id} value={plano.id}>
                    {plano.name} — {formatCurrency(plano.value)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              type="number"
              variant="outlined"
              label="Mensalidade negociada (R$)"
              value={form.saleValue ?? ""}
              inputProps={{ min: 0, step: "0.01" }}
              onChange={e => set("saleValue", e.target.value)}
              helperText={
                planoEscolhido
                  ? `Em branco usa o valor do plano (${formatCurrency(
                      planoEscolhido.value
                    )}).`
                  : "Em branco usa o valor do plano."
              }
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              type="number"
              variant="outlined"
              label="Dias de teste grátis"
              value={form.trialDays ?? 0}
              inputProps={{ min: 0, max: 3650 }}
              onChange={e => set("trialDays", e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              type="number"
              variant="outlined"
              label="Dia de vencimento"
              value={form.dueDay ?? 1}
              inputProps={{ min: 1, max: 31 }}
              onChange={e => set("dueDay", e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="cliente-recorrencia">Recorrência</InputLabel>
              <Select
                labelId="cliente-recorrencia"
                label="Recorrência"
                value={form.recurrence || "MENSAL"}
                onChange={e => set("recurrence", e.target.value)}
              >
                {RECORRENCIAS.map(item => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              type="date"
              variant="outlined"
              label="Próximo vencimento"
              InputLabelProps={{ shrink: true }}
              value={form.dueDate || ""}
              onChange={e => set("dueDate", e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  color="primary"
                  checked={!!form.status}
                  onChange={e => set("status", e.target.checked)}
                />
              }
              label="Cliente ativo"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="caption" color="textSecondary">
              Alterar os dias de teste reinicia a contagem a partir de hoje e só
              é aceito enquanto nenhuma cobrança do cliente tiver sido emitida.
              Mudar plano ou mensalidade refaz a fatura automática em aberto que
              ainda não virou cobrança.
              {cliente?.trialEndsAt
                ? ` Teste atual até ${moment(cliente.trialEndsAt).format(
                    "DD/MM/YYYY"
                  )}.`
                : ""}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={aoFechar} disabled={salvando}>
          Fechar
        </Button>
        <Button
          color="primary"
          variant="contained"
          onClick={handleSalvar}
          disabled={salvando}
        >
          {salvando ? <CircularProgress size={18} /> : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalCliente;
