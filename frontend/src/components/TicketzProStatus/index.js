import React, { useEffect, useState } from "react";
import { Grid, Paper, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import useTicketzStatus from "../../hooks/useTicketzStatus";
import useTicketzProStatus from "../../hooks/useTicketzProStatus";
import moment from "moment/moment";
import 'moment/locale/pt';

moment.locale("pt-br");

const useStyles = makeStyles((theme) => ({
  ticketzProPaper: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    ...theme.scrollbarStyles,
  },
  ticketzProBox: {
    backgroundColor: theme.palette.primary.light,
    borderRadius: "10px",
    textAlign: "center",
    borderColor: theme.palette.primary.main,
    borderWidth: "3px",
    borderStyle: "solid",
    padding: "15px"
  },
  ticketzProCounter: {
    fontSize: "35pt",
    fontWeight: "bold"
  }

}));

export default function TicketzProStatus(props) {
  const classes = useStyles();
  const { ticketzStatus } = useTicketzStatus();
  const { ticketzProStatus } = useTicketzProStatus();
  const [proStatus, setProStatus] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect (() => {
    async function fetchData() {
      const ticketzPro = await ticketzProStatus();
      setProStatus(ticketzPro.status);
  
      const ticketz = await ticketzStatus();
      setStatus(ticketz);
    }
    fetchData();
  }, []);
  
	return (
    <Grid item xs={12}>
      <Paper className={classes.ticketzProPaper}>
        <Typography component="h2" variant="h6" gutterBottom>
          Ticketz PRO
        </Typography>
        <Grid container justifyContent="flex-end">
          <Grid className={classes.ticketzProBox} item xs={12} md={4} sm={12}>
            <Typography component="h3" variant="h6" gutterBottom>
              Empresas
            </Typography>
            <div className={classes.ticketzProCounter}>{ status?.companies }</div>
          </Grid>
          <Grid className={classes.ticketzProBox} item xs={12} md={4} sm={12}>
            <Typography component="h3" variant="h6" gutterBottom>
              Conexões Ativas
            </Typography>
            <div className={classes.ticketzProCounter}>{ status?.connections }</div>
          </Grid>
          <Grid className={classes.ticketzProBox} item xs={12} md={4} sm={12}>
            <Typography component="h3" variant="h6" gutterBottom>
              Agentes Online
            </Typography>
            <div className={classes.ticketzProCounter}>{ status?.agents }</div>
          </Grid>
        </Grid>
        <Typography component="h2" variant="h6">
          Status da assinatura:&nbsp;
          {
            proStatus?.success ?
              (proStatus?.subscriptionData?.next_payment_date ? "Válida até " + moment(proStatus.subscriptionData.next_payment_date).format("LL") : "OK")
              :
              "Erro: " + proStatus?.message
          }
        </Typography>

      </Paper>
    </Grid>
	);
}
