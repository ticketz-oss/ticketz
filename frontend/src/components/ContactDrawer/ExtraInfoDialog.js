import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography
} from "@material-ui/core";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const ExtraInfoDialog = ({ open, onClose, contact, onSave }) => {
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !contact?.id) return;
    let alive = true;
    api
      .get(`/contacts/${contact.id}`)
      .then(({ data }) => {
        if (alive) setRows(data.extraInfo || []);
      })
      .catch(toastError);
    return () => {
      alive = false;
    };
  }, [open, contact?.id]);

  const update = (index, key, value) =>
    setRows(previous =>
      previous.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row
      )
    );

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/contacts/${contact.id}/extra-info`, {
        extraInfo: rows.map(({ id, name, value }) => ({
          id,
          name: name.trim(),
          value
        }))
      });
      onSave(data);
      onClose();
    } catch (error) {
      toastError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{i18n.t("contactModal.form.extraInfo")}</DialogTitle>
      <DialogContent dividers>
        {rows.map((row, index) => (
          <div key={row.id || `new-${index}`} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <TextField
                label={i18n.t("contactModal.form.extraName")}
                value={row.name || ""}
                onChange={event => update(index, "name", event.target.value)}
                fullWidth
              />
              <TextField
                label={i18n.t("contactModal.form.extraValue")}
                value={row.value || ""}
                onChange={event => update(index, "value", event.target.value)}
                fullWidth
              />
              <IconButton
                aria-label={i18n.t("common.delete")}
                onClick={() =>
                  setRows(previous =>
                    previous.filter((_, rowIndex) => rowIndex !== index)
                  )
                }
              >
                <DeleteOutlineIcon />
              </IconButton>
            </div>
            {row.createdAt && (
              <Typography variant="caption" color="textSecondary">
                {i18n.t("contactDrawer.fieldAddedAt", {
                  defaultValue: "Adicionado em"
                })}{" "}
                {new Date(row.createdAt).toLocaleString(i18n.language)}
              </Typography>
            )}
          </div>
        ))}
        <Button
          onClick={() =>
            setRows(previous => [...previous, { name: "", value: "" }])
          }
        >
          {i18n.t("contactDrawer.addExtraInfo", {
            defaultValue: "Adicionar informação"
          })}
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {i18n.t("common.cancel", { defaultValue: "Cancelar" })}
        </Button>
        <Button
          color="primary"
          variant="contained"
          onClick={save}
          disabled={
            saving || rows.some(row => !row.name?.trim() || !row.value?.trim())
          }
        >
          {i18n.t("common.save", { defaultValue: "Salvar" })}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExtraInfoDialog;
