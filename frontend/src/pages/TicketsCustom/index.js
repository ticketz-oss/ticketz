import React from "react";
import { useParams } from "react-router-dom";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";

import TicketsManager from "../../components/TicketsManagerTabs/";
import Ticket from "../../components/Ticket/";

import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
  chatContainer: {
    flex: 1,
    height: `calc(100% - 48px)`,
    overflowY: "hidden",
    padding: theme.spacing(1),
    backgroundColor: "transparent"
  },

  chatPapper: {
    display: "flex",
    height: "100%",
    borderRadius: 14,
    overflow: "hidden",
    border: `1px solid ${theme.palette.backgroundContrast.border}`,
    backgroundColor: theme.palette.background.paper,
    boxShadow:
      theme.mode === "light"
        ? "0 12px 30px -24px rgba(0,0,0,0.45)"
        : "0 20px 34px -26px rgba(0,0,0,0.8)"
  },

  contactsWrapper: {
    display: "flex",
    height: "100%",
    flexDirection: "column",
    overflowY: "hidden",
    maxWidth: 534,
    borderRight: `1px solid ${theme.palette.backgroundContrast.border}`,
    backgroundColor:
      theme.mode === "light" ? theme.palette.background.paper : theme.palette.inputBackground
  },
  messagesWrapper: {
    overflow: "hidden",
    display: "flex",
    height: "100%",
    flexDirection: "column",
    flexGrow: 1,
    maxWidth: "unset",
    backgroundColor: theme.palette.background.default
  },
  welcomeMsg: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    textAlign: "center",
    fontWeight: 600,
    color: theme.palette.messageIcons,
    backgroundColor: "transparent",
    border: "none"
  }
}));

const TicketsCustom = () => {
  const classes = useStyles();
  const { ticketId } = useParams();

  return (
    <div className={classes.chatContainer}>
      <div className={classes.chatPapper}>
        <Grid container spacing={0}>
          <Grid item md={5} className={classes.contactsWrapper}>
            <TicketsManager />
          </Grid>
          <Grid item md={7} className={classes.messagesWrapper}>
            {ticketId ? (
              <>
                <Ticket />
              </>
            ) : (
              <Paper square variant="outlined" className={classes.welcomeMsg}>
                <span>{i18n.t("chat.noTicketMessage")}</span>
              </Paper>
            )}
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export default TicketsCustom;
