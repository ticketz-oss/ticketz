import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Divider,
  makeStyles,
  Link
} from "@material-ui/core";

const useStyles = makeStyles(theme => ({
  field: {
    marginBottom: theme.spacing(2)
  },
  helpText: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
    lineHeight: 1.6
  },
  section: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    fontWeight: 500,
    fontSize: 14
  }
}));

const MetaConnectionModal = ({ open, onClose, onSave, initialData }) => {
  const classes = useStyles();
  const [form, setForm] = useState({
    name: "",
    phoneNumberId: "",
    wabaId: "",
    tokenMeta: "",
    channel: "meta"
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        phoneNumberId: initialData.phoneNumberId || "",
        wabaId: initialData.wabaId || "",
        tokenMeta: initialData.tokenMeta || "",
        channel: "meta"
      });
    } else {
      setForm({ name: "", phoneNumberId: "", wabaId: "", tokenMeta: "", channel: "meta" });
    }
  }, [initialData, open]);

  const handleSave = () => {
    if (!form.name || !form.phoneNumberId || !form.tokenMeta) {
      return;
    }
    onSave(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialData ? "Editar conexão Meta API" : "Nova conexão — Meta WhatsApp Business API"}
      </DialogTitle>
      <DialogContent>
        <Typography className={classes.helpText}>
          Para usar a API Oficial do WhatsApp, você precisa de uma conta no{" "}
          <Link href="https://business.facebook.com" target="_blank" rel="noopener">
            Meta Business Suite
          </Link>
          . Os dados abaixo estão disponíveis no painel do desenvolvedor da Meta em{" "}
          <Link href="https://developers.facebook.com" target="_blank" rel="noopener">
            developers.facebook.com
          </Link>
          {" "}→ seu app → WhatsApp → API Setup.
        </Typography>

        <TextField
          className={classes.field}
          label="Nome da conexão"
          placeholder="Ex: Número Comercial (11) 9999-9999"
          fullWidth
          variant="outlined"
          size="small"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />

        <Divider />
        <Typography className={classes.section}>Credenciais da Meta</Typography>

        <TextField
          className={classes.field}
          label="Phone Number ID"
          placeholder="Ex: 123456789012345"
          fullWidth
          variant="outlined"
          size="small"
          helperText="Encontre em: WhatsApp → API Setup → Phone number ID"
          value={form.phoneNumberId}
          onChange={e => setForm({ ...form, phoneNumberId: e.target.value })}
        />

        <TextField
          className={classes.field}
          label="WABA ID (WhatsApp Business Account ID)"
          placeholder="Ex: 987654321098765"
          fullWidth
          variant="outlined"
          size="small"
          helperText="Encontre em: WhatsApp → API Setup → WhatsApp Business Account ID"
          value={form.wabaId}
          onChange={e => setForm({ ...form, wabaId: e.target.value })}
        />

        <TextField
          className={classes.field}
          label="Access Token (permanente)"
          placeholder="EAAG..."
          fullWidth
          variant="outlined"
          size="small"
          type="password"
          helperText="Gere um token permanente em: Business Settings → System Users → Generate Token"
          value={form.tokenMeta}
          onChange={e => setForm({ ...form, tokenMeta: e.target.value })}
        />

        <Divider />
        <Typography className={classes.section}>Configuração do Webhook</Typography>

        <Typography className={classes.helpText}>
          Após salvar, configure o webhook no painel da Meta:
          <br />
          <strong>URL do Webhook:</strong>{" "}
          {window.location.origin.replace(":3000", ":8080")}/webhook/meta
          <br />
          <strong>Token de verificação:</strong> solutionzap_verify
          <br />
          <strong>Campos:</strong> messages (obrigatório)
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          disabled={!form.name || !form.phoneNumberId || !form.tokenMeta}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MetaConnectionModal;
