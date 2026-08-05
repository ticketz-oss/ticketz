import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Replay, Search, SystemUpdateAlt } from "@material-ui/icons";
import { toast } from "react-toastify";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import ConfirmationModal from "../ConfirmationModal";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
  container: {
    padding: theme.spacing(2)
  },
  title: {
    marginBottom: theme.spacing(1)
  },
  description: {
    marginBottom: theme.spacing(3),
    color: theme.palette.text.secondary
  },
  toolbar: {
    display: "flex",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2)
  },
  tableContainer: {
    maxHeight: 600
  },
  tableCell: {
    fontSize: "0.875rem"
  },
  nameCell: {
    fontSize: "0.875rem",
    fontWeight: 500
  },
  selfBadge: {
    marginLeft: theme.spacing(1)
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing(4)
  },
  warningText: {
    color: theme.palette.warning.main,
    textAlign: "center",
    padding: theme.spacing(4)
  },
  actionsCell: {
    whiteSpace: "nowrap"
  }
}));

const updateChipProps = check => {
  if (!check) {
    return { label: i18n.t("settings.docker.notChecked"), color: "default" };
  }
  if (check.updateAvailable === true) {
    return {
      label: i18n.t("settings.docker.updateAvailable"),
      color: "secondary"
    };
  }
  if (check.updateAvailable === false) {
    return { label: i18n.t("settings.docker.upToDate"), color: "primary" };
  }
  return {
    label: check.message || i18n.t("settings.docker.unavailable"),
    color: "default"
  };
};

