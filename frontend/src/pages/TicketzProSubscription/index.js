import React, { useState, useRef, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, Grid, Paper, TextField, Typography } from '@material-ui/core';
import MainHeader from '../../components/MainHeader';
import MainContainer from '../../components/MainContainer';
import { i18n } from "../../translate/i18n.js";
import Title from '../../components/Title';

import { StripePaymentForm } from '../../components/StripePaymentForm';
import useTicketzProSubscribe from '../../hooks/useTicketzProSubscribe';
import useTicketzProStatus from '../../hooks/useTicketzProStatus';
import useTicketzProCheck from '../../hooks/useTicketzProCheck';
import OnlyForSuperUser from '../../components/OnlyForSuperUser';
import MercadoPagoCreditCard from '../../components/MercadoPagoCreditCard';
import { toast } from 'react-toastify';

import moment from "moment/moment";
import 'moment/locale/pt';
import useSettings from '../../hooks/useSettings';
import useAuth from '../../hooks/useAuth.js';
import { isEurozone } from '../../helpers/isEurozone';
import { AddressForm, useAddressData } from '../../components/AddressForm';

moment.locale("pt-br");

// STRIPE

// PRODUCTION PUBLISHABLE KEY
// const STRIPE_PUBLIC_KEY = "pk_live_51PsrkqHMzZ75trYxha3EJhP8s50rFlzPDOWftlnWNqXRkxek7V3xYnwllkXAnWZnSB5ml0tQAjEqHLfAKZMfGyJ400LtMAYDua";

// TEST PUBLISHABLE KEY
const STRIPE_PUBLIC_KEY = "pk_test_51PsrkqHMzZ75trYxacfXfxXZhTitwvPIgVT9gjerhiqWCG35VEOjXzznhF57CZe21y9lb4rLkupImfgXFysT5Er500n0gmG0sh"

// MERCADOPAGO

// PRODUCTION KEY
const MP_PUBLIC_KEY = "APP_USR-4e658725-1e50-49ef-976f-f866ca2a041c";

// TEST USER PRODUCTION KEY
// const MP_PUBLIC_KEY = "APP_USR-76c4bf2f-b045-4985-ad2c-d69142de8583";

// TEST KEY
// const MP_PUBLIC_KEY = "TEST-7b3070b9-c99c-459b-8c35-79a50579a3af";

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '2rem'
  },
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },  
  selectContainer: {
    width: "100%",
    textAlign: "left",
    marginBottom: "8px",
  },
  button: {
    marginRight: "12px",
    position: "relative",
  },
}));

