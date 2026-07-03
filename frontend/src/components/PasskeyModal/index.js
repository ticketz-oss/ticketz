import React, { useEffect, useState, useCallback, useContext } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
  CircularProgress,
  makeStyles
} from "@material-ui/core";
import { Fingerprint } from "@material-ui/icons";
import { i18n } from "../../translate/i18n";
import { SocketContext } from "../../context/Socket/SocketContext";
import api from "../../services/api";
import { getBackendURL } from "../../services/config";
import useSettings from "../../hooks/useSettings";
import toastError from "../../errors/toastError";
import getInstallInstructions from "./installInstructions";

const SOURCE = "wasession-capture";

const useStyles = makeStyles(theme => ({
  root: {
    textAlign: "center"
  },
  icon: {
    fontSize: 64,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(2)
  },
  statusBox: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius
  },
  instructionsActions: {
    display: "flex",
    justifyContent: "flex-end",
    paddingBottom: theme.spacing(2)
  }
}));

const PasskeyModal = ({
  open,
  onClose,
  whatsAppId,
  captureToken = "",
  onConnectorReady
}) => {
  const classes = useStyles();
  const socketManager = useContext(SocketContext);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [whatsApp, setWhatsApp] = useState(null);
  const [connectorReady, setConnectorReady] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const { getPublicSetting } = useSettings();

  useEffect(() => {
    const loadDownloadUrl = async () => {
      try {
        const url = await getPublicSetting("extensionDownloadUrl");
        setDownloadUrl(url || "");
      } catch (_) {
        setDownloadUrl("");
      }
    };

    loadDownloadUrl();
  }, [getPublicSetting]);

  useEffect(() => {
    if (whatsApp?.extensionDownloadUrl) {
      setDownloadUrl(whatsApp.extensionDownloadUrl);
    }
  }, [whatsApp]);

  useEffect(() => {
    const fetchSession = async () => {
      if (!whatsAppId) return;
      try {
        const { data } = await api.get(`/whatsapp/${whatsAppId}?session=0`);
        setWhatsApp(data);
      } catch (err) {
        toastError(err);
      }
    };
    fetchSession();
  }, [whatsAppId]);

  const handleMessage = useCallback(
    event => {
      if (event.source !== window) return;
      const data = event.data;
      if (!data || data.source !== SOURCE) return;

      switch (data.type) {
        case "CONNECTOR_READY":
          setConnectorReady(true);
          if (onConnectorReady) {
            onConnectorReady();
          }
          break;
        case "EXISTING_SESSION":
          setStatus("existing");
          setMessage(
            i18n.t("passkeyModal.existingSession", { number: data.number })
          );
          break;
        case "IMPORT_SENT":
          setStatus("success");
          setMessage(i18n.t("passkeyModal.importSent"));
          break;
        case "IMPORT_ERROR":
          setStatus("error");
          setMessage(
            i18n.t("passkeyModal.importError", { reason: data.reason })
          );
          break;
        default:
          break;
      }
    },
    [setConnectorReady, setStatus, setMessage, onConnectorReady]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    window.postMessage({ target: SOURCE, type: "PING" }, "*");

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [handleMessage, onConnectorReady]);

  useEffect(() => {
    if (!whatsAppId) return;
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);

    const onSession = data => {
      if (data.action === "update" && data.session.id === whatsAppId) {
        setWhatsApp(data.session);
        if (data.session.status !== "passkey_required") {
          setTimeout(() => onClose(), 1500);
        }
      }
    };

    socket.on(`company-${companyId}-whatsappSession`, onSession);
    return () => {
      socket.disconnect();
    };
  }, [whatsAppId, onClose, socketManager]);

  const handleStartCapture = () => {
    const token = captureToken || whatsApp?.pairToken;

    if (!token) {
      setStatus("error");
      setMessage(i18n.t("passkeyModal.missingToken"));
      return;
    }

    setStatus("waiting");
    setMessage(i18n.t("passkeyModal.waitingForCapture"));

    const captureUrl = `${getBackendURL()}/whatsappsession/capture/${token}`;
    window.postMessage(
      {
        target: SOURCE,
        type: "START_PASSKEY_IMPORT",
        url: captureUrl
      },
      "*"
    );
  };

  const handleClearAndContinue = () => {
    window.postMessage({ target: SOURCE, type: "CLEAR_AND_CONTINUE" }, "*");
    setStatus("idle");
    setMessage("");
  };

  const handleCaptureExisting = () => {
    window.postMessage({ target: SOURCE, type: "CAPTURE_EXISTING" }, "*");
    setStatus("waiting");
    setMessage(i18n.t("passkeyModal.waitingForCapture"));
  };

  const handleCancel = () => {
    window.postMessage({ target: SOURCE, type: "CANCEL_IMPORT" }, "*");
    onClose();
  };

  const installSteps = getInstallInstructions(i18n.language);

  const handleOpenInstructions = () => {
    setInstructionsOpen(true);
  };

  const handleCloseInstructions = () => {
    setInstructionsOpen(false);
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{i18n.t("passkeyModal.title")}</DialogTitle>
      <DialogContent className={classes.root}>
        <Fingerprint className={classes.icon} />
        <Typography variant="body1" gutterBottom>
          {i18n.t("passkeyModal.instructions")}
        </Typography>
        {!connectorReady && (
          <>
            <Typography color="textSecondary" variant="body2" gutterBottom>
              {i18n.t("passkeyModal.connectorNotFound")}
            </Typography>
            {downloadUrl && (
              <>
                <Button
                  variant="outlined"
                  color="primary"
                  href={`${getBackendURL()}/public/${downloadUrl}`}
                  target="_blank"
                  rel="noopener"
                >
                  {i18n.t("passkeyModal.downloadExtension")}
                </Button>
                <Button
                  variant="text"
                  color="primary"
                  onClick={handleOpenInstructions}
                  style={{ marginTop: 8 }}
                >
                  {i18n.t("passkeyModal.installInstructions")}
                </Button>
              </>
            )}
          </>
        )}
        {connectorReady && status === "idle" && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleStartCapture}
          >
            {i18n.t("passkeyModal.startCapture")}
          </Button>
        )}
        {status === "waiting" && (
          <div className={classes.statusBox}>
            <CircularProgress size={24} />
            <Typography variant="body2">{message}</Typography>
          </div>
        )}
        {status === "existing" && (
          <div className={classes.statusBox}>
            <Typography variant="body2" gutterBottom>
              {message}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCaptureExisting}
              style={{ marginRight: 8 }}
            >
              {i18n.t("passkeyModal.captureExisting")}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleClearAndContinue}
            >
              {i18n.t("passkeyModal.clearAndContinue")}
            </Button>
          </div>
        )}
        {(status === "success" || status === "error") && (
          <div className={classes.statusBox}>
            <Typography
              variant="body2"
              color={status === "success" ? "primary" : "error"}
            >
              {message}
            </Typography>
          </div>
        )}
      </DialogContent>
      <Dialog
        open={instructionsOpen}
        onClose={handleCloseInstructions}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{i18n.t("passkeyModal.installInstructions")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            {i18n.t("passkeyModal.instructionsIntro")}
          </Typography>
          <ol>
            {installSteps.map((step, index) => (
              <li key={`install-step-${index}`}>
                <Typography variant="body2">{step}</Typography>
              </li>
            ))}
          </ol>
        </DialogContent>
        <DialogContent className={classes.instructionsActions}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleCloseInstructions}
          >
            {i18n.t("common.close")}
          </Button>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default React.memo(PasskeyModal);
