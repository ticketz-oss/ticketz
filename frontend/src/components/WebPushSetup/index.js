import React, { useCallback, useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import Typography from "@material-ui/core/Typography";
import NotificationsActiveOutlinedIcon from "@material-ui/icons/NotificationsActiveOutlined";
import PhoneIphoneOutlinedIcon from "@material-ui/icons/PhoneIphoneOutlined";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import {
  enableWebPush,
  testWebPush,
  webPushState,
  webPushSupported
} from "../../services/webPush";

const useStyles = makeStyles(theme => ({
  root: {
    margin: theme.spacing(1),
    padding: theme.spacing(1.5),
    maxWidth: 340,
    borderRadius: 16,
    background: theme.palette.action.hover
  },
  heading: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    fontWeight: 700
  },
  actions: {
    display: "flex",
    gap: theme.spacing(1),
    marginTop: theme.spacing(1)
  }
}));

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

const text = (key, defaultValue) => i18n.t(key, { defaultValue });

const WebPushSetup = () => {
  const classes = useStyles();
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const state = await webPushState();
      setActive(state.active);
    } catch (error) {
      setActive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isIOS()) {
      setLoading(false);
      return;
    }
    refresh();
  }, [refresh]);

  if (!isIOS()) return null;

  const activate = async () => {
    setLoading(true);
    try {
      await enableWebPush();
      setActive(true);
    } catch (error) {
      toastError(error);
    } finally {
      setLoading(false);
    }
  };

  const sendTest = async () => {
    setLoading(true);
    try {
      await testWebPush();
      setSent(true);
    } catch (error) {
      toastError(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isStandalone()) {
    return (
      <Box className={classes.root}>
        <Typography className={classes.heading}>
          <PhoneIphoneOutlinedIcon />
          {text("webPush.installTitle", "Avisos no iPhone")}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {text(
            "webPush.installHelp",
            "No Safari, toque em Compartilhar e Adicionar à Tela de Início. Abra o ícone criado para ativar os avisos."
          )}
        </Typography>
      </Box>
    );
  }

  return (
    <Box className={classes.root}>
      <Typography className={classes.heading}>
        <NotificationsActiveOutlinedIcon />
        {active
          ? text("webPush.active", "Avisos em segundo plano ativos")
          : text("webPush.title", "Receba mensagens no iPhone")}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        {active
          ? text(
              "webPush.activeHelp",
              "Ao tocar no aviso, o atendimento será aberto no app Espaço Whats."
            )
          : text(
              "webPush.help",
              "Ative uma vez para receber nome, mensagem e canal mesmo com o app fechado."
            )}
      </Typography>
      <Box className={classes.actions}>
        {!active ? (
          <Button
            color="primary"
            variant="contained"
            size="small"
            disabled={loading || !webPushSupported()}
            onClick={activate}
          >
            {loading ? (
              <CircularProgress size={18} />
            ) : (
              text("webPush.enable", "Ativar")
            )}
          </Button>
        ) : (
          <Button
            color="primary"
            variant="outlined"
            size="small"
            disabled={loading}
            onClick={sendTest}
          >
            {loading ? (
              <CircularProgress size={18} />
            ) : sent ? (
              text("webPush.sent", "Teste enviado")
            ) : (
              text("webPush.test", "Enviar teste")
            )}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default WebPushSetup;
