import React, { useEffect, useState } from "react";
import { Grid, Paper, Typography, Button } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import useTicketzStatus from "../../hooks/useTicketzStatus";
import useTicketzProStatus from "../../hooks/useTicketzProStatus";
import moment from "moment/moment";
import 'moment/locale/pt';
import { i18n } from "../../translate/i18n";
import WhatsMarked from "react-whatsmarked";
import QRCode from "qrcode.react";
import { copyToClipboard } from "../../helpers/copyToClipboard";

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
  },
  pixInstructions: {
    margin: "auto"
  }

}));

export default function TicketzProStatus(props) {
  const classes = useStyles();
  const { ticketzStatus } = useTicketzStatus();
  const { ticketzProStatus } = useTicketzProStatus();
  const [proStatus, setProStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [status, setStatus] = useState(null);

  async function checkSubscription(recheck) {
    setLoadingStatus(true);
    const ticketzPro = await ticketzProStatus({ recheck });
    setProStatus(ticketzPro.status);
    setLoadingStatus(false);

    const ticketz = await ticketzStatus();
    setStatus(ticketz);
  }

  useEffect (() => {
    checkSubscription();
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
          {proStatus?.subscriptionData?.pix && !loadingStatus &&
          <Grid className={classes.ticketzProBox} item xs={12} md={12} sm={12}>
              <Grid container spacing={2}>
                <Grid className={classes.pix} xs={12} sm={4} md={4} item>
                  {proStatus.subscriptionData?.next_payment_date &&
                    <div>
                      {i18n.t("common.dueDate")}:<br />{moment(proStatus.subscriptionData.next_payment_date).format("LL")}
                    </div>
                  }
                  <QRCode value={proStatus.subscriptionData.pix}
                    style={
                      {
                        borderStyle: "solid",
                        borderWidth: "1px",
                        padding: "5px",
                        borderColor: "black",
                        backgroundColor: "white",
                        height: "auto",
                        maxWidth: "100%"
                      }} />
                  <br />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => copyToClipboard(proStatus.subscriptionData.pix)}>
                    {i18n.t("common.copy")}
                  </Button>
                </Grid>
                <Grid className={classes.pixInstructions} xs={12} sm={8} md={8} item>
                  <WhatsMarked>
                    {i18n.t("ticketz.pro.pixFinishInstructions")}
                  </WhatsMarked>
                  <div>&nbsp;</div>
                  <Button variant="contained" onClick={() => checkSubscription(true)} color="primary">
                    {i18n.t("common.proceed")}
                  </Button>
                </Grid>
              </Grid>
          </Grid>
          }
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
