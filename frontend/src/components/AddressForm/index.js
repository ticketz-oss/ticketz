import React, { useState, useEffect } from "react";
import { Grid, TextField, FormControl, InputLabel, Select, MenuItem } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { i18n } from '../../translate/i18n';

// Country loader placed outside the component functions
const loadCountries = async () => {
  try {
    const response = await fetch("https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/countries.json");
    const data = await response.json();

    const language = localStorage.getItem("language") || "en";

    // Map and sort countries
    const countries = data.map(country => {
      // Full match
      let countryName = country.translations[language];

      // Two-letter match
      if (!countryName && language.length === 5) {
        countryName = country.translations[language.slice(0, 2)];
      }

      // Fallback to English
      if (!countryName) {
        countryName = country.name;
      }

      return {
        iso2: country.iso2,
        name: countryName,
        emoji: country.emoji
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    return countries;
  } catch (error) {
    console.error("Error fetching countries:", error);
    return [];
  }
};

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: 0,
  },
  field: {
    width: "100%",
    textAlign: "left",
  },
  addressLine1: {
    width: "100%",
  },
}));

export function useAddressData() {
  return useState({
    addressLine1: "",
    addressLine2: "",
    street: "",
    number: "",
    country: "",
    postalCode: "",
    city: "",
    state: "",
  });
}

export function AddressForm({ formData, setFormData }) {
  const classes = useStyles();
  const [countries, setCountries] = useState([]);
  const [showNumber, setShowNumber] = useState(true);

  // Fetch countries on component mount
  useEffect(() => {
    loadCountries().then(setCountries);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let updatedFormData = { ...formData, [name]: value };

    if (name === "country") {
      if (value === "BR") {
        setShowNumber(true);
      } else {
        setShowNumber(false);
      }
    }

    if (updatedFormData.country === "BR" && ["street", "number"].includes(name))
    {
      updatedFormData.addressLine1 = `${updatedFormData.street}, ${updatedFormData.number}`;
    }

    setFormData(updatedFormData);
  };

  return (
    <Grid className={classes.container} container spacing={2}>
      <Grid item xs={12} sm={6}>
        <FormControl className={classes.field}>
          <InputLabel id="country-label">{i18n.t('addressForm.country')}</InputLabel>
          <Select
            labelId="country-label"
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
          >
            {countries.map((country) => (
              <MenuItem key={country.iso2} value={country.iso2}>
                {country.emoji} {country.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl className={classes.field}>
          <TextField
            id="postalCode"
            name="postalCode"
            label={i18n.t('addressForm.postalCode')}
            variant="standard"
            value={formData.postalCode}
            onChange={handleChange}
          />
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={12} style={{ display: showNumber ? 'block' : 'none' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <FormControl className={classes.field}>
              <TextField
                id="street"
                name="street"
                label={i18n.t('addressForm.street')}
                variant="standard"
                value={formData.street}
                onChange={handleChange}
                className={classes.addressLine1}
              />
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl className={classes.field}>
              <TextField
                id="number"
                name="number"
                label={i18n.t('addressForm.streetNumber')}
                variant="standard"
                value={formData.number}
                onChange={handleChange}
              />
            </FormControl>
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12} sm={12} style={{ display: !showNumber ? 'block' : 'none' }}>
        <FormControl className={classes.field}>
          <TextField
            id="addressLine1"
            name="addressLine1"
            label={i18n.t('addressForm.addressLine1')}
            variant="standard"
            value={formData.addressLine1}
            onChange={handleChange}
            className={classes.addressLine1}
          />
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControl className={classes.field}>
          <TextField
            id="addressLine2"
            name="addressLine2"
            label={i18n.t('addressForm.addressLine2')}
            variant="standard"
            value={formData.addressLine2}
            onChange={handleChange}
          />
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl className={classes.field}>
          <TextField
            id="city"
            name="city"
            label={i18n.t('addressForm.city')}
            variant="standard"
            value={formData.city}
            onChange={handleChange}
          />
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl className={classes.field}>
          <TextField
            id="state"
            name="state"
            label={i18n.t('addressForm.state')}
            variant="standard"
            value={formData.state}
            onChange={handleChange}
          />
        </FormControl>
      </Grid>
    </Grid>
  );
}
