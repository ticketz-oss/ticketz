import StardewEmblem from "../../components/StardewEmblem";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
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
  Tooltip,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import SearchIcon from "@material-ui/icons/Search";
import EditIcon from "@material-ui/icons/Edit";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import ImageIcon from "@material-ui/icons/Image";
import PublicIcon from "@material-ui/icons/Public";
import moment from "moment";
import { toast } from "react-toastify";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import AnnouncementModal from "../../components/AnnouncementModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";

const useStyles = makeStyles(theme => ({
  mainPaper: { flex: 1, overflow: "hidden", ...theme.scrollbarStyles },
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
  chips: { display: "flex", flexWrap: "wrap", gap: theme.spacing(0.5) },
  empty: {
    padding: theme.spacing(6),
    textAlign: "center",
    color: theme.palette.text.secondary
  },
  number: { fontVariantNumeric: "tabular-nums" }
}));

const priorityColor = priority => {
  if (priority === 1) return "secondary";
  if (priority === 2) return "primary";
  return "default";
};

const priorityLabel = priority => {
  if (priority === 1) return i18n.t("announcements.priorities.high");
  if (priority === 2) return i18n.t("announcements.priorities.medium");
  return i18n.t("announcements.priorities.low");
};

/**
 * Derived from the publication window, so an admin can tell at a glance whether
 * a notice is live, still waiting for its start date or already expired.
 */
const situationOf = announcement => {
  if (!announcement.status) return "inactive";
  const now = new Date();
  if (announcement.startsAt && new Date(announcement.startsAt) > now) {
    return "scheduled";
  }
  if (announcement.endsAt && new Date(announcement.endsAt) < now) {
    return "expired";
  }
  return "live";
};

const situationColor = situation => {
  if (situation === "live") return "primary";
  if (situation === "expired") return "secondary";
  return "default";
};

const formatDate = value =>
  value ? moment(value).format("DD/MM/YYYY HH:mm") : "—";

