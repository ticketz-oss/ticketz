import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, CircularProgress } from "@material-ui/core";
import { toast } from "react-toastify";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";

const WavoipModal = ({ open, onClose, whatsappId }) => {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (open && whatsappId) {
      const fetchToken = async () => {
        try {
          setLoading(true);
          const { data } = await api.get(`/wavoip/${whatsappId}`);
          setToken(data.token);
        } catch (err) {
          // If not found, clear token and continue
          setToken("");
        } finally {
          setLoading(false);
          setInitialLoad(false);
        }
      };
      fetchToken();
    }
  }, [open, whatsappId]);

  const handleSave = async () => {
    try {
      setLoading(true);
      // Upsert token via saveToken route
      const { data } = await api.post(`/wavoip/${whatsappId}`, { token });
      setToken(data.token);
      toast.success("Token saved successfully");
    } catch (err) {
      toast.error("Error saving token");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await api.delete(`/wavoip/${whatsappId}`);
      setToken("");
      toast.success("Token deleted successfully");
    } catch (err) {
      toast.error("Error deleting token");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setToken("");
    setInitialLoad(true);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Wavoip Token</DialogTitle>
      <DialogContent dividers>
        {loading && initialLoad ? (
          <CircularProgress />
        ) : (
          <TextField
            label="Token"
            value={token || ""}
            onChange={e => setToken(e.target.value)}
            fullWidth
            variant="outlined"
          />
        )}
      </DialogContent>
      <DialogActions>
        {token && (
          <Button onClick={handleDelete} color="secondary" disabled={loading}>
            { i18n.t("common.delete") }
          </Button>
        )}
        <Button onClick={handleSave} color="primary" disabled={loading}>
          {loading ? <CircularProgress size={24} /> :i18n.t("common.save") }
        </Button>
        <Button onClick={handleClose} variant="outlined" disabled={loading}>
        { i18n.t("common.close") }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WavoipModal;
