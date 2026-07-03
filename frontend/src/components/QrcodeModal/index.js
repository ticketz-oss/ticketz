import React, { useEffect, useState, useContext } from "react";
import QRCode from "qrcode.react";
import toastError from "../../errors/toastError";

import {
  Dialog,
  DialogContent,
  Paper,
  Typography,
  Button,
  makeStyles
} from "@material-ui/core";
import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import { SocketContext } from "../../context/Socket/SocketContext";

const useStyles = makeStyles(theme => ({
  qrcodeFrame: {
    padding: "10px",
    backgroundColor: "#fff"
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: theme.spacing(2),
    gap: theme.spacing(2)
  }
}));

const QrcodeModal = ({
  open,
  onClose,
  whatsAppId,
  onTriggerCapture,
  connectorReady = false
}) => {
  const classes = useStyles();
  const [qrCode, setQrCode] = useState("");
  const [requestingToken, setRequestingToken] = useState(false);

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    const fetchSession = async () => {
      if (!whatsAppId) return;

      try {
        const { data } = await api.get(`/whatsapp/${whatsAppId}`);
        setQrCode(data.qrcode);
      } catch (err) {
        toastError(err);
      }
    };
    fetchSession();
  }, [whatsAppId]);

  useEffect(() => {
    if (!whatsAppId) return;
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);

    const onCompanyWhatsappSession = data => {
      if (data.action === "update" && data.session.id === whatsAppId) {
        setQrCode(data.session.qrcode);
      }

      if (data.action === "update" && data.session.qrcode === "") {
        onClose();
      }
    };

    socket.on(`company-${companyId}-whatsappSession`, onCompanyWhatsappSession);

    return () => {
      socket.disconnect();
    };
  }, [whatsAppId, onClose, socketManager]);

  const handleTriggerCapture = async () => {
    if (!whatsAppId || !onTriggerCapture) return;

    setRequestingToken(true);
    try {
      const { data } = await api.post(
        `/whatsappsession/${whatsAppId}/capture-token`
      );
      onTriggerCapture(data.token);
    } catch (err) {
      toastError(err);
    } finally {
      setRequestingToken(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" scroll="paper">
      <DialogContent>
        <Paper elevation={0} className={classes.content}>
          <Typography color="primary" gutterBottom>
            {i18n.t("qrCode.message")}
          </Typography>
          {qrCode ? (
            <QRCode className={classes.qrcodeFrame} value={qrCode} size={256} />
          ) : (
            <Typography component="span" variant="body1">
              Waiting for QR Code
            </Typography>
          )}
          {connectorReady && onTriggerCapture && (
            <>
              <Typography color="textSecondary" variant="body2">
                {i18n.t("qrCode.localDevHint")}
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                disabled={requestingToken}
                onClick={handleTriggerCapture}
              >
                {i18n.t("qrCode.triggerCapture")}
              </Button>
            </>
          )}
        </Paper>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(QrcodeModal);
