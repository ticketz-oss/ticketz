import CompanyWhatsAppModeField from "../CompanyWhatsAppModeField";
import React, { useState, useEffect, useContext } from "react";
import {
  makeStyles,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  IconButton,
  Select,
  Typography
} from "@material-ui/core";
import { Formik, Form, Field } from "formik";
import ButtonWithSpinner from "../ButtonWithSpinner";
import ConfirmationModal from "../ConfirmationModal";

import { Edit as EditIcon } from "@material-ui/icons";

import { toast } from "react-toastify";
import useCompanies from "../../hooks/useCompanies";
import usePlans from "../../hooks/usePlans";
import ModalUsers from "../ModalUsers";
import api from "../../services/api";
import { head, isArray, has } from "lodash";
import { useDate } from "../../hooks/useDate";
import useSettings from "../../hooks/useSettings";
import { SelectLanguage } from "../SelectLanguage";

import moment from "moment";

import { AuthContext } from "../../context/Auth/AuthContext";
import { i18n } from "../../translate/i18n";
import { timeZonesNames } from "@vvo/tzdb";
import { podeVerCentralCobranca } from "../../helpers/billingConsole";

const initialDueDate = () => moment().add(3, "days").format("YYYY-MM-DD");

const useStyles = makeStyles(theme => ({
  root: {
    width: "100%"
  },
  mainPaper: {
    width: "100%",
    flex: 1,
    padding: theme.spacing(2)
  },
  fullWidth: {
    width: "100%"
  },
  tableContainer: {
    width: "100%",
    overflowX: "scroll",
    ...theme.scrollbarStyles
  },
  textfield: {
    width: "100%"
  },
  textRight: {
    textAlign: "right"
  },
  row: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2)
  },
  control: {
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1)
  },
  buttonContainer: {
    textAlign: "right",
    padding: theme.spacing(1)
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
  }
}));

