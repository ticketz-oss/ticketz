import React, { useState, useRef } from 'react';
import { getPhoneCode, SelectCountry } from '../SelectCountry';
import { TextField, Button, Grid, InputAdornment, Typography } from '@material-ui/core';
import { makeStyles } from "@material-ui/core/styles";
import { i18n } from '../../translate/i18n';
import api from '../../services/api';

const useStyles = makeStyles((theme) => ({
  fullWidth: {
    width: '100%'
  }
}));

const TicketzRegistry = ({onRegister}) => {
  const classes = useStyles();
  const phoneNumberRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    country: 'BR',
    phoneNumber: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'country') {
      phoneNumberRef.current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const registryData = {
        name: formData.name,
        whatsapp: `${getPhoneCode(formData.country)}${formData.phoneNumber}`
      };
      const response = await api.post('/ticketz/registry', registryData);
      console.debug('Form submitted successfully:', response.data);
      if (!!onRegister) {
        onRegister(true);
      };
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
            <Typography component="h2" variant="h6" gutterBottom>
              {i18n.t("ticketz.registration.header")}
            </Typography>
            <p>{i18n.t("ticketz.registration.description")}</p>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            className={classes.fullWidth}
            label={i18n.t('ticketz.registration.name')}
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <SelectCountry
            className={classes.fullWidth}
            label={i18n.t('ticketz.registration.country')}
            value={formData.country}
            onChange={handleChange}
            name="country"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            className={classes.fullWidth}
            label={i18n.t('ticketz.registration.phoneNumber')}
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            fullWidth
            inputRef={phoneNumberRef}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {getPhoneCode(formData.country)}
                </InputAdornment>
              )
            }}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <Button className={classes.fullWidth} type="submit" variant="contained" color="primary">
            {i18n.t('ticketz.registration.submit')}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default TicketzRegistry;
