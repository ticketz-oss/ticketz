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
import { ExtensionOutlined } from "@material-ui/icons";
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
  },
  extensionAction: {
    marginTop: theme.spacing(1)
  }
}));

const QrcodeModal = ({
  open,
  onClose,
  whatsAppId,
  onOpenPasskeyModal,
  connectorReady = false
}) => {
  const classes = useStyles();
  const [qrCode, setQrCode] = useState("");

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
          {onOpenPasskeyModal && (
            <Button
              className={classes.extensionAction}
              variant={connectorReady ? "contained" : "outlined"}
              color="primary"
              size="small"
              startIcon={<ExtensionOutlined />}
              onClick={onOpenPasskeyModal}
            >
              {connectorReady
                ? i18n.t("qrCode.startCapture")
                : i18n.t("qrCode.installExtension")}
            </Button>
          )}
        </Paper>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(QrcodeModal);
