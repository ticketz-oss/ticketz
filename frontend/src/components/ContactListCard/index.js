import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Box
} from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import GroupIcon from "@material-ui/icons/Group";
import ScheduleIcon from "@material-ui/icons/Schedule";
import { useDate } from "../../hooks/useDate";

const useStyles = makeStyles(theme => ({
  root: {
    position: "relative",
    cursor: "pointer",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: theme.shadows[4]
    }
  },
  listName: {
    fontWeight: 600,
    marginBottom: theme.spacing(1)
  },
  statsContainer: {
    marginTop: theme.spacing(1)
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1)
  },
  statIcon: {
    color: theme.palette.text.secondary
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: theme.spacing(2)
  }
}));

const ContactListCard = ({ contactList, onEdit, onDelete, onViewContacts }) => {
  const classes = useStyles();
  const { datetimeToClient } = useDate();

  return (
    <Card className={classes.root} variant="outlined" onClick={onViewContacts}>
      <CardContent>
        <Typography variant="h6" component="h2" className={classes.listName}>
          {contactList.name}
        </Typography>

        <Grid container spacing={2} className={classes.statsContainer}>
          <Grid item xs={12} className={classes.statItem}>
            <GroupIcon fontSize="small" className={classes.statIcon} />
            <Typography variant="body2">
              {contactList.contactsCount || 0} contatos
            </Typography>
          </Grid>
          {contactList.createdAt && (
            <Grid item xs={12} className={classes.statItem}>
              <ScheduleIcon fontSize="small" className={classes.statIcon} />
              <Typography variant="body2">
                Criada: {datetimeToClient(contactList.createdAt)}
              </Typography>
            </Grid>
          )}
        </Grid>

        <Box className={classes.actions} onClick={e => e.stopPropagation()}>
          {onEdit && (
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

export default ContactListCard;
