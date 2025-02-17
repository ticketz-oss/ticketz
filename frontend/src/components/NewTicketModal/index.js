import React, { useState, useEffect, useContext } from "react";

import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";

import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Autocomplete, {
	createFilterOptions,
} from "@material-ui/lab/Autocomplete";
import CircularProgress from "@material-ui/core/CircularProgress";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import ContactModal from "../ContactModal";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { FormControl, Grid, InputLabel, ListItemText, MenuItem, Select, makeStyles } from "@material-ui/core";
import { toast } from "react-toastify";

const useStyles = makeStyles((theme) => ({
  selectContainer: {
    width: "100%",
    textAlign: "left",
  },
}));  

const filter = createFilterOptions({
	trim: true,
});

const NewTicketModal = ({ modalOpen, onClose, initialContact }) => {
  const classes = useStyles();

	const [options, setOptions] = useState([]);
	const [loading, setLoading] = useState(false);
	const [searchParam, setSearchParam] = useState("");
	const [selectedContact, setSelectedContact] = useState(null);
	const [selectedQueue, setSelectedQueue] = useState("");
	const [newContact, setNewContact] = useState({});
	const [contactModalOpen, setContactModalOpen] = useState(false);
	const { user } = useContext(AuthContext);
  
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState("");

  useEffect(() => {
    setConnections([]);
    setSelectedConnection('');
    setSelectedQueue('');
  }, [modalOpen]);
      
  useEffect(() => {
    if (selectedQueue) {
      const fetchConnections = async () => {
        try {
          const { data } = await api.get('/whatsapp', {
            params: { queueId: selectedQueue },
          });
          setConnections(data);
          if (data.length === 1) {
            setSelectedConnection(data[0].id);
            return;
          }

          if (data.length > 1) {
            const connection = data.find((c) => {
              return c.queues.find((q) => q.id === selectedQueue);
            });
            if (connection) {
              setSelectedConnection(connection.id);
              return;
            }
          }
          
          setSelectedConnection('');
                    
        } catch (err) {
          toastError(err);
        }
      };

      fetchConnections();
    }
  }, [selectedQueue]);

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

	const handleClose = () => {
		onClose();
		setSearchParam("");
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
			const queueId = selectedQueue || null;
			const whatsappId = selectedConnection || null;
			const { data: ticket } = await api.post("/tickets", {
				contactId: contactId,
				queueId,
				whatsappId,
				userId: user.id,
				status: "open",
			});
			onClose(ticket);
		} catch (err) {
			toastError(err);
		}
		setLoading(false);
	};

	const handleSelectOption = (e, newValue) => {
		if (newValue?.number) {
			setSelectedContact(newValue);
		} else if (newValue?.name) {
			setNewContact({ name: newValue.name });
			setContactModalOpen(true);
		}
	};

	const handleCloseContactModal = () => {
		setContactModalOpen(false);
	};

	const handleAddNewContactTicket = contact => {
    setOptions([contact]);
    setSelectedContact(contact);
	};

	const createAddContactOption = (filterOptions, params) => {
		const filtered = filter(filterOptions, params);

		if (params.inputValue !== "" && !loading && searchParam.length >= 3) {
			filtered.push({
				name: `${params.inputValue}`,
			});
		}

		return filtered;
	};

	const renderOption = option => {
		if (option.number) {
			return `${option.name} - ${option.number}`;
		} else {
			return `${i18n.t("newTicketModal.add")} ${option.name}`;
		}
	};

	const renderOptionLabel = option => {
		if (option.number) {
			return `${option.name} - ${option.number}`;
		} else {
			return `${option.name}`;
		}
	};

	const renderContactAutocomplete = () => {
		if (initialContact === undefined || initialContact.id === undefined) {
			return (
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
						filterOptions={createAddContactOption}
						onChange={(e, newValue) => handleSelectOption(e, newValue)}
						renderInput={params => (
							<TextField
								{...params}
								label={i18n.t("newTicketModal.fieldLabel")}
								autoFocus
								onChange={e => setSearchParam(e.target.value)}
								onKeyPress={e => {
									if (loading || !selectedContact) return;
									else if (e.key === "Enter") {
										handleSaveTicket(selectedContact.id);
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
			)
		}
		return null;
	}

	return (
		<>
			<ContactModal
				open={contactModalOpen}
				initialValues={newContact}
				onClose={handleCloseContactModal}
				onSave={handleAddNewContactTicket}
			></ContactModal>
			<Dialog open={modalOpen} onClose={handleClose}>
				<DialogTitle id="form-dialog-title">
					{i18n.t("newTicketModal.title")}
				</DialogTitle>
				<DialogContent dividers>
					<Grid style={{ width: 300 }} container spacing={2}>
						{renderContactAutocomplete()}
						<Grid xs={12} item>
              <FormControl className={classes.selectContainer}>
                <InputLabel id="queue-label">{i18n.t("newTicketModal.queue")}</InputLabel>
  							<Select
  								fullWidth
  								displayEmpty
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
  							>
                  {user.profile === "admin" &&
                    <MenuItem dense key="-1" value="0">
                      <ListItemText primary={i18n.t("newTicketModal.noQueue")} />
                    </MenuItem>
                  }
  								{user.queues?.length > 0 &&
  									user.queues.map((queue, key) => (
  										<MenuItem dense key={key} value={queue.id}>
  											<ListItemText primary={queue.name} />
  										</MenuItem>
  									))}
  							</Select>
							</FormControl>
						</Grid>
            {selectedQueue && <Grid xs={12} item>
              <FormControl className={classes.selectContainer}>
                <InputLabel id="connection-label">{i18n.t("newTicketModal.connection")}</InputLabel>
                <Select
                  fullWidth
                  displayEmpty
                  value={selectedConnection}
                  onChange={(e) => {
                    setSelectedConnection(e.target.value);
                  }}
                  MenuProps={{
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                    getContentAnchorEl: null,
                  }}
                >
                  {connections?.length > 0 &&
                    connections.map((connection, key) => (
                      <MenuItem dense key={key} value={connection.id}>
                        <ListItemText primary={connection.name} />
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            }
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
						onClick={() => handleSaveTicket(selectedContact.id)}
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
