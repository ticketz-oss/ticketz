import React, { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select
} from "@material-ui/core";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";

const GroupConfigModal = ({ open, onClose, ticket, onUpdated }) => {
  const [queues, setQueues] = useState([]);
  const [mode, setMode] = useState("conversation");
  const [queueIds, setQueueIds] = useState([]);
  const [serviceQueueId, setServiceQueueId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode(ticket.contact?.groupMode || ticket.groupMode || "conversation");
    setQueueIds(
      ticket.queueIds ||
        ticket.contact?.groupQueues?.map(groupQueue => groupQueue.queueId) ||
        []
    );
    setServiceQueueId(ticket.queueId || "");
    api
      .get("/queue")
      .then(({ data }) => setQueues(data))
      .catch(toastError);
  }, [open, ticket]);

  const save = async () => {
    if (!queueIds.length || (mode === "ticket" && !serviceQueueId)) return;
    const currentMode =
      ticket.contact?.groupMode || ticket.groupMode || "conversation";
    if (
      currentMode === "ticket" &&
      mode === "conversation" &&
      !window.confirm(i18n.t("whatsappGroups.confirmConversation"))
    ) {
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put(`/whatsapp-groups/${ticket.id}`, {
        mode,
        queueIds,
        serviceQueueId: mode === "ticket" ? serviceQueueId : undefined
      });
      onUpdated?.(data);
      onClose();
    } catch (error) {
      toastError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{i18n.t("whatsappGroups.configure")}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel>{i18n.t("whatsappGroups.mode")}</InputLabel>
          <Select value={mode} onChange={event => setMode(event.target.value)}>
            <MenuItem value="conversation">
              {i18n.t("whatsappGroups.conversation")}
            </MenuItem>
            <MenuItem value="ticket">
              {i18n.t("whatsappGroups.attendance")}
            </MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>{i18n.t("whatsappGroups.allowedQueues")}</InputLabel>
          <Select
            multiple
            value={queueIds}
            onChange={event => {
              const selectedQueueIds = event.target.value;
              setQueueIds(selectedQueueIds);
              if (!selectedQueueIds.includes(serviceQueueId)) {
                setServiceQueueId("");
              }
            }}
            renderValue={selected =>
              queues
                .filter(queue => selected.includes(queue.id))
                .map(queue => queue.name)
                .join(", ")
            }
          >
            {queues.map(queue => (
              <MenuItem key={queue.id} value={queue.id}>
                <Checkbox checked={queueIds.includes(queue.id)} />
                <ListItemText primary={queue.name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {mode === "ticket" && (
          <FormControl fullWidth margin="normal">
            <InputLabel>{i18n.t("whatsappGroups.serviceQueue")}</InputLabel>
            <Select
              value={serviceQueueId}
              onChange={event => setServiceQueueId(event.target.value)}
            >
              {queues
                .filter(queue => queueIds.includes(queue.id))
                .map(queue => (
                  <MenuItem key={queue.id} value={queue.id}>
                    {queue.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{i18n.t("whatsappGroups.cancel")}</Button>
        <Button
          color="primary"
          variant="contained"
          onClick={save}
          disabled={
            saving || !queueIds.length || (mode === "ticket" && !serviceQueueId)
          }
        >
          {i18n.t("whatsappGroups.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GroupConfigModal;
