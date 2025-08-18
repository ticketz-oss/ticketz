import React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@material-ui/core";
import { i18n } from "../../translate/i18n";
import { messages } from "../../translate/languages";

const languageOptions = {};

Object.keys(messages).forEach((key) => {
  languageOptions[key] = messages[key].translations.mainDrawer.appBar.i18n.language;
});

export function SelectLanguage({ className, label, value, name, onChange, field, form, variant, margin, fullWidth }) {
  const handleChange = (event) => {
    if (form && field) {
      form.setFieldValue(field.name, event.target.value);
    } else if (onChange) {
      onChange(event);
    }
  };

  const selectedValue = field?.value || value;
  
  label = label || i18n.t("common.language");

  return (
    <FormControl className={className} variant={variant} margin={margin} fullWidth={fullWidth}>
      <InputLabel id="language-label">
        {label}
      </InputLabel>
      <Select
        labelId="language-label"
        label={label}
        id="language"
        name={field?.name || name || "language"}
        value={selectedValue}
        onChange={handleChange}
        variant={variant}
        margin={margin}
      >
        {Object.entries(languageOptions).map(([key, display]) => (
          <MenuItem key={key} value={key}>
            {display}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
