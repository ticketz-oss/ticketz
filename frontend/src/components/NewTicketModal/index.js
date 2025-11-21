import React, { useState, useEffect, useContext } from "react";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import ContactModal from "../ContactModal";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Grid, ListItemText, MenuItem, Select, TextField } from "@material-ui/core";
import { toast } from "react-toastify";
import { ContactSelect } from "../ContactSelect";

const NewTicketModal = ({ modalOpen, onClose, contact }) => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [forcedContact, setForcedContact] = useState(null);
  const [selectedQueue, setSelectedQueue] = useState("");
  const [newContact, setNewContact] = useState({});
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (contact) {
      setForcedContact(contact);
      setSelectedContact(contact);
    }
  }, [contact]);
  
  useEffect(() => {
    setSelectedQueue("");
  }, [modalOpen]);
  
  const handleClose = () => {
    onClose();
    setSelectedContact(null);
  };

  const handleSaveTicket = async contactId => {
    if (!contactId) return;
    if (selectedQueue === "" && user.profile !== 'admin') {
      toast.error("Selecione uma fila");
      return;
    }
    setLoading(true);
    try {
      const queueId = selectedQueue !== "" ? selectedQueue : null;
      const { data: ticket } = await api.post("/tickets", {
        contactId: contactId,
        queueId,
        userId: user.id,
        status: "open",
      });
      onClose(ticket);
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  };

  const handleSelectedContact = contactId => {
    if (contactId) {
      setSelectedContact({ id: contactId });
    } else {
      setSelectedContact(null);
    }
  };

  const handleCreateContact = name => {
    setNewContact({ name });
    setContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setContactModalOpen(false);
  };

  const handleAddNewContactTicket = contact => {
    setSelectedContact(contact);
  };

  return (
    <>
      <ContactModal
        open={contactModalOpen}
        initialValues={newContact}
        onClose={handleCloseContactModal}
        onSave={handleAddNewContactTicket}
      />
      <Dialog open={modalOpen} onClose={handleClose}>
        <DialogTitle id="form-dialog-title">
          {i18n.t("newTicketModal.title")}
        </DialogTitle>
        <DialogContent dividers>
          <Grid style={{ width: 300 }} container spacing={2}>
            <Grid xs={12} item>
              {forcedContact ? (
                <TextField
                  label={i18n.t("common.contact")}
                  value={`${forcedContact.name} (${forcedContact.number})`}
                  variant="outlined"
                  fullWidth
                  disabled
                  margin="dense"
                />
              ) : (
                <ContactSelect
                  onSelected={handleSelectedContact}
                  allowCreate={true}
                  onCreateContact={handleCreateContact}
                />
              )}
            </Grid>
            <Grid xs={12} item>
              <Select
                fullWidth
                displayEmpty
                variant="outlined"
                margin="dense"
                value={selectedQueue}
                onChange={(e) => {
                  setSelectedQueue(e.target.value)
                }}
                MenuProps={{
                  anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "left",
                  },
                  transformOrigin: {
                    vertical: "top",
                    horizontal: "left",
                  },
                  getContentAnchorEl: null,
                }}
                renderValue={() => {
                  if (selectedQueue === "") {
                    return i18n.t("transferTicketModal.fieldQueuePlaceholder")
                  }
                  const queue = user.queues.find(q => q.id === selectedQueue)
                  return queue.name
                }}
              >
                {user.queues?.length > 0 &&
                  user.queues.map((queue, key) => (
                    <MenuItem dense key={key} value={queue.id}>
                      <ListItemText primary={queue.name} />
                    </MenuItem>
                  ))}
              </Select>
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
          <ButtonWithSpinner
            variant="contained"
            type="button"
            disabled={!selectedContact}
            onClick={() => handleSaveTicket(selectedContact?.id)}
            color="primary"
            loading={loading}
          >
            {i18n.t("newTicketModal.buttons.ok")}
          </ButtonWithSpinner>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NewTicketModal;
