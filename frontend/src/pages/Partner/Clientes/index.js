import CompanyWhatsAppModeField from "../../../components/CompanyWhatsAppModeField";
import React, { useCallback, useEffect, useState } from "react";
import moment from "moment";
import { toast } from "react-toastify";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import ButtonWithSpinner from "../../../components/ButtonWithSpinner";
import MainContainer from "../../../components/MainContainer";
import MainHeader from "../../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../../components/MainHeaderButtonsWrapper";
import TableRowSkeleton from "../../../components/TableRowSkeleton";
import Title from "../../../components/Title";
import partnerApi from "../../../services/partnerApi";
import toastError from "../../../errors/toastError";
import { formatCurrency } from "../format";
import { timeZonesNames } from "@vvo/tzdb";

const useStyles = makeStyles(theme => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles
  },
  fullWidth: {
    width: "100%"
  },
  inactive: {
    color: theme.isStardew ? "#805335" : "gray"
  },
  gracePeriod: {
    color: theme.isStardew ? "#9e6926" : "orange"
  },
  almostDue: {
    color: theme.isStardew
      ? "#44748a"
      : theme.mode === "light"
        ? "blue"
        : "#38f"
  },
  introHint: {
    display: "block",
    lineHeight: 1.2
  },
  marginSummary: {
    marginTop: theme.spacing(0.5)
  }
}));

const emptyForm = {
  whatsappMode: "normal",
  name: "",
  email: "",
  phone: "",
  password: "",
  planId: "",
  saleValue: "",
  introValue: "",
  introMonths: "",
  recurrence: "MENSAL",
  timezone: ""
};

const toNumberOrNull = value => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const introEndsAt = company => {
  if (!company.introValue || !(Number(company.introMonths) > 0)) {
    return null;
  }
  const createdAt = moment(company.createdAt);
  if (!createdAt.isValid()) {
    return null;
  }
  return createdAt.add(Number(company.introMonths), "months");
};

