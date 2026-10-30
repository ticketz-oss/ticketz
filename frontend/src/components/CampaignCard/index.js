import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Grid,
  Chip,
  IconButton,
  Box,
  Divider
} from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import VisibilityIcon from "@material-ui/icons/Visibility";
import PauseCircleOutlineIcon from "@material-ui/icons/PauseCircleOutline";
import PlayCircleOutlineIcon from "@material-ui/icons/PlayCircleOutline";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import GroupIcon from "@material-ui/icons/Group";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import ScheduleIcon from "@material-ui/icons/Schedule";
import EventAvailableIcon from "@material-ui/icons/EventAvailable";
import DoneIcon from "@material-ui/icons/Done";
import DoneAllIcon from "@material-ui/icons/DoneAll";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import ListAltIcon from "@material-ui/icons/ListAlt";
import { useDate } from "../../hooks/useDate";

const useStyles = makeStyles(theme => ({
  root: {
    position: "relative",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: theme.shadows[4]
    }
  },
  statusChip: {
    position: "absolute",
    top: 8,
    right: 8,
    fontWeight: 600
  },
  statusInactive: {
    backgroundColor: "#9e9e9e",
    color: "#fff"
  },
  statusScheduled: {
    backgroundColor: "#2196f3",
    color: "#fff"
  },
  statusRunning: {
    backgroundColor: "#4caf50",
    color: "#fff"
  },
  statusCancelled: {
    backgroundColor: "#f44336",
    color: "#fff"
  },
  statusFinished: {
    backgroundColor: "#000000",
    color: "#fff"
  },
  progress: {
    height: 12,
    borderRadius: 5,
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1)
  },
  progressText: {
    marginBottom: theme.spacing(2)
  },
  statsContainer: {
    marginTop: theme.spacing(2)
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    padding: theme.spacing(0.5, 0)
  },
  statIcon: {
    color: theme.palette.primary.main,
    fontSize: 20
  },
  statLabel: {
    color: theme.palette.text.secondary,
    fontSize: "0.75rem"
  },
  statValue: {
    fontWeight: 600,
    fontSize: "0.875rem"
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: theme.spacing(2),
    gap: theme.spacing(0.5)
  },
  campaignName: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
    paddingRight: theme.spacing(10)
  },
  divider: {
    margin: theme.spacing(2, 0)
  },
  sectionTitle: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: theme.palette.text.secondary,
    textTransform: "uppercase",
    marginBottom: theme.spacing(1)
  }
}));