const ContainersManager = () => {
  const classes = useStyles();
  const [dockerAvailable, setDockerAvailable] = useState(true);
  const [containers, setContainers] = useState([]);
  const [checks, setChecks] = useState({});
  const [busy, setBusy] = useState({});
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null);
  const [dailyCheck, setDailyCheck] = useState(null);

  const loadContainers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: statusData } = await api.get("/docker/status");
      if (!statusData.available) {
        setDockerAvailable(false);
        setContainers([]);
        return;
      }
      setDockerAvailable(true);
      const { data } = await api.get("/docker/containers");
      setContainers(data);
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDailyCheck = useCallback(async () => {
    try {
      const { data } = await api.get("/docker/updates/daily-check");
      setDailyCheck(data);
    } catch (err) {
      toastError(err);
    }
  }, []);

  useEffect(() => {
    loadContainers();
    loadDailyCheck();
  }, [loadContainers, loadDailyCheck]);

  const handleCheck = async container => {
    setBusy(prev => ({ ...prev, [container.id]: "check" }));
    try {
      const { data } = await api.get(
        `/docker/containers/${container.id}/check-update`
      );
      setChecks(prev => ({ ...prev, [container.id]: data }));
      if (data.updateAvailable === true) {
        toast.info(
          i18n.t("settings.docker.toasts.updateAvailable", {
            name: container.name
          })
        );
      }
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(prev => ({ ...prev, [container.id]: null }));
    }
  };

  const handleCheckAll = async () => {
    for (const container of containers.filter(c => c.state === "running")) {
      // eslint-disable-next-line no-await-in-loop
      await handleCheck(container);
    }
  };

  const handleUpdateBackendFrontend = async () => {
    setBusy(prev => ({ ...prev, __backendFrontend: "update" }));
    try {
      await api.post("/docker/updates/update-all");
      toast.info(i18n.t("settings.docker.toasts.selfUpdate"));
      window.location.href = "/?restart=1";
    } catch (err) {
      setBusy(prev => ({ ...prev, __backendFrontend: null }));
      toastError(err);
    }
  };

  const handleUpdate = async container => {
    setBusy(prev => ({ ...prev, [container.id]: "update" }));
    try {
      const { data } = await api.post(
        `/docker/containers/${container.id}/update`
      );
      if (data.self) {
        toast.info(i18n.t("settings.docker.toasts.selfUpdate"));
      } else if (data.updated) {
        toast.success(`${container.name}: ${data.message}`);
      } else {
        toast.info(`${container.name}: ${data.message}`);
      }
      await loadContainers();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(prev => ({ ...prev, [container.id]: null }));
    }
  };

  const handleRestart = async container => {
    setBusy(prev => ({ ...prev, [container.id]: "restart" }));
    try {
      await api.post(`/docker/containers/${container.id}/restart`);
      if (container.self) {
        toast.info(i18n.t("settings.docker.toasts.selfRestart"));
      } else {
        toast.success(
          i18n.t("settings.docker.toasts.restarted", { name: container.name })
        );
      }
    } catch (err) {
      if (container.self) {
        toast.info(i18n.t("settings.docker.toasts.selfRestart"));
      } else {
        toastError(err);
      }
    } finally {
      setBusy(prev => ({ ...prev, [container.id]: null }));
    }
  };

  const openConfirm = (container, action) => {
    setConfirmAction({ container, action });
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    const { container, action } = confirmAction;
    setConfirmAction(null);
    if (action === "updateBackendFrontend") {
      handleUpdateBackendFrontend();
    } else if (action === "update") {
      handleUpdate(container);
    } else if (action === "restart") {
      handleRestart(container);
    }
  };

  const handleRefresh = () => {
    loadContainers();
    loadDailyCheck();
  };

  if (loading) {
    return (
      <Box className={classes.loadingContainer}>
        <CircularProgress />
      </Box>
    );
  }

  if (!dockerAvailable) {
    return (
      <Typography className={classes.warningText}>
        {i18n.t("settings.docker.unavailableMessage")}
      </Typography>
    );
  }

  return (
    <div className={classes.container}>
      <Typography variant="h5" className={classes.title}>
        {i18n.t("settings.docker.title")}
      </Typography>
      <Typography variant="body2" className={classes.description}>
        {i18n.t("settings.docker.description")}
      </Typography>

      <div className={classes.toolbar}>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleRefresh}
          disabled={loading}
        >
          {i18n.t("settings.docker.actions.refreshList")}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCheckAll}
          disabled={loading}
        >
          {i18n.t("settings.docker.actions.checkUpdates")}
        </Button>
        {dailyCheck?.hasBackendOrFrontendUpdate && (
          <Button
            variant="contained"
            color="secondary"
            onClick={() => openConfirm({ all: true }, "updateBackendFrontend")}
            disabled={loading || busy.__backendFrontend}
          >
            {busy.__backendFrontend === "update"
              ? i18n.t("settings.docker.actions.updatingBackendFrontend")
              : i18n.t("settings.docker.actions.updateBackendFrontend")}
          </Button>
        )}
      </div>

      <TableContainer component={Paper} className={classes.tableContainer}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell className={classes.tableCell}>
                {i18n.t("settings.docker.columns.name")}
              </TableCell>
              <TableCell className={classes.tableCell}>
                {i18n.t("settings.docker.columns.image")}
              </TableCell>
              <TableCell className={classes.tableCell}>
                {i18n.t("settings.docker.columns.state")}
              </TableCell>
              <TableCell className={classes.tableCell}>
                {i18n.t("settings.docker.columns.created")}
              </TableCell>
              <TableCell className={classes.tableCell}>
                {i18n.t("settings.docker.columns.update")}
              </TableCell>
              <TableCell className={classes.tableCell} align="right">
                {i18n.t("settings.docker.columns.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {containers.map(container => {
              const check = checks[container.id];
              const chip = updateChipProps(check);
              const rowBusy = busy[container.id];
              const isRunning = container.state === "running";

              return (
                <TableRow key={container.id} hover>
                  <TableCell className={classes.nameCell}>
                    {container.name}
                    {container.self && (
                      <Chip
                        className={classes.selfBadge}
                        label={i18n.t("settings.docker.selfBadge")}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell className={classes.tableCell}>
                    {container.image}
                  </TableCell>
                  <TableCell className={classes.tableCell}>
                    <Tooltip title={container.status || ""}>
                      <Chip
                        label={container.state}
                        size="small"
                        color={isRunning ? "primary" : "default"}
                        variant={isRunning ? "default" : "outlined"}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell className={classes.tableCell}>
                    {container.created
                      ? new Date(container.created * 1000).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell className={classes.tableCell}>
                    <Tooltip
                      title={check?.message || check?.remoteDigest || ""}
                    >
                      <Chip
                        label={chip.label}
                        size="small"
                        color={chip.color}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell className={classes.actionsCell} align="right">
                    <Tooltip
                      title={i18n.t("settings.docker.actions.checkUpdate")}
                    >
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleCheck(container)}
                          disabled={!!rowBusy || !isRunning}
                        >
                          {rowBusy === "check" ? (
                            <CircularProgress size={18} />
                          ) : (
                            <Search fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={i18n.t("settings.docker.actions.update")}>
                      <span>
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => openConfirm(container, "update")}
                          disabled={!!rowBusy || !isRunning}
                        >
                          {rowBusy === "update" ? (
                            <CircularProgress size={18} />
                          ) : (
                            <SystemUpdateAlt fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={i18n.t("settings.docker.actions.restart")}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => openConfirm(container, "restart")}
                          disabled={!!rowBusy || !isRunning}
                        >
                          {rowBusy === "restart" ? (
                            <CircularProgress size={18} />
                          ) : (
                            <Replay fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {confirmAction && (
        <ConfirmationModal
          open={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirm}
          title={
            confirmAction.action === "updateBackendFrontend"
              ? i18n.t("settings.docker.confirm.updateAllTitle")
              : confirmAction.action === "update"
                ? i18n.t("settings.docker.confirm.updateTitle", {
                    name: confirmAction.container.name
                  })
                : i18n.t("settings.docker.confirm.restartTitle", {
                    name: confirmAction.container.name
                  })
          }
        >
          {confirmAction.action === "updateBackendFrontend"
            ? i18n.t("settings.docker.confirm.updateAllBody")
            : confirmAction.action === "update"
              ? i18n.t("settings.docker.confirm.updateBody", {
                  image: confirmAction.container.image
                }) +
                (confirmAction.container.self
                  ? " " + i18n.t("settings.docker.confirm.selfWarning")
                  : "")
              : i18n.t("settings.docker.confirm.restartBody", {
                  name: confirmAction.container.name
                }) +
                (confirmAction.container.self
                  ? " " + i18n.t("settings.docker.confirm.selfWarning")
                  : "")}
        </ConfirmationModal>
      )}
    </div>
  );
};

export default ContainersManager;
