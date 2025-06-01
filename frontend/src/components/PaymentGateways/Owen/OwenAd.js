import React, { useEffect, useState, useRef } from "react";

import Grid from "@material-ui/core/Grid";
import FormControl from "@material-ui/core/FormControl";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Typography from '@material-ui/core/Typography';
import { i18n } from "../../../translate/i18n";

const useStyles = makeStyles((_) => ({
  fieldContainer: {
    width: "100%",
    textAlign: "left",
  },
  
  uploadInput: {
    display: "none",
  },
}));

export default function OwenAd(props) {
  const classes = useStyles();
  const [owenSettings, setOwenSettings] = useState({});

  useEffect(() => {
  }, []);

  return (
    <>
      <Typography variant="h5" color="primary" gutterBottom>
        {/* Owen Payments apoia o Ticketz */}
        {i18n.t("owenAd.title")}
      </Typography>    
      <Typography variant="body1">
        {/* A startup Owen Payments oferece recebimentos via PIX a custo fixo de R$ 0,99 por operação. */}
        {i18n.t("owenAd.description1")}
      </Typography>
      <Typography variant="body1">
        {/* Uma fração do valor de cada operação é revertida para o projeto Ticketz, então ao utilizar este meio de recebimento você também estará apoiando o projeto. */}
        {i18n.t("owenAd.description2")}
      </Typography>
      <Typography variant="body1">
        {/* Selecione o gateway de pagamento "Owen Payments 💎" e solicite a abertura da sua conta sem sair do Ticketz! */}
        {i18n.t("owenAd.description3")}
      </Typography>
    </>
  );
}
