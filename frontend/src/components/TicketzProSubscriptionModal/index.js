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
  RadioGroup,
  FormControlLabel,
  Radio,
  InputLabel,
  Select,
  MenuItem,
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
import { i18n } from "../../translate/i18n";
import WhatsMarked from "react-whatsmarked";
import { CreditCardForm } from "../CreditCardForm/index.js";
import InputMask from "react-input-mask/lib/react-input-mask.development.js";
import { cpf, cnpj } from "cpf-cnpj-validator";
import { copyToClipboard } from "../../helpers/copyToClipboard";
import QRCode from "qrcode.react";

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
  container: {
    marginTop: 0,
    marginBottom: 0,
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
  loading: {
    width: 40,
    marginLeft: "auto",
    marginRight: "auto",
  },
  errorMessage: {
    color: "yellow",
    backgroundColor: "red",
    textAlign: "center",
    fontSize: "large",
    padding: 3
  },
  field: {
    width: "100%",
    textAlign: "left",
    padding: "unset",
  },
  pix: {
    textAlign: "center",
  }
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
  const [showPixQrCode, setShowPixQrCode] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [emptyAddress] = useAddressData();
  const [addressData, setAddressData] = useAddressData();
  const [customerIdType, setCustomerIdType] = useState("CPF");
  const [customerId, setCustomerId] = useState("");
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
  const [ errorMessage, setErrorMessage ] = useState("");

  const settings = useSettings();
  
  const stripeRef = useRef(null);
  const mercadoPagoRef = useRef(null);

  const asaasCcRef = useRef(null);
  const [ payMethod, setPayMethod ] = useState("boleto");

  const steps = [
    "ticketz.pro.stepperStart",
    "ticketz.pro.stepperCustomer",
    "ticketz.pro.stepperPayment",
    "ticketz.pro.stepperProcessing",
    "ticketz.pro.stepperDone",
  ];

  const handleNext = async () => {
    if (activeStep === 2) {
      setLoading(true);
      if (paymentService === "stripe" && stripeRef.current) {
        await stripeRef.current.submitPayment();
      } else if (paymentService === "asaas" && payMethod === "boleto") {
        handlePayment();
      } else if (paymentService === "asaas" && asaasCcRef.current) {
        await asaasCcRef.current.submitPayment();
      } else if (paymentService === "mp" && mercadoPagoRef.current) {
        await mercadoPagoRef.current.submitPayment();
      }
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setErrorMessage("");
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handlePayment = (cardData) => {
    setActiveStep(3);
    setLoading(true);
    const customerData = {
      name: customerName,
      email: emailAddress,
      mobilePhone: customerWhatsapp,
      cpfCnpj: customerId,
    };
    ticketzProSubscribe({
      paymentService,
      customerData,
      ccData: paymentService === "asaas" && payMethod === "cc" ? cardData : undefined,
      cardToken: paymentService !== "asaas" ? cardData : undefined,
      addressData
    }).then(
      result => {
        setProStatus(result.status);
        if (result.status?.subscriptionData?.id && !result.status?.subscriptionData?.pix) {
          setActiveStep(4);
        } else {
          console.debug("Subscription result",{ result });
        }
        setLoading(false);
      },
      error => {
        setErrorMessage(`${i18n.t("ticketz.pro.paymentRefused")}: ${error.message}`);
        setLoading(false);
      }
    );
  };

  const handleCancelSubscription = () => {
    setLoading(true);
    setProStatus({});
    ticketzProCancelSubscription().then(
      result => {
        setProStatus(result.status);
        if (result.status?.subscriptionData?.id) {
          setActiveStep(4);
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

  const validatePhoneNumber = (phoneNumber) => {
    return phoneNumber
      && phoneNumber.match(/^\+?\d+$/)
      && (phoneNumber.startsWith("+")
        ? phoneNumber.length > 8 && phoneNumber.length < 17
        : phoneNumber.length === 11
      );
  };
                                
  const validCustomerData = () => {
    return customerName
      && validatePhoneNumber(customerWhatsapp)
      && isValidEmail(emailAddress)
      && (addressData.country === "BR"
        ? (customerIdType === "CPF" ? cpf.isValid(customerId) : cnpj.isValid(customerId))
        : true);
  };
  
  const recheckSubscription = () => {
    setProStatus({});
    setLoading(true);
    ticketzProStatus({ recheck: true }).then(
      ticketzPro => {
        setProStatus(ticketzPro.status);
        if (ticketzPro.status?.subscriptionData?.pending
          || ticketzPro.status?.subscriptionData?.pix) {
          setActiveStep(3);
        } else if (ticketzPro.status?.success) {
          setActiveStep(4);
        } else {
          setActiveStep(0);
        }
        setLoading(false);
      }
    );
  };
    
  useEffect(() => {
    if (open) {
      setErrorMessage("");
      setTicketzProKey("");
      setProStatus({});
      settings.get("ticketzProKey").then(
        (proKey) => {
          setTicketzProKey(proKey);
        }
      );
      setShowTicketzProKey(false);
      setActiveStep(-1);
      setLoading(true);
      setTimeout(() => {
        ticketzProStatus().then(
          ticketzPro => {
            setProStatus(ticketzPro.status);
            if (ticketzPro.status?.subscriptionData?.pending
              || ticketzPro.status?.subscriptionData?.pix) {
              setActiveStep(3);
            } else if (ticketzPro.status?.success) {
              setActiveStep(4);
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
      setPaymentService("asaas");
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
    setErrorMessage("");
    setLoading(true);
    try {
      await settings.update({
        key: "ticketzProKey",
        value,
      });

      await ticketzProCheck();

      try {
        const ticketzPro = await ticketzProStatus();
        setProStatus(ticketzPro.status);
        if (ticketzPro.status?.success) {
          setShowTicketzProKey(false);
          if (ticketzPro.status?.subscriptionData?.pending) {
            setActiveStep(3);
          } else {
            setActiveStep(4);
          }
        } else {
          value && setErrorMessage(`${i18n.t("ticketz.pro.invalidKey")}: ${i18n.t(ticketzPro?.status?.message)}`);
        }
      } catch (error) {
        setErrorMessage(`${i18n.t("ticketz.pro.errorCheckingStatus")}: ${error?.message}`);
      }
    } catch (error) {
      setErrorMessage(`${i18n.t("ticketz.pro.errorActivating")}: ${error?.message}`);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth disableBackdropClick maxWidth="sm">
        <div className={classes.stepperContent}>
          <DialogTitle>{i18n.t("ticketz.pro.subscriptionTitle")}</DialogTitle>
          <DialogContent>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{i18n.t(label)}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {loading &&
              <div className={classes.loading}>
                <CircularProgress color="inherit" />
              </div>
            }
            
            {!loading && activeStep === 0 &&
              <>
                {!showTicketzProKey &&
                  <div>
                    <WhatsMarked>
                      {i18n.t("ticketz.pro.subscribeInstructions")}
                    </WhatsMarked>
                  </div>
                }

                {showTicketzProKey &&
                  <>
                    <Grid xs={12} sm={12} md={12} item>
                      <FormControl className={classes.selectContainer}>
                        <TextField
                          id="ticketzprokey-field"
                          label={i18n.t("ticketz.pro.activationCode")}
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
                  </>
                }
              </>
            }

            {!loading && activeStep >= 1 && activeStep <= 2 && (
              <Typography component="h2" variant="h6">
                {i18n.t("ticketz.pro.subscriptionPrice")}:&nbsp;
                {currency === "BRL" ? "R$ 199" : (currency === "EUR" ? "€44" : "US$ 49")}
                {i18n.t("ticketz.pro.perMonth")}
              </Typography>
            )}

            {!loading && activeStep === 1 && (
              <>
                <Grid className={classes.container} container spacing={2}>
                  <Grid xs={12} sm={12} md={12} item>
                    <FormControl className={classes.field}>
                      <TextField
                        label={i18n.t("common.name")}
                        variant="standard"
                        value={customerName || ""}
                        onChange={(e) => setCustomerName(e.target.value)}
                        error={!customerName}
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} sm={8} md={8} item>
                    <FormControl className={classes.field}>
                      <TextField
                        label={i18n.t("common.email")}
                        variant="standard"
                        value={emailAddress || ""}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        error={!isValidEmail(emailAddress)}
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} sm={4} md={4} item>
                    <FormControl className={classes.field}>
                      <TextField
                        label={i18n.t("common.whatsappNumber")}
                        variant="standard"
                        value={customerWhatsapp || ""}
                        onChange={(e) => setCustomerWhatsapp(e.target.value)}
                        error={!validatePhoneNumber(customerWhatsapp)}
                      />
                    </FormControl>
                  </Grid>
                </Grid>

                <AddressForm formData={addressData} setFormData={setAddressData} />

                {addressData.country === "BR" &&
                  <Grid className={classes.container} container spacing={2}>
                    <Grid xs={12} sm={4} md={4} item>
                      <FormControl className={classes.field}>
                        <InputLabel id="customer-id-type-label">{i18n.t('ccform.documentType')}</InputLabel>
                        <Select
                          labelId="customer-id-type-label"
                          value={customerIdType || "CPF"}
                          onChange={(e) => setCustomerIdType(e.target.value)}
                          name="customerIdType"
                        >
                          <MenuItem value={"CPF"}>{i18n.t('ccform.cpf')}</MenuItem>
                          <MenuItem value={"CNPJ"}>{i18n.t('ccform.cnpj')}</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
  
                    <Grid xs={12} sm={8} md={8} item>
                      <FormControl className={classes.field}>
                        <InputMask
                          mask={customerIdType === "CPF" ? '999.999.999-99' : '99.999.999/9999-99'}
                          maskPlaceholder={null}
                          value={customerId || ""}
                          onChange={(e) => setCustomerId(e.target.value)}
                        >
                          <TextField
                            id="customer-id"
                            label={customerIdType === "CPF" ? i18n.t('ccform.cpf') : i18n.t('ccform.cnpj')}
                            variant="standard"
                            name="customerId"
                            error={ !customerId || (customerIdType === "CPF" ? !cpf.isValid(customerId) : !cnpj.isValid(customerId)) }
                          />
                        </InputMask>
                      </FormControl>
                    </Grid>
                  </Grid>
                }
                </>
            )}

            {!loading && activeStep === 2 && (
              <>
                {paymentService === "asaas" && (
                  <>
                    <FormControl component="fieldset" fullWidth margin="normal">
                      <RadioGroup row value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                        <FormControlLabel value="boleto" control={<Radio />} label={i18n.t("ticketz.pro.boleto")} />
                        <FormControlLabel value="cc" control={<Radio />} label={i18n.t("ticketz.pro.creditCard")} />
                      </RadioGroup>
                    </FormControl>
                    {payMethod === "boleto" &&
                      <WhatsMarked>
                        {i18n.t("ticketz.pro.boletoInstructions")}
                      </WhatsMarked>}
                    {payMethod === "cc" &&
                      <CreditCardForm
                        ref={asaasCcRef}
                        onSubmit={handlePayment}
                        forceBR={true}
                        renderSubmit={false}
                      />}
                  </>
                )}
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
            
            {!loading && activeStep === 3 && proStatus.subscriptionData?.pix &&
              <Grid container spacing={2}>
                <Grid xs={12} sm={8} md={8} item>
                  <WhatsMarked>
                    {i18n.t("ticketz.pro.pixFinishInstructions")}
                  </WhatsMarked>
                </Grid>
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
              </Grid>
            }

            {!loading && activeStep === 4 && (
              proStatus?.success ?
                <>
                  {
                    proStatus?.subscriptionData?.cancel_date ?
                      <WarningIcon className={classes.warningIcon} /> :
                      proStatus?.subscriptionData?.next_payment_date ?
                        <CheckCircleIcon className={classes.okIcon} /> :
                        <></>
                  }
                  <Typography variant="h5" align="center">
                    {
                      proStatus?.subscriptionData?.cancel_date ?
                        i18n.t("ticketz.pro.willCancelAt") + " " + moment(proStatus.subscriptionData.cancel_date).format("LL")
                        :
                        proStatus?.subscriptionData?.next_payment_date ? i18n.t("ticketz.pro.renewAt") + " " + moment(proStatus.subscriptionData.next_payment_date).format("LL")
                          : <></>
                    }
                  </Typography>

                  {
                    (proStatus?.subscriptionData?.cancel_date ||
                      ticketzProKey.startsWith("wwGo:")) ?
                      <Button
                        className={classes.center}
                        variant="contained"
                        color="secondary"
                        onClick={() => setOpenResetLicense(true)}>
                        {i18n.t("ticketz.pro.resetLicense")}
                      </Button>
                      :
                      proStatus?.subscriptionData?.next_payment_date ?
                        <Button
                          className={classes.center}
                          variant="contained"
                          color="secondary"
                          onClick={() => setOpenCancelSubscription(true)}>
                          {i18n.t("ticketz.pro.cancelSubscription")}
                        </Button>
                        :
                        <></>
                  }

                </>
                :
                <Typography variant="h5" align="center">
                  {proStatus?.message || i18n.t("ticketz.pro.subscriptionNotFound") }
                </Typography>
            )}
            {
              errorMessage &&
              <div className={classes.errorMessage}>
                { errorMessage }
              </div>
            }

            <Dialog
              open={openCancelSubscription}
              onClose={() => setOpenCancelSubscription(false)}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
            >
              <DialogTitle id="alert-dialog-title">{i18n.t("ticketz.pro.cancelSubscriptionQuestion")}</DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  <WhatsMarked>
                    {i18n.t("ticketz.pro.cancelSubscriptionDetails")}
                  </WhatsMarked>
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenCancelSubscription(false)} variant="contained" color="primary" autofocus>
                  {i18n.t("ticketz.pro.back")}
                </Button>
                <Button onClick={
                  () => {
                    setOpenCancelSubscription(false);
                    handleCancelSubscription();
                  }
                }
                  variant="contained" color="secondary">
                  {i18n.t("ticketz.pro.cancelSubscription")}
                </Button>
              </DialogActions>
            </Dialog>

            <Dialog
              open={openResetLicense}
              onClose={() => setOpenResetLicense(false)}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
            >
              <DialogTitle id="alert-dialog-title">{i18n.t("ticketz.pro.resetLicenseQuestion")}</DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  <WhatsMarked>
                    {i18n.t("ticketz.pro.resetLicenseDetails")}
                  </WhatsMarked>
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenResetLicense(false)} variant="contained" color="primary" autofocus>
                  {i18n.t("ticketz.pro.back")}
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
                  {i18n.t("ticketz.pro.resetLicense")}
                </Button>
              </DialogActions>
            </Dialog>
            
          </DialogContent>

          <DialogActions>
            {!loading &&
              <Button onClick={onClose}>
                {i18n.t("ticketz.pro.close")}
              </Button>
            }
  
            {activeStep > 0 && activeStep < 3 && !loading &&
              <Button onClick={handleBack}>{i18n.t("ticketz.pro.back")}</Button>
            }

            {activeStep === 3 && !loading &&
              (errorMessage ? 
              <Button onClick={handleBack}>{i18n.t("ticketz.pro.back")}</Button>
              :
              <Button
                color="secondary"
                onClick={() => setOpenCancelSubscription(true)}>
                {i18n.t("ticketz.pro.cancelSubscription")}
              </Button>)
            }

            {activeStep === 0 &&
              <>
                {!showTicketzProKey &&
                  <>
                    <Button
                      className={classes.button}
                      onClick={
                        () => {
                          setShowTicketzProKey(true);
                        }
                      }>
                      {i18n.t("ticketz.pro.enterCode")}
                    </Button>
                    <Button
                      className={classes.button}
                      color="primary"
                      onClick={
                        () => {
                          setActiveStep(1);
                        }
                      }>
                      {i18n.t("ticketz.pro.subscribe")}
                    </Button>
                  </>
                }
                {showTicketzProKey &&
                <>
                  <Button
                    className={classes.button}
                    onClick={
                      () => {
                        setErrorMessage("");
                        setShowTicketzProKey(false);
                      }
                    }>
                    {i18n.t("ticketz.pro.cancel")}
                  </Button>
                  <Button
                    className={classes.button}
                    disabled={!ticketzProKey}
                    color="primary"
                    onClick={
                      () => {
                        handleTicketzProKey(ticketzProKey);
                      }
                    }>
                    {i18n.t("ticketz.pro.activate")}
                  </Button>
                </>                
                
                }
                
              </>
            }

            {activeStep === 2 ? (
              <Button onClick={handleNext} color="primary">
                {i18n.t("ticketz.pro.pay")}
              </Button>
            ) : activeStep === 3 || activeStep === 4 ? (
              <></>
            ) : activeStep > 0 ? (
              <Button onClick={handleNext} color="primary" disabled={!validCustomerData()}>
                {i18n.t("ticketz.pro.next")}
              </Button>
            ) : ""}
            
            {activeStep === 3 && proStatus.subscriptionData?.pix && !loading &&
              <Button onClick={recheckSubscription} color="primary">
                {i18n.t("common.proceed")}
              </Button>
            }
          </DialogActions>
        </div>
    </Dialog>
  );
}
