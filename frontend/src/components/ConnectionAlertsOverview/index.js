import React from "react";
import clsx from "clsx";
import {
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  Paper,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import NotificationsActiveOutlinedIcon from "@material-ui/icons/NotificationsActiveOutlined";
import PortableWifiOffOutlinedIcon from "@material-ui/icons/PortableWifiOffOutlined";
import VisibilityOutlinedIcon from "@material-ui/icons/VisibilityOutlined";
import DeleteSweepOutlinedIcon from "@material-ui/icons/DeleteSweepOutlined";

import useConnectionAlerts from "../../hooks/useConnectionAlerts";
import {
  formatConnectionAlertTime,
  getConnectionAlertCompanyName,
  getConnectionAlertEmailStatusLabel,
  getConnectionAlertReasonLabel,
  getConnectionAlertTypeLabel
} from "../../helpers/connectionAlerts";

const useStyles = makeStyles(theme => ({
  root: {
    width: "100%"
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2)
  },
  subtitle: {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5)
  },
  card: {
    padding: theme.spacing(2),
    height: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  cardValue: {
    fontWeight: 700,
    marginTop: theme.spacing(1)
  },
  cardIcon: {
    opacity: 0.35,
    fontSize: 34
  },
  listPaper: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(1),
    ...theme.scrollbarStyles
  },
  listHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(1, 1.5, 0.5)
  },
  list: {
    maxHeight: 340,
    overflowY: "auto",
    ...theme.scrollbarStyles
  },
  listRow: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(1.5)
  },
  listText: {
    minWidth: 0,
    flex: 1
  },
  rowTitle: {
    fontWeight: 600
  },
  rowMeta: {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.25)
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: theme.spacing(1)
  },
  viewedRow: {
    opacity: 0.72
  },
  emptyState: {
    padding: theme.spacing(3),
    display: "flex",
    justifyContent: "center"
  }
}));

const StatCard = ({ title, value, icon }) => {
  const classes = useStyles();

  return (
    <Paper variant="outlined" className={classes.card}>
      <div>
        <Typography variant="body2" color="textSecondary">
          {title}
        </Typography>
        <Typography variant="h5" className={classes.cardValue}>
          {value}
        </Typography>
      </div>
      <div className={classes.cardIcon}>{icon}</div>
    </Paper>
  );
};

const ConnectionAlertsOverview = ({
  title = "Monitoramento de conexoes",
  subtitle,
  maxItems = 6,
  companyId
}) => {
  const classes = useStyles();
  const { alerts, summary, loading, markAllViewed } = useConnectionAlerts({
    companyId,
    limit: maxItems
  });

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div>
          <Typography variant="h6">{title}</Typography>
          {subtitle && (
            <Typography variant="body2" className={classes.subtitle}>
              {subtitle}
            </Typography>
          )}
        </div>

        {summary.unviewed > 0 && (
          <Button color="primary" size="small" onClick={markAllViewed}>
            Marcar tudo como visto
          </Button>
        )}
      </div>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Alertas totais"
            value={summary.total}
            icon={<NotificationsActiveOutlinedIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Nao visualizados"
            value={summary.unviewed}
            icon={<VisibilityOutlinedIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Desconectadas"
            value={summary.disconnected}
            icon={<PortableWifiOffOutlinedIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Deletadas"
            value={summary.deleted}
            icon={<DeleteSweepOutlinedIcon />}
          />
        </Grid>
      </Grid>

      <Paper variant="outlined" className={classes.listPaper}>
        <div className={classes.listHeader}>
          <Typography variant="subtitle1">Ultimos eventos</Typography>
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
              Nenhum alerta registrado ate o momento.
            </Typography>
          </div>
        ) : (
          <List className={classes.list}>
            {alerts.map(alert => (
              <ListItem
                key={alert.id}
                divider
                className={clsx(alert.viewed && classes.viewedRow)}
              >
                <div className={classes.listRow}>
                  <div className={classes.listText}>
                    <Typography
                      variant="body2"
                      className={classes.rowTitle}
                      noWrap
                    >
                      {alert.connectionName || `Conexao ${alert.whatsappId}`}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      className={classes.rowMeta}
                    >
                      {getConnectionAlertCompanyName(alert)} •{" "}
                      {formatConnectionAlertTime(alert.occurredAt)}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      className={classes.rowMeta}
                    >
                      {getConnectionAlertReasonLabel(alert.reason)}
                    </Typography>
                  </div>
                  <div className={classes.chips}>
                    <Chip
                      size="small"
                      color="secondary"
                      label={getConnectionAlertTypeLabel(alert.eventType)}
                    />
                    <Chip
                      size="small"
                      variant="outlined"
                      label={getConnectionAlertEmailStatusLabel(
                        alert.emailStatus
                      )}
                    />
                  </div>
                </div>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </div>
  );
};

export default ConnectionAlertsOverview;
