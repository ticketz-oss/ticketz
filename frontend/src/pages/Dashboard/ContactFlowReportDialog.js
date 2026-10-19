import React, { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
  Typography
} from "@material-ui/core";
import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const firstDay = () => `${today().slice(0, 7)}-01`;

const ContactFlowReportDialog = ({ open, onClose }) => {
  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(today);
  const [availableFields, setAvailableFields] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  const [columns, setColumns] = useState([
    "contactedAt",
    "name",
    "number",
    "notes"
  ]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !from || !to || from > to) return;
    let alive = true;
    api
      .get("/dashboard/contact-report/fields", {
        params: { from, to, tz: new Date().getTimezoneOffset() }
      })
      .then(({ data }) => {
        if (!alive) return;
        setAvailableFields(data.fields);
        setSelectedFields(previous =>
          previous.length
            ? previous.filter(field => data.fields.includes(field))
            : data.fields
        );
      })
      .catch(toastError);
    return () => {
      alive = false;
    };
  }, [open, from, to]);

  const toggle = (value, selected, setter) => {
    setter(
      selected.includes(value)
        ? selected.filter(item => item !== value)
        : [...selected, value]
    );
  };

  const download = async format => {
    setBusy(true);
    try {
      const { data } = await api.get("/dashboard/contact-report/export", {
        params: {
          from,
          to,
          tz: new Date().getTimezoneOffset(),
          format,
          columns: JSON.stringify(columns),
          fields: JSON.stringify(selectedFields)
        },
        responseType: "blob"
      });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fluxo-contatos-${from}-a-${to}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toastError(error);
    } finally {
      setBusy(false);
    }
  };

  const standard = [
    ["contactedAt", "dashboard.contactReport.contactedAt"],
    ["name", "dashboard.contactReport.name"],
    ["number", "dashboard.contactReport.number"],
    ["notes", "dashboard.contactReport.notes"]
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {i18n.t("dashboard.contactReport.title", {
          defaultValue: "Exportar fluxo de contatos"
        })}
      </DialogTitle>
      <DialogContent dividers>
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <TextField
            type="date"
            label={i18n.t("dashboard.date.start")}
            value={from}
            onChange={event => setFrom(event.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            type="date"
            label={i18n.t("dashboard.date.end")}
            value={to}
            onChange={event => setTo(event.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </div>
        <Typography variant="subtitle1">
          {i18n.t("dashboard.contactReport.columns", {
            defaultValue: "Colunas do relatório"
          })}
        </Typography>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          {standard.map(([id, label]) => (
            <FormControlLabel
              key={id}
              label={i18n.t(label)}
              control={
                <Checkbox
                  checked={columns.includes(id)}
                  onChange={() => toggle(id, columns, setColumns)}
                />
              }
            />
          ))}
        </div>
        <Typography variant="subtitle1">
          {i18n.t("contactModal.form.extraInfo")}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {i18n.t("dashboard.contactReport.historyNotice")}
        </Typography>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          {availableFields.map(field => (
            <FormControlLabel
              key={field}
              label={field}
              control={
                <Checkbox
                  checked={selectedFields.includes(field)}
                  onChange={() =>
                    toggle(field, selectedFields, setSelectedFields)
                  }
                />
              }
            />
          ))}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          {i18n.t("common.cancel", { defaultValue: "Cancelar" })}
        </Button>
        {busy && <CircularProgress size={22} />}
        <Button
          disabled={busy || !from || !to || from > to || !columns.length}
          onClick={() => download("pdf")}
        >
          PDF
        </Button>
        <Button
          color="primary"
          variant="contained"
          disabled={busy || !from || !to || from > to || !columns.length}
          onClick={() => download("xlsx")}
        >
          Excel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContactFlowReportDialog;