const CampaignCard = ({
  campaign,
  validContacts,
  delivered,
  confirmationRequested,
  confirmed,
  onView,
  onEdit,
  onCancel,
  onRestart,
  onDelete
}) => {
  const classes = useStyles();
  const { datetimeToClient } = useDate();

  const percent = validContacts > 0 ? (delivered / validContacts) * 100 : 0;

  const formatStatus = status => {
    const statusMap = {
      INATIVA: "Inativa",
      PROGRAMADA: "Programada",
      EM_ANDAMENTO: "Em Andamento",
      CANCELADA: "Cancelada",
      FINALIZADA: "Finalizada"
    };
    return statusMap[status] || status;
  };

  const getStatusClass = status => {
    const statusClassMap = {
      INATIVA: classes.statusInactive,
      PROGRAMADA: classes.statusScheduled,
      EM_ANDAMENTO: classes.statusRunning,
      CANCELADA: classes.statusCancelled,
      FINALIZADA: classes.statusFinished
    };
    return statusClassMap[status] || classes.statusInactive;
  };

  const canEdit =
    campaign.status === "INATIVA" ||
    (campaign.status === "PROGRAMADA" &&
      new Date(campaign.scheduledAt) > new Date(Date.now() + 3600000));

  const showProgress =
    campaign.status === "EM_ANDAMENTO" || campaign.status === "FINALIZADA";

  return (
    <Card className={classes.root} variant="outlined">
      <CardContent>
        <Chip
          label={formatStatus(campaign.status)}
          size="small"
          className={`${classes.statusChip} ${getStatusClass(campaign.status)}`}
        />

        <Typography
          variant="h6"
          component="h2"
          className={classes.campaignName}
        >
          {campaign.name}
        </Typography>

        {showProgress && (
          <>
            <LinearProgress
              variant="determinate"
              value={percent}
              className={classes.progress}
              color={campaign.status === "FINALIZADA" ? "default" : "primary"}
            />
            <Typography
              variant="body2"
              color="textSecondary"
              className={classes.progressText}
            >
              {delivered} de {validContacts} ({percent.toFixed(1)}%)
            </Typography>
          </>
        )}

        <Box className={classes.statsContainer}>
          <Typography className={classes.sectionTitle}>Progresso</Typography>
          <Grid container spacing={1}>
            <Grid item xs={6} className={classes.statItem}>
              <GroupIcon className={classes.statIcon} />
              <Box>
                <Typography className={classes.statLabel}>
                  Contatos Válidos
                </Typography>
                <Typography className={classes.statValue}>
                  {validContacts}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} className={classes.statItem}>
              <CheckCircleIcon className={classes.statIcon} />
              <Box>
                <Typography className={classes.statLabel}>Entregues</Typography>
                <Typography className={classes.statValue}>
                  {delivered}
                </Typography>
              </Box>
            </Grid>
            {campaign.confirmation && (
              <>
                <Grid item xs={6} className={classes.statItem}>
                  <DoneIcon className={classes.statIcon} />
                  <Box>
                    <Typography className={classes.statLabel}>
                      Conf. Solicitadas
                    </Typography>
                    <Typography className={classes.statValue}>
                      {confirmationRequested}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} className={classes.statItem}>
                  <DoneAllIcon className={classes.statIcon} />
                  <Box>
                    <Typography className={classes.statLabel}>
                      Confirmações
                    </Typography>
                    <Typography className={classes.statValue}>
                      {confirmed}
                    </Typography>
                  </Box>
                </Grid>
              </>
            )}
          </Grid>
        </Box>

        <Divider className={classes.divider} />

        <Box>
          <Grid container spacing={1}>
            {campaign.whatsapp?.name && (
              <Grid item xs={12} className={classes.statItem}>
                <WhatsAppIcon className={classes.statIcon} />
                <Box>
                  <Typography className={classes.statLabel}>Conexão</Typography>
                  <Typography className={classes.statValue}>
                    {campaign.whatsapp.name}
                  </Typography>
                </Box>
              </Grid>
            )}
            {campaign.contactList?.name && (
              <Grid item xs={6} className={classes.statItem}>
                <ListAltIcon className={classes.statIcon} />
                <Box>
                  <Typography className={classes.statValue}>
                    {campaign.contactList.name}
                  </Typography>
                </Box>
              </Grid>
            )}
            {campaign.scheduledAt && (
              <Grid item xs={6} className={classes.statItem}>
                <ScheduleIcon className={classes.statIcon} />
                <Box>
                  <Typography className={classes.statValue}>
                    {datetimeToClient(campaign.scheduledAt)}
                  </Typography>
                </Box>
              </Grid>
            )}
            {campaign.completedAt && (
              <Grid item xs={12} className={classes.statItem}>
                <EventAvailableIcon className={classes.statIcon} />
                <Box>
                  <Typography className={classes.statLabel}>
                    Conclusão
                  </Typography>
                  <Typography className={classes.statValue}>
                    {datetimeToClient(campaign.completedAt)}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>

        <Box className={classes.actions}>
          {campaign.status === "EM_ANDAMENTO" && onCancel && (
            <IconButton size="small" onClick={onCancel} title="Parar Campanha">
              <PauseCircleOutlineIcon fontSize="small" />
            </IconButton>
          )}
          {campaign.status === "CANCELADA" && onRestart && (
            <IconButton
              size="small"
              onClick={onRestart}
              title="Reiniciar Campanha"
            >
              <PlayCircleOutlineIcon fontSize="small" />
            </IconButton>
          )}
          {onView && (
            <IconButton size="small" onClick={onView} title="Ver Detalhes">
              <VisibilityIcon fontSize="small" />
            </IconButton>
          )}
          {canEdit && onEdit && (
            <IconButton size="small" onClick={onEdit} title="Editar">
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton size="small" onClick={onDelete} title="Excluir">
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CampaignCard;
