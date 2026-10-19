import StardewEmblem from "../../components/StardewEmblem";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import SearchIcon from "@material-ui/icons/Search";
import EditIcon from "@material-ui/icons/Edit";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ImageIcon from "@material-ui/icons/Image";
import SendIcon from "@material-ui/icons/Send";
import moment from "moment";
import { toast } from "react-toastify";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import ScheduleModal from "../../components/ScheduleModal";
import CommemorativeDateModal from "../../components/CommemorativeDateModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";

const useStyles = makeStyles(theme => ({
  mainPaper: { flex: 1, overflow: "hidden", ...theme.scrollbarStyles },
  tabs: {
    marginBottom: theme.spacing(1),
    background: theme.palette.background.paper
  },
  filters: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    padding: theme.spacing(1.5),
    borderBottom: `1px solid ${theme.palette.divider}`
  },
  search: {
    minWidth: 220,
    flex: 1,
    [theme.breakpoints.down("xs")]: { minWidth: "100%" }
  },
  filter: {
    minWidth: 150,
    [theme.breakpoints.down("xs")]: { flex: "1 1 calc(50% - 8px)" }
  },
  tableScroll: {
    width: "100%",
    overflowX: "auto",
    ...theme.scrollbarStyles
  },
  message: {
    maxWidth: 320,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  progress: { minWidth: 120 },
  detail: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.action.hover
  },
  empty: {
    padding: theme.spacing(6),
    textAlign: "center",
    color: theme.palette.text.secondary
  },
  number: { fontVariantNumeric: "tabular-nums" }
}));

const urlContactId = () =>
  Number(new URLSearchParams(window.location.search).get("contactId"));
const urlTab = () => {
  const value = new URLSearchParams(window.location.search).get("tab");
  return ["schedules", "dates"].includes(value) ? value : "schedules";
};

const statusColor = status => {
  if (["ENVIADA", "SENT", "ATIVA"].includes(status)) return "primary";
  if (["ERRO", "ERROR"].includes(status)) return "secondary";
  return "default";
};

