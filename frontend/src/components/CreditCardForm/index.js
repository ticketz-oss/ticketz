import React, { useState, useEffect } from "react";
import { Grid, TextField, FormControl, InputLabel, Select, MenuItem, Button } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import InputMask from 'react-input-mask';
import { i18n } from "../../translate/i18n";
import api from "../../services/api";

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
  }
}));

export function CreditCardForm({ onSubmit, forceBR = false }) {
  const classes = useStyles();
  const [formData, setFormData] = useState({
    cardNumber: "",
    expirationDate: "",
    securityCode: "",
    cardholderName: "",
    identificationType: "CPF",
    identificationNumber: "",
  });
  const [isBrazilianCard, setIsBrazilianCard] = useState(true);
  const [lastBin, setLastBin] = useState("");

  useEffect(() => {
    
    const bin = formData.cardNumber.replace(/\s+/g, '').substring(0, 6);
    if (bin.length === 6) {
      
      if (bin === lastBin) {
        return;
      }
      
      setLastBin(bin);
      
      !forceBR && api.get(`/binlist/${bin}`).then(
        ({ data }) => {
          setIsBrazilianCard(data.country.alpha2 === 'BR');
        }
      ).catch(error => {
        console.error("Error fetching BIN data:", error);
      });
    }
  }, [formData.cardNumber]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Grid className={classes.container} container spacing={2}>
      <Grid xs={12} sm={12} md={6} item>
        <FormControl className={classes.field}>
          <InputMask
            mask="9999 9999 9999 9999"
            maskPlaceholder={null}
            value={formData.cardNumber}
            onChange={handleChange}
          >
            <TextField
              id="card-number"
              label={i18n.t('ccform.cardNumber')}
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
            value={formData.expirationDate}
            onChange={handleChange}
          >
            <TextField
              id="expiration-date"
              label={i18n.t('ccform.expirationDate')}
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
            value={formData.securityCode}
            onChange={handleChange}
          >
            <TextField
              id="security-code"
              label={i18n.t('ccform.securityCode')}
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
            label={i18n.t('ccform.cardholderName')}
            variant="standard"
            name="cardholderName"
            value={formData.cardholderName}
            onChange={handleChange}
          />
        </FormControl>
      </Grid>

      {isBrazilianCard && (
        <>
          <Grid xs={12} sm={4} md={4} item>
            <FormControl className={classes.field}>
              <InputLabel id="doc-type-label">{i18n.t('ccform.documentType')}</InputLabel>
              <Select
                labelId="doc-type-label"
                value={formData.identificationType}
                onChange={handleChange}
                name="identificationType"
              >
                <MenuItem value={"CPF"}>{i18n.t('ccform.cpf')}</MenuItem>
                <MenuItem value={"CNPJ"}>{i18n.t('ccform.cnpj')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid xs={12} sm={8} md={8} item>
            <FormControl className={classes.field}>
              <InputMask
                mask={formData.identificationType === "CPF" ? '999.999.999-99' : '99.999.999/9999-99'}
                maskPlaceholder={null}
                value={formData.identificationNumber}
                onChange={handleChange}
              >
                <TextField
                  id="document-number"
                  label={formData.identificationType === "CPF" ? i18n.t('ccform.cpf') : i18n.t('ccform.cnpj')}
                  variant="standard"
                  name="identificationNumber"
                />
              </InputMask>
            </FormControl>
          </Grid>
        </>
      )}

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
  );
}
