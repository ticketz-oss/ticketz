import React, { useState, useEffect, useContext, useMemo } from "react";
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
  TableSortLabel,
  IconButton,
  Select,
  Tooltip
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
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    ...theme.scrollbarStyles
  },
  table: {
    minWidth: 900
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
  filterBar: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    padding: theme.spacing(1, 0),
    flexWrap: "wrap"
  },
  filterSelect: {
    minWidth: 200
  },
  filterCount: {
    fontSize: "0.8rem",
    color: theme.palette.text.secondary,
    marginLeft: "auto"
  },
  sortLabel: {
    "& .MuiTableSortLabel-icon": {
      opacity: 0.4
    }
  },
  inactive: {
    color: "gray"
  },
  gracePeriod: {
    color: "orange"
  },
  almostDue: {
    color: theme.mode === "light" ? "blue" : "#38f"
  },
  cellCompact: {
    paddingTop: 4,
    paddingBottom: 4,
    fontSize: "0.8rem"
  }
}));

// ─── helpers ────────────────────────────────────────────────────────────────

function getDiffDays(record) {
  if (!moment(record.dueDate).isValid()) return null;
  return moment(record.dueDate).diff(moment(), "days");
}

function getStatusCategory(record, gracePeriod) {
  const diff = getDiffDays(record);
  if (diff === null) return "active";
  if (diff < -gracePeriod) return "inactive";   // vencido
  if (diff < 0) return "grace";                 // período de carência
  if (diff < 7) return "almostDue";             // a vencer
  return "active";
}

const FILTER_OPTIONS = [
  { value: "all",      label: "Todos" },
  { value: "active",   label: "Clientes Ativos" },
  { value: "almostDue",label: "A Vencer (≤ 7 dias)" },
  { value: "inactive", label: "Clientes Vencidos" },
];

const SORTABLE_COLUMNS = [
  { id: "name",    label: "Nome" },
  { id: "phone",   label: "Telefone" },
  { id: "plan",    label: "Plano" },
  { id: "status",  label: "Status" },
  { id: "dueDate", label: "Vencimento" },
];

function compareRows(a, b, orderBy) {
  let valA, valB;
  switch (orderBy) {
    case "name":    valA = (a.name || "").toLowerCase();  valB = (b.name || "").toLowerCase();  break;
    case "phone":   valA = (a.phone || "").toLowerCase(); valB = (b.phone || "").toLowerCase(); break;
    case "plan":    valA = a.planId ? (a.plan?.name || "").toLowerCase() : ""; valB = b.planId ? (b.plan?.name || "").toLowerCase() : ""; break;
    case "status":  valA = a.status ? 1 : 0; valB = b.status ? 1 : 0; break;
    case "dueDate": valA = a.dueDate || ""; valB = b.dueDate || ""; break;
    default:        valA = ""; valB = "";
  }
  if (valA < valB) return -1;
  if (valA > valB) return 1;
  return 0;
}

// ─── CompanyForm ─────────────────────────────────────────────────────────────