const TicketzProSubscription = () => {
  const classes = useStyles();
  const { getCurrentUserInfo } = useAuth();
  const [currentUser, setCurrentUser] = useState({});
  const { ticketzProSubscribe } = useTicketzProSubscribe();
  const { ticketzProStatus } = useTicketzProStatus();
  const { ticketzProCheck } = useTicketzProCheck();
  const [ticketzProKey, setTicketzProKey] = useState("");
  const ticketzProKeyInput = useRef(null);
  const [showTicketzProKey, setShowTicketzProKey] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [showSubscriptionLoading, setShowSubscriptionLoading] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [subscribeError, setSubscribeError] = useState("");
  const [proStatus, setProStatus] = useState(null);
  const [openResetLicense, setOpenResetLicense] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [addressData, setAddressData] = useAddressData();
  const [paymentService, setPaymentService] = useState("stripe");

  const settings = useSettings();

  useEffect(() => {
    getCurrentUserInfo().then(
      (u) => {
        setCurrentUser(u);
      }
    );

    settings.get("ticketzProKey").then(value => {
      setTicketzProKey(value || "");
    })
  }, []);

  useEffect(() => {
    fetch('https://ipinfo.io/json')
      .then(response => response.json())
      .then(data => {
        setAddressData({ ...addressData, country: data.country });
      })
      .catch(error => {
        console.error('Error fetching IP info:', error);
      });
  }, []);

  useEffect(() => {
    if (addressData.country === "BR") {
      setCurrency("BRL");
      setPaymentService("mp");
    } else if (isEurozone(addressData.country)) {
      setCurrency("EUR");
      setPaymentService("stripe");
    } else {
      setCurrency("USD");
      setPaymentService("stripe");
    }
  }, [addressData])

  async function handleTicketzProKey(value) {
    setTicketzProKey(value);
    await settings.update({
      key: "ticketzProKey",
      value,
    });
    if (value) {
      setSubscribeError("");
      setShowSubscriptionLoading(true);
      ticketzProCheck().then(
        _result => {
          setShowSubscriptionLoading(false);
          setShowTicketzProKey(false);
          ticketzProStatus().then(
            ticketzPro => {
              setProStatus(ticketzPro.status);
            }
          )
        },
        _error => {
          setShowSubscriptionLoading(false);
        }
      );
    } else {
      setProStatus(null);
    }
    toast.success("Operação atualizada com sucesso.");
  }

  function formCallback(cardToken) {
    setShowCardForm(false);
    setShowSubscriptionLoading(true);
    setSubscribeError("");

    ticketzProSubscribe({
      paymentService,
      emailAddress,
      cardToken,
      addressData
    }).then(
      result => {
        setShowSubscriptionLoading(false);
        setProStatus(result.status);
        if (result.status?.subscriptionData?.id) {
          setTicketzProKey(result.status.subscriptionData.id);
          setShowCardForm(false);
          setShowTicketzProKey(false);
        }
      },
      error => {
        setShowSubscriptionLoading(false);
        setSubscribeError(error.message || "Erro desconhecido");
      }
    );
  }

  useEffect(() => {
    async function fetchData() {
      const ticketzPro = await ticketzProStatus();
      setProStatus(ticketzPro.status);
    }
    if (ticketzProKey) {
      fetchData();
    }
  }, []);

  return (
    <MainContainer className={classes.root}>
      <MainHeader>
        <Title>{i18n.t("ticketz.subscription")}</Title>
      </MainHeader>
      <Paper className={classes.mainPaper} elevation={1}>
        <OnlyForSuperUser
          user={currentUser}
          yes={() => (
            <Grid container style={{ paddingTop: "15px" }}>
              <Grid xs={12} item>
                <Typography variant="h5" color="primary">
                  Ticketz PRO
                </Typography>
              </Grid>
              {
                showSubscriptionLoading &&
                <Grid xs={12} item>
                  <CircularProgress />
                </Grid>
              }
              {
                !ticketzProKey && !showSubscriptionLoading &&
                <Grid xs={12} sm={12} md={12} className={classes.buttonGrid} item>
                  {!showCardForm &&
                    <Button
                      className={classes.button}
                      variant="contained"
                      color="primary"
                      onClick={
                        () => {
                          setShowCardForm(true);
                          setShowTicketzProKey(false);
                        }
                      }>
                      Assinar o Ticketz PRO
                    </Button>
                  }
                  {!showTicketzProKey &&
                    <Button
                      className={classes.button}
                      variant="contained"
                      color="primary"
                      onClick={
                        () => {
                          setShowTicketzProKey(true);
                          setShowCardForm(false);
                        }
                      }>
                      Código de Ativação
                    </Button>
                  }
                </Grid>
              }

              {
                ticketzProKey && !showSubscriptionLoading &&
                <Grid xs={12} sm={12} md={12} className={classes.buttonGrid} item>
                  <Button
                    className={classes.button}
                    variant="contained"
                    color="secondary"
                    onClick={() => setOpenResetLicense(true)}>
                    Resetar Licença
                  </Button>
                </Grid>
              }

              <Dialog
                open={openResetLicense}
                onClose={() => setOpenResetLicense(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
              >
                <DialogTitle id="alert-dialog-title">Resetar configuração de licença?</DialogTitle>
                <DialogContent>
                  <DialogContentText id="alert-dialog-description">
                    Isso irá remover a licença atual do sistema, você poderá
                    adicionar novamente através da chave de ativação ou
                    contratar uma nova licença.
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setOpenResetLicense(false)} variant="contained" color="primary" autofocus>
                    Cancelar
                  </Button>
                  <Button onClick={
                    () => {
                      setOpenResetLicense(false);
                      setShowCardForm(false);
                      handleTicketzProKey("");
                      setProStatus(null);
                    }
                  }
                    variant="contained" color="secondary">
                    Resetar
                  </Button>
                </DialogActions>
              </Dialog>

              {showTicketzProKey &&
                <Grid xs={12} sm={12} md={6} item>
                  <FormControl className={classes.selectContainer}>
                    <TextField
                      id="ticketzprokey-field"
                      label="Código de Ativação"
                      variant="standard"
                      name="ticketzProKey"
                      value={ticketzProKey}
                      inputRef={ticketzProKeyInput}
                      onChange={(e) => {
                        setTicketzProKey(e.target.value);
                      }}
                      onBlur={async (_) => {
                        await handleTicketzProKey(ticketzProKey);
                      }}
                    />
                  </FormControl>
                </Grid>
              }

              {
                showCardForm &&
                <Grid xs={12} sm={12} md={6} item>
                  {currency === "BRL" &&
                    <Typography component="h2" variant="h6">
                      Assinatura: R$ 199/mês
                    </Typography>
                  }
                  {currency === "USD" &&
                    <Typography component="h2" variant="h6">
                      Assinatura: US$ 49/mês
                    </Typography>
                  }
                  {currency === "EUR" &&
                    <Typography component="h2" variant="h6">
                      Assinatura: €49/mês
                    </Typography>
                  }

                  <FormControl className={classes.selectContainer}>
                    <TextField
                      id="email-field"
                      label="Endereço de e-mail"
                      variant="standard"
                      name="emailAddress"
                      value={emailAddress}
                      onChange={(e) => {
                        setEmailAddress(e.target.value);
                      }}
                    />
                  </FormControl>
                  <AddressForm formData={addressData} setFormData={setAddressData} />
                  {
                    paymentService === "mp" &&
                      <MercadoPagoCreditCard
                        callback={formCallback}
                        clientKey={MP_PUBLIC_KEY}
                        addressData={addressData}
                      />
                  }
                  {
                    paymentService === "stripe" &&
                      <StripePaymentForm
                        callback={formCallback}
                        clientKey={STRIPE_PUBLIC_KEY}
                        addressData={addressData}
                      />
                  }
                </Grid>
              }
              {
                subscribeError && !showSubscriptionLoading &&
                <Grid xs={12} item>
                  <Typography variant="h5" color="error">
                    {subscribeError}
                  </Typography>
                </Grid>
              }

              {
                proStatus && !showSubscriptionLoading &&
                <Typography component="h2" variant="h6">
                  Status da assinatura:&nbsp;
                  {
                    proStatus?.success ?
                      (proStatus?.subscriptionData?.next_payment_date ? "Válida até " + moment(proStatus.subscriptionData.next_payment_date).format("LL") : "OK")
                      :
                      "Erro: " + proStatus?.message
                  }
                </Typography>
              }

            </Grid>
          )}
        />
      </Paper>
    </MainContainer>
  );
};


export default TicketzProSubscription;
