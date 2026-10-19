import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField
} from "@material-ui/core";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";
import { i18n } from "../../translate/i18n";

const emptyDate = {
  name: "",
  ruleType: "FIXED_DATE",
  month: 1,
  day: 1,
  weekday: 0,
  ordinal: 1,
  active: true
};

const CommemorativeDateModal = ({ open, onClose, value, onSaved }) => {
  const [form, setForm] = useState(emptyDate);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(value ? { ...emptyDate, ...value } : emptyDate);
  }, [open, value]);

  const set = (key, fieldValue) =>
    setForm(current => ({ ...current, [key]: fieldValue }));

  const save = async () => {
    setSaving(true);
    try {
      if (value?.id) await api.put(`/commemorative-dates/${value.id}`, form);
      else await api.post("/commemorative-dates", form);
      toast.success(i18n.t("commemorativeDates.success"));
      onSaved();
      onClose();
    } catch (error) {
      toastError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {value?.id
          ? i18n.t("commemorativeDates.edit")
          : i18n.t("commemorativeDates.add")}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label={i18n.t("commemorativeDates.form.name")}
              value={form.name}
              onChange={event => set("name", event.target.value)}
              variant="outlined"
              fullWidth
              autoFocus
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl variant="outlined" fullWidth>
              <InputLabel>
                {i18n.t("commemorativeDates.form.ruleType")}
              </InputLabel>
              <Select
                value={form.ruleType}
                onChange={event => set("ruleType", event.target.value)}
                label={i18n.t("commemorativeDates.form.ruleType")}
              >
                <MenuItem value="FIXED_DATE">
                  {i18n.t("commemorativeDates.rules.fixed")}
                </MenuItem>
                <MenuItem value="NTH_WEEKDAY">
                  {i18n.t("commemorativeDates.rules.nthWeekday")}
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label={i18n.t("commemorativeDates.form.month")}
              type="number"
              inputProps={{ min: 1, max: 12 }}
              value={form.month}
              onChange={event => set("month", Number(event.target.value))}
              variant="outlined"
              fullWidth
            />
          </Grid>
          {form.ruleType === "FIXED_DATE" ? (
            <Grid item xs={12} sm={6}>
              <TextField
                label={i18n.t("commemorativeDates.form.day")}
                type="number"
                inputProps={{ min: 1, max: 31 }}
                value={form.day}
                onChange={event => set("day", Number(event.target.value))}
                variant="outlined"
                fullWidth
              />
            </Grid>
          ) : (
            <>
              <Grid item xs={12} sm={6}>
                <FormControl variant="outlined" fullWidth>
                  <InputLabel>
                    {i18n.t("commemorativeDates.form.ordinal")}
                  </InputLabel>
                  <Select
                    value={form.ordinal}
                    onChange={event => set("ordinal", event.target.value)}
                    label={i18n.t("commemorativeDates.form.ordinal")}
                  >
                    {[1, 2, 3, 4, 5].map(item => (
                      <MenuItem key={item} value={item}>
                        {item}º
                      </MenuItem>
                    ))}
                    <MenuItem value={-1}>
                      {i18n.t("commemorativeDates.last")}
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl variant="outlined" fullWidth>
                  <InputLabel>
                    {i18n.t("commemorativeDates.form.weekday")}
                  </InputLabel>
                  <Select
                    value={form.weekday}
                    onChange={event => set("weekday", event.target.value)}
                    label={i18n.t("commemorativeDates.form.weekday")}
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map(day => (
                      <MenuItem key={day} value={day}>
                        {i18n.t(`commemorativeDates.weekdays.${day}`)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.active}
                  onChange={event => set("active", event.target.checked)}
                  color="primary"
                />
              }
              label={i18n.t("commemorativeDates.form.active")}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{i18n.t("common.cancel")}</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={save}
          disabled={saving}
        >
          {i18n.t("common.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommemorativeDateModal;
