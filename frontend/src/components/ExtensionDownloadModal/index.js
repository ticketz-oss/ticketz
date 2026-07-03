import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
  makeStyles
} from "@material-ui/core";
import { GetApp } from "@material-ui/icons";
import { i18n } from "../../translate/i18n";
import { getBackendURL } from "../../services/config";

const useStyles = makeStyles(theme => ({
  root: {
    textAlign: "center",
    paddingBottom: theme.spacing(2)
  },
  icon: {
    fontSize: 64,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(2)
  },
  actions: {
    marginTop: theme.spacing(3),
    display: "flex",
    justifyContent: "center",
    gap: theme.spacing(2)
  }
}));

const ExtensionDownloadModal = ({ open, onClose, url, error }) => {
  const classes = useStyles();

  const handleDownload = () => {
    if (!url) return;
    window.open(`${getBackendURL()}/public/${url}`, "_blank");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {error
          ? i18n.t("extensionDownloadModal.errorTitle")
          : i18n.t("extensionDownloadModal.title")}
      </DialogTitle>
      <DialogContent className={classes.root}>
        {error ? (
          <Typography color="error" variant="body1">
            {error}
          </Typography>
        ) : (
          <>
            <GetApp className={classes.icon} />
            <Typography variant="body1" gutterBottom>
              {i18n.t("extensionDownloadModal.ready")}
            </Typography>
            <Typography color="textSecondary" variant="body2">
              {i18n.t("extensionDownloadModal.instructions")}
            </Typography>
          </>
        )}
        <div className={classes.actions}>
          {url && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<GetApp />}
              onClick={handleDownload}
            >
              {i18n.t("extensionDownloadModal.download")}
            </Button>
          )}
          <Button variant="outlined" color="primary" onClick={onClose}>
            {i18n.t("common.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExtensionDownloadModal;
