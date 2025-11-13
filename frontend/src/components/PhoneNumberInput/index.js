import React, { useState, useEffect } from "react";
import TextField from "@material-ui/core/TextField";
import MenuItem from "@material-ui/core/MenuItem";
import { loadedCountries, currentCountry } from "../../helpers/loadCountries";
import { i18n } from "../../translate/i18n";
import { useFormikContext } from "formik";

function isNumeric(str) {
  return /^\d+$/.test(str);
}

export function PhoneNumberInput(props) {
  const formik = useFormikContext();
  const { field, label, ...rest } = props;
  const value = field?.value ?? props.value ?? "";
  const name = field?.name ?? props.name;

  const onChangeValue = (val) => {
    if (formik && name) {
      formik.setFieldValue(name, val);
      formik.setFieldTouched(name, true, false);
    } else if (props.onChange) {
      props.onChange(val);
    }
  };

  const [countryCode, setCountryCode] = useState("");
  const [localNumber, setLocalNumber] = useState("");
  const [isStandard, setIsStandard] = useState(false);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    (async () => {
      setCountries(await loadedCountries);
    })();
  }, []);

  useEffect(() => {
    if (!value && countries.length) {
      const defaultCountry = countries.find(c => c.iso2 === currentCountry) || countries[0];
      if (defaultCountry && !countryCode) {
        setCountryCode(defaultCountry.phonecode);
      }
    }
  }, [countries, value]);

  useEffect(() => {
    if (value && !isNumeric(value)) {
      setIsStandard(true);
    } else if (value && countries.length) {
      const found = countries.find(c => value.startsWith(c.phonecode));
      if (found) {
        setCountryCode(found.phonecode);
        setLocalNumber(value.slice(found.phonecode.length));
        setIsStandard(false);
        return;
      }
      const defaultCountry = countries.find(c => c.iso2 === currentCountry) || countries[0];
      setCountryCode(defaultCountry.phonecode);
      setLocalNumber(value);
      setIsStandard(false);
    }
  }, [value, countries]);

  const handleCountryChange = (e) => {
    setCountryCode(e.target.value);
    onChangeValue(e.target.value + localNumber);
  };

  const handleLocalChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    setLocalNumber(val);
    onChangeValue(countryCode + val);
  };

  const handleStandardChange = (e) => {
    onChangeValue(e.target.value);
  };

  if (isStandard) {
    return (
      <TextField
        label={label || i18n.t("phoneNumberInput.phoneNumber")}
        value={value}
        onChange={handleStandardChange}
        style={{ width: "100%" }}
        name={name}
        {...rest}
      />
    );
  }

  const selectedCountry = countries.find(c => c.phonecode === countryCode);

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <TextField
        select
        label={i18n.t("phoneNumberInput.country")}
        value={countryCode}
        onChange={handleCountryChange}
        style={{ width: 100, marginRight: 8 }}
        variant="outlined"
        margin="dense"
        name={name}
        SelectProps={{
          renderValue: () =>
            selectedCountry
              ? `${selectedCountry.emoji} +${selectedCountry.phonecode}`
              : `+${countryCode}`
        }}
      >
        {countries.map((option) => (
          <MenuItem key={option.iso2} value={option.phonecode}>
            {`${option.name} (+${option.phonecode})`}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label={label || i18n.t("phoneNumberInput.localNumber")}
        value={localNumber}
        onChange={handleLocalChange}
        variant="outlined"
        margin="dense"
        style={{ flex: 1 }}
        inputProps={{ maxLength: 15 }}
        name={name}
      />
    </div>
  );
}
