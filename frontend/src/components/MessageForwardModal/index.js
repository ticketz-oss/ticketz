import React, { useState, useEffect, useContext } from "react";

import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Autocomplete, { createFilterOptions } from "@material-ui/lab/Autocomplete";
import CircularProgress from "@material-ui/core/CircularProgress";
import { Grid } from "@material-ui/core";
import { toast } from "react-toastify";

import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";

const filter = createFilterOptions({
  trim: true,
});

const MessageForwardModal = ({ modalOpen, onClose, ticketId, messageId, initialContact }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [queues, setQueues] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (initialContact?.id !== undefined) {
      setOptions([initialContact]);
      setSelectedContact(initialContact);
    }
  }, [initialContact]);

  useEffect(() => {
    if (!modalOpen || searchParam.length < 3) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchContacts = async () => {
        try {
          const { data } = await api.get("contacts", {
            params: { searchParam },
          });
          setOptions(data.contacts);
          setLoading(false);
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      };

      fetchContacts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, modalOpen]);

  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const { data } = await api.get("/queue");
        setQueues(data);
      } catch (err) {
        toastError(err);
      }
    };

    fetchQueues();
  }, []);

  const handleClose = () => {
    onClose();
    setSearchParam("");
    setSelectedContact(null);
    setSelectedQueue(null);
  };

  const handleForwardMessage = async (contactId, queueId) => {
    if (!contactId || !queueId) return;
    setLoading(true);
    try {
      await api.post("/messages/forward", {
        contactId: selectedContact.id,
        ticketId,
        messageId,
        queueId: selectedQueue.id
      });

      onClose();
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  };

  const handleSelectOption = (e, newValue) => {
    if (newValue?.number) {
      setSelectedContact(newValue);
    }
  };

  const renderOption = option => {
    if (option.number) {
      return `${option.name} - ${option.number}`;
    } else {
      return `${option.name}`;
    }
  };

  const renderOptionLabel = option => {
    if (option.number) {
      return `${option.name} - ${option.number}`;
    } else {
      return `${option.name}`;
    }
  };

  return (
    <Dialog open={modalOpen} onClose={handleClose}>
      <DialogTitle id="form-dialog-title">{i18n.t("messageOptionsMenu.forward")}</DialogTitle>
      <DialogContent dividers>
        <Grid style={{ width: 300 }} container spacing={2}>
          <Grid xs={12} item>
            <Autocomplete
              fullWidth
              options={options}
              loading={loading}
              clearOnBlur
              autoHighlight
              freeSolo
              clearOnEscape
              getOptionLabel={renderOptionLabel}
              renderOption={renderOption}
              filterOptions={filter}
              onChange={(e, newValue) => handleSelectOption(e, newValue)}
              renderInput={params => (
                <TextField
                  {...params}
                  label={i18n.t("newTicketModal.fieldLabel")}
                  variant="outlined"
                  autoFocus
                  onChange={e => setSearchParam(e.target.value)}
                  onKeyPress={e => {
                    if (loading || !selectedContact || !selectedQueue) return;
                    else if (e.key === "Enter") {
                      handleForwardMessage(selectedContact.id, selectedQueue.id);
                    }
                  }}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {loading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
            />
          </Grid>
          <Grid xs={12} item>
            <Autocomplete
              fullWidth
              options={queues}
              getOptionLabel={option => option.name}
              onChange={(e, newValue) => setSelectedQueue(newValue)}
              renderInput={params => (
                <TextField
                  {...params}
                  label={i18n.t("transferTicketModal.fieldQueuePlaceholder")}
                  variant="outlined"
                />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          color="secondary"
          disabled={loading}
          variant="outlined"
        >
          {i18n.t("newTicketModal.buttons.cancel")}
        </Button>
        <Button
          variant="contained"
          type="button"
          disabled={!selectedContact || !selectedQueue}
          onClick={() => handleForwardMessage(selectedContact.id, selectedQueue.id)}
          color="primary"
          loading={loading}
        >
          {i18n.t("messageOptionsMenu.forward")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MessageForwardModal;
