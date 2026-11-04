import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback
} from "react";
import {
  makeStyles,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  TextField,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  CircularProgress,
  Chip,
  Box,
  Divider,
  Fab
} from "@material-ui/core";
import { Formik, Form, Field } from "formik";
import ButtonWithSpinner from "../ButtonWithSpinner";
import ConfirmationModal from "../ConfirmationModal";

import {
  Edit as EditIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as PlanIcon,
  VolumeUp as CampaignsIcon,
  ToggleOn as StatusIcon,
  CalendarToday as CreatedIcon,
  Event as DueDateIcon,
  Search as SearchIcon,
  CheckCircle as ActiveIcon,
  List as AllIcon,
  Delete as DeleteIcon,
  ExitToApp as ImpersonateIcon,
  DateRange as AddPeriodIcon,
  Person as PersonIcon
} from "@material-ui/icons";

import { toast } from "react-toastify";
import useCompanies from "../../hooks/useCompanies";
import usePlans from "../../hooks/usePlans";
import ModalUsers from "../ModalUsers";
import api from "../../services/api";
import { head, isArray, has } from "lodash";
import { useDate } from "../../hooks/useDate";
import useSettings from "../../hooks/useSettings";
import { SelectLanguage } from "../SelectLanguage";
import { i18n } from "../../translate/i18n";

import moment from "moment";

import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles(theme => ({
  root: {
    width: "100%"
  },
  mainPaper: {
    width: "100%",
    flex: 1,
    position: "relative"
  },
  fullWidth: {
    width: "100%"
  },
  cardsContainer: {
    width: "100%",
    padding: theme.spacing(1)
  },
  card: {
    position: "relative",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: theme.shadows[4]
    }
  },
  statusChip: {
    position: "absolute",
    top: 8,
    right: 8,
    fontWeight: 600
  },
  statusActive: {
    backgroundColor: "#4caf50",
    color: "#fff"
  },
  statusInactive: {
    backgroundColor: "#9e9e9e",
    color: "#fff"
  },
  statusGracePeriod: {
    backgroundColor: "#ff9800",
    color: "#fff"
  },
  statusAlmostDue: {
    backgroundColor: theme.mode === "light" ? "#2196f3" : "#38f",
    color: "#fff"
  },
  cardContent: {
    paddingBottom: theme.spacing(1),
    "&:last-child": {
      paddingBottom: theme.spacing(1)
    }
  },
  cardActions: {
    justifyContent: "flex-end",
    paddingTop: 0,
    gap: theme.spacing(0.5)
  },
  companyName: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
    paddingRight: theme.spacing(10)
  },
  statsContainer: {
    marginTop: theme.spacing(2)
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    padding: theme.spacing(0.5, 0)
  },
  statIcon: {
    color: theme.palette.primary.main,
    fontSize: 20
  },
  statLabel: {
    color: theme.palette.text.secondary,
    fontSize: "0.75rem"
  },
  statValue: {
    fontWeight: 600,
    fontSize: "0.875rem"
  },
  divider: {
    margin: theme.spacing(2, 0)
  },
  sectionTitle: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: theme.palette.text.secondary,
    textTransform: "uppercase",
    marginBottom: theme.spacing(1)
  },
  fab: {
    position: "fixed",
    bottom: theme.spacing(3),
    right: theme.spacing(3),
    zIndex: 1000
  },
  searchContainer: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(2),
    gap: theme.spacing(1)
  },
  searchInput: {
    flex: 1
  },
  filterButton: {
    textTransform: "none",
    minWidth: "auto"
  },
  filterButtonActive: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    "&:hover": {
      backgroundColor: theme.palette.primary.dark
    }
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
  formSection: {
    marginBottom: theme.spacing(2)
  },
  sectionTitle: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: theme.palette.text.secondary,
    textTransform: "uppercase",
    marginBottom: theme.spacing(1)
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    padding: theme.spacing(2)
  }
}));

