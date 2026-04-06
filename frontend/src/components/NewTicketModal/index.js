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
import { Grid, ListItemText, MenuItem, Select, TextField, FormControl, InputLabel, Typography, Box, Chip } from "@material-ui/core";
import { toast } from "react-toastify";
import { ContactSelect } from "../ContactSelect";

const NewTicketModal = ({ modalOpen, onClose, contact }) => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [forcedContact, setForcedContact] = useState(null);
  const [selectedQueue, setSelectedQueue] = useState("");
  const [newContact, setNewContact] = useState({});
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openTickets, setOpenTickets] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (contact) {
      setForcedContact(contact);
      setSelectedContact(contact);
    }
  }, [contact]);

  useEffect(() => {
    setSelectedQueue("");
    setOpenTickets([]);
  }, [modalOpen]);

  useEffect(() => {
    const fetchOpenTickets = async () => {
      if (user.profile !== "admin") {
        setOpenTickets([]);
        return;
      }
      const contactId = selectedContact?.id;
      if (!contactId) {
        setOpenTickets([]);
        return;
      }
      try {
        const { data } = await api.get("/tickets", {
          params: {
            contactId,
            notClosed: true,
            showAll: true,
            all: true,
            queueIds: JSON.stringify([]),
          },
        });
        setOpenTickets(data.tickets || []);
      } catch (err) {
        setOpenTickets([]);
      }
    };
    fetchOpenTickets();
  }, [selectedContact, user.profile]);

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

  const handleTransferTicket = async (ticket) => {
    setLoading(true);
    try {
      await api.put(`/tickets/${ticket.id}`, {
        userId: user.id,
        status: "open",
      });
      onClose(ticket);
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  };

  const handleGoToTicket = (ticket) => {
    onClose(ticket);
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

  const getStatusLabel = (status) => {
    const labels = {
      open: i18n.t("tickets.tabs.open.title"),
      pending: i18n.t("ticketsList.pendingHeader"),
      closed: i18n.t("tickets.tabs.closed.title"),
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = { open: "#4caf50", pending: "#ff9800", closed: "#9e9e9e" };
    return colors[status] || "#9e9e9e";
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
            {user.profile === "admin" && openTickets.length > 0 && (
              <Grid xs={12} item>
                <Box style={{
                  border: "1px solid #ff9800",
                  borderRadius: 8,
                  padding: 12,
                  backgroundColor: "#fff8e1"
                }}>
                  <Typography variant="subtitle2" style={{ marginBottom: 8 }}>
                    {i18n.t("newTicketModal.openTicketsWarning") || "Este contato já possui ticket(s) aberto(s):"}
                  </Typography>
                  {openTickets.map((ticket) => (
                    <Box
                      key={ticket.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 6,
                        padding: "4px 0",
                      }}
                    >
                      <Box style={{ flex: 1 }}>
                        <Typography variant="body2">
                          #{ticket.id} -&nbsp;
                          <Chip
                            size="small"
                            label={getStatusLabel(ticket.status)}
                            style={{
                              backgroundColor: getStatusColor(ticket.status),
                              color: "white",
                              height: 20,
                            }}
                          />
                          {ticket.whatsapp && (
                            <span style={{ marginLeft: 8, fontSize: 12, color: "#1976d2" }}>
                              [{ticket.whatsapp.name}]
                            </span>
                          )}
                          {ticket.user && (
                            <span style={{ marginLeft: 8, fontSize: 12, color: "#666" }}>
                              ({ticket.user.name})
                            </span>
                          )}
                        </Typography>
                      </Box>
                      <Box>
                        {ticket.userId === user.id ? (
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => handleGoToTicket(ticket)}
                          >
                            {i18n.t("newTicketModal.buttons.goToTicket") || "Ir para ticket"}
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            disabled={loading}
                            onClick={() => handleTransferTicket(ticket)}
                          >
                            {i18n.t("newTicketModal.buttons.transfer") || "Transferir para mim"}
                          </Button>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Grid>
            )}
            <Grid xs={12} item>
              <FormControl fullWidth variant="outlined" margin="dense">
                <InputLabel id="queue-label">{i18n.t("common.queue")}</InputLabel>
                <Select
                  fullWidth
                  displayEmpty
                  variant="outlined"
                  margin="dense"
                  value={selectedQueue || ""}
                  label={i18n.t("common.queue")}
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
                    if (!selectedQueue) {
                      return
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
              </FormControl>
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
