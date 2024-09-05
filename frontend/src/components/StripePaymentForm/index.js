import {useStripe, useElements, Elements, CardNumberElement, CardExpiryElement, CardCvcElement} from '@stripe/react-stripe-js';
import { makeStyles } from "@material-ui/core/styles";
import { Button, FormControl, Grid, TextField } from '@material-ui/core';
import { i18n } from '../../translate/i18n';
import { loadStripe } from '@stripe/stripe-js';
import React, { useState } from 'react';

let stripePromise = null;

const getStripePromise = (clientKey) => {
  if (!stripePromise) {
    console.log("Loading stripe promise");
    stripePromise = loadStripe(clientKey);
  }
  return stripePromise;
}

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: "8px"
  },
  field: {
    width: "100%",
    textAlign: "left",
  },
  button: {
    position: "relative",
  },
  buttonGrid: {
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: "6px",
  },
  inputField: {
    paddingTop: "6px",
    paddingBottom: "7px"
  },
  customInputField: {
    width: "100%"
  }
}));

const cardFieldOptions = {
  showIcon: true,
  style: {
    base: {
      fontFamily: "Roboto, Helvetica, Arial, sans-serif",
      fontSize: "16px",
    }
  }
}

function InputCustomField(props) {
  const { component: Component, inputRef, ...other } = props;

  // implementa a interface `InputElement`
  React.useImperativeHandle(inputRef, () => ({
    focus: () => {
    },
  }));
  
  return <Component {...other} /> 
}

function RenderStripeCardElement({ callback, addressData }) {
  const classes = useStyles();
  const stripe = useStripe();
  const elements = useElements();
  const [formData, setFormData] = useState({
    cardholderName: "",
  });  

  const handleSubmit = async (event) => {
    if (!stripe || !elements) {
      return;
    }

    const data = {
      name: formData.cardholderName,
      address_line1: addressData.addressLine1,
      address_line2: addressData.addressLine2,
      address_city: addressData.city,
      address_state: addressData.state,
      address_zip: addressData.postalCode,
      address_country: addressData.country
    }

    const cardElement = elements.getElement("cardNumber");
    const token = await stripe.createToken(cardElement, data);
    callback(token.token);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };  
  
  return (
    <Grid className={classes.container} container spacing={2}>
      <Grid xs={12} sm={12} md={6} item>
        <TextField
          label={i18n.t('ccform.cardNumber')}
          InputLabelProps={{ shrink: true }} 
          className={classes.customInputField}
          InputProps={{
            inputComponent: InputCustomField,
            inputProps: {
              component: CardNumberElement,
              className: classes.inputField,
              options: cardFieldOptions
            }
          }}
        />
      </Grid>
      <Grid xs={12} sm={6} md={3} item>
        <TextField
          className={classes.customInputField}
          label={i18n.t('ccform.expirationDate')}
          InputLabelProps={{ shrink: true }} 
          InputProps={{
            inputComponent: InputCustomField,
            inputProps: {
              component: CardExpiryElement,
              className: classes.inputField,
              options: cardFieldOptions
            }
          }}
        />
      </Grid>
      <Grid xs={12} sm={6} md={3} item>
        <TextField
          className={classes.customInputField}
          label={i18n.t('ccform.securityCode')}
          InputLabelProps={{ shrink: true }} 
          InputProps={{
            inputComponent: InputCustomField,
            inputProps: {
              component: CardCvcElement,
              className: classes.inputField,
              options: cardFieldOptions
            }
          }}
        />
      </Grid>
      <Grid xs={12} sm={12} md={12} item>
        <FormControl className={classes.field}>
          <TextField
            id="card-holder"
            label={i18n.t('ccform.cardholderName')}
            variant="standard"
            name="cardholderName"
            value={formData.cardholderName}
            onChange={handleChange}
          />
        </FormControl>
      </Grid>
      <Grid xs={12} sm={12} md={12} className={classes.buttonGrid}>
        <Button
          className={classes.button}
          variant="contained"
          color="primary"
          onClick={handleSubmit}
        >
          {i18n.t('ccform.submit')}
        </Button>
      </Grid>
    </Grid>
  )
}

export function StripePaymentForm({ callback, clientKey, addressData }) {
  return (
    <Elements stripe={getStripePromise(clientKey)}>
      <RenderStripeCardElement callback={callback} addressData={addressData} />
    </Elements>
  )
};
