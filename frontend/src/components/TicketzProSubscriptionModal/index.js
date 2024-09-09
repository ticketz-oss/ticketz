import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  Typography,
  makeStyles,
  Grid,
  CircularProgress,
  DialogContentText,
} from "@material-ui/core";
import { AddressForm, useAddressData } from "../../components/AddressForm";
import { MercadoPagoCreditCard } from "../../components/MercadoPagoCreditCard";
import { StripePaymentForm } from "../../components/StripePaymentForm";
import { isEurozone } from "../../helpers/isEurozone";
import useTicketzProCheck from "../../hooks/useTicketzProCheck";
import useSettings from "../../hooks/useSettings";
import useTicketzProStatus from "../../hooks/useTicketzProStatus";
import useTicketzProSubscribe from "../../hooks/useTicketzProSubscribe";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import WarningIcon from "@material-ui/icons/Warning";
import moment from 'moment';
import useAuth from "../../hooks/useAuth.js";

// Get preferred language from localStorage or browser
const storedLanguage = localStorage.getItem('language');
const browserLanguage = navigator.language || navigator.userLanguage;

// Extract the primary language code (first two letters)
const storedLangCode = storedLanguage ? storedLanguage.split('-')[0] : '';
const browserLangCode = browserLanguage.split('-')[0];

// Determine the more specific locale to use
const localeToUse = (storedLanguage && storedLangCode === browserLangCode)
  ? (storedLanguage.length > browserLanguage.length ? storedLanguage : browserLanguage)
  : (storedLanguage || browserLanguage);

if (localeToUse.startsWith("en")) {
  moment.locale(localeToUse);
} else {
  // Dynamically import the locale based on the chosen locale
  import(`moment/locale/${localeToUse}`)
    .then(() => {
      moment.locale(localeToUse);  // Set Moment.js locale
    })
    .catch(() => {
      // Fallback in case the specific locale is not available
      const fallbackLocale = localeToUse.split('-')[0];  // e.g., 'pt-BR' -> 'pt'
      import(`moment/locale/${fallbackLocale}`).then(() => {
        moment.locale(fallbackLocale);
      })
        .catch(() => {
          // Fallback in case the specific locale is not available
          const fallbackLocale = localeToUse.split('-')[0];  // e.g., 'pt-BR' -> 'pt'
          import(`moment/locale/${fallbackLocale}`).then(() => {
            moment.locale(fallbackLocale);
          });
        });
    });
}  

// STRIPE

// PRODUCTION PUBLISHABLE KEY
const STRIPE_PUBLIC_KEY = "pk_live_51PsrkqHMzZ75trYxha3EJhP8s50rFlzPDOWftlnWNqXRkxek7V3xYnwllkXAnWZnSB5ml0tQAjEqHLfAKZMfGyJ400LtMAYDua";

// TEST PUBLISHABLE KEY
// const STRIPE_PUBLIC_KEY = "pk_test_51PsrkqHMzZ75trYxacfXfxXZhTitwvPIgVT9gjerhiqWCG35VEOjXzznhF57CZe21y9lb4rLkupImfgXFysT5Er500n0gmG0sh"

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
  buttonGrid: {
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: "6px",
  },  
  center: {
    display: "flex",
    justifyContent: "center",
    paddingTop: "6px",
    margin: "auto"
  },  
  button: {
    marginRight: "12px",
    position: "relative",
  },
  okIcon: {
    width: "100%",
    height: 96,
    color: "green",
    textAlign: "center"
  },
  warningIcon: {
    width: "100%",
    height: 96,
    color: "orange",
    textAlign: "center"
  },
  loadingContainer: {
    position: 'relative',
    pointerEvents: (props) => (props.loading ? 'none' : 'auto'), // Prevents interaction when loading
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Grays out the background
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // Ensures the overlay is on top
  },
  stepperContent: {
    opacity: (props) => (props.loading ? 0.5 : 1), // Makes content semi-transparent when loading
  },
}));