export function CompanyForm(props) {
  const { onSubmit, onDelete, onImpersonate, onCancel, initialValue, loading } =
    props;
  const classes = useStyles();
  const [plans, setPlans] = useState([]);
  const [modalUser, setModalUser] = useState(false);
  const [firstUser, setFirstUser] = useState({});

  const [record, setRecord] = useState({
    name: "",
    email: "",
    phone: "",
    language: "",
    planId: "",
    status: true,
    campaignsEnabled: false,
    dueDate: "",
    recurrence: "",
    ...initialValue
  });

  const { list: listPlans } = usePlans();

  useEffect(() => {
    async function fetchData() {
      const list = await listPlans();
      setPlans(list);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setRecord(prev => {
      if (moment(initialValue).isValid()) {
        initialValue.dueDate = moment(initialValue.dueDate).format(
          "YYYY-MM-DD"
        );
      }
      return {
        ...prev,
        ...initialValue
      };
    });
  }, [initialValue]);

  const handleSubmit = async data => {
    if (data.dueDate === "" || moment(data.dueDate).isValid() === false) {
      data.dueDate = null;
    }
    onSubmit(data);
    setRecord({ ...initialValue, dueDate: "" });
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
        onSubmit={(values, { resetForm }) =>
          setTimeout(() => {
            handleSubmit(values);
            resetForm();
          }, 500)
        }
      >
        {(values, setValues) => (
          <Form className={classes.fullWidth}>
            <Grid spacing={2} justifyContent="flex-end" container>
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
              <Grid xs={12} sm={6} md={2} item>
                <Field
                  as={SelectLanguage}
                  name="language"
                  fullWidth
                  variant="outlined"
                  margin="dense"
                />
              </Grid>
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

// ─── CompaniesManagerGrid ────────────────────────────────────────────────────

export function CompaniesManagerGrid(props) {
  const { records, onSelect } = props;
  const classes = useStyles();
  const { dateToClient } = useDate();
  const { getSetting } = useSettings();
  const [gracePeriod, setGracePeriod] = useState(5);

  // Filter + sort state
  const [filter, setFilter]       = useState("all");
  const [orderBy, setOrderBy]     = useState("name");
  const [orderDir, setOrderDir]   = useState("asc");

  useEffect(() => {
    getSetting("gracePeriod").then(value => {
      if (!isNaN(Number(value))) {
        setGracePeriod(Number(value));
      }
    });
  }, [getSetting]);

  const handleSort = column => {
    if (orderBy === column) {
      setOrderDir(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setOrderBy(column);
      setOrderDir("asc");
    }
  };

  const renderStatus = row => (row.status === false ? "Não" : "Sim");

  const renderPlan = row => (row.planId !== null ? row.plan?.name || "-" : "-");

  const renderCampaignsStatus = row => {
    if (has(row, "settings") && isArray(row.settings) && row.settings.length > 0) {
      const setting = row.settings.find(s => s.key === "campaignsEnabled");
      if (setting) {
        return setting.value === "true" ? "Habilitadas" : "Desabilitadas";
      }
    }
    return "Desabilitadas";
  };

  const rowClass = record => {
    const cat = getStatusCategory(record, gracePeriod);
    if (cat === "inactive") return classes.inactive;
    if (cat === "grace")    return classes.gracePeriod;
    if (cat === "almostDue") return classes.almostDue;
    return undefined;
  };

  // Filtered + sorted list
  const visibleRecords = useMemo(() => {
    let filtered = records;

    if (filter !== "all") {
      filtered = records.filter(r => {
        const cat = getStatusCategory(r, gracePeriod);
        if (filter === "inactive") return cat === "inactive" || cat === "grace";
        if (filter === "almostDue") return cat === "almostDue";
        if (filter === "active") return cat === "active";
        return true;
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      const cmp = compareRows(a, b, orderBy);
      return orderDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [records, filter, orderBy, orderDir, gracePeriod]);

  // Count badges
  const counts = useMemo(() => {
    const c = { active: 0, almostDue: 0, inactive: 0, grace: 0 };
    records.forEach(r => {
      const cat = getStatusCategory(r, gracePeriod);
      c[cat] = (c[cat] || 0) + 1;
    });
    return c;
  }, [records, gracePeriod]);

  const filterLabels = {
    all:       `Todos (${records.length})`,
    active:    `Clientes Ativos (${counts.active})`,
    almostDue: `A Vencer — ≤ 7 dias (${counts.almostDue})`,
    inactive:  `Vencidos (${counts.inactive + counts.grace})`,
  };

  return (
    <Paper variant="outlined">
      {/* ── Barra de filtro ── */}
      <div className={classes.filterBar} style={{ padding: "8px 16px" }}>
        <FormControl variant="outlined" size="small" className={classes.filterSelect}>
          <InputLabel>Filtrar por situação</InputLabel>
          <Select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            label="Filtrar por situação"
          >
            {FILTER_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                {filterLabels[opt.value]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <span className={classes.filterCount}>
          {visibleRecords.length} registro{visibleRecords.length !== 1 ? "s" : ""}
          {filter !== "all" ? ` de ${records.length}` : ""}
        </span>
      </div>

      {/* ── Tabela ── */}
      <div className={classes.tableWrapper}>
        <Table className={classes.table} size="small" aria-label="companies table">
          <TableHead>
            <TableRow>
              <TableCell style={{ width: 40 }} />

              {SORTABLE_COLUMNS.map(col => (
                <TableCell key={col.id} sortDirection={orderBy === col.id ? orderDir : false}>
                  <Tooltip title={`Ordenar por ${col.label}`} enterDelay={300}>
                    <TableSortLabel
                      className={classes.sortLabel}
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? orderDir : "asc"}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  </Tooltip>
                </TableCell>
              ))}

              <TableCell>E-mail</TableCell>
              <TableCell>Campanhas</TableCell>
              <TableCell>Criada Em</TableCell>
              <TableCell>Recorrência</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" style={{ padding: 24, color: "gray" }}>
                  Nenhum registro encontrado para este filtro.
                </TableCell>
              </TableRow>
            ) : (
              visibleRecords.map((row, key) => (
                <TableRow className={rowClass(row)} key={key}>
                  <TableCell className={classes.cellCompact} style={{ width: 40 }}>
                    <IconButton size="small" onClick={() => onSelect(row)} aria-label="editar">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                  <TableCell className={classes.cellCompact} style={{ color: "unset" }}>
                    {row.name || "-"}
                  </TableCell>
                  <TableCell className={classes.cellCompact} style={{ color: "unset" }}>
                    {row.phone || "-"}
                  </TableCell>
                  <TableCell className={classes.cellCompact} style={{ color: "unset" }}>
                    {renderPlan(row)}
                  </TableCell>
                  <TableCell className={classes.cellCompact} style={{ color: "unset" }}>
                    {renderStatus(row)}
                  </TableCell>
                  <TableCell className={classes.cellCompact} style={{ color: "unset" }}>
                    {dateToClient(row.dueDate)}
                  </TableCell>
                  <TableCell className={classes.cellCompact} style={{ color: "unset" }}>
                    {row.email || "-"}
                  </TableCell>
                  <TableCell className={classes.cellCompact} style={{ color: "unset" }}>
                    {renderCampaignsStatus(row)}
                  </TableCell>
                  <TableCell className={classes.cellCompact} style={{ color: "unset" }}>
                    {dateToClient(row.createdAt)}
                  </TableCell>
                  <TableCell className={classes.cellCompact} style={{ color: "unset" }}>
                    {row.recurrence || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Paper>
  );
}

// ─── CompaniesManager (default) ──────────────────────────────────────────────

export default function CompaniesManager() {
  const classes = useStyles();
  const { list, save, update, remove } = useCompanies();

  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = useState(false);
  const [showConfirmImpersonateDialog, setShowConfirmImpersonateDialog] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [record, setRecord] = useState({
    name: "",
    email: "",
    phone: "",
    language: "",
    planId: "",
    status: true,
    campaignsEnabled: false,
    dueDate: "",
    recurrence: ""
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
      name: "",
      email: "",
      phone: "",
      language: "",
      planId: "",
      status: true,
      campaignsEnabled: false,
      dueDate: "",
      recurrence: ""
    }));
  };

  const handleSelect = data => {
    let campaignsEnabled = false;

    const setting = data.settings.find(
      s => s.key.indexOf("campaignsEnabled") > -1
    );
    if (setting) {
      campaignsEnabled =
        setting.value === "true" || setting.value === "enabled";
    }

    setRecord(prev => ({
      ...prev,
      id: data.id,
      name: data.name || "",
      phone: data.phone || "",
      language: data.language || "",
      email: data.email || "",
      planId: data.planId || "",
      status: data.status === false ? false : true,
      campaignsEnabled,
      dueDate: data.dueDate || "",
      recurrence: data.recurrence || ""
    }));
  };

  return (
    <Paper className={classes.mainPaper} elevation={0}>
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