export function CompanyForm(props) {
  const { onSubmit, onDelete, onImpersonate, onCancel, initialValue, loading } =
    props;
  const classes = useStyles();
  const [plans, setPlans] = useState([]);
  const [partners, setPartners] = useState([]);
  const [modalUser, setModalUser] = useState(false);
  const [firstUser, setFirstUser] = useState({});
  const { user } = useContext(AuthContext);

  const [record, setRecord] = useState({
    whatsappMode: "normal",
    name: "",
    email: "",
    phone: "",
    language: "",
    timezone: "",
    planId: "",
    status: true,
    campaignsEnabled: false,
    voiceCallsEnabled: false,
    dueDate: initialDueDate(),
    trialDays: 0,
    dueDay: Number(moment(initialDueDate()).format("D")),
    recurrence: "MENSAL",
    slug: "",
    partnerId: "",
    saleValue: "",
    introValue: "",
    introMonths: "",
    ...initialValue
  });

  const { list: listPlans } = usePlans();
  const billingManagedInCentral =
    podeVerCentralCobranca(user) && record.id !== undefined;

  useEffect(() => {
    async function fetchData() {
      const list = await listPlans();
      setPlans(list);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api
      .get("/partners", { params: { pageNumber: 1 } })
      .then(({ data }) => setPartners(data.partners || []))
      .catch(() => setPartners([]));
  }, []);

  useEffect(() => {
    setRecord(prev => {
      const dueDate = moment(
        initialValue.dueDate,
        moment.ISO_8601,
        true
      ).isValid()
        ? moment(initialValue.dueDate).format("YYYY-MM-DD")
        : "";

      return {
        ...prev,
        ...initialValue,
        whatsappMode: initialValue.whatsappMode || "normal",
        timezone: initialValue.timezone || "",
        dueDate,
        trialDays: initialValue.trialDays ?? 0,
        dueDay:
          initialValue.dueDay ??
          (dueDate ? Number(moment(dueDate).format("D")) : 1)
      };
    });
  }, [initialValue]);

  const handleSubmit = async data => {
    const normalizedData = { ...data };
    normalizedData.dueDate = moment(
      normalizedData.dueDate,
      moment.ISO_8601,
      true
    ).isValid()
      ? moment(normalizedData.dueDate).format("YYYY-MM-DD")
      : null;
    // Venda direta: sem parceiro o preco volta a ser o do plano.
    normalizedData.partnerId =
      normalizedData.partnerId === "" ? null : Number(normalizedData.partnerId);
    normalizedData.saleValue =
      normalizedData.saleValue === "" || normalizedData.saleValue === null
        ? null
        : Number(normalizedData.saleValue);
    normalizedData.introValue =
      normalizedData.introValue === "" || normalizedData.introValue === null
        ? null
        : Number(normalizedData.introValue);
    normalizedData.introMonths =
      normalizedData.introMonths === "" || normalizedData.introMonths === null
        ? null
        : Number(normalizedData.introMonths);
    normalizedData.trialDays = Number(normalizedData.trialDays);
    normalizedData.dueDay = Number(normalizedData.dueDay);
    if (billingManagedInCentral) {
      [
        "planId",
        "saleValue",
        "introValue",
        "introMonths",
        "trialDays",
        "dueDay",
        "dueDate",
        "recurrence"
      ].forEach(field => delete normalizedData[field]);
    }
    // The parent resets only after the request succeeds. Keep the selected
    // provider and entered data intact when validation or the network fails.
    await onSubmit(normalizedData);
  };

  const handleOpenModalUsers = async () => {
    try {
      const { data } = await api.get("/users/list", {
        params: {
          companyId: initialValue.id
        }
      });
      if (isArray(data) && data.length) {
        setFirstUser(head(data));
      }
      setModalUser(true);
    } catch (e) {
      toast.error(e);
    }
  };

  const handleCloseModalUsers = () => {
    setFirstUser({});
    setModalUser(false);
  };

  const incrementDueDate = () => {
    const data = { ...record };
    if (data.dueDate !== "" && data.dueDate !== null) {
      switch (data.recurrence) {
        case "MENSAL":
          data.dueDate = moment(data.dueDate)
            .add(1, "month")
            .format("YYYY-MM-DD");
          break;
        case "BIMESTRAL":
          data.dueDate = moment(data.dueDate)
            .add(2, "month")
            .format("YYYY-MM-DD");
          break;
        case "TRIMESTRAL":
          data.dueDate = moment(data.dueDate)
            .add(3, "month")
            .format("YYYY-MM-DD");
          break;
        case "SEMESTRAL":
          data.dueDate = moment(data.dueDate)
            .add(6, "month")
            .format("YYYY-MM-DD");
          break;
        case "ANUAL":
          data.dueDate = moment(data.dueDate)
            .add(12, "month")
            .format("YYYY-MM-DD");
          break;
        default:
          break;
      }
    }
    setRecord(data);
  };

  return (
    <>
      <ModalUsers
        userId={firstUser.id}
        companyId={initialValue.id}
        open={modalUser}
        onClose={handleCloseModalUsers}
      />
      <Formik
        enableReinitialize
        className={classes.fullWidth}
        initialValues={record}
        onSubmit={handleSubmit}
      >
        {(values, setValues) => (
          <Form className={classes.fullWidth}>
            <Grid spacing={2} justifyContent="flex-end" container>
              <Grid xs={12} sm={6} item>
                <CompanyWhatsAppModeField
                  value={values.values.whatsappMode}
                  onChange={values.handleChange}
                  disabled={record.id !== undefined}
                />
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <Field
                  as={TextField}
                  label="Nome"
                  name="name"
                  variant="outlined"
                  className={classes.fullWidth}
                  margin="dense"
                />
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <Field
                  as={TextField}
                  label="Subdomínio (slug)"
                  name="slug"
                  variant="outlined"
                  className={classes.fullWidth}
                  margin="dense"
                  helperText="Ex.: teste → teste.seudominio.com.br"
                  onChange={e =>
                    values.setFieldValue(
                      "slug",
                      (e.target.value || "")
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "")
                    )
                  }
                />
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <Field
                  as={TextField}
                  label="E-mail"
                  name="email"
                  variant="outlined"
                  className={classes.fullWidth}
                  margin="dense"
                  required
                />
              </Grid>
              <Grid xs={12} sm={6} md={2} item>
                <Field
                  as={TextField}
                  label="Telefone"
                  name="phone"
                  variant="outlined"
                  className={classes.fullWidth}
                  margin="dense"
                />
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <Field
                  as={TextField}
                  select
                  label="Fuso horário padrão"
                  name="timezone"
                  variant="outlined"
                  className={classes.fullWidth}
                  margin="dense"
                  helperText="Automático usa o fuso do primeiro usuário que acessar."
                >
                  <MenuItem value="">Automático no primeiro acesso</MenuItem>
                  {timeZonesNames.map(timezone => (
                    <MenuItem key={timezone} value={timezone}>
                      {timezone}
                    </MenuItem>
                  ))}
                </Field>
              </Grid>
              <Grid xs={12} sm={6} md={2} item>
                <Field
                  as={SelectLanguage}
                  name="language"
                  fullWidth
                  variant="outlined"
                  margin="dense"
                />
              </Grid>
              {!billingManagedInCentral && (
                <Grid xs={12} sm={6} md={2} item>
                  <FormControl margin="dense" variant="outlined" fullWidth>
                    <InputLabel htmlFor="plan-selection">Plano</InputLabel>
                    <Field
                      as={Select}
                      id="plan-selection"
                      label="Plano"
                      labelId="plan-selection-label"
                      name="planId"
                      margin="dense"
                      required
                    >
                      {plans.map((plan, key) => (
                        <MenuItem key={key} value={plan.id}>
                          {plan.name}
                        </MenuItem>
                      ))}
                    </Field>
                  </FormControl>
                </Grid>
              )}
              <Grid xs={12} sm={6} md={2} item>
                <FormControl margin="dense" variant="outlined" fullWidth>
                  <InputLabel htmlFor="voice-calls-selection">
                    {i18n.t("voiceCalls.companySwitch")}
                  </InputLabel>
                  <Field
                    as={Select}
                    id="voice-calls-selection"
                    label={i18n.t("voiceCalls.companySwitch")}
                    name="voiceCallsEnabled"
                    margin="dense"
                  >
                    <MenuItem value={true}>
                      {i18n.t("voiceCalls.enabled")}
                    </MenuItem>
                    <MenuItem value={false}>
                      {i18n.t("voiceCalls.disabled")}
                    </MenuItem>
                  </Field>
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6} md={2} item>
                <FormControl margin="dense" variant="outlined" fullWidth>
                  <InputLabel htmlFor="status-selection">Status</InputLabel>
                  <Field
                    as={Select}
                    id="status-selection"
                    label="Status"
                    labelId="status-selection-label"
                    name="status"
                    margin="dense"
                  >
                    <MenuItem value={true}>Sim</MenuItem>
                    <MenuItem value={false}>Não</MenuItem>
                  </Field>
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6} md={2} item>
                <FormControl margin="dense" variant="outlined" fullWidth>
                  <InputLabel htmlFor="status-selection">Campanhas</InputLabel>
                  <Field
                    as={Select}
                    id="campaigns-selection"
                    label="Campanhas"
                    labelId="campaigns-selection-label"
                    name="campaignsEnabled"
                    margin="dense"
                  >
                    <MenuItem value={true}>Habilitadas</MenuItem>
                    <MenuItem value={false}>Desabilitadas</MenuItem>
                  </Field>
                </FormControl>
              </Grid>
              {billingManagedInCentral ? (
                <Grid xs={12} item>
                  <Typography variant="body2" color="textSecondary">
                    Plano, mensalidade, teste e vencimentos são gerenciados na
                    Central de Cobrança.
                  </Typography>
                </Grid>
              ) : (
                <>
                  <Grid xs={12} sm={6} md={2} item>
                    <FormControl variant="outlined" fullWidth>
                      <Field
                        as={TextField}
                        label="Data de Vencimento"
                        type="date"
                        name="dueDate"
                        InputLabelProps={{
                          shrink: true
                        }}
                        variant="outlined"
                        fullWidth
                        margin="dense"
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} sm={6} md={2} item>
                    <Field
                      as={TextField}
                      label={i18n.t("billing.trialDays")}
                      helperText={i18n.t("billing.trialDaysHelp")}
                      type="number"
                      name="trialDays"
                      inputProps={{ min: 0, max: 3650, step: 1 }}
                      variant="outlined"
                      fullWidth
                      margin="dense"
                      required
                    />
                  </Grid>
                  <Grid xs={12} sm={6} md={2} item>
                    <Field
                      as={TextField}
                      label={i18n.t("billing.dueDay")}
                      helperText={i18n.t("billing.dueDayHelp")}
                      type="number"
                      name="dueDay"
                      inputProps={{ min: 1, max: 31, step: 1 }}
                      variant="outlined"
                      fullWidth
                      margin="dense"
                      required
                    />
                  </Grid>
                  <Grid xs={12} sm={6} md={2} item>
                    <FormControl margin="dense" variant="outlined" fullWidth>
                      <InputLabel htmlFor="recorrencia-selection">
                        Recorrência
                      </InputLabel>
                      <Field
                        as={Select}
                        label="Recorrência"
                        labelId="recorrencia-selection-label"
                        id="recurrence"
                        name="recurrence"
                        margin="dense"
                      >
                        <MenuItem value="MENSAL">Mensal</MenuItem>
                        <MenuItem value="BIMESTRAL">Bimestral</MenuItem>
                        <MenuItem value="TRIMESTRAL">Trimestral</MenuItem>
                        <MenuItem value="SEMESTRAL">Semestral</MenuItem>
                        <MenuItem value="ANUAL">Anual</MenuItem>
                      </Field>
                    </FormControl>
                  </Grid>
                </>
              )}
              <Grid xs={12} sm={6} md={2} item>
                <FormControl margin="dense" variant="outlined" fullWidth>
                  <InputLabel htmlFor="partner-selection">
                    Vendido por
                  </InputLabel>
                  <Field
                    as={Select}
                    id="partner-selection"
                    label="Vendido por"
                    labelId="partner-selection-label"
                    name="partnerId"
                    margin="dense"
                  >
                    <MenuItem value="">Venda direta</MenuItem>
                    {partners.map(partner => (
                      <MenuItem key={partner.id} value={partner.id}>
                        {partner.name} ({partner.discountPct}%)
                      </MenuItem>
                    ))}
                  </Field>
                </FormControl>
              </Grid>
              {!billingManagedInCentral && (
                <>
                  <Grid xs={12} sm={6} md={2} item>
                    <Field
                      as={TextField}
                      label="Preço de venda"
                      name="saleValue"
                      type="number"
                      variant="outlined"
                      className={classes.fullWidth}
                      margin="dense"
                      helperText="Vazio = valor do plano"
                    />
                  </Grid>
                  <Grid xs={12} sm={6} md={2} item>
                    <Field
                      as={TextField}
                      label="Valor dos primeiros meses"
                      name="introValue"
                      type="number"
                      variant="outlined"
                      className={classes.fullWidth}
                      margin="dense"
                      helperText="Opcional. Vazio = sempre o preço de venda"
                    />
                  </Grid>
                  <Grid xs={12} sm={6} md={2} item>
                    <Field
                      as={TextField}
                      label="Durante quantos meses"
                      name="introMonths"
                      type="number"
                      variant="outlined"
                      className={classes.fullWidth}
                      margin="dense"
                      helperText="Depois volta ao preço de venda"
                    />
                  </Grid>
                </>
              )}
              <Grid xs={12} item>
                <Grid justifyContent="flex-end" spacing={1} container>
                  <Grid xs={4} md={1} item>
                    <ButtonWithSpinner
                      className={classes.fullWidth}
                      style={{ marginTop: 7 }}
                      loading={loading}
                      onClick={() => onCancel()}
                      variant="contained"
                    >
                      Limpar
                    </ButtonWithSpinner>
                  </Grid>
                  {record.id !== undefined ? (
                    <>
                      <Grid xs={6} md={2} item>
                        <ButtonWithSpinner
                          style={{ marginTop: 7 }}
                          className={classes.fullWidth}
                          loading={loading}
                          onClick={() => onImpersonate(record)}
                          variant="outlined"
                          color="primary"
                        >
                          Acessar como
                        </ButtonWithSpinner>
                      </Grid>
                      <Grid xs={6} md={1} item>
                        <ButtonWithSpinner
                          style={{ marginTop: 7 }}
                          className={classes.fullWidth}
                          loading={loading}
                          onClick={() => onDelete(record)}
                          variant="contained"
                          color="secondary"
                        >
                          Excluir
                        </ButtonWithSpinner>
                      </Grid>
                      {!billingManagedInCentral && (
                        <Grid xs={6} md={2} item>
                          <ButtonWithSpinner
                            style={{ marginTop: 7 }}
                            className={classes.fullWidth}
                            loading={loading}
                            onClick={() => incrementDueDate()}
                            variant="contained"
                            color="primary"
                          >
                            + Vencimento
                          </ButtonWithSpinner>
                        </Grid>
                      )}
                      <Grid xs={6} md={1} item>
                        <ButtonWithSpinner
                          style={{ marginTop: 7 }}
                          className={classes.fullWidth}
                          loading={loading}
                          onClick={() => handleOpenModalUsers()}
                          variant="contained"
                          color="primary"
                        >
                          Usuário
                        </ButtonWithSpinner>
                      </Grid>
                    </>
                  ) : null}
                  <Grid xs={6} md={1} item>
                    <ButtonWithSpinner
                      className={classes.fullWidth}
                      style={{ marginTop: 7 }}
                      loading={loading}
                      type="submit"
                      variant="contained"
                      color="primary"
                    >
                      Salvar
                    </ButtonWithSpinner>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    </>
  );
}

