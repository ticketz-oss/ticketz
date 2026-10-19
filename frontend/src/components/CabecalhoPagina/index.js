import React from "react";
import { Typography, makeStyles } from "@material-ui/core";

const useStyles = makeStyles(tema => ({
  titulo: {
    minWidth: 0,
    flex: 1,
    [tema.breakpoints.down("xs")]: { flexBasis: "100%" }
  },
  descricao: {
    maxWidth: 640,
    marginTop: 4,
    fontSize: 13,
    color: tema.palette.text.secondary
  }
}));

export default function CabecalhoPagina({ titulo, descricao }) {
  const classes = useStyles();
  return (
    <div className={classes.titulo}>
      <Typography component="h1" variant="h5">
        {titulo}
      </Typography>
      {descricao && (
        <Typography className={classes.descricao}>{descricao}</Typography>
      )}
    </div>
  );
}
