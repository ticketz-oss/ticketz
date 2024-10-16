import React, { useState, useEffect } from "react";
import { Grid, TextField, FormControl, InputLabel, Select, MenuItem } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { i18n } from '../../translate/i18n';

const countriesRequiringPostalCode = [
  "US", "CA", "GB", "AU", "DE", "FR", "IT", "ES", "BR", "IN", "RU", "JP", "CN", "MX", 
  "NL", "KR", "ZA", "NZ", "AR", "BE", "DK", "FI", "NO", "SE", "CH", "IE", "PL", 
  "PT", "SG", "TR", "IL", "AT", "CZ", "HU", "RO", "GR"
];

const countriesRequiringState = [
  "US", "CA", "AU", "IN", "BR", "MX", "AR", "CN", "JP", "RU"
];

const loadCountries = async () => {
  try {
    const response = await fetch("https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries.json");
    const data = await response.json();

    const language = localStorage.getItem("language") || "en";

    const countries = data.map(country => {
      let countryName = country.translations[language] || country.translations[language.slice(0, 2)] || country.name;
      return { iso2: country.iso2, name: countryName, emoji: country.emoji };
    }).sort((a, b) => a.name.localeCompare(b.name));

    return countries;
  } catch (error) {
    console.error("Error fetching countries:", error);
    return [];
  }
};

// Function to fetch address data from ViaCEP API
const fetchBrazilianAddressData = async (postalCode) => {
  if (postalCode.length !== 8) {
    return;
  }
  try {
    const response = await fetch(`https://viacep.com.br/ws/${postalCode}/json`);
    const data = await response.json();

    if (data.erro) {
      throw new Error("Postal code not found");
    }

    return {
      street: data.logradouro,
      city: data.localidade,
      state: data.uf,
      addressLine2: `Bairro ${data.bairro}`
    };
  } catch (error) {
    console.error("Error fetching address data from ViaCEP:", error);
    return { street: "", city: "", state: "", addressLine2: "" };
  }
};

const fetchZippopotamusData = async (country, zipCode) => {
  if (!country || !zipCode) {
    return;
  }
  try {
    const response = await fetch(`https://api.zippopotam.us/${country.toLowerCase()}/${zipCode}`);
    const data = await response.json();

    if (!data.places || data.places.length === 0) {
      throw new Error("ZIP code not found");
    }

    const place = data.places[0];
    return {
      street: "",
      city: place['place name'],
      state: place['state abbreviation'],
      addressLine2: ""
    };
  } catch (error) {
    console.error("Error fetching address data from Zippopotamus:", error);
    return { street: "", city: "", state: "", addressLine2: "" };
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
  errorField: {
    borderColor: theme.palette.error.main,
  }
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
    complete: false,
  });
}

export function AddressForm({ formData, setFormData }) {
  const classes = useStyles();
  const [countries, setCountries] = useState([]);
  const [showNumber, setShowNumber] = useState(true);
  const [errors, setErrors] = useState({ 
    country: false, addressLine1: false, street: false, number: false, 
    city: false, postalCode: false, state: false 
  });

  useEffect(() => {
    loadCountries().then(setCountries);
    validateFields(formData);
  }, []);

  useEffect(() => {
    setShowNumber(formData.country === "BR");
  }, [formData]);

  const validateFields = (updatedFormData) => {
    const newErrors = {
      country: !updatedFormData.country,
      addressLine1: !updatedFormData.addressLine1,
      city: !updatedFormData.city,
      postalCode: countriesRequiringPostalCode.includes(updatedFormData.country) && !updatedFormData.postalCode,
      street: updatedFormData.country === "BR" && !updatedFormData.street,
      number: updatedFormData.country === "BR" && !updatedFormData.number,
      state: countriesRequiringState.includes(updatedFormData.country) && !updatedFormData.state
    };
    setErrors(newErrors);

    const isComplete = !Object.values(newErrors).some((error) => error);
    return isComplete;
  };

  const handlePostalCode = async (e) => {
    const { value } = e.target;
    const addressData = (formData.country === "BR")
      ? await fetchBrazilianAddressData(value)
      : await fetchZippopotamusData(formData.country, value);
    const updatedFormData = { ...formData, ...addressData };

    const isComplete = validateFields(updatedFormData);
    updatedFormData.complete = isComplete;
    setFormData(updatedFormData);
  }

  const handleChange = async (e) => {
    const { name, value } = e.target;
    let updatedFormData = { ...formData, [name]: value };

    if (name === "country") {
      if (value === "BR" && formData.postalCode) {
        const addressData = await fetchBrazilianAddressData(formData.postalCode);
        updatedFormData = { ...updatedFormData, ...addressData };
      }
    }

    if (updatedFormData.country === "BR" && ["street", "number"].includes(name)) {
      updatedFormData.addressLine1 = `${updatedFormData.street}, ${updatedFormData.number}`;
    }

    const isComplete = validateFields(updatedFormData);
    updatedFormData.complete = isComplete;

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
            error={errors.country}
            className={errors.country ? classes.errorField : ""}
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
            onBlur={handlePostalCode}
            error={errors.postalCode}
            className={errors.postalCode ? classes.errorField : ""}
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
                error={errors.street}
                className={errors.street ? classes.errorField : ""}
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
                error={errors.number}
                className={errors.number ? classes.errorField : ""}
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
            error={errors.addressLine1}
            className={`${classes.addressLine1} ${errors.addressLine1 ? classes.errorField : ""}`}
          />
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={12}>
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
            error={errors.city}
            className={errors.city ? classes.errorField : ""}
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
            error={errors.state}
            className={errors.state ? classes.errorField : ""}
          />
        </FormControl>
      </Grid>
    </Grid>
  );
}
