import React, { useCallback, useContext, useEffect, useState } from "react";
import QRCode from "qrcode.react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  FormControlLabel,
  Grid,
  Paper,
  Typography,
  makeStyles
} from "@material-ui/core";
import { LinkOff, PhoneInTalk } from "@material-ui/icons";
import { toast } from "react-toastify";
import api from "../../services/api";
import { SocketContext } from "../../context/Socket/SocketContext";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
  root: { width: "100%" },
  warning: {
    border: `1px solid ${theme.palette.warning.main}`,
    background: theme.isStardew
      ? "#f5d995"
      : theme.palette.type === "dark"
        ? "#4a3617"
        : "#fff8e1",
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2)
  },
  card: { padding: theme.spacing(2), height: "100%" },
  status: { margin: theme.spacing(1, 0) },
  qr: { padding: 12, background: "white" },
  qrContent: { textAlign: "center", padding: theme.spacing(3) }
}));

const stateLabel = state =>
  i18n.t(`voiceCalls.states.${state || "disconnected"}`, {
    defaultValue: state || "-"
  });

export default function VoiceSettings() {
  const classes = useStyles();
  const socketManager = useContext(SocketContext);
  const [data, setData] = useState({
    enabled: false,
    serviceHealthy: false,
    connections: [],
    whatsapps: []
  });
  const [riskAccepted, setRiskAccepted] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  const [qr, setQr] = useState("");

  const load = useCallback(async () => {
    const response = await api.get("/voice/connections");
    setData(response.data);
  }, []);

  useEffect(() => {
    load().catch(() => toast.error(i18n.t("voiceCalls.errors.load")));
  }, [load]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    if (!companyId) return undefined;
    const socket = socketManager.GetSocket(companyId);
    const onUpdated = payload => {
      if (payload?.qr) setQr(payload.qr);
      if (payload?.connection) {
        setData(current => ({
          ...current,
          connections: [
            ...current.connections.filter(
              item => item.whatsappId !== payload.connection.whatsappId
            ),
            payload.connection
          ]
        }));
      }
    };
    socket.on("voice:updated", onUpdated);
    return () => socket.off("voice:updated", onUpdated);
  }, [socketManager]);

  const pair = async whatsappId => {
    setLoadingId(whatsappId);
    try {
      const response = await api.post(`/voice/connections/${whatsappId}/pair`, {
        riskAccepted
      });
      if (response.data.qr) setQr(response.data.qr);
      await load();
    } catch (error) {
      toast.error(i18n.t("voiceCalls.errors.pair"));
    } finally {
      setLoadingId(null);
    }
  };

  const disconnect = async whatsappId => {
    setLoadingId(whatsappId);
    try {
      await api.delete(`/voice/connections/${whatsappId}`);
      await load();
      toast.success(i18n.t("voiceCalls.disconnectedSuccess"));
    } catch {
      toast.error(i18n.t("voiceCalls.errors.action"));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className={`${classes.root} sd-voice-workshop`}>
      <Paper className={`${classes.warning} sd-workshop-warning`} elevation={0}>
        <Typography variant="h6">
          {i18n.t("voiceCalls.experimentalTitle")}
        </Typography>
        <Typography>{i18n.t("voiceCalls.warning")}</Typography>
      </Paper>
      {!data.serviceHealthy && (
        <Typography color="error" paragraph>
          {i18n.t("voiceCalls.serviceUnavailable")}
        </Typography>
      )}
      <FormControlLabel
        control={
          <Checkbox
            checked={riskAccepted}
            onChange={event => setRiskAccepted(event.target.checked)}
            color="primary"
          />
        }
        label={i18n.t("voiceCalls.riskConsent")}
      />
      <Grid container spacing={2}>
        {data.whatsapps.map(whatsapp => {
          const connection = data.connections.find(
            item => item.whatsappId === whatsapp.id
          );
          const paired = Boolean(connection?.paired);
          return (
            <Grid item xs={12} md={6} key={whatsapp.id}>
              <Paper
                className={`${classes.card} sd-voice-connection`}
                variant="outlined"
              >
                <Typography variant="h6">{whatsapp.name}</Typography>
                <Typography className={classes.status} color="textSecondary">
                  {i18n.t("voiceCalls.status")}: {stateLabel(connection?.state)}
                </Typography>
                {paired ? (
                  <Button
                    variant="outlined"
                    color="secondary"
                    disabled={loadingId === whatsapp.id}
                    startIcon={<LinkOff />}
                    onClick={() => disconnect(whatsapp.id)}
                  >
                    {i18n.t("voiceCalls.disconnect")}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={
                      !riskAccepted ||
                      !data.serviceHealthy ||
                      loadingId === whatsapp.id
                    }
                    startIcon={<PhoneInTalk />}
                    onClick={() => pair(whatsapp.id)}
                  >
                    {i18n.t("voiceCalls.pair")}
                  </Button>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>
      {data.whatsapps.length === 0 && (
        <Typography color="textSecondary">
          {i18n.t("voiceCalls.noConnections")}
        </Typography>
      )}
      <Dialog
        PaperProps={{ className: "sd-voice-dialog" }}
        open={Boolean(qr)}
        onClose={() => setQr("")}
        maxWidth="sm"
      >
        <DialogContent className={classes.qrContent}>
          <Typography paragraph>
            {i18n.t("voiceCalls.qrInstruction")}
          </Typography>
          {qr && <QRCode className={classes.qr} value={qr} size={280} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
