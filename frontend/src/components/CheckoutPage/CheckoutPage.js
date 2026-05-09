import React, { useContext, useState } from "react";
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  FormControl,
  FormLabel,
  Grid,
  Divider
} from "@material-ui/core";
import { Formik, Form } from "formik";

import AddressForm from "./Forms/AddressForm";
import PaymentForm from "./Forms/PaymentForm";
import ReviewOrder from "./ReviewOrder";
import CheckoutSuccess from "./CheckoutSuccess";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/Auth/AuthContext";

import validationSchema from "./FormModel/validationSchema";
import checkoutFormModel from "./FormModel/checkoutFormModel";
import formInitialValues from "./FormModel/formInitialValues";

import useStyles from "./styles";

export default function CheckoutPage(props) {
  const steps = ["Dados", "Personalizar", "Revisar"];
  const { formId, formField } = checkoutFormModel;

  const classes = useStyles();
  const [activeStep, setActiveStep] = useState(1);
  const [datePayment, setDatePayment] = useState(null);
  const [invoiceId] = useState(props.Invoice.id);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const onClose = props.onClose;
  const currentValidationSchema = validationSchema[activeStep];
  const isLastStep = activeStep === steps.length - 1;
  const { user } = useContext(AuthContext);

  function _renderStepContent(step, setFieldValue, setActiveStep, values) {
    switch (step) {
      case 0:
        return (
          <AddressForm
            formField={formField}
            values={values}
            setFieldValue={setFieldValue}
          />
        );
      case 1:
        return (
          <PaymentForm
            formField={formField}
            setFieldValue={setFieldValue}
            setActiveStep={setActiveStep}
            activeStep={step}
            invoiceId={invoiceId}
            values={values}
          />
        );
      case 2:
        return (
          <>
            <ReviewOrder />
            <Divider style={{ margin: "24px 0 16px" }} />
            <FormControl component="fieldset">
              <FormLabel component="legend">
                <Typography variant="subtitle1">Forma de Pagamento</Typography>
              </FormLabel>
              <RadioGroup
                row
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
              >
                <FormControlLabel value="pix" control={<Radio />} label="PIX" />
                <FormControlLabel
                  value="boleto"
                  control={<Radio />}
                  label="Boleto Bancário"
                />
              </RadioGroup>
            </FormControl>

            {paymentMethod === "boleto" && (
              <Grid container spacing={2} style={{ marginTop: 8 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="CPF / CNPJ do pagador"
                    variant="outlined"
                    fullWidth
                    required
                    value={cpfCnpj}
                    onChange={e => setCpfCnpj(e.target.value)}
                    helperText="Necessário para emissão do boleto"
                    inputProps={{ maxLength: 18 }}
                  />
                </Grid>
              </Grid>
            )}
          </>
        );
      default:
        return <div>Not Found</div>;
    }
  }

  async function _submitForm(values, actions) {
    if (paymentMethod === "boleto" && !cpfCnpj.trim()) {
      toast.error("Informe o CPF/CNPJ para gerar o boleto.");
      actions.setSubmitting(false);
      return;
    }

    try {
      const plan = JSON.parse(values.plan);
      const newValues = {
        firstName: values.firstName,
        lastName: values.lastName,
        address2: values.address2,
        city: values.city,
        state: values.state,
        zipcode: values.zipcode,
        country: values.country,
        useAddressForPaymentDetails: values.useAddressForPaymentDetails,
        nameOnCard: values.nameOnCard,
        cardNumber: values.cardNumber,
        cvv: values.cvv,
        plan: values.plan,
        price: plan.price,
        users: plan.users,
        connections: plan.connections,
        invoiceId,
        paymentMethod,
        cpfCnpj: cpfCnpj.trim() || undefined,
        customerName: `${values.firstName || ""} ${values.lastName || ""}`.trim() || undefined,
        customerEmail: user?.email || undefined
      };

      const { data } = await api.post("/subscription", newValues);
      setDatePayment(data);
      actions.setSubmitting(true);
      setActiveStep(activeStep + 1);

      if (paymentMethod === "boleto") {
        toast.success("Boleto gerado! Efetue o pagamento até o vencimento.");
      } else {
        toast.success(
          "Assinatura realizada com sucesso! Aguardando a realização do pagamento."
        );
      }
    } catch (err) {
      actions.setSubmitting(false);
      toastError(err);
    }
  }

  function _handleSubmit(values, actions) {
    if (isLastStep) {
      _submitForm(values, actions);
    } else {
      setActiveStep(activeStep + 1);
      actions.setTouched({});
      actions.setSubmitting(false);
    }
  }

  function _handleBack() {
    setActiveStep(activeStep - 1);
  }

  return (
    <React.Fragment>
      <Typography component="h1" variant="h4" align="center">
        Falta pouco!
      </Typography>
      <Stepper activeStep={activeStep} className={classes.stepper}>
        {steps.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <React.Fragment>
        {activeStep === steps.length ? (
          <CheckoutSuccess pix={datePayment} onClose={onClose} />
        ) : (
          <Formik
            initialValues={{
              ...user,
              ...formInitialValues
            }}
            validationSchema={currentValidationSchema}
            onSubmit={_handleSubmit}
          >
            {({ isSubmitting, setFieldValue, values }) => (
              <Form id={formId}>
                {_renderStepContent(
                  activeStep,
                  setFieldValue,
                  setActiveStep,
                  values
                )}

                <div className={classes.buttons}>
                  {activeStep !== 1 && (
                    <Button onClick={_handleBack} className={classes.button}>
                      VOLTAR
                    </Button>
                  )}
                  <div className={classes.wrapper}>
                    {activeStep !== 1 && (
                      <Button
                        disabled={isSubmitting}
                        type="submit"
                        variant="contained"
                        color="primary"
                        className={classes.button}
                      >
                        {isLastStep ? "PAGAR" : "PRÓXIMO"}
                      </Button>
                    )}
                    {isSubmitting && (
                      <CircularProgress
                        size={24}
                        className={classes.buttonProgress}
                      />
                    )}
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        )}
      </React.Fragment>
    </React.Fragment>
  );
}
