import React, { useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  Grid,
  Paper,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { SystemUpdateAlt } from "@material-ui/icons";
import { toast } from "react-toastify";

import api from "../../../services/api";
import toastError from "../../../errors/toastError";
import { i18n } from "../../../translate/i18n";
import ConfirmationModal from "../../ConfirmationModal";

const useStyles = makeStyles(theme => ({
  banner: {
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(2),
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.contrastText,
    flexWrap: "wrap"
  },
  content: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    flex: 1
  },
  icon: {
    fontSize: "2rem"
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1)
  }
}));

const ContainerUpdatesBanner = () => {
  const classes = useStyles();
  const [checking, setChecking] = useState(true);
  const [updates, setUpdates] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadDailyCheck = async () => {
    setChecking(true);
    try {
      const { data } = await api.get("/docker/updates/daily-check");
      setUpdates(data);
    } catch (err) {
      toastError(err);
    } finally {
      setChecking(false);
    }
  };

  const handleRefresh = async () => {
    setChecking(true);
    try {
      const { data } = await api.post("/docker/updates/refresh");
      setUpdates(data);
    } catch (err) {
      toastError(err);
    } finally {
      setChecking(false);
    }
  };

  const handleUpdateAll = async () => {
    setUpdating(true);
    try {
      await api.post("/docker/updates/update-all");
      toast.info(i18n.t("settings.docker.toasts.selfUpdate"));
      // Use the same reload screen as the backend restart button.
      window.location.href = "/?restart=1";
    } catch (err) {
      setUpdating(false);
      toastError(err);
    }
  };

  useEffect(() => {
    loadDailyCheck();
  }, []);

  if (checking && !updates) {
    return null;
  }

  if (!updates?.hasBackendOrFrontendUpdate) {
    return null;
  }

  return (
    <Grid item xs={12}>
      <Paper className={classes.banner} elevation={2}>
        <div className={classes.content}>
          <SystemUpdateAlt className={classes.icon} />
          <div>
            <Typography variant="h6">
              {i18n.t("settings.docker.dashboardBanner.title")}
            </Typography>
            <Typography variant="body2">
              {i18n.t("settings.docker.dashboardBanner.description")}
            </Typography>
          </div>
        </div>
        <div className={classes.actions}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleRefresh}
            disabled={checking}
          >
            {checking ? (
              <CircularProgress size={18} />
            ) : (
              i18n.t("common.refresh")
            )}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setConfirmOpen(true)}
            disabled={updating}
            startIcon={
              updating ? <CircularProgress size={18} color="inherit" /> : null
            }
          >
            {updating
              ? i18n.t("settings.docker.dashboardBanner.updating")
              : i18n.t("settings.docker.dashboardBanner.updateAll")}
          </Button>
        </div>
      </Paper>

      <ConfirmationModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleUpdateAll}
        title={i18n.t("settings.docker.confirm.updateAllTitle")}
      >
        {i18n.t("settings.docker.dashboardBanner.confirmBody")}
      </ConfirmationModal>
    </Grid>
  );
};

export default ContainerUpdatesBanner;
