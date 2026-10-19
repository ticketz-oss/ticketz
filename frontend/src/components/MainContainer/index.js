import React from "react";

import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";

const useStyles = makeStyles(theme => ({
  mainContainer: {
    flex: 1,
    padding: "32px 32px 24px",
    [theme.breakpoints.down("sm")]: { padding: 16 },
    height: `calc(100% - var(--altura-cabecalho, 60px))`,
    backgroundColor: theme.palette.background.default
  },

  contentWrapper: {
    height: "100%",
    overflowY: "hidden",
    display: "flex",
    flexDirection: "column"
  }
}));

const MainContainer = ({ children, className = "", style }) => {
  const classes = useStyles();

  return (
    <Container
      maxWidth={false}
      className={`${classes.mainContainer} stardew-main-container ${className}`}
      style={style}
    >
      <div className={classes.contentWrapper}>{children}</div>
    </Container>
  );
};

export default MainContainer;
