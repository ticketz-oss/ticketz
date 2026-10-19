import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Button, makeStyles } from "@material-ui/core";
import ChatBubbleOutline from "@material-ui/icons/ChatBubbleOutline";
import PeopleOutline from "@material-ui/icons/PeopleOutline";
import { i18n } from "../translate/i18n";

const useStyles = makeStyles(tema => ({
  atalhos: {
    display: "flex",
    gap: 4,
    padding: 3,
    marginRight: "auto",
    border: `1px solid ${tema.palette.divider}`,
    borderRadius: 8,
    "& .MuiButton-root": {
      minHeight: 30,
      padding: "4px 10px",
      color: tema.palette.text.secondary
    },
    "& .ativo": {
      color: tema.palette.primary.main,
      backgroundColor: tema.palette.action.hover
    },
    [tema.breakpoints.down("md")]: { display: "none" }
  }
}));

export default function AtalhosAtendimento() {
  const { pathname } = useLocation();
  const classes = useStyles();
  if (!/^\/(tickets|chats)(\/|$)/.test(pathname)) return null;
  return (
    <div className={classes.atalhos}>
      <Button
        component={NavLink}
        to="/tickets"
        activeClassName="ativo"
        startIcon={<ChatBubbleOutline />}
      >
        {i18n.t("mainDrawer.listItems.tickets")}
      </Button>
      <Button
        component={NavLink}
        to="/chats"
        activeClassName="ativo"
        startIcon={<PeopleOutline />}
      >
        {i18n.t("mainDrawer.listItems.chats")}
      </Button>
    </div>
  );
}
