import React from "react";
import StardewBusinessGlyph from "../../components/StardewBusinessGlyph";
import { Card, CardContent, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import Skeleton from "@material-ui/lab/Skeleton";

const useStyles = makeStyles(theme => ({
  card: {
    height: "100%",
    borderLeftWidth: 4,
    borderLeftStyle: "solid"
  },
  conteudo: {
    padding: theme.spacing(1.5)
  },
  valor: {
    fontSize: "1.35rem",
    fontWeight: 700,
    lineHeight: 1.3
  },
  detalhe: {
    color: theme.palette.text.secondary
  }
}));

const CartaoResumo = ({ titulo, valor, detalhe, cor, carregando }) => {
  const classes = useStyles();

  if (carregando) {
    return <Skeleton variant="rect" height={86} />;
  }

  return (
    <Card
      variant="outlined"
      className={`${classes.card} sd-gold-card`}
      style={{ borderLeftColor: cor }}
    >
      <CardContent className={classes.conteudo}>
        <Typography variant="caption" color="textSecondary">
          {titulo}
        </Typography>
        <Typography className={`${classes.valor} sd-gold-value`}>
          <StardewBusinessGlyph />
          {valor}
        </Typography>
        {detalhe ? (
          <Typography variant="caption" className={classes.detalhe}>
            {detalhe}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default CartaoResumo;
