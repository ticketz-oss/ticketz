import React from "react";
import { MenuItem, TextField } from "@material-ui/core";
import { i18n } from "../../translate/i18n";

export default function CompanyWhatsAppModeField({
  value = "normal",
  onChange,
  disabled = false
}) {
  return (
    <TextField
      select
      name="whatsappMode"
      label={i18n.t("companyWhatsAppMode.label")}
      helperText={i18n.t("companyWhatsAppMode.immutable")}
      value={value}
      onChange={onChange}
      disabled={disabled}
      variant="outlined"
      margin="dense"
      fullWidth
      required
    >
      <MenuItem value="normal">{i18n.t("companyWhatsAppMode.normal")}</MenuItem>
      <MenuItem value="meta">{i18n.t("companyWhatsAppMode.meta")}</MenuItem>
    </TextField>
  );
}
