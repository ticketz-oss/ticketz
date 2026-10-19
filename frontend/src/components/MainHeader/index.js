import React from "react";

import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(theme => ({
  contactsHeader: {
    display: "flex",
    alignItems: "center",
    padding: "0 0 20px",
    gap: 16,
    flexWrap: "wrap",
    backgroundColor: theme.palette.background.default
  }
}));

const MainHeader = ({ children }) => {
  const classes = useStyles();

  return (
    <div className={`${classes.contactsHeader} stardew-main-header`}>
      {children}
    </div>
  );
};

export default MainHeader;
