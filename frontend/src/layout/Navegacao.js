import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Collapse,
  Tooltip
} from "@material-ui/core";
import { makeStyles, alpha } from "@material-ui/core/styles";
import ExpandMore from "@material-ui/icons/ExpandMore";
import { i18n } from "../translate/i18n";
import "../components/interface/motion.css";

const useStyles = makeStyles(tema => ({
  grupo: { padding: 0, margin: 0, listStyle: "none" },
  titulo: {
    position: "static",
    padding: "18px 12px 6px",
    lineHeight: "18px",
    fontSize: 10,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: tema.palette.text.secondary
  },
  item: {
    minHeight: 38,
    borderRadius: 8,
    padding: "6px 10px",
    marginBottom: 3,
    color: tema.palette.text.secondary,
    "& .MuiListItemIcon-root": {
      minWidth: 32,
      color: "inherit",
      "& svg": { fontSize: 19 }
    },
    "& .MuiTypography-root": { fontSize: 13, fontWeight: 500 },
    "&.ativo": {
      color: tema.palette.primary.main,
      backgroundColor: alpha(tema.palette.primary.main, 0.09),
      "& .MuiTypography-root": { fontWeight: 600 }
    }
  },
  sublista: {
    marginLeft: 19,
    paddingLeft: 12,
    borderLeft: `1px solid ${tema.palette.divider}`
  },
  seta: { fontSize: 16, marginLeft: "auto" },
  aberta: { transform: "rotate(180deg)" }
}));

function ItemNavegacao({ item, expandido, aoNavegar }) {
  const classes = useStyles();
  const { pathname } = useLocation();
  const selecionado = item.filhos?.some(filho => pathname.startsWith(filho.to));
  const [aberto, definirAberto] = useState(!!selecionado);
  const titulo = i18n.t(item.chave);
  const conteudo = (
    <>
      <ListItemIcon>{item.icone}</ListItemIcon>
      {expandido && <ListItemText primary={titulo} />}
      {item.filhos && expandido && (
        <ExpandMore
          className={`${classes.seta} ${aberto ? classes.aberta : ""}`}
        />
      )}
    </>
  );

  return (
    <li>
      <Tooltip title={expandido ? "" : titulo} placement="right">
        {item.filhos ? (
          <ListItem
            button
            className={`ew-nav-motion ${classes.item} ${selecionado ? "ativo" : ""}`}
            data-tour={item.chave}
            aria-label={titulo}
            aria-expanded={aberto}
            onClick={() => definirAberto(!aberto)}
          >
            {conteudo}
          </ListItem>
        ) : (
          <ListItem
            button
            component={NavLink}
            role="link"
            exact={item.to === "/"}
            to={item.to}
            activeClassName="ativo"
            className={`ew-nav-motion ${classes.item}`}
            data-tour={item.to}
            aria-label={titulo}
            onClick={aoNavegar}
          >
            {conteudo}
          </ListItem>
        )}
      </Tooltip>
      {item.filhos && (
        <Collapse in={aberto} unmountOnExit>
          <List className={expandido ? classes.sublista : classes.grupo}>
            {item.filhos.map(filho => (
              <ItemNavegacao
                key={filho.to}
                item={filho}
                expandido={expandido}
                aoNavegar={aoNavegar}
              />
            ))}
          </List>
        </Collapse>
      )}
    </li>
  );
}

export default function Navegacao({ grupos, expandido, aoNavegar }) {
  const classes = useStyles();
  return grupos
    .filter(grupo => grupo.itens.length)
    .map(grupo => (
      <List
        key={grupo.chave}
        className={classes.grupo}
        subheader={
          expandido ? (
            <ListSubheader className={classes.titulo}>
              {i18n.t(grupo.chave)}
            </ListSubheader>
          ) : null
        }
      >
        {grupo.itens.map(item => (
          <ItemNavegacao
            key={item.to || item.chave}
            item={item}
            expandido={expandido}
            aoNavegar={aoNavegar}
          />
        ))}
      </List>
    ));
}
