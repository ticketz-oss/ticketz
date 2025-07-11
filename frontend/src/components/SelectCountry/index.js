import React, { useState, useEffect } from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@material-ui/core";
import { i18n } from '../../translate/i18n';
import { loadCountries } from "../../helpers/loadCountries";

const loadedCountryes = await loadCountries();

export function getPhoneCode(iso2) {
  const country = loadedCountryes.find(country => country.iso2 === iso2);
  return country ? country.phonecode : "";
}

export function SelectCountry({ className, label, value, name, onChange }) {
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    setCountries(loadedCountryes);
  }, []);

  return (
    <FormControl className={className}>
      <InputLabel id="country-label">{label || i18n.t('addressForm.country')}</InputLabel>
      <Select
        labelId="country-label"
        id="country"
        name={name || "country"}
        value={value}
        onChange={onChange}
      >
        {countries.map((country) => (
          <MenuItem key={country.iso2} value={country.iso2}>
            {country.emoji} {country.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
