import React, { useEffect, useMemo, useState } from "react";

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  makeStyles
} from "@material-ui/core";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import ButtonWithSpinner from "../ButtonWithSpinner";
import { renderTemplateBody } from "./renderTemplateBody";

const useStyles = makeStyles(theme => ({
  field: {
    width: "100%",
    marginBottom: theme.spacing(2)
  },
  preview: {
    padding: theme.spacing(1.5),
    whiteSpace: "pre-wrap",
    backgroundColor: theme.palette.action.hover
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    padding: theme.spacing(3)
  }
}));

const TemplateMessageModal = ({
  open,
  onClose,
  ticketId,
  templates,
  loading,
  onSent
}) => {
  const classes = useStyles();
  const [selectedName, setSelectedName] = useState("");
  const [parameters, setParameters] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const selected = useMemo(
    () => templates.find(template => template.name === selectedName) || null,
    [templates, selectedName]
  );

  useEffect(() => {
    if (!open) return;
    setSelectedName("");
    setParameters([]);
  }, [open, ticketId]);

  useEffect(() => {
    setParameters(Array.from({ length: selected?.variables || 0 }, () => ""));
  }, [selected]);

  const missingParameter = parameters.some(value => !value.trim());

  const handleSubmit = async event => {
    event.preventDefault();
    if (!selected || missingParameter) return;

    setSubmitting(true);
    try {
      await api.post(`/messages/${ticketId}/template`, {
        name: selected.name,
        language: selected.language,
        parameters
      });
      onSent();
      onClose();
    } catch (err) {
      toastError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{i18n.t("templateMessageModal.title")}</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            {i18n.t("templateMessageModal.help")}
          </DialogContentText>

          {loading ? (
            <div className={classes.loading}>
              <CircularProgress size={28} />
            </div>
          ) : (
            <>
              {templates.length === 0 ? (
                <Typography color="error" variant="body2">
                  {i18n.t("templateMessageModal.noTemplates")}
                </Typography>
              ) : (
                <>
                  <FormControl
                    variant="outlined"
                    className={classes.field}
                    required
                  >
                    <InputLabel id="template-message-modal-label">
                      {i18n.t("templateMessageModal.fieldLabel")}
                    </InputLabel>
                    <Select
                      labelId="template-message-modal-label"
                      value={selectedName}
                      onChange={event => setSelectedName(event.target.value)}
                      label={i18n.t("templateMessageModal.fieldLabel")}
                    >
                      {templates.map(template => (
                        <MenuItem key={template.name} value={template.name}>
                          {template.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {parameters.map((value, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <TextField
                      key={`${selectedName}-${index}`}
                      className={classes.field}
                      variant="outlined"
                      required
                      label={i18n.t("templateMessageModal.variableLabel", {
                        index: index + 1
                      })}
                      value={value}
                      onChange={event => {
                        const next = [...parameters];
                        next[index] = event.target.value;
                        setParameters(next);
                      }}
                    />
                  ))}

                  {selected && (
                    <Paper variant="outlined" className={classes.preview}>
                      {renderTemplateBody(selected.body, parameters)}
                    </Paper>
                  )}
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={onClose}
            color="secondary"
            variant="outlined"
            disabled={submitting}
          >
            {i18n.t("templateMessageModal.buttons.cancel")}
          </Button>
          <ButtonWithSpinner
            type="submit"
            color="primary"
            variant="contained"
            loading={submitting}
            disabled={loading || !selected || missingParameter}
          >
            {i18n.t("templateMessageModal.buttons.ok")}
          </ButtonWithSpinner>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TemplateMessageModal;