const PartnerClientes = () => {
  const classes = useStyles();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [plans, setPlans] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await partnerApi.get("/partner/companies");
      setRows(data);
    } catch (error) {
      toastError(error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCompanies();

    partnerApi
      .get("/partner/plans")
      .then(({ data }) => setPlans(data))
      .catch(toastError);
  }, [loadCompanies]);

  const selectedPlan = plans.find(plan => plan.id === form.planId);
  const floor = selectedPlan?.resellerCost ?? null;

  const belowFloor = value =>
    floor != null && value !== "" && Number(value) < Number(floor);

  const saleError = belowFloor(form.saleValue);
  const introError = belowFloor(form.introValue);
  const monthsError =
    form.introValue !== "" && !(Number(form.introMonths) >= 1);

  const requiredFilled =
    !!form.name &&
    !!form.email &&
    !!form.planId &&
    form.saleValue !== "" &&
    (!!editingId || !!form.password);

  const canSave =
    !saleError && !introError && !monthsError && requiredFilled && !saving;

  const saleMargin =
    floor != null && form.saleValue !== "" && !saleError
      ? Number(form.saleValue) - Number(floor)
      : null;
  const introMargin =
    floor != null && form.introValue !== "" && !introError && !monthsError
      ? Number(form.introValue) - Number(floor)
      : null;

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const handleOpenEdit = row => {
    setEditingId(row.company.id);
    setForm({
      ...emptyForm,
      whatsappMode: row.company.whatsappMode || "normal",
      name: row.company.name || "",
      email: row.company.email || "",
      phone: row.company.phone || "",
      planId: row.company.planId || "",
      saleValue: row.company.saleValue ?? "",
      introValue: row.company.introValue ?? "",
      introMonths: row.company.introMonths ?? "",
      recurrence: row.company.recurrence || "MENSAL",
      timezone: row.company.timezone || ""
    });
    setModalOpen(true);
  };

  const handleChange = field => event => {
    setForm(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    if (floor != null && Number(form.saleValue) < Number(floor)) {
      toast.error(
        `O preço de venda não pode ser menor que o seu custo de ${formatCurrency(
          floor
        )}`
      );
      return;
    }

    if (
      floor != null &&
      form.introValue !== "" &&
      Number(form.introValue) < Number(floor)
    ) {
      toast.error(
        `O valor dos primeiros meses não pode ser menor que o seu custo de ${formatCurrency(
          floor
        )}`
      );
      return;
    }

    if (form.introValue !== "" && !(Number(form.introMonths) >= 1)) {
      toast.error(
        "Informe durante quantos meses o valor inicial será cobrado (mínimo 1)."
      );
      return;
    }

    const introValue = toNumberOrNull(form.introValue);
    const introMonths =
      introValue == null ? null : toNumberOrNull(form.introMonths);

    setSaving(true);
    try {
      if (editingId) {
        await partnerApi.put(`/partner/companies/${editingId}`, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          planId: form.planId,
          timezone: form.timezone || null,
          saleValue: Number(form.saleValue),
          introValue,
          introMonths
        });
      } else {
        await partnerApi.post("/partner/companies", {
          ...form,
          saleValue: Number(form.saleValue),
          introValue,
          introMonths
        });
      }
      toast.success("Operação realizada com sucesso!");
      setModalOpen(false);
      await loadCompanies();
    } catch (error) {
      toastError(error);
    }
    setSaving(false);
  };

  const rowClass = company => {
    if (moment(company.dueDate).isValid()) {
      const diff = moment(company.dueDate).diff(moment(), "days");
      if (diff < -5) {
        return classes.inactive;
      }
      if (diff < 0) {
        return classes.gracePeriod;
      }
      if (diff < 7) {
        return classes.almostDue;
      }
    }
    return null;
  };

  const renderIntroPeriod = company => {
    const endsAt = introEndsAt(company);
    if (!endsAt || !endsAt.isAfter(moment())) {
      return null;
    }
    return (
      <Typography variant="caption" display="block" color="textSecondary">
        {formatCurrency(company.introValue)} até {endsAt.format("MM/YYYY")}
      </Typography>
    );
  };

  const renderPaymentStatus = row => {
    if (!row.openInvoice) {
      return "Em dia";
    }
    return moment(row.openInvoice.dueDate).isBefore(moment(), "day")
      ? "Em atraso"
      : "Aguardando pagamento";
  };

  return (
    <MainContainer className="sd-business sd-partner-clients">
      <MainHeader>
        <Title>Meus clientes</Title>
        <MainHeaderButtonsWrapper>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenCreate}
          >
            Novo cliente
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper className={classes.mainPaper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="left">Cliente</TableCell>
              <TableCell align="left">E-mail</TableCell>
              <TableCell align="left">Plano</TableCell>
              <TableCell align="right">Preço de venda</TableCell>
              <TableCell align="center">Vencimento</TableCell>
              <TableCell align="center">Pagamento</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && <TableRowSkeleton columns={7} />}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Você ainda não cadastrou nenhum cliente.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              rows.map(row => (
                <TableRow
                  key={row.company.id}
                  className={rowClass(row.company)}
                >
                  <TableCell align="left" style={{ color: "unset" }}>
                    {row.company.name}
                  </TableCell>
                  <TableCell align="left" style={{ color: "unset" }}>
                    {row.company.email || "-"}
                  </TableCell>
                  <TableCell align="left" style={{ color: "unset" }}>
                    {row.company.plan?.name || "-"}
                  </TableCell>
                  <TableCell align="right" style={{ color: "unset" }}>
                    {formatCurrency(row.company.saleValue)}
                    {renderIntroPeriod(row.company)}
                  </TableCell>
                  <TableCell align="center" style={{ color: "unset" }}>
                    {row.company.dueDate
                      ? moment(row.company.dueDate).format("DD/MM/YYYY")
                      : "-"}
                  </TableCell>
                  <TableCell align="center" style={{ color: "unset" }}>
                    {renderPaymentStatus(row)}
                  </TableCell>
                  <TableCell align="center" style={{ color: "unset" }}>
                    <Button size="small" onClick={() => handleOpenEdit(row)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          {editingId ? "Editar cliente" : "Cadastrar cliente"}
        </DialogTitle>
        <DialogContent dividers>
          <CompanyWhatsAppModeField
            value={form.whatsappMode}
            onChange={handleChange("whatsappMode")}
            disabled={!!editingId}
          />
          <Grid spacing={2} container>
            <Grid xs={12} sm={6} item>
              <TextField
                label="Nome da empresa"
                variant="outlined"
                margin="dense"
                className={classes.fullWidth}
                value={form.name}
                onChange={handleChange("name")}
                required
              />
            </Grid>
            <Grid xs={12} sm={6} item>
              <TextField
                label="E-mail"
                variant="outlined"
                margin="dense"
                className={classes.fullWidth}
                value={form.email}
                onChange={handleChange("email")}
                required
              />
            </Grid>
            <Grid xs={12} sm={6} item>
              <TextField
                label="Telefone"
                variant="outlined"
                margin="dense"
                className={classes.fullWidth}
                value={form.phone}
                onChange={handleChange("phone")}
              />
            </Grid>
            {!editingId && (
              <Grid xs={12} sm={6} item>
                <TextField
                  label="Senha do primeiro acesso"
                  type="password"
                  variant="outlined"
                  margin="dense"
                  className={classes.fullWidth}
                  value={form.password}
                  onChange={handleChange("password")}
                  required
                />
              </Grid>
            )}
            <Grid xs={12} sm={6} item>
              <FormControl variant="outlined" margin="dense" fullWidth>
                <InputLabel id="partner-plan-label">Plano</InputLabel>
                <Select
                  labelId="partner-plan-label"
                  label="Plano"
                  value={form.planId}
                  onChange={handleChange("planId")}
                >
                  {plans.map(plan => (
                    <MenuItem key={plan.id} value={plan.id}>
                      {plan.name} — seu custo{" "}
                      {formatCurrency(plan.resellerCost)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} sm={6} item>
              <TextField
                select
                label="Fuso horário padrão"
                variant="outlined"
                margin="dense"
                className={classes.fullWidth}
                value={form.timezone}
                onChange={handleChange("timezone")}
                helperText="Automático usa o fuso do primeiro usuário que acessar."
              >
                <MenuItem value="">Automático no primeiro acesso</MenuItem>
                {timeZonesNames.map(timezone => (
                  <MenuItem key={timezone} value={timezone}>
                    {timezone}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid xs={12} sm={6} item>
              <TextField
                label="Preço de venda"
                type="number"
                variant="outlined"
                margin="dense"
                className={classes.fullWidth}
                value={form.saleValue}
                onChange={handleChange("saleValue")}
                inputProps={{ min: floor ?? 0, step: "0.01" }}
                error={saleError}
                helperText={
                  floor == null
                    ? "Selecione um plano para ver o seu custo"
                    : saleError
                      ? `Abaixo do seu custo de ${formatCurrency(
                          floor
                        )} — a plataforma não cobre esse valor`
                      : `Seu custo neste plano: ${formatCurrency(floor)}`
                }
                required
              />
            </Grid>
            {!editingId && (
              <Grid xs={12} sm={6} item>
                <FormControl variant="outlined" margin="dense" fullWidth>
                  <InputLabel id="partner-recurrence-label">
                    Recorrência
                  </InputLabel>
                  <Select
                    labelId="partner-recurrence-label"
                    label="Recorrência"
                    value={form.recurrence}
                    onChange={handleChange("recurrence")}
                  >
                    <MenuItem value="MENSAL">Mensal</MenuItem>
                    <MenuItem value="BIMESTRAL">Bimestral</MenuItem>
                    <MenuItem value="TRIMESTRAL">Trimestral</MenuItem>
                    <MenuItem value="SEMESTRAL">Semestral</MenuItem>
                    <MenuItem value="ANUAL">Anual</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid xs={12} sm={6} item>
              <TextField
                label="Valor dos primeiros meses (opcional)"
                type="number"
                variant="outlined"
                margin="dense"
                className={classes.fullWidth}
                value={form.introValue}
                onChange={handleChange("introValue")}
                inputProps={{ min: floor ?? 0, step: "0.01" }}
                error={introError}
                helperText={
                  floor == null
                    ? "Selecione um plano para ver o seu custo"
                    : introError
                      ? `Abaixo do seu custo de ${formatCurrency(
                          floor
                        )} — a plataforma não cobre esse valor`
                      : `Seu custo neste plano: ${formatCurrency(floor)}`
                }
              />
            </Grid>
            <Grid xs={12} sm={6} item>
              <TextField
                label="Durante quantos meses"
                type="number"
                variant="outlined"
                margin="dense"
                className={classes.fullWidth}
                value={form.introMonths}
                onChange={handleChange("introMonths")}
                inputProps={{ min: 1, step: "1" }}
                error={monthsError}
                disabled={form.introValue === ""}
                helperText={
                  monthsError
                    ? "Informe pelo menos 1 mês"
                    : "Depois desse período a cobrança passa para a mensalidade."
                }
              />
            </Grid>
            <Grid xs={12} item>
              <Typography
                variant="caption"
                color="textSecondary"
                className={classes.introHint}
              >
                Cobre um valor diferente no início — acima, para embutir
                implantação, treinamento ou consultoria; ou abaixo, como
                desconto de captação. Depois a cobrança passa sozinha para a
                mensalidade.
              </Typography>
              {saleMargin != null && (
                <Typography
                  variant="body2"
                  color="textSecondary"
                  className={classes.marginSummary}
                >
                  {introMargin != null ? (
                    <>
                      Você recebe{" "}
                      <strong>{formatCurrency(introMargin)}/mês</strong>{" "}
                      {Number(form.introMonths) === 1
                        ? "no primeiro mês"
                        : `nos ${Number(form.introMonths)} primeiros meses`}{" "}
                      e <strong>{formatCurrency(saleMargin)}/mês</strong>{" "}
                      depois.
                    </>
                  ) : (
                    <>
                      Você recebe{" "}
                      <strong>{formatCurrency(saleMargin)}/mês</strong>.
                    </>
                  )}
                </Typography>
              )}
            </Grid>
            <Grid xs={12} item>
              <Typography variant="caption" color="textSecondary">
                O cliente nasce com 3 dias de teste. Se a primeira fatura não
                for paga, a conta é bloqueada automaticamente.
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <ButtonWithSpinner
            loading={saving}
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={!canSave}
          >
            Salvar
          </ButtonWithSpinner>
        </DialogActions>
      </Dialog>
    </MainContainer>
  );
};

export default PartnerClientes;