const Schedules = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const socketManager = useContext(SocketContext);
  const [tab, setTab] = useState(urlTab());
  const [schedules, setSchedules] = useState([]);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [sendingNow, setSendingNow] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [deliveries, setDeliveries] = useState({});
  const [contactId, setContactId] = useState(urlContactId());

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/schedules", {
        params: {
          searchParam,
          kind,
          status,
          periodFrom,
          periodTo,
          pageNumber: 1
        }
      });
      setSchedules(data.schedules);
    } catch (error) {
      toastError(error);
    } finally {
      setLoading(false);
    }
  }, [searchParam, kind, status, periodFrom, periodTo]);

  const fetchDates = useCallback(async () => {
    try {
      const { data } = await api.get("/commemorative-dates", {
        params: { showInactive: user.profile === "admin" }
      });
      setDates(data);
    } catch (error) {
      toastError(error);
    }
  }, [user.profile]);

  useEffect(() => {
    const timeout = setTimeout(fetchSchedules, 350);
    return () => clearTimeout(timeout);
  }, [fetchSchedules]);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  useEffect(() => {
    const socket = socketManager.GetSocket(user.companyId);
    const eventName = `company-${user.companyId}-schedule`;
    const onSchedule = data => {
      if (["create", "update"].includes(data.action) && data.schedule) {
        setSchedules(current => {
          const exists = current.some(item => item.id === data.schedule.id);
          return exists
            ? current.map(item =>
                item.id === data.schedule.id
                  ? {
                      ...item,
                      ...data.schedule,
                      commemorativeDate:
                        data.schedule.commemorativeDate ||
                        item.commemorativeDate
                    }
                  : item
              )
            : [data.schedule, ...current];
        });
      }
      if (data.action === "delete") {
        setSchedules(current =>
          current.filter(item => item.id !== Number(data.scheduleId))
        );
      }
    };
    socket.on(eventName, onSchedule);
    return () => socket.off(eventName, onSchedule);
  }, [socketManager, user.companyId]);

  useEffect(() => {
    if (contactId) setScheduleModalOpen(true);
  }, [contactId]);

  const changeTab = (_event, value) => {
    setTab(value);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", value);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params}`
    );
  };

  const loadDeliveries = async scheduleId => {
    if (expandedId === scheduleId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(scheduleId);
    if (deliveries[scheduleId]) return;
    try {
      const { data } = await api.get(`/schedules/${scheduleId}/deliveries`);
      setDeliveries(current => ({ ...current, [scheduleId]: data.deliveries }));
    } catch (error) {
      toastError(error);
    }
  };

  const remove = async () => {
    try {
      if (deleting.type === "schedule") {
        await api.delete(`/schedules/${deleting.id}`);
        await fetchSchedules();
      } else {
        await api.delete(`/commemorative-dates/${deleting.id}`);
        await fetchDates();
        await fetchSchedules();
      }
      toast.success(i18n.t("common.success"));
    } catch (error) {
      toastError(error);
    } finally {
      setDeleting(null);
    }
  };

  const sendNow = async () => {
    const scheduleId = sendingNow?.id;
    if (!scheduleId) return;
    try {
      await api.post(`/schedules/${scheduleId}/send-now`);
      toast.success(i18n.t("schedules.toasts.sentNow"));
      await fetchSchedules();
    } catch (error) {
      toastError(error);
    } finally {
      setSendingNow(null);
    }
  };

  const ruleText = date => {
    if (date.ruleType === "FIXED_DATE") {
      return `${String(date.day).padStart(2, "0")}/${String(date.month).padStart(2, "0")}`;
    }
    const ordinal =
      date.ordinal === -1
        ? i18n.t("commemorativeDates.last")
        : `${date.ordinal}º`;
    return `${ordinal} ${i18n.t(`commemorativeDates.weekdays.${date.weekday}`)} · ${String(
      date.month
    ).padStart(2, "0")}`;
  };

  return (
    <MainContainer className="sv-operations sv-screen-schedules">
      <ConfirmationModal
        title={i18n.t("common.confirm")}
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
      >
        {i18n.t("schedules.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <ConfirmationModal
        title={i18n.t("schedules.confirmationModal.sendNowTitle")}
        open={Boolean(sendingNow)}
        onClose={() => setSendingNow(null)}
        onConfirm={sendNow}
      >
        {i18n.t("schedules.confirmationModal.sendNowMessage")}
      </ConfirmationModal>
      <ScheduleModal
        open={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false);
          setSelectedSchedule(null);
          setContactId(0);
        }}
        reload={fetchSchedules}
        scheduleId={selectedSchedule?.id}
        contactId={contactId || undefined}
        cleanContact={() => setContactId(0)}
      />
      <CommemorativeDateModal
        open={dateModalOpen}
        value={selectedDate}
        onClose={() => {
          setDateModalOpen(false);
          setSelectedDate(null);
        }}
        onSaved={fetchDates}
      />
      <MainHeader>
        <StardewEmblem item="calendar" />
        <Title>{i18n.t("schedules.title")}</Title>
        <MainHeaderButtonsWrapper>
          {tab === "schedules" ? (
            <Tooltip
              title={
                user?.company?.whatsappMode === "meta"
                  ? i18n.t("connections.toolTips.notAvailableOfficial")
                  : ""
              }
            >
              <span>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={user?.company?.whatsappMode === "meta"}
                  onClick={() => setScheduleModalOpen(true)}
                >
                  {i18n.t("schedules.buttons.add")}
                </Button>
              </span>
            </Tooltip>
          ) : (
            user.profile === "admin" && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setDateModalOpen(true)}
              >
                {i18n.t("commemorativeDates.add")}
              </Button>
            )
          )}
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper variant="outlined" className={classes.tabs}>
        <Tabs
          value={tab}
          onChange={changeTab}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab value="schedules" label={i18n.t("schedules.tabs.schedules")} />
          <Tab value="dates" label={i18n.t("schedules.tabs.dates")} />
        </Tabs>
      </Paper>
      <Paper className={classes.mainPaper} variant="outlined">
        {tab === "schedules" ? (
          <>
            <Box className={classes.filters}>
              <TextField
                className={classes.search}
                placeholder={i18n.t("contacts.searchPlaceholder")}
                value={searchParam}
                onChange={event => setSearchParam(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
              <FormControl className={classes.filter}>
                <InputLabel>{i18n.t("schedules.filters.kind")}</InputLabel>
                <Select
                  value={kind}
                  onChange={event => setKind(event.target.value)}
                >
                  <MenuItem value="">{i18n.t("common.all")}</MenuItem>
                  <MenuItem value="ONCE">
                    {i18n.t("scheduleModal.kinds.once")}
                  </MenuItem>
                  <MenuItem value="BIRTHDAY">
                    {i18n.t("scheduleModal.kinds.birthday")}
                  </MenuItem>
                  <MenuItem value="COMMEMORATIVE">
                    {i18n.t("scheduleModal.kinds.commemorative")}
                  </MenuItem>
                </Select>
              </FormControl>
              <TextField
                className={classes.filter}
                type="date"
                label={i18n.t("schedules.filters.from")}
                value={periodFrom}
                onChange={event => setPeriodFrom(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                className={classes.filter}
                type="date"
                label={i18n.t("schedules.filters.to")}
                value={periodTo}
                onChange={event => setPeriodTo(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <FormControl className={classes.filter}>
                <InputLabel>{i18n.t("schedules.filters.status")}</InputLabel>
                <Select
                  value={status}
                  onChange={event => setStatus(event.target.value)}
                >
                  <MenuItem value="">{i18n.t("common.all")}</MenuItem>
                  {[
                    "PENDENTE",
                    "AGENDADA",
                    "ATIVA",
                    "ENVIADA",
                    "PARCIAL",
                    "ERRO"
                  ].map(item => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box className={classes.tableScroll}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>{i18n.t("schedules.table.occasion")}</TableCell>
                    <TableCell>{i18n.t("schedules.table.body")}</TableCell>
                    <TableCell>{i18n.t("schedules.table.nextRun")}</TableCell>
                    <TableCell>{i18n.t("schedules.table.audience")}</TableCell>
                    <TableCell>{i18n.t("schedules.table.progress")}</TableCell>
                    <TableCell>{i18n.t("schedules.table.status")}</TableCell>
                    <TableCell align="right">
                      {i18n.t("schedules.table.actions")}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedules.map(schedule => {
                    const total = schedule.totalRecipients || 0;
                    const completed = schedule.sentCount + schedule.errorCount;
                    const progress = total
                      ? Math.min(100, (completed / total) * 100)
                      : 0;
                    return (
                      <React.Fragment key={schedule.id}>
                        <TableRow hover>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => loadDeliveries(schedule.id)}
                            >
                              {expandedId === schedule.id ? (
                                <ExpandLessIcon />
                              ) : (
                                <ExpandMoreIcon />
                              )}
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {schedule.kind === "COMMEMORATIVE"
                                ? schedule.commemorativeDate?.name
                                : i18n.t(
                                    `scheduleModal.kinds.${schedule.kind.toLowerCase()}`
                                  )}
                            </Typography>
                            {schedule.mediaPath && (
                              <ImageIcon fontSize="small" color="action" />
                            )}
                          </TableCell>
                          <TableCell
                            className={classes.message}
                            title={schedule.body}
                          >
                            {schedule.body}
                          </TableCell>
                          <TableCell className={classes.number}>
                            {schedule.nextRunAt
                              ? moment(schedule.nextRunAt).format(
                                  "DD/MM/YYYY HH:mm"
                                )
                              : schedule.sentAt
                                ? moment(schedule.sentAt).format(
                                    "DD/MM/YYYY HH:mm"
                                  )
                                : "—"}
                          </TableCell>
                          <TableCell>
                            {schedule.audienceMode === "ALL"
                              ? i18n.t("scheduleModal.form.allContacts")
                              : `${total} ${i18n.t("scheduleModal.review.recipients")}`}
                          </TableCell>
                          <TableCell className={classes.progress}>
                            <Typography variant="caption">
                              {schedule.sentCount}/{total}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={progress}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              color={statusColor(schedule.status)}
                              label={schedule.status}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {schedule.kind === "ONCE" &&
                              schedule.active &&
                              schedule.status === "PENDENTE" && (
                                <Tooltip
                                  title={i18n.t("schedules.actions.sendNow")}
                                >
                                  <IconButton
                                    size="small"
                                    aria-label={i18n.t(
                                      "schedules.actions.sendNow"
                                    )}
                                    onClick={() => setSendingNow(schedule)}
                                  >
                                    <SendIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedSchedule(schedule);
                                setScheduleModalOpen(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() =>
                                setDeleting({
                                  type: "schedule",
                                  id: schedule.id
                                })
                              }
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={8} padding="none">
                            <Collapse
                              in={expandedId === schedule.id}
                              timeout="auto"
                              unmountOnExit
                            >
                              <Box className={classes.detail}>
                                {(deliveries[schedule.id] || []).length ? (
                                  (deliveries[schedule.id] || []).map(
                                    delivery => (
                                      <Box
                                        key={delivery.id}
                                        display="flex"
                                        justifyContent="space-between"
                                        mb={1}
                                      >
                                        <Typography variant="body2">
                                          {delivery.contact?.name ||
                                            delivery.contactName}{" "}
                                          ·{" "}
                                          {delivery.contact?.number ||
                                            delivery.contactNumber}
                                        </Typography>
                                        <Chip
                                          size="small"
                                          color={statusColor(delivery.status)}
                                          label={delivery.status}
                                        />
                                      </Box>
                                    )
                                  )
                                ) : (
                                  <Typography
                                    variant="body2"
                                    color="textSecondary"
                                  >
                                    {i18n.t("schedules.emptyDeliveries")}
                                  </Typography>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })}
                  {loading && <TableRowSkeleton columns={8} />}
                </TableBody>
              </Table>
            </Box>
            {!loading && schedules.length === 0 && (
              <div className={classes.empty}>{i18n.t("schedules.empty")}</div>
            )}
          </>
        ) : (
          <>
            <Box className={classes.tableScroll}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      {i18n.t("commemorativeDates.form.name")}
                    </TableCell>
                    <TableCell>
                      {i18n.t("commemorativeDates.form.ruleType")}
                    </TableCell>
                    <TableCell>
                      {i18n.t("commemorativeDates.form.active")}
                    </TableCell>
                    {user.profile === "admin" && (
                      <TableCell align="right">
                        {i18n.t("schedules.table.actions")}
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dates.map(date => (
                    <TableRow key={date.id} hover>
                      <TableCell>{date.name}</TableCell>
                      <TableCell>{ruleText(date)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={date.active ? "primary" : "default"}
                          label={
                            date.active
                              ? i18n.t("common.yes")
                              : i18n.t("common.no")
                          }
                        />
                      </TableCell>
                      {user.profile === "admin" && (
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedDate(date);
                              setDateModalOpen(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() =>
                              setDeleting({ type: "date", id: date.id })
                            }
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            {dates.length === 0 && (
              <div className={classes.empty}>
                {i18n.t("commemorativeDates.empty")}
              </div>
            )}
          </>
        )}
      </Paper>
    </MainContainer>
  );
};

export default Schedules;