const Announcements = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const socketManager = useContext(SocketContext);

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/announcements", {
        params: {
          searchParam,
          status,
          priority,
          periodFrom,
          periodTo,
          pageNumber: 1
        }
      });
      setAnnouncements(data.records);
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  }, [searchParam, status, priority, periodFrom, periodTo]);

  useEffect(() => {
    const timeout = setTimeout(fetchAnnouncements, 350);
    return () => clearTimeout(timeout);
  }, [fetchAnnouncements]);

  useEffect(() => {
    const socket = socketManager.GetSocket(user.companyId);

    // The payload only signals a change: the audience is resolved server side,
    // so the authoritative list always comes from a refetch.
    const onAnnouncement = () => fetchAnnouncements();

    socket.on("company-announcement", onAnnouncement);

    return () => {
      socket.off("company-announcement", onAnnouncement);
    };
  }, [socketManager, user.companyId, fetchAnnouncements]);

  const remove = async () => {
    try {
      await api.delete(`/announcements/${deleting.id}`);
      toast.success(i18n.t("announcements.toasts.deleted"));
      fetchAnnouncements();
    } catch (err) {
      toastError(err);
    }
    setDeleting(null);
  };

  const openNew = () => {
    setSelected(null);
    setModalOpen(true);
  };

  const openEdit = announcement => {
    setSelected(announcement);
    setModalOpen(true);
  };

  const audienceSummary = announcement => {
    if (announcement.audienceMode !== "SEGMENTED") {
      return [{ key: "all", label: i18n.t("announcements.audience.all") }];
    }

    const chips = [];
    (announcement.queues || []).forEach(queue =>
      chips.push({
        key: `q-${queue.id}`,
        label: queue.name,
        color: queue.color
      })
    );
    (announcement.whatsapps || []).forEach(whatsapp =>
      chips.push({ key: `w-${whatsapp.id}`, label: whatsapp.name })
    );
    (announcement.profiles || []).forEach(profile =>
      chips.push({
        key: `p-${profile}`,
        label: i18n.t(`announcements.profiles.${profile}`)
      })
    );
    if ((announcement.users || []).length) {
      chips.push({
        key: "users",
        label: i18n.t("announcements.audience.users", {
          count: announcement.users.length
        })
      });
    }

    return chips.length
      ? chips
      : [{ key: "none", label: i18n.t("announcements.audience.none") }];
  };

  return (
    <MainContainer className="sv-operations sv-screen-announcements">
      <ConfirmationModal
        title={i18n.t("announcements.confirmationModal.deleteTitle")}
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
      >
        {i18n.t("announcements.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <AnnouncementModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelected(null);
        }}
        reload={fetchAnnouncements}
        announcementId={selected?.id}
      />
      <MainHeader>
        <StardewEmblem item="scroll" />
        <Title>{i18n.t("announcements.title")}</Title>
        <MainHeaderButtonsWrapper>
          <Button variant="contained" color="primary" onClick={openNew}>
            {i18n.t("announcements.buttons.add")}
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper className={classes.mainPaper} variant="outlined">
        <Box className={classes.filters}>
          <TextField
            className={classes.search}
            placeholder={i18n.t("announcements.searchPlaceholder")}
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
            <InputLabel>{i18n.t("announcements.filters.status")}</InputLabel>
            <Select
              value={status}
              onChange={event => setStatus(event.target.value)}
            >
              <MenuItem value="">{i18n.t("common.all")}</MenuItem>
              <MenuItem value="true">
                {i18n.t("announcements.situations.active")}
              </MenuItem>
              <MenuItem value="false">
                {i18n.t("announcements.situations.inactive")}
              </MenuItem>
            </Select>
          </FormControl>
          <FormControl className={classes.filter}>
            <InputLabel>{i18n.t("announcements.filters.priority")}</InputLabel>
            <Select
              value={priority}
              onChange={event => setPriority(event.target.value)}
            >
              <MenuItem value="">{i18n.t("common.all")}</MenuItem>
              <MenuItem value="1">
                {i18n.t("announcements.priorities.high")}
              </MenuItem>
              <MenuItem value="2">
                {i18n.t("announcements.priorities.medium")}
              </MenuItem>
              <MenuItem value="3">
                {i18n.t("announcements.priorities.low")}
              </MenuItem>
            </Select>
          </FormControl>
          <TextField
            className={classes.filter}
            type="date"
            label={i18n.t("announcements.filters.from")}
            value={periodFrom}
            onChange={event => setPeriodFrom(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            className={classes.filter}
            type="date"
            label={i18n.t("announcements.filters.to")}
            value={periodTo}
            onChange={event => setPeriodTo(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
        <Box className={classes.tableScroll}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{i18n.t("announcements.table.title")}</TableCell>
                <TableCell>{i18n.t("announcements.table.text")}</TableCell>
                <TableCell>{i18n.t("announcements.table.priority")}</TableCell>
                <TableCell>{i18n.t("announcements.table.window")}</TableCell>
                <TableCell>{i18n.t("announcements.table.audience")}</TableCell>
                <TableCell>{i18n.t("announcements.table.status")}</TableCell>
                <TableCell align="right">
                  {i18n.t("announcements.table.actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {announcements.map(announcement => {
                const situation = situationOf(announcement);
                return (
                  <TableRow key={announcement.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gridGap={4}>
                        <Typography variant="body2">
                          {announcement.title}
                        </Typography>
                        {announcement.mediaPath && (
                          <ImageIcon fontSize="small" color="action" />
                        )}
                        {announcement.isGlobal && (
                          <Tooltip
                            title={i18n.t("announcements.table.globalHint")}
                          >
                            <PublicIcon fontSize="small" color="action" />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell
                      className={classes.message}
                      title={announcement.text}
                    >
                      {announcement.text}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={priorityColor(announcement.priority)}
                        label={priorityLabel(announcement.priority)}
                      />
                    </TableCell>
                    <TableCell className={classes.number}>
                      <Typography variant="caption" display="block">
                        {formatDate(announcement.startsAt)}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {formatDate(announcement.endsAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box className={classes.chips}>
                        {audienceSummary(announcement).map(chip => (
                          <Chip
                            key={chip.key}
                            size="small"
                            variant="outlined"
                            label={chip.label}
                            style={
                              chip.color
                                ? {
                                    backgroundColor: chip.color,
                                    color: "#fff",
                                    borderColor: chip.color
                                  }
                                : undefined
                            }
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={situationColor(situation)}
                        label={i18n.t(`announcements.situations.${situation}`)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => openEdit(announcement)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setDeleting(announcement)}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {loading && <TableRowSkeleton columns={7} />}
            </TableBody>
          </Table>
          {!loading && announcements.length === 0 && (
            <div className={classes.empty}>{i18n.t("announcements.empty")}</div>
          )}
        </Box>
      </Paper>
    </MainContainer>
  );
};

export default Announcements;
