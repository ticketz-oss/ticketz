import React, { useState, useEffect, useReducer, useContext } from "react";

import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Avatar from "@material-ui/core/Avatar";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";

import IconButton from "@material-ui/core/IconButton";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";

import api from "../../services/api";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ContactModal from "../../components/ContactModal";
import ConfirmationModal from "../../components/ConfirmationModal/";

import { i18n } from "../../translate/i18n";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import MainContainer from "../../components/MainContainer";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../../components/Can";
import NewTicketModal from "../../components/NewTicketModal";
import { SocketContext } from "../../context/Socket/SocketContext";
import { generateColor } from "../../helpers/colorGenerator";
import { getInitials } from "../../helpers/getInitials";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FormControl, Grid, InputLabel, MenuItem, Select, Tooltip } from "@material-ui/core";

const reducer = (state, action) => {
  if (action.type === "LOAD_CONTACTS") {
    const contacts = action.payload;
    const newContacts = [];

    contacts.forEach((contact) => {
      const contactIndex = state.findIndex((c) => c.id === contact.id);
      if (contactIndex !== -1) {
        state[contactIndex] = contact;
      } else {
        newContacts.push(contact);
      }
    });

    return [...state, ...newContacts];
  }

  if (action.type === "UPDATE_CONTACTS") {
    const contact = action.payload;
    const contactIndex = state.findIndex((c) => c.id === contact.id);

    if (contactIndex !== -1) {
      state[contactIndex] = contact;
      return [...state];
    } else {
      return [contact, ...state];
    }
  }

  if (action.type === "DELETE_CONTACT") {
    const contactId = action.payload;

    const contactIndex = state.findIndex((c) => c.id === contactId);
    if (contactIndex !== -1) {
      state.splice(contactIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  
  selectContainer: {
    width: "100%",
    textAlign: "left",
  },
  tagsdiv: {
    display: "flex",
    maxWidth: 350,
    flexWrap: "wrap",
  },
  tag: {
    marginTop: 3,
    borderRadius: 15,
    padding: "2px 15px",
    marginRight: 5,
    textWrapMode: "nowrap",
    maxWidth: 150,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  contactName: {
  }
}));

const Contacts = () => {
  const classes = useStyles();
  const history = useHistory();

  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam, setSearchParam] = useState("");
  const [contacts, dispatch] = useReducer(reducer, []);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [contactTicket, setContactTicket] = useState({});
  const [deletingContact, setDeletingContact] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [connections, setConnections] = useState([]);
  const [importConnectionId, setImportConnectionId] = useState("");
  const [hasMore, setHasMore] = useState(false);

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    api.get('/whatsapp').then(({ data }) => {
      setConnections(data);
      data.map((connection) => {
        if (connection.channel === "whatsapp" && connection.isDefault) {
          setImportConnectionId(connection.id);
        }
      });
    });
  }, []);
  
  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchContacts = async () => {
        try {
          const { data } = await api.get("/contacts/", {
            params: { searchParam, pageNumber },
          });
          dispatch({ type: "LOAD_CONTACTS", payload: data.contacts });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchContacts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);

    const onContact = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_CONTACTS", payload: data.contact });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_CONTACT", payload: +data.contactId });
      }
    }
    
    socket.on(`company-${companyId}-contact`, onContact);

    return () => {
      socket.disconnect();
    };
  }, [socketManager]);

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleOpenContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(false);
  };

  const handleCloseOrOpenTicket = (ticket) => {
    setNewTicketModalOpen(false);
    if (ticket !== undefined && ticket.uuid !== undefined) {
      history.push(`/tickets/${ticket.uuid}`);
    }
  };

  const hadleEditContact = (contactId) => {
    setSelectedContactId(contactId);
    setContactModalOpen(true);
  };

  const handleDeleteContact = async (contactId) => {
    try {
      await api.delete(`/contacts/${contactId}`);
      toast.success(i18n.t("contacts.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingContact(null);
    setSearchParam("");
    setPageNumber(1);
  };

  const handleimportContact = async () => {
    try {
      await api.post("/contacts/import", { whatsappId: importConnectionId });
      history.go(0);
    } catch (err) {
      toastError(err);
    }
  };

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };
  
  const importCsv = async () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".csv";
    fileInput.click();
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("contacts", file);
      try {
        api.post("/contacts/importCsv", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }).then(() => {
          toast.success(i18n.t("contacts.toasts.imported"));
        }).catch((err) => {
          toastError(err);
        });
      } catch (err) {
        toastError(err);
      }
    };
  }
  
  const exportCsv = async () => {
    try {
      const { data } = await api.get("/contacts/exportCsv", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "contacts.csv");
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      toastError(err);
    }
  }
  
  return (
    <MainContainer className={classes.mainContainer}>
      <NewTicketModal
        modalOpen={newTicketModalOpen}
        initialContact={contactTicket}
        onClose={(ticket) => {
          handleCloseOrOpenTicket(ticket);
        }}
      />
      <ContactModal
        open={contactModalOpen}
        onClose={handleCloseContactModal}
        aria-labelledby="form-dialog-title"
        contactId={selectedContactId}
      ></ContactModal>
      <ConfirmationModal
        title={
          `${i18n.t("contacts.confirmationModal.deleteTitle")} ${deletingContact?.name}?`
        }
        open={deleteConfirmOpen}
        onClose={setDeleteConfirmOpen}
        onConfirm={() =>
          handleDeleteContact(deletingContact.id)
        }
      >
        {i18n.t("contacts.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <ConfirmationModal
        title={`${i18n.t("contacts.confirmationModal.importTitlte")}`}
        rawChildren
        okEnabled={importConnectionId}
        open={importConfirmOpen}
        onClose={setImportConfirmOpen}
        onConfirm={() =>
          handleimportContact()
        }
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl
              className={classes.selectContainer}
              variant="outlined"
              margin="dense"
            >
              <InputLabel id="labelSelectWhatsapp">
                {i18n.t("common.connection")}
              </InputLabel>
              <Select
                labelId="labelSelectWhatsapp"
                label={i18n.t("common.connection")}
                name="whatsappId"
                value={importConnectionId || ""}
                onChange={(e) => setImportConnectionId(e.target.value)}
              >
                <MenuItem value="">&nbsp;</MenuItem>
                {connections.map((connection) => (
                  connection.channel === "whatsapp" &&
                  <MenuItem key={connection.id} value={connection.id}>
                    {connection.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </ConfirmationModal>
      <MainHeader>
        <Title>{i18n.t("contacts.title")}</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            placeholder={i18n.t("contacts.searchPlaceholder")}
            type="search"
            value={searchParam}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: "gray" }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => importCsv()}
          >
            &nbsp;<FontAwesomeIcon icon={faCloudArrowUp} />&nbsp;
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => exportCsv()}
          >
            &nbsp;<FontAwesomeIcon icon={faDownload} />&nbsp;
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setImportConfirmOpen(true)}
          >
            {i18n.t("contacts.buttons.import")}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenContactModal}
          >
            {i18n.t("contacts.buttons.add")}
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper
        className={classes.mainPaper}
        variant="outlined"
        onScroll={handleScroll}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell className={classes.contactName}>{i18n.t("contacts.table.name")}</TableCell>
              <TableCell align="center">
                {i18n.t("contacts.table.whatsapp")}
              </TableCell>
              <TableCell align="center">
                {i18n.t("contacts.table.email")}
              </TableCell>
              <TableCell align="center">
                {i18n.t("contacts.table.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell style={{ paddingRight: 0 }}>
                    {<Avatar style={{ backgroundColor: generateColor(contact?.number), fontWeight: "bold", color: "white" }} src={contact.profilePicUrl}>{getInitials(contact?.name)}</Avatar>}
                  </TableCell>
                  <TableCell className={classes.contactName}>
                    {contact.name}
                    <div className={classes.tagsdiv}>
                      {
                        contact.tags.map((tag) => (
                          <Tooltip title={tag.name} placement="top" arrow>
                            <div
                              key={tag.id}
                              className={classes.tag}
                              style={{
                                backgroundColor: tag.color
                              }}
                            >
                              {tag.name}
                            </div>
                          </Tooltip>
                        ))
                      }
                    </div>
                  </TableCell>
                  <TableCell align="center">{contact.number}</TableCell>
                  <TableCell align="center">{contact.email}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setContactTicket(contact);
                        setNewTicketModalOpen(true);
                      }}
                    >
                      <WhatsAppIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => hadleEditContact(contact.id)}
                    >
                      <EditIcon />
                    </IconButton>
                    <Can
                      role={user.profile}
                      perform="contacts-page:deleteContact"
                      yes={() => (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setDeleteConfirmOpen(true);
                            setDeletingContact(contact);
                          }}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      )}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {loading && <TableRowSkeleton avatar columns={3} />}
            </>
          </TableBody>
        </Table>
      </Paper>
    </MainContainer>
  );
};

export default Contacts;