export function CompanyForm(props) {
  const { onSubmit, onCancel, initialValue, loading } = props;
  const classes = useStyles();
  const [plans, setPlans] = useState([]);

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

  return (
    <>
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
            <div className={classes.formSection}>
              <Typography className={classes.sectionTitle}>
                {i18n.t("companiesManager.section.basicInfo")}
              </Typography>
              <Grid spacing={2} container>
                <Grid xs={12} sm={6} item>
                  <Field
                    as={TextField}
                    label={i18n.t("common.name")}
                    name="name"
                    variant="outlined"
                    className={classes.fullWidth}
                    margin="dense"
                  />
                </Grid>
                <Grid xs={12} sm={6} item>
                  <Field
                    as={TextField}
                    label={i18n.t("common.email")}
                    name="email"
                    variant="outlined"
                    className={classes.fullWidth}
                    margin="dense"
                    required
                  />
                </Grid>
                <Grid xs={12} sm={6} item>
                  <Field
                    as={TextField}
                    label={i18n.t("common.phone")}
                    name="phone"
                    variant="outlined"
                    className={classes.fullWidth}
                    margin="dense"
                  />
                </Grid>
                <Grid xs={12} sm={6} item>
                  <Field
                    as={SelectLanguage}
                    name="language"
                    fullWidth
                    variant="outlined"
                    margin="dense"
                  />
                </Grid>
              </Grid>
            </div>

            <div className={classes.formSection}>
              <Typography className={classes.sectionTitle}>
                {i18n.t("companiesManager.section.subscription")}
              </Typography>
              <Grid spacing={2} container>
                <Grid xs={12} sm={6} md={4} item>
                  <FormControl margin="dense" variant="outlined" fullWidth>
                    <InputLabel htmlFor="plan-selection">
                      {i18n.t("companies.form.plan")}
                    </InputLabel>
                    <Field
                      as={Select}
                      id="plan-selection"
                      label={i18n.t("companies.form.plan")}
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
                <Grid xs={12} sm={6} md={4} item>
                  <FormControl margin="dense" variant="outlined" fullWidth>
                    <InputLabel htmlFor="status-selection">
                      {i18n.t("common.status")}
                    </InputLabel>
                    <Field
                      as={Select}
                      id="status-selection"
                      label={i18n.t("common.status")}
                      labelId="status-selection-label"
                      name="status"
                      margin="dense"
                    >
                      <MenuItem value={true}>{i18n.t("common.yes")}</MenuItem>
                      <MenuItem value={false}>{i18n.t("common.no")}</MenuItem>
                    </Field>
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6} md={4} item>
                  <FormControl margin="dense" variant="outlined" fullWidth>
                    <InputLabel htmlFor="campaigns-selection">
                      {i18n.t("companiesManager.form.campaigns")}
                    </InputLabel>
                    <Field
                      as={Select}
                      id="campaigns-selection"
                      label={i18n.t("companiesManager.form.campaigns")}
                      labelId="campaigns-selection-label"
                      name="campaignsEnabled"
                      margin="dense"
                    >
                      <MenuItem value={true}>
                        {i18n.t("common.enabled")}
                      </MenuItem>
                      <MenuItem value={false}>
                        {i18n.t("common.disabled")}
                      </MenuItem>
                    </Field>
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6} md={6} item>
                  <FormControl variant="outlined" fullWidth>
                    <Field
                      as={TextField}
                      label={i18n.t("common.dueDate")}
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
                <Grid xs={12} sm={6} md={6} item>
                  <FormControl margin="dense" variant="outlined" fullWidth>
                    <InputLabel htmlFor="recorrencia-selection">
                      {i18n.t("companiesManager.form.recurrence")}
                    </InputLabel>
                    <Field
                      as={Select}
                      label={i18n.t("companiesManager.form.recurrence")}
                      labelId="recorrencia-selection-label"
                      id="recurrence"
                      name="recurrence"
                      margin="dense"
                    >
                      <MenuItem value="MENSAL">
                        {i18n.t("companiesManager.form.monthly")}
                      </MenuItem>
                      <MenuItem value="BIMESTRAL">
                        {i18n.t("companiesManager.form.bimonthly")}
                      </MenuItem>
                      <MenuItem value="TRIMESTRAL">
                        {i18n.t("companiesManager.form.quarterly")}
                      </MenuItem>
                      <MenuItem value="SEMESTRAL">
                        {i18n.t("companiesManager.form.semiannual")}
                      </MenuItem>
                      <MenuItem value="ANUAL">
                        {i18n.t("companiesManager.form.annual")}
                      </MenuItem>
                    </Field>
                  </FormControl>
                </Grid>
              </Grid>
            </div>

            <Grid justifyContent="flex-end" spacing={1} container>
              <Grid xs={6} md={2} item>
                <ButtonWithSpinner
                  className={classes.fullWidth}
                  style={{ marginTop: 7 }}
                  loading={loading}
                  onClick={() => onCancel()}
                  variant="outlined"
                >
                  {i18n.t("common.cancel")}
                </ButtonWithSpinner>
              </Grid>
              <Grid xs={6} md={2} item>
                <ButtonWithSpinner
                  className={classes.fullWidth}
                  style={{ marginTop: 7 }}
                  loading={loading}
                  type="submit"
                  variant="contained"
                  color="primary"
                >
                  {i18n.t("common.save")}
                </ButtonWithSpinner>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    </>
  );
}

