import React, { useEffect, useMemo, useRef, useState } from "react";
import { useHistory } from "react-router-dom";

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  makeStyles
} from "@material-ui/core";
import Autocomplete, {
  createFilterOptions
} from "@material-ui/lab/Autocomplete";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import toastError from "../../errors/toastError";
import {
  filterTransferQueues,
  shouldShowConnectionSelection
} from "./transferOptions";

const useStyles = makeStyles(theme => ({
  field: {
    width: "100%",
    marginBottom: theme.spacing(2)
  },
  hint: {
    display: "block",
    marginTop: theme.spacing(0.5)
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    padding: theme.spacing(3)
  }
}));

const filterOptions = createFilterOptions({ trim: true });

const TransferTicketModalCustom = ({
  modalOpen,
  onClose,
  ticketid,
  hideUserSelection = false
}) => {
  const history = useHistory();
  const classes = useStyles();
  const isMounted = useRef(true);
  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [currentWhatsappId, setCurrentWhatsappId] = useState(null);
  const [selectedWhatsappId, setSelectedWhatsappId] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedQueue, setSelectedQueue] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!modalOpen || !ticketid) return;
    let active = true;

    const loadTransferOptions = async () => {
      setLoadingOptions(true);
      setConnections([]);
      setSelectedWhatsappId("");
      setSelectedQueue("");
      try {
        const { data } = await api.get(`/tickets/${ticketid}/transfer-options`);
        if (!active || !isMounted.current) return;

        setConnections(data.connections || []);
        setCurrentWhatsappId(data.currentWhatsappId);
        setSelectedWhatsappId(data.currentWhatsappId || "");
        setIsGroup(!!data.isGroup);
      } catch (err) {
        if (active) toastError(err);
      } finally {
        if (active && isMounted.current) setLoadingOptions(false);
      }
    };

    loadTransferOptions();

    return () => {
      active = false;
    };
  }, [modalOpen, ticketid]);

  useEffect(() => {
    if (hideUserSelection || !modalOpen || searchParam.length < 3) {
      setLoadingUsers(false);
      return undefined;
    }

    let active = true;

    const delayDebounceFn = setTimeout(async () => {
      setLoadingUsers(true);
      try {
        const { data } = await api.get("/users/", {
          params: { searchParam }
        });
        if (active && isMounted.current) setUsers(data.users);
      } catch (err) {
        if (active) toastError(err);
      } finally {
        if (active && isMounted.current) setLoadingUsers(false);
      }
    }, 500);

    return () => {
      active = false;
      clearTimeout(delayDebounceFn);
    };
  }, [searchParam, modalOpen, hideUserSelection]);

  const queues = useMemo(
    () => filterTransferQueues(connections, selectedWhatsappId, selectedUser),
    [connections, selectedWhatsappId, selectedUser]
  );

  const resetForm = () => {
    setSearchParam("");
    setSelectedUser(null);
    setSelectedQueue("");
    setConnections([]);
    setCurrentWhatsappId(null);
    setSelectedWhatsappId("");
    setIsGroup(false);
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const handleSaveTicket = async event => {
    event.preventDefault();
    if (!ticketid || !selectedQueue || !selectedWhatsappId) return;

    setSubmitting(true);
    try {
      const data = {
        queueId: selectedQueue,
        whatsappId: selectedWhatsappId
      };

      if (selectedUser?.id) {
        data.userId = selectedUser.id;
      } else {
        data.status = "pending";
        data.userId = null;
      }

      await api.put(`/tickets/${ticketid}`, data);
      resetForm();
      onClose();
      history.push("/tickets");
    } catch (err) {
      toastError(err);
    } finally {
      if (isMounted.current) setSubmitting(false);
    }
  };

  const showConnectionSelection = shouldShowConnectionSelection(
    connections,
    isGroup
  );

  return (
    <Dialog
      className="conversa-dialogo"
      open={modalOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <form onSubmit={handleSaveTicket}>
        <DialogTitle>{i18n.t("transferTicketModal.title")}</DialogTitle>
        <DialogContent dividers>
          {loadingOptions ? (
            <div className={classes.loading}>
              <CircularProgress size={28} />
            </div>
          ) : (
            <>
              {showConnectionSelection && (
                <FormControl
                  variant="outlined"
                  className={classes.field}
                  required
                >
                  <InputLabel>
                    {i18n.t("transferTicketModal.fieldConnectionLabel")}
                  </InputLabel>
                  <Select
                    value={selectedWhatsappId}
                    onChange={event => {
                      setSelectedWhatsappId(event.target.value);
                      setSelectedQueue("");
                    }}
                    label={i18n.t(
                      "transferTicketModal.fieldConnectionPlaceholder"
                    )}
                  >
                    {connections.map(connection => {
                      const unavailable =
                        connection.id !== currentWhatsappId &&
                        connection.status !== "CONNECTED";
                      return (
                        <MenuItem
                          key={connection.id}
                          value={connection.id}
                          disabled={unavailable}
                        >
                          {connection.name}
                          {unavailable
                            ? ` — ${i18n.t(
                                "transferTicketModal.connectionUnavailable"
                              )}`
                            : ""}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  <Typography
                    className={classes.hint}
                    variant="caption"
                    color="textSecondary"
                  >
                    {i18n.t("transferTicketModal.connectionHelp")}
                  </Typography>
                </FormControl>
              )}

              <FormControl
                variant="outlined"
                className={classes.field}
                required
              >
                <InputLabel>
                  {i18n.t("transferTicketModal.fieldQueueLabel")}
                </InputLabel>
                <Select
                  value={selectedQueue}
                  onChange={event => setSelectedQueue(event.target.value)}
                  label={i18n.t("transferTicketModal.fieldQueuePlaceholder")}
                >
                  {queues.map(queue => (
                    <MenuItem key={queue.id} value={queue.id}>
                      {queue.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {!hideUserSelection && (
                <Autocomplete
                  className={classes.field}
                  getOptionLabel={option => `${option.name}`}
                  onChange={(_event, newValue) => {
                    setSelectedUser(newValue);
                    const userQueueIds = newValue?.queues?.map(
                      queue => queue.id
                    );
                    if (
                      Array.isArray(userQueueIds) &&
                      !userQueueIds.includes(Number(selectedQueue))
                    ) {
                      setSelectedQueue("");
                    }
                  }}
                  options={users}
                  filterOptions={filterOptions}
                  freeSolo
                  autoHighlight
                  noOptionsText={i18n.t("transferTicketModal.noOptions")}
                  loading={loadingUsers}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label={i18n.t("transferTicketModal.fieldLabel")}
                      variant="outlined"
                      onChange={event => setSearchParam(event.target.value)}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingUsers ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClose}
            color="secondary"
            disabled={submitting}
            variant="outlined"
          >
            {i18n.t("transferTicketModal.buttons.cancel")}
          </Button>
          <ButtonWithSpinner
            variant="contained"
            type="submit"
            color="primary"
            loading={submitting}
            disabled={loadingOptions || !selectedQueue}
          >
            {i18n.t("transferTicketModal.buttons.ok")}
          </ButtonWithSpinner>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TransferTicketModalCustom;
