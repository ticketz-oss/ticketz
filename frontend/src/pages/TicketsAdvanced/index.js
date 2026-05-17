import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";
import BottomNavigation from "@material-ui/core/BottomNavigation";
import BottomNavigationAction from "@material-ui/core/BottomNavigationAction";
import QuestionAnswerIcon from "@material-ui/icons/QuestionAnswer";
import ChatIcon from "@material-ui/icons/Chat";

import TicketsManagerTabs from "../../components/TicketsManagerTabs/";
import Ticket from "../../components/Ticket/";
import TicketAdvancedLayout from "../../components/TicketAdvancedLayout";

import { TicketsContext } from "../../context/Tickets/TicketsContext";

import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
  header: {
    position: "sticky",
    top: 0,
    zIndex: 2,
    borderBottom: `1px solid ${theme.palette.backgroundContrast.border}`,
    backgroundColor: theme.palette.background.paper
  },
  nav: {
    height: 56,
    backgroundColor: "transparent",
    "& .MuiBottomNavigationAction-root": {
      minWidth: 0,
      maxWidth: "none",
      borderRadius: 10,
      margin: theme.spacing(0.75),
      color: theme.palette.messageIcons,
      transition: "background-color 160ms ease"
    },
    "& .MuiBottomNavigationAction-label": {
      fontSize: "0.72rem",
      fontWeight: 600
    },
    "& .MuiBottomNavigationAction-root.Mui-selected": {
      color: theme.palette.primary.main,
      backgroundColor:
        theme.mode === "light" ? "rgba(255,122,0,0.14)" : "rgba(255,154,47,0.22)",
      border: `1px solid ${
        theme.mode === "light"
          ? "rgba(255,122,0,0.24)"
          : "rgba(255,154,47,0.35)"
      }`
    }
  },
  content: {
    overflow: "auto",
    backgroundColor: theme.palette.background.default
  },
  placeholderContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing(2),
    height: "100%",
    padding: theme.spacing(2.5),
    textAlign: "center"
  },
  placeholderItem: {
    color: theme.palette.messageIcons,
    fontWeight: 600
  }
}));

const TicketAdvanced = props => {
  const classes = useStyles();
  const { ticketId } = useParams();
  const [option, setOption] = useState(0);
  const { currentTicket, setCurrentTicket } = useContext(TicketsContext);

  useEffect(() => {
    if (currentTicket.id !== null) {
      setCurrentTicket({ id: currentTicket.id, code: "#open" });
    }
    if (!ticketId) {
      setOption(1);
    }
    return () => {
      setCurrentTicket({ id: null, code: null });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentTicket.id !== null) {
      setOption(0);
    }
  }, [currentTicket]);

  const renderPlaceholder = () => {
    return (
      <Box className={classes.placeholderContainer}>
        <div className={classes.placeholderItem}>
          {i18n.t("chat.noTicketMessage")}
        </div>
        <br />
        <Button
          onClick={() => setOption(1)}
          variant="contained"
          color="primary"
        >
          Selecionar Ticket
        </Button>
      </Box>
    );
  };

  const renderMessageContext = () => {
    if (ticketId) {
      return <Ticket />;
    }
    return renderPlaceholder();
  };

  const renderTicketsManagerTabs = () => {
    return <TicketsManagerTabs />;
  };

  return (
    <TicketAdvancedLayout>
      <Box className={classes.header}>
        <BottomNavigation
          value={option}
          onChange={(event, newValue) => {
            setOption(newValue);
          }}
          showLabels
          className={classes.nav}
        >
          <BottomNavigationAction label="Ticket" icon={<ChatIcon />} />
          <BottomNavigationAction
            label="Atendimentos"
            icon={<QuestionAnswerIcon />}
          />
        </BottomNavigation>
      </Box>
      <Box className={classes.content}>
        {option === 0 ? renderMessageContext() : renderTicketsManagerTabs()}
      </Box>
    </TicketAdvancedLayout>
  );
};

export default TicketAdvanced;