function isValidEmail(email) {
  // Regular expression for validating an email address
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function TicketzProSubscriptionModal({ open, onClose }) {
  const [loading, setLoading] = useState(true);
  const classes = useStyles({ loading });
  const { getCurrentUserInfo } = useAuth();
  const [proStatus, setProStatus] = useState({});
  const [activeStep, setActiveStep] = useState(-1);
  const [emailAddress, setEmailAddress] = useState("");
  const [emptyAddress] = useAddressData();
  const [addressData, setAddressData] = useAddressData();
  const [paymentService, setPaymentService] = useState("stripe");
  const [currency, setCurrency] = useState("USD");
  const [ticketzProKey, setTicketzProKey] = useState("");
  const ticketzProKeyInput = useRef(null);
  const [openCancelSubscription, setOpenCancelSubscription] = useState(false);
  const [openResetLicense, setOpenResetLicense] = useState(false);
  const [showTicketzProKey, setShowTicketzProKey] = useState(false);
  const { ticketzProSubscribe, ticketzProCancelSubscription } = useTicketzProSubscribe();
  const { ticketzProStatus } = useTicketzProStatus();
  const { ticketzProCheck } = useTicketzProCheck();

  const settings = useSettings();
  
  const stripeRef = useRef(null);
  const mercadoPagoRef = useRef(null);

  const steps = ["Start", "Fill Email and Address", "Complete Payment", "Subscription Status"];

  const handleNext = async () => {
    if (activeStep === 2) {
      if (paymentService === "stripe" && stripeRef.current) {
        const success = await stripeRef.current.submitPayment();
        if (success) {
          setActiveStep((prevStep) => prevStep + 1);
        }
      } else if (paymentService === "mp" && mercadoPagoRef.current) {
        const success = await mercadoPagoRef.current.submitPayment();
        if (success) {
          setActiveStep((prevStep) => prevStep + 1);
        }
      }
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handlePayment = (cardToken) => {
    setLoading(true);
    ticketzProSubscribe({
      paymentService,
      emailAddress,
      cardToken,
      addressData
    }).then(
      result => {
        setProStatus(result.status);
        if (result.status?.subscriptionData?.id) {
          setActiveStep(3);
        } else {
          console.debug("Subscription result",{ result });
        }
        setLoading(false);
      },
      _error => {
        setLoading(false);
        // setSubscribeError(error.message || "Erro desconhecido");
      }
    );
  };

  const handleCancelSubscription = () => {
    setLoading(true);
    ticketzProCancelSubscription().then(
      result => {
        setProStatus(result.status);
        if (result.status?.subscriptionData?.id) {
          setActiveStep(3);
        } else {
          console.debug("Cancel subscription result",{ result });
        }
        setLoading(false);
      },
      _error => {
        setLoading(false);
        // setSubscribeError(error.message || "Erro desconhecido");
      }
    );
  };

  useEffect(() => {
    if (open) {
      setActiveStep(-1);
      setLoading(true);
      setTimeout(() => {
        ticketzProStatus().then(
          ticketzPro => {
            setProStatus(ticketzPro.status);
            if (ticketzPro.status?.success) {
              setActiveStep(3);
            } else {
              setActiveStep(0);
            }
            setLoading(false);
          }
        );
      },750);

      fetch('https://ipinfo.io/json')
        .then(response => response.json())
        .then(data => {
          setAddressData({ ...emptyAddress, country: data.country });
        })
        .catch(error => {
          console.error('Error fetching IP info:', error);
        });
    }
  }, [open]);

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
  }, [addressData]);

  useEffect(() => {
    if (activeStep === 1) {
      getCurrentUserInfo().then(
        (u) => {
          setEmailAddress(u.email);
        }
      );
    }
    
  }, [activeStep])

  async function handleTicketzProKey(value) {
    setLoading(true);
    try {
      await settings.update({
        key: "ticketzProKey",
        value,
      });

      await ticketzProCheck();
      setShowTicketzProKey(false);

      try {
        const ticketzPro = await ticketzProStatus();
        setProStatus(ticketzPro.status);
        setActiveStep(ticketzPro.status?.success ? 3 : 0);
      } catch (_error) {
        setActiveStep(0);
        setProStatus(null);
      }
    } catch (_error) {
      setActiveStep(0);
      setProStatus(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth disableBackdropClick maxWidth="sm">
      <div className={classes.loadingContainer}>
        <div className={classes.stepperContent}>
          <DialogTitle>Ticketz PRO Subscription</DialogTitle>
          <DialogContent>
            {loading && (
              <div className={classes.loadingOverlay}>
                <CircularProgress color="inherit" />
              </div>
            )}
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {activeStep === 0 &&
              <>
                {
                  !showTicketzProKey &&
                  <>
                    <Button
                      className={classes.button}
                      variant="outlined"
                      color="primary"
                      onClick={
                        () => {
                          setShowTicketzProKey(true);
                        }
                      }>
                      Tenho um código de ativação
                    </Button>
                    <Button
                      className={classes.button}
                      variant="contained"
                      color="primary"
                      onClick={
                        () => {
                          setActiveStep(1);
                        }
                      }>
                      Desejo assinar o Ticketz PRO
                    </Button>
                  </>
                }

                {showTicketzProKey &&
                  <>
                    <Grid xs={12} sm={12} md={12} item>
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
                        />
                      </FormControl>
                    </Grid>
                    <Grid className={classes.buttonGrid} xs={12} sm={12} md={12} item>
                      <Button
                        className={classes.button}
                        variant="outlined"
                        color="primary"
                        onClick={
                          () => {
                            setShowTicketzProKey(false);
                          }
                        }>
                        Cancelar
                      </Button>
                      <Button
                        className={classes.button}
                        variant="contained"
                        color="primary"
                        onClick={
                          () => {
                            handleTicketzProKey(ticketzProKey);
                          }
                        }>
                        Ativar
                      </Button>
                    </Grid>
                  </>
                }
              </>
            }

            {activeStep >= 1 && activeStep <= 2 && (
              <>
                {currency === "BRL" && (
                  <Typography component="h2" variant="h6">
                    Assinatura: R$ 199/mês
                  </Typography>
                )}
                {currency === "USD" && (
                  <Typography component="h2" variant="h6">
                    Assinatura: US$ 49/mês
                  </Typography>
                )}
                {currency === "EUR" && (
                  <Typography component="h2" variant="h6">
                    Assinatura: €44/mês
                  </Typography>
                )}
              </>
            )}

            {activeStep === 1 && (
              <>
                <FormControl fullWidth margin="normal">
                  <TextField
                    label="Email Address"
                    variant="standard"
                    value={emailAddress || ""}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    error={!isValidEmail(emailAddress)}
                  />
                </FormControl>

                <AddressForm formData={addressData} setFormData={setAddressData} />
              </>
            )}

            {activeStep === 2 && (
              <>
                {paymentService === "mp" && (
                  <MercadoPagoCreditCard
                    ref={mercadoPagoRef}
                    callback={handlePayment}
                    clientKey={MP_PUBLIC_KEY}
                    addressData={addressData}
                    renderSubmit={false}
                  />
                )}
                {paymentService === "stripe" && (
                  <StripePaymentForm
                    ref={stripeRef}
                    callback={handlePayment}
                    clientKey={STRIPE_PUBLIC_KEY}
                    addressData={addressData}
                    renderSubmit={false}
                  />
                )}
              </>
            )}

            {activeStep === 3 && (
              proStatus?.success ?
                <>
                  {proStatus?.subscriptionData?.next_payment_date && 
                    <CheckCircleIcon className={classes.okIcon} />}
                  {proStatus?.subscriptionData?.cancel_date && 
                    <WarningIcon className={classes.warningIcon} />}
                  <Typography variant="h5" align="center">
                    {proStatus?.subscriptionData?.next_payment_date && "Renova em " + moment(proStatus.subscriptionData.next_payment_date).format("LL")}
                    {proStatus?.subscriptionData?.cancel_date && "Será cancelada em " + moment(proStatus.subscriptionData.cancel_date).format("LL")}
                  </Typography>

                  {proStatus?.subscriptionData?.next_payment_date &&
                    <Button
                      className={classes.center}
                      variant="contained"
                      color="secondary"
                      onClick={() => setOpenCancelSubscription(true)}>
                      Cancelar Assinatura
                    </Button>
                  }

                  {proStatus?.subscriptionData?.cancel_date &&
                    <Button
                      className={classes.center}
                      variant="contained"
                      color="secondary"
                      onClick={() => setOpenResetLicense(true)}>
                      Resetar Licença
                    </Button>
                  }

                  <Dialog
                    open={openCancelSubscription}
                    onClose={() => setOpenCancelSubscription(false)}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                  >
                    <DialogTitle id="alert-dialog-title">Cancelar a assinatura?</DialogTitle>
                    <DialogContent>
                      <DialogContentText id="alert-dialog-description">
                        A assinatura será cancelada ao final do período já
                        contratado. Essa ação não pode ser revertida e para
                        voltar a utilizar o sistema será necessário fazer
                        uma nova assinatura.
                      </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={() => setOpenCancelSubscription(false)} variant="contained" color="primary" autofocus>
                        Voltar
                      </Button>
                      <Button onClick={
                        () => {
                          setOpenCancelSubscription(false);
                          handleCancelSubscription();
                        }
                      }
                        variant="contained" color="secondary">
                        Cancelar Assinatura
                      </Button>
                    </DialogActions>
                  </Dialog>

                  <Dialog
                    open={openResetLicense}
                    onClose={() => setOpenResetLicense(false)}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                  >
                    <DialogTitle id="alert-dialog-title">Resetar configuração de licença?</DialogTitle>
                    <DialogContent>
                      <DialogContentText id="alert-dialog-description">
                        <p>Isso irá remover a licença que ainda está ativa,
                          você poderá adicionar novamente através da chave
                          de ativação ou contratar uma nova licença.</p>
                        <p><b>ATENÇÃO: O sistema vai parar de operar imediatamente!</b></p>
                      </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={() => setOpenResetLicense(false)} variant="contained" color="primary" autofocus>
                        Voltar
                      </Button>
                      <Button onClick={
                        () => {
                          setOpenResetLicense(false);
                          setTicketzProKey("");
                          handleTicketzProKey("");
                          setActiveStep(0);
                        }
                      }
                        variant="contained" color="secondary">
                        Resetar
                      </Button>
                    </DialogActions>
                  </Dialog>


                </>
                :
                <Typography variant="h5" align="center">
                  {proStatus?.message || "Assinatura nao encontrada" }
                </Typography>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={onClose}>
              Close
            </Button>

            {activeStep > 0 && activeStep < 3 && <Button onClick={handleBack}>Back</Button>}

            {activeStep === 2 ? (
              <Button onClick={handleNext} color="primary">
                Pay
              </Button>
            ) : activeStep === 3 ? (
              <></>
            ) : activeStep > 0 ? (
              <Button onClick={handleNext} color="primary" disabled={!addressData.complete || !isValidEmail(emailAddress)}>
                Next
              </Button>
            ) : ""}
          </DialogActions>
        </div>
      </div>
    </Dialog>
  );
}