export function CompaniesManagerGrid(props) {
  const {
    records,
    onSelect,
    onLoadMore,
    hasMore,
    loading,
    onImpersonate,
    onDelete,
    onAddPeriod,
    onUsers
  } = props;
  const classes = useStyles();
  const { dateToClient } = useDate();
  const observerRef = useRef(null);

  const getStatusInfo = record => {
    const statusMap = {
      inactive: {
        label: i18n.t("common.inactive"),
        class: classes.statusInactive
      },
      gracePeriod: {
        label: i18n.t("companiesManager.status.gracePeriod"),
        class: classes.statusGracePeriod
      },
      almostDue: {
        label: i18n.t("companiesManager.status.almostDue"),
        class: classes.statusAlmostDue
      },
      active: {
        label: i18n.t("common.active"),
        class: classes.statusActive
      }
    };

    return statusMap[record.subscriptionStatus] || statusMap.active;
  };

  const renderPlan = row => {
    return row.plan && row.plan.name
      ? row.plan.name
      : i18n.t("common.undefined");
  };

  const renderCampaignsStatus = row => {
    if (
      has(row, "settings") &&
      isArray(row.settings) &&
      row.settings.length > 0
    ) {
      const setting = row.settings.find(s => s.key === "campaignsEnabled");
      if (setting) {
        return setting.value === "true"
          ? i18n.t("common.enabled")
          : i18n.t("common.disabled");
      }
    }
    return i18n.t("common.disabled");
  };

  const loadMoreRef = useCallback(
    node => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          onLoadMore();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore, onLoadMore]
  );

  return (
    <div className={classes.cardsContainer}>
      <Grid container spacing={2}>
        {records.map((row, key) => {
          const statusInfo = getStatusInfo(row);
          return (
            <Grid item xs={12} sm={6} md={6} lg={6} xl={4} key={key}>
              <Card
                className={classes.card}
                variant="outlined"
                onClick={() => onSelect(row)}
                style={{ cursor: "pointer" }}
              >
                <CardContent className={classes.cardContent}>
                  <Chip
                    label={statusInfo.label}
                    size="small"
                    className={`${classes.statusChip} ${statusInfo.class}`}
                  />

                  <Typography
                    variant="h6"
                    component="h2"
                    className={classes.companyName}
                  >
                    {row.name || "-"}
                  </Typography>

                  <Box className={classes.statsContainer}>
                    <Typography className={classes.sectionTitle}>
                      {i18n.t("companiesManager.section.info")}
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12} className={classes.statItem}>
                        <EmailIcon className={classes.statIcon} />
                        <Box>
                          <Typography className={classes.statLabel}>
                            {i18n.t("common.email")}
                          </Typography>
                          <Typography className={classes.statValue}>
                            {row.email || "-"}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} className={classes.statItem}>
                        <PhoneIcon className={classes.statIcon} />
                        <Box>
                          <Typography className={classes.statLabel}>
                            {i18n.t("common.phone")}
                          </Typography>
                          <Typography className={classes.statValue}>
                            {row.phone || "-"}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} className={classes.statItem}>
                        <PlanIcon className={classes.statIcon} />
                        <Box>
                          <Typography className={classes.statLabel}>
                            {i18n.t("companies.form.plan")}
                          </Typography>
                          <Typography className={classes.statValue}>
                            {renderPlan(row)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} className={classes.statItem}>
                        <CampaignsIcon className={classes.statIcon} />
                        <Box>
                          <Typography className={classes.statLabel}>
                            {i18n.t("companiesManager.table.campaigns")}
                          </Typography>
                          <Typography className={classes.statValue}>
                            {renderCampaignsStatus(row)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} className={classes.statItem}>
                        <StatusIcon className={classes.statIcon} />
                        <Box>
                          <Typography className={classes.statLabel}>
                            {i18n.t("common.status")}
                          </Typography>
                          <Typography className={classes.statValue}>
                            {row.status === false
                              ? i18n.t("common.no")
                              : i18n.t("common.yes")}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider className={classes.divider} />

                  <Box>
                    <Grid container spacing={1}>
                      <Grid item xs={6} className={classes.statItem}>
                        <CreatedIcon className={classes.statIcon} />
                        <Box>
                          <Typography className={classes.statLabel}>
                            {i18n.t("companiesManager.table.createdAt")}
                          </Typography>
                          <Typography className={classes.statValue}>
                            {dateToClient(row.createdAt)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} className={classes.statItem}>
                        <DueDateIcon className={classes.statIcon} />
                        <Box>
                          <Typography className={classes.statLabel}>
                            {i18n.t("common.dueDate")}
                          </Typography>
                          <Typography className={classes.statValue}>
                            {dateToClient(row.dueDate)}
                          </Typography>
                          {row.recurrence && (
                            <Typography variant="caption" display="block">
                              {row.recurrence}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
                <CardActions className={classes.cardActions}>
                  <IconButton
                    size="small"
                    onClick={e => {
                      e.stopPropagation();
                      onAddPeriod(row);
                    }}
                    aria-label="add period"
                    title={i18n.t("companiesManager.buttons.incrementDueDate")}
                  >
                    <AddPeriodIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={e => {
                      e.stopPropagation();
                      onUsers(row);
                    }}
                    aria-label="users"
                    title={i18n.t("companiesManager.buttons.users")}
                  >
                    <PersonIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={e => {
                      e.stopPropagation();
                      onImpersonate(row);
                    }}
                    aria-label="impersonate"
                    title={i18n.t("companiesManager.buttons.accessAs")}
                  >
                    <ImpersonateIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={e => {
                      e.stopPropagation();
                      onDelete(row);
                    }}
                    aria-label="delete"
                    title={i18n.t("common.delete")}
                  >
                    <DeleteIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={e => {
                      e.stopPropagation();
                      onSelect(row);
                    }}
                    aria-label="edit"
                    title={i18n.t("common.edit")}
                  >
                    <EditIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      {hasMore && (
        <div ref={loadMoreRef} className={classes.loadingContainer}>
          <CircularProgress size={24} />
        </div>
      )}
    </div>
  );
}

export default function CompaniesManager() {
  const classes = useStyles();
  const { listPaginated, save, update, remove } = useCompanies();

  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = useState(false);
  const [showConfirmImpersonateDialog, setShowConfirmImpersonateDialog] =
    useState(false);
  const [showConfirmAddPeriodDialog, setShowConfirmAddPeriodDialog] =
    useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [records, setRecords] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchParam, setSearchParam] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
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
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadInitial();
    }, 500);

    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam, statusFilter]);

  const loadInitial = async () => {
    setLoading(true);
    setPageNumber(1);
    try {
      const { companies, hasMore: more } = await listPaginated(1, searchParam);
      let filteredCompanies = companies;

      if (statusFilter === "active") {
        filteredCompanies = companies.filter(
          company => company.subscriptionStatus !== "inactive"
        );
      }

      setRecords(filteredCompanies);
      setHasMore(more);
    } catch (e) {
      toast.error(i18n.t("companiesManager.toasts.loadError"));
    }
    setLoading(false);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = pageNumber + 1;
    try {
      const { companies, hasMore: more } = await listPaginated(
        nextPage,
        searchParam
      );
      let filteredCompanies = companies;

      if (statusFilter === "active") {
        filteredCompanies = companies.filter(
          company => company.subscriptionStatus !== "inactive"
        );
      }

      setRecords(prev => [...prev, ...filteredCompanies]);
      setPageNumber(nextPage);
      setHasMore(more);
    } catch (e) {
      toast.error(i18n.t("companiesManager.toasts.loadError"));
    }
    setLoadingMore(false);
  };

  const handleSubmit = async data => {
    setLoading(true);
    try {
      if (data.id !== undefined) {
        await update(data);
      } else {
        await save(data);
      }
      await loadInitial();
      handleCancel();
      toast.success(i18n.t("companiesManager.toasts.operationSuccess"));
    } catch (e) {
      toast.error(i18n.t("companiesManager.toasts.operationErrorDuplicate"));
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await remove(record.id);
      await loadInitial();
      handleCancel();
      toast.success(i18n.t("companiesManager.toasts.operationSuccess"));
    } catch (e) {
      toast.error(i18n.t("companiesManager.toasts.operationError"));
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

  const handleOpenAddPeriodDialog = () => {
    setShowConfirmAddPeriodDialog(true);
  };

  const handleAddPeriod = async () => {
    setLoading(true);
    try {
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
      await update(data);
      await loadInitial();
      setShowConfirmAddPeriodDialog(false);
      toast.success(i18n.t("companiesManager.toasts.operationSuccess"));
    } catch (e) {
      toast.error(i18n.t("companiesManager.toasts.operationError"));
    }
    setLoading(false);
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
    setModalOpen(false);
  };

  const handleSelect = data => {
    let campaignsEnabled = false;

    if (data.settings && isArray(data.settings)) {
      const setting = data.settings.find(
        s => s.key.indexOf("campaignsEnabled") > -1
      );
      if (setting) {
        campaignsEnabled =
          setting.value === "true" || setting.value === "enabled";
      }
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
    setModalOpen(true);
  };

  const handleCardImpersonate = data => {
    setRecord(prev => ({
      ...prev,
      id: data.id,
      name: data.name || ""
    }));
    handleOpenImpersonateDialog();
  };

  const handleCardDelete = data => {
    setRecord(prev => ({
      ...prev,
      id: data.id,
      name: data.name || ""
    }));
    handleOpenDeleteDialog();
  };

  const handleCardAddPeriod = data => {
    let campaignsEnabled = false;

    if (data.settings && isArray(data.settings)) {
      const setting = data.settings.find(
        s => s.key.indexOf("campaignsEnabled") > -1
      );
      if (setting) {
        campaignsEnabled =
          setting.value === "true" || setting.value === "enabled";
      }
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
    handleOpenAddPeriodDialog();
  };

  const handleCardUsers = async data => {
    setRecord(prev => ({
      ...prev,
      id: data.id,
      name: data.name || "",
      email: data.email || ""
    }));

    // Check if user exists with company email
    if (data.email) {
      try {
        const { data: usersData } = await api.get("/users", {
          params: { companyId: data.id }
        });
        const existingUser = usersData.users?.find(u => u.email === data.email);
        if (existingUser) {
          setRecord(prev => ({
            ...prev,
            userId: existingUser.id
          }));
        }
      } catch (err) {
        // If API call fails, just open modal without userId
        console.error("Error fetching users:", err);
      }
    }

    setShowUsersModal(true);
  };

  const handleNew = () => {
    setRecord({
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
    setModalOpen(true);
  };

  return (
    <Paper className={classes.mainPaper} elevation={0}>
      <div className={classes.searchContainer}>
        <TextField
          className={classes.searchInput}
          variant="outlined"
          size="small"
          placeholder={i18n.t("common.search")}
          value={searchParam}
          onChange={e => setSearchParam(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon color="disabled" />
          }}
        />
        <Button
          variant="contained"
          size="small"
          className={`${classes.filterButton} ${
            statusFilter === "active" ? classes.filterButtonActive : ""
          }`}
          onClick={() => setStatusFilter("active")}
          startIcon={<ActiveIcon />}
        >
          {i18n.t("common.active")}
        </Button>
        <Button
          variant="contained"
          size="small"
          className={`${classes.filterButton} ${
            statusFilter === "all" ? classes.filterButtonActive : ""
          }`}
          onClick={() => setStatusFilter("all")}
          startIcon={<AllIcon />}
        >
          {i18n.t("common.all")}
        </Button>
      </div>
      <Grid spacing={2} container>
        <Grid xs={12} item style={{ padding: 0 }}>
          <CompaniesManagerGrid
            records={records}
            onSelect={handleSelect}
            onLoadMore={loadMore}
            hasMore={hasMore}
            loading={loadingMore}
            onImpersonate={handleCardImpersonate}
            onDelete={handleCardDelete}
            onAddPeriod={handleCardAddPeriod}
            onUsers={handleCardUsers}
          />
        </Grid>
      </Grid>
      <Fab
        color="primary"
        aria-label="add"
        className={classes.fab}
        onClick={handleNew}
      >
        <AddIcon />
      </Fab>
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {record.id !== undefined
            ? i18n.t("companiesManager.modal.editTitle")
            : i18n.t("companiesManager.modal.newTitle")}
        </DialogTitle>
        <DialogContent>
          <CompanyForm
            initialValue={record}
            onDelete={handleOpenDeleteDialog}
            onImpersonate={handleOpenImpersonateDialog}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        </DialogContent>
      </Dialog>
      <ConfirmationModal
        title={i18n.t("companiesManager.confirmationModal.deleteTitle")}
        open={showConfirmDeleteDialog}
        onClose={() => setShowConfirmDeleteDialog(false)}
        onConfirm={() => handleDelete()}
      >
        {i18n.t("companiesManager.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <ConfirmationModal
        title={i18n.t("companiesManager.confirmationModal.impersonateTitle")}
        open={showConfirmImpersonateDialog}
        onClose={() => setShowConfirmImpersonateDialog(false)}
        onConfirm={() => onImpersonate()}
      >
        {i18n.t("companiesManager.confirmationModal.impersonateMessage")}
      </ConfirmationModal>
      <ConfirmationModal
        title={i18n.t("companiesManager.confirmationModal.addPeriodTitle")}
        open={showConfirmAddPeriodDialog}
        onClose={() => setShowConfirmAddPeriodDialog(false)}
        onConfirm={() => handleAddPeriod()}
      >
        {i18n.t("companiesManager.confirmationModal.addPeriodMessage")}
      </ConfirmationModal>
      <ModalUsers
        open={showUsersModal}
        onClose={() => {
          setShowUsersModal(false);
          setRecord(prev => ({ ...prev, userId: undefined }));
        }}
        companyId={record.id}
        companyEmail={record.email}
        userId={record.userId}
      />
    </Paper>
  );
}
