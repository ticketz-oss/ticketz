import React from "react";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(theme => ({
  wrapper: {
    position: "relative",
    display: "flex",
    height: "100%",
    minHeight: 0,
    flexDirection: "column",
    overflow: "hidden",
    border: 0,
    borderRadius: 0
  },
  scroll: {
    flex: 1,
    maxHeight: "100%",
    overflowY: "auto",
    ...theme.scrollbarStyles,
    border: 0
  }
}));

// The sidebar owns the only outline. Nested elevation1 Papers add duplicate
// borders through the global theme, even when their box-shadow is disabled.
export default function TicketListSurface({ children, style, onScroll }) {
  const classes = useStyles();
  return (
    <Paper
      square
      elevation={0}
      className={`${classes.wrapper} fila-superficie`}
      style={style}
      data-testid="ticket-list-surface"
    >
      <Paper
        square
        elevation={0}
        className={`${classes.scroll} fila-rolagem`}
        onScroll={onScroll}
        data-testid="ticket-list-scroll"
      >
        {children}
      </Paper>
    </Paper>
  );
}
