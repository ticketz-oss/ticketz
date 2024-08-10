import React, { useRef, useState } from "react";
import { Grid } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import moment from "moment/moment";
import 'moment/locale/pt';
import { getIdentificationTypes, initMercadoPago } from "@mercadopago/sdk-react";
import { createCardToken } from '@mercadopago/sdk-react/coreMethods';
import { TextField, FormControl, InputLabel, Select, MenuItem, Button } from "@material-ui/core";
import InputMask from 'react-input-mask';

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
  field: {
    width: "100%",
    textAlign: "left",
    paddingRight: "12px",
  },  
  button: {
    position: "relative",
  },
  buttonGrid: {
    display: "flex",
    justifyContent: "flex-end",
    paddingRight: "12px",
    paddingTop: "6px",
  }
}));

export default function MercadoPagoCreditCard({ callback }) {
  const classes = useStyles();
  const [cardNumber, setCardNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [identificationType, setIdentificationType] = useState("CPF");
  const [identificationNumber, setIdentificationNumber] = useState("");

  const sendForm = async () => {
    const [cardExpirationMonth, cardExpirationYear] = expirationDate.split("/");
    const cardToken = await createCardToken({
      cardNumber: cardNumber.replace(/\D/g, ""),
      cardholderName,
      cardExpirationMonth,
      cardExpirationYear,
      securityCode,
      identificationType,
      identificationNumber: identificationNumber.replace(/\D/g, "")
    });
    callback(cardToken);
  };

  initMercadoPago("APP_USR-4e658725-1e50-49ef-976f-f866ca2a041c");
  // initMercadoPago("TEST-7b3070b9-c99c-459b-8c35-79a50579a3af");

	return (
    <Grid xs={12} sm={12} md={6} container>
      <Grid xs={12} sm={12} md={6} item>
        <FormControl className={classes.field}>
          <InputMask
            mask="9999 9999 9999 9999"
            maskPlaceholder={null}
            value={cardNumber}
            onChange={(e) => {
              setCardNumber(e.target.value);
            }}
          >
            <TextField
              id="card-number"
              label="Número do Cartão"
              variant="standard"
              name="cardNumber"
            />
          </InputMask>        
        </FormControl>
      </Grid>
      <Grid xs={12} sm={6} md={3} item>
        <FormControl className={classes.field}>
          <InputMask
            mask="99/99"
            maskPlaceholder={null}
            value={expirationDate}
            onChange={(e) => {
              setExpirationDate(e.target.value);
            }}
          >
              <TextField
                id="expiration-date"
                label="Validade"
                variant="standard"
                name="expirationDate"
              />
          </InputMask>
        </FormControl>
      </Grid>
      <Grid xs={12} sm={6} md={3} item>
        <FormControl className={classes.field}>
          <InputMask
            mask="999"
            maskPlaceholder={null}
            value={securityCode}
            onChange={(e) => {
              setSecurityCode(e.target.value);
            }}
          >
              <TextField
                id="security-code"
                label="CVV"
                variant="standard"
                name="securityCode"
              />
          </InputMask>
        </FormControl>
      </Grid>

      <Grid xs={12} sm={12} md={12} item>
        <FormControl className={classes.field}>
          <TextField
            id="card-holder"
            label="Nome no Cartão"
            variant="standard"
            name="cardHolder"
            value={cardholderName}
            onChange={(e) => {
              setCardholderName(e.target.value);
            }}
          />
        </FormControl>
      </Grid>


      <Grid xs={12} sm={4} md={4} item>
        <FormControl className={classes.field}>
          <InputLabel id="doc-type-label">
            Tipo do documento
          </InputLabel>
          <Select
            labelId="quickmessages-label"
            value={identificationType}
            onChange={async (e) => {
              setIdentificationType(e.target.value);
            }}
          >
            <MenuItem value={"CPF"}>CPF</MenuItem>
            <MenuItem value={"CNPJ"}>CNPJ</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      { identificationType === "CPF" && 
      <Grid xs={12} sm={8} md={8} item>
        <FormControl className={classes.field}>
          <InputMask
            mask='999.999.999-99'
            maskPlaceholder={null}
            value={identificationNumber}
            onChange={(e) => {
              setIdentificationNumber(e.target.value);
            }}
          >
              <TextField
                id="document-number-cpf"
                label="CPF"
                variant="standard"
                name="documentNumber"
              />
          </InputMask>
        </FormControl>
      </Grid>
      }

      { identificationType === "CNPJ" && 
      <Grid xs={12} sm={8} md={8} item>
        <FormControl className={classes.field}>
          <InputMask
            mask='99.999.999/9999-99'
            maskPlaceholder={null}
            value={identificationNumber}
            onChange={(e) => {
              setIdentificationNumber(e.target.value);
            }}
          >
              <TextField
                id="document-number-cnpj"
                label="CNPJ"
                variant="standard"
                name="documentNumber"
              />
          </InputMask>
        </FormControl>
      </Grid>
      }

      <Grid xs={12} sm={12} md={12} className={classes.buttonGrid}>
        <Button className={classes.button}  variant="contained" color="primary"  onClick={() => sendForm()}>Enviar</Button>
      </Grid>

    </Grid>
	);
}