export function CompaniesManagerGrid(props) {
  const { records, onSelect } = props;
  const classes = useStyles();
  const { dateToClient } = useDate();
  const { getSetting } = useSettings();
  const [gracePeriod, setGracePeriod] = useState(5);

  useEffect(() => {
    getSetting("gracePeriod").then(value => {
      if (!isNaN(Number(value))) {
        setGracePeriod(Number(value));
      }
    });
  }, [getSetting]);

  const renderStatus = row => {
    return row.status === false ? "Não" : "Sim";
  };

  const renderPlan = row => {
    return row.planId !== null ? row.plan.name : "-";
  };

  const renderCampaignsStatus = row => {
    if (
      has(row, "settings") &&
      isArray(row.settings) &&
      row.settings.length > 0
    ) {
      const setting = row.settings.find(s => s.key === "campaignsEnabled");
      if (setting) {
        return setting.value === "true" ? "Habilitadas" : "Desabilitadas";
      }
    }
    return "Desabilitadas";
  };

  const renderVoiceStatus = row => {
    const setting = row.settings?.find(s => s.key === "voiceCallsEnabled");
    return setting?.value === "true"
      ? i18n.t("voiceCalls.enabled")
      : i18n.t("voiceCalls.disabled");
  };

  const rowClass = record => {
    if (moment(record.dueDate).isValid()) {
      const now = moment();
      const dueDate = moment(record.dueDate);
      const diff = dueDate.diff(now, "days");
      if (diff < -gracePeriod) {
        return classes.inactive;
      }
      if (diff < 0) {
        return classes.gracePeriod;
      }
      if (diff < 7) {
        return classes.almostDue;
      }
    }
    return classes.active;
  };

  return (
    <Paper className={classes.tableContainer}>
      <Table
        className={classes.fullWidth}
        size="small"
        aria-label="a dense table"
      >
        <TableHead>
          <TableRow>
            <TableCell align="center" style={{ width: "1%" }}>
              #
            </TableCell>
            <TableCell align="left">Nome</TableCell>
            <TableCell align="left">E-mail</TableCell>
            <TableCell align="left">Telefone</TableCell>
            <TableCell align="left">Plano</TableCell>
            <TableCell align="left">Campanhas</TableCell>
            <TableCell align="left">
              {i18n.t("voiceCalls.companySwitch")}
            </TableCell>
            <TableCell align="left">Status</TableCell>
            <TableCell align="left">Criada Em</TableCell>
            <TableCell align="left">Vencimento</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((row, key) => (
            <TableRow className={rowClass(row)} key={key}>
              <TableCell align="center" style={{ width: "1%" }}>
                <IconButton onClick={() => onSelect(row)} aria-label="delete">
                  <EditIcon />
                </IconButton>
              </TableCell>
              <TableCell align="left" style={{ color: "unset" }}>
                {row.name || "-"}
              </TableCell>
              <TableCell align="left" style={{ color: "unset" }}>
                {row.email || "-"}
              </TableCell>
              <TableCell align="left" style={{ color: "unset" }}>
                {row.phone || "-"}
              </TableCell>
              <TableCell align="left" style={{ color: "unset" }}>
                {renderPlan(row)}
              </TableCell>
              <TableCell align="left" style={{ color: "unset" }}>
                {renderCampaignsStatus(row)}
              </TableCell>
              <TableCell align="left" style={{ color: "unset" }}>
                {renderVoiceStatus(row)}
              </TableCell>
              <TableCell align="left" style={{ color: "unset" }}>
                {renderStatus(row)}
              </TableCell>
              <TableCell align="left" style={{ color: "unset" }}>
                {dateToClient(row.createdAt)}
              </TableCell>
              <TableCell align="left" style={{ color: "unset" }}>
                {dateToClient(row.dueDate)}
                <br />
                <span>{row.recurrence}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

export default function CompaniesManager() {
  const classes = useStyles();
  const { list, save, update, remove } = useCompanies();

  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = useState(false);
  const [showConfirmImpersonateDialog, setShowConfirmImpersonateDialog] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [record, setRecord] = useState({
    whatsappMode: "normal",
    name: "",
    email: "",
    phone: "",
    language: "",
    timezone: "",
    planId: "",
    status: true,
    campaignsEnabled: false,
    voiceCallsEnabled: false,
    dueDate: initialDueDate(),
    trialDays: 0,
    dueDay: Number(moment(initialDueDate()).format("D")),
    recurrence: "MENSAL",
    slug: "",
    partnerId: "",
    saleValue: "",
    introValue: "",
    introMonths: ""
  });

  const { handleImpersonate } = useContext(AuthContext);

  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const companyList = await list();
      setRecords(companyList);
    } catch (e) {
      toast.error("Não foi possível carregar a lista de registros");
    }
    setLoading(false);
  };

  const handleSubmit = async data => {
    setLoading(true);
    try {
      if (data.id !== undefined) {
        await update(data);
      } else {
        await save(data);
      }
      await loadPlans();
      handleCancel();
      toast.success("Operação realizada com sucesso!");
    } catch (e) {
      toast.error(
        "Não foi possível realizar a operação. Verifique se já existe uma empresa com o mesmo nome ou se os campos foram preenchidos corretamente"
      );
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await remove(record.id);
      await loadPlans();
      handleCancel();
      toast.success("Operação realizada com sucesso!");
    } catch (e) {
      toast.error("Não foi possível realizar a operação");
    }
    setLoading(false);
  };

  const onImpersonate = async () => {
    handleImpersonate(record.id);
  };

  const handleOpenDeleteDialog = () => {
    setShowConfirmDeleteDialog(true);
  };

  const handleOpenImpersonateDialog = () => {
    setShowConfirmImpersonateDialog(true);
  };

  const handleCancel = () => {
    setRecord(prev => ({
      ...prev,
      id: undefined,
      slug: "",
      whatsappMode: "normal",
      name: "",
      email: "",
      phone: "",
      language: "",
      planId: "",
      status: true,
      campaignsEnabled: false,
      voiceCallsEnabled: false,
      dueDate: initialDueDate(),
      trialDays: 0,
      dueDay: Number(moment(initialDueDate()).format("D")),
      recurrence: "MENSAL",
      partnerId: "",
      saleValue: "",
      introValue: "",
      introMonths: ""
    }));
  };

  const handleSelect = data => {
    let campaignsEnabled = false;
    let voiceCallsEnabled = false;

    const setting = (data.settings || []).find(
      s => s.key.indexOf("campaignsEnabled") > -1
    );
    if (setting) {
      campaignsEnabled =
        setting.value === "true" || setting.value === "enabled";
    }
    const voiceSetting = (data.settings || []).find(
      s => s.key === "voiceCallsEnabled"
    );
    if (voiceSetting) {
      voiceCallsEnabled = voiceSetting.value === "true";
    }

    setRecord(prev => ({
      ...prev,
      whatsappMode: data.whatsappMode || "normal",
      id: data.id,
      name: data.name || "",
      phone: data.phone || "",
      language: data.language || "",
      email: data.email || "",
      planId: data.planId || "",
      status: data.status === false ? false : true,
      campaignsEnabled,
      voiceCallsEnabled,
      dueDate: data.dueDate || "",
      trialDays: data.trialDays ?? 0,
      dueDay:
        data.dueDay ??
        (data.dueDate ? Number(moment(data.dueDate).format("D")) : 1),
      recurrence: data.recurrence || "",
      slug: data.slug || "",
      partnerId: data.partnerId || "",
      saleValue: data.saleValue ?? "",
      introValue: data.introValue ?? "",
      introMonths: data.introMonths ?? ""
    }));
  };

  return (
    <Paper className={`${classes.mainPaper} sd-company-register`} elevation={0}>
      <Grid spacing={2} container>
        <Grid xs={12} item>
          <CompanyForm
            initialValue={record}
            onDelete={handleOpenDeleteDialog}
            onImpersonate={handleOpenImpersonateDialog}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        </Grid>
        <Grid xs={12} item>
          <CompaniesManagerGrid records={records} onSelect={handleSelect} />
        </Grid>
      </Grid>
      <ConfirmationModal
        title="Exclusão de Registro"
        open={showConfirmDeleteDialog}
        onClose={() => setShowConfirmDeleteDialog(false)}
        onConfirm={() => handleDelete()}
      >
        Deseja realmente excluir esse registro?
      </ConfirmationModal>
      <ConfirmationModal
        title="Acessar como"
        open={showConfirmImpersonateDialog}
        onClose={() => setShowConfirmImpersonateDialog(false)}
        onConfirm={() => onImpersonate()}
      >
        Deseja acessar o sistema como esta empresa?
      </ConfirmationModal>
    </Paper>
  );
}
