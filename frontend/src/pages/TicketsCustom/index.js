import React from "react";
import { useParams } from "react-router-dom";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { MessageCircle } from "lucide-react";
import "./atendimento.css";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";

import TicketsManager from "../../components/TicketsManagerTabs/";
import Ticket from "../../components/Ticket/";

import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
  chatContainer: {
    flex: 1,
    height: `calc(100% - var(--altura-cabecalho, 60px))`,
    overflowY: "hidden",
    padding: "0 0 0 0"
  },

  chatPapper: {
    gap: 12,
    display: "flex",
    height: "100%"
  },

  contactsWrapper: { height: "100%", minWidth: 0, overflow: "hidden" },
  messagesWrapper: {
    overflow: "hidden",
    display: "flex",
    height: "100%",
    flexDirection: "column",
    flexGrow: 1,
    maxWidth: "unset",
    flex: 1,
    minWidth: 0,
    borderRadius: theme.isStardew ? 0 : 16
  },
  welcomeMsg: {
    display: "flex",
    justifyContent: "space-evenly",
    alignItems: "center",
    height: "100%",
    textAlign: "center"
  }
}));

const TicketsCustom = () => {
  const classes = useStyles();
  const { ticketId } = useParams();

  return (
    <div
      className={`${classes.chatContainer} atendimento-layout`}
      data-stardew-screen="tickets"
    >
      <div className={classes.chatPapper}>
        <PanelGroup
          direction="horizontal"
          autoSaveId="espaco-atendimento-paineis-v2"
        >
          <Panel
            defaultSize={28}
            minSize={23}
            maxSize={35}
            className={classes.contactsWrapper}
          >
            <TicketsManager />
          </Panel>
          <PanelResizeHandle
            className="atendimento-divisor"
            aria-label={i18n.t("visual.redimensionar")}
          />
          <Panel minSize={45} className={classes.messagesWrapper}>
            {ticketId ? (
              <>
                <Ticket />
              </>
            ) : (
              <Paper square variant="outlined" className={classes.welcomeMsg}>
                <div className="atendimento-vazio">
                  <MessageCircle size={34} />
                  <span>{i18n.t("chat.noTicketMessage")}</span>
                </div>
              </Paper>
            )}
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default TicketsCustom;
