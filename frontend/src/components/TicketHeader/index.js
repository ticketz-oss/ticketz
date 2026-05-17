import React from "react";

import { Card } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import TicketHeaderSkeleton from "../TicketHeaderSkeleton";

const useStyles = makeStyles(theme => ({
  ticketHeader: {
    display: "flex",
    flex: "none",
    alignItems: "center",
    borderBottom: `1px solid ${theme.palette.backgroundContrast.border}`,
    backgroundColor:
      theme.mode === "light" ? "rgba(255,255,255,0.92)" : theme.palette.background.paper,
    backdropFilter: "blur(6px)",
    boxShadow: "none"
  }
}));

const TicketHeader = ({ loading, children }) => {
  const classes = useStyles();

  return (
    <>
      {loading ? (
        <TicketHeaderSkeleton />
      ) : (
        <Card square className={classes.ticketHeader}>
          {children}
        </Card>
      )}
    </>
  );
};

export default TicketHeader;
