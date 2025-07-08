import React, { useState, useEffect } from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@material-ui/core";
import { i18n } from '../../translate/i18n';

const loadCountries = async () => {
  try {
    const response = await fetch("https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries.json");
    const data = await response.json();

    const language = localStorage.getItem("language") || "en";

    const countries = data.map(country => {
      let countryName = country.translations?.[language] || country.translations?.[language.slice(0, 2)] || country.name;
      return { iso2: country.iso2, phonecode: country.phonecode, name: countryName, emoji: country.emoji };
    }).sort((a, b) => a.name.localeCompare(b.name));

    return countries;
  } catch (error) {
    console.error("Error fetching countries:", error);
    return [];
  }
};

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
