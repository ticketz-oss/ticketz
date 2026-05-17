import React, { useContext, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  Badge,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  Popover,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import PortableWifiOffOutlinedIcon from "@material-ui/icons/PortableWifiOffOutlined";

import { AuthContext } from "../../context/Auth/AuthContext";
import useConnectionAlerts from "../../hooks/useConnectionAlerts";
import {
  formatConnectionAlertTime,
  getConnectionAlertCompanyName,
  getConnectionAlertTypeLabel
} from "../../helpers/connectionAlerts";

const useStyles = makeStyles(theme => ({
  popoverPaper: {
    width: "100%",
    maxWidth: 380,
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(1)
  },
  header: {
    padding: theme.spacing(1.5, 2, 1),
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(1)
  },
  list: {
    maxHeight: 360,
    overflowY: "auto",
    ...theme.scrollbarStyles
  },
  emptyState: {
    padding: theme.spacing(3),
    display: "flex",
    justifyContent: "center"
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    gap: theme.spacing(1),
    padding: theme.spacing(1.5, 2)
  }
}));

const ConnectionAlertsPopover = () => {
  const classes = useStyles();
  const history = useHistory();
  const anchorEl = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const { alerts, summary, loading, markAllViewed } = useConnectionAlerts({
    limit: 8
  });

  const handleToggle = () => {
    setIsOpen(currentValue => !currentValue);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleOpenPanel = () => {
    history.push(user?.super ? "/" : "/connections");
    handleClose();
  };

  return (
    <>
      <IconButton ref={anchorEl} onClick={handleToggle} color="inherit">
        <Badge badgeContent={summary.unviewed} color="error" max={99}>
          <PortableWifiOffOutlinedIcon />
        </Badge>
      </IconButton>

      <Popover
        open={isOpen}
        anchorEl={anchorEl.current}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center"
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right"
        }}
        classes={{ paper: classes.popoverPaper }}
      >
        <div className={classes.header}>
          <div>
            <Typography variant="subtitle1">Alertas de conexao</Typography>
            <Typography variant="body2" color="textSecondary">
              {summary.unviewed} nao visualizados
            </Typography>
          </div>
          {loading && <CircularProgress size={18} />}
        </div>

        <Divider />

        {loading && alerts.length === 0 ? (
          <div className={classes.emptyState}>
            <CircularProgress size={24} />
          </div>
        ) : alerts.length === 0 ? (
          <div className={classes.emptyState}>
            <Typography variant="body2" color="textSecondary">
              Nenhum alerta recente.
            </Typography>
          </div>
        ) : (
          <List className={classes.list}>
            {alerts.map(alert => (
              <ListItem button key={alert.id} onClick={handleOpenPanel} divider>
                <div>
                  <Typography variant="body2">
                    {alert.connectionName || `Conexao ${alert.whatsappId}`}
                  </Typography>
                  <Typography
                    variant="caption"
                    display="block"
                    color="textSecondary"
                  >
                    {getConnectionAlertCompanyName(alert)} •{" "}
                    {getConnectionAlertTypeLabel(alert.eventType)}
                  </Typography>
                  <Typography
                    variant="caption"
                    display="block"
                    color="textSecondary"
                  >
                    {formatConnectionAlertTime(alert.occurredAt)}
                  </Typography>
                </div>
              </ListItem>
            ))}
          </List>
        )}

        <Divider />

        <div className={classes.footer}>
          <Button
            size="small"
            onClick={markAllViewed}
            disabled={summary.unviewed === 0}
          >
            Marcar vistos
          </Button>
          <Button size="small" color="primary" onClick={handleOpenPanel}>
            Abrir painel
          </Button>
        </div>
      </Popover>
    </>
  );
};

export default ConnectionAlertsPopover;
