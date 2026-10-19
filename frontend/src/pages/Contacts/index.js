import StardewEmblem from "../../components/StardewEmblem";
import * as Tabs from "@radix-ui/react-tabs";
import {
  Users,
  UsersRound,
  Upload,
  Download,
  Plus,
  MessageCircle
} from "lucide-react";
import { Botao, useIdentidade } from "../../components/interface";
import React, { useState, useEffect, useReducer, useContext } from "react";

import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import api from "../../services/api";
import TabelaContatos from "./TabelaContatos";
import MenuAcoes from "../../components/interface/MenuAcoes";
import ContactModal from "../../components/ContactModal";
import ConfirmationModal from "../../components/ConfirmationModal/";

import { i18n } from "../../translate/i18n";
import MainHeader from "../../components/MainHeader";
import CabecalhoPagina from "../../components/CabecalhoPagina";
import MainContainer from "../../components/MainContainer";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import { isOfficialApiConnection } from "../../helpers/officialApiRestriction";

import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select
} from "@material-ui/core";

const reducer = (state, action) => {
  if (action.type === "LOAD_CONTACTS") {
    return action.payload;
  }

  if (action.type === "UPDATE_CONTACTS") {
    const contact = action.payload;
    const contactIndex = state.findIndex(c => c.id === contact.id);

    if (contactIndex !== -1) {
      state[contactIndex] = contact;
      return [...state];
    } else {
      return [contact, ...state];
    }
  }

  if (action.type === "DELETE_CONTACT") {
    const contactId = action.payload;

    const contactIndex = state.findIndex(c => c.id === contactId);
    if (contactIndex !== -1) {
      state.splice(contactIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useStyles = makeStyles(() => ({
  selectContainer: { width: "100%", textAlign: "left" }
}));

const Contacts = () => {
  const classes = useStyles();
  const history = useHistory();

  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam, setSearchParam] = useState("");
  const [segmento, setSegmento] = useState("contatos");
  const identidade = useIdentidade();
  const [contacts, dispatch] = useReducer(reducer, []);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [deletingContact, setDeletingContact] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [connections, setConnections] = useState([]);
  const [importConnectionId, setImportConnectionId] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [selecao, setSelecao] = useState({});
  const [atualizacao, setAtualizacao] = useState(0);

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    api.get("/whatsapp").then(({ data }) => {
      setConnections(data);
      data.forEach(connection => {
        if (
          connection.channel === "whatsapp" &&
          connection.isDefault &&
          !isOfficialApiConnection(connection)
        ) {
          setImportConnectionId(connection.id);
        }
      });
    });
  }, []);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam, segmento]);

  useEffect(() => {
    let ativo = true;
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchContacts = async () => {
        try {
          const { data } = await api.get("/contacts/", {
            params: { searchParam, pageNumber, isGroup: segmento === "grupos" }
          });
          if (!ativo) return;
          dispatch({ type: "LOAD_CONTACTS", payload: data.contacts });
          setHasMore(data.hasMore);
          setTotal(data.count ?? data.contacts.length);
          setLoading(false);
        } catch (err) {
          if (ativo) {
            toastError(err);
            setLoading(false);
          }
        }
      };
      fetchContacts();
    }, 500);
    return () => {
      ativo = false;
      clearTimeout(delayDebounceFn);
    };
  }, [searchParam, pageNumber, segmento, atualizacao]);

  useEffect(() => setSelecao({}), [searchParam, pageNumber, segmento]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);

    const onContact = data => {
      if (["update", "create", "delete"].includes(data.action)) {
        setAtualizacao(valor => valor + 1);
      }
    };

    socket.on(`company-${companyId}-contact`, onContact);

    return () => {
      socket.disconnect();
    };
  }, [socketManager]);

  const handleSearch = event => {
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

  const hadleEditContact = contactId => {
    setSelectedContactId(contactId);
    setContactModalOpen(true);
  };

  const handleDeleteContact = async contactId => {
    try {
      await api.delete(`/contacts/${contactId}`);
      toast.success(i18n.t("contacts.toasts.deleted"));
      setAtualizacao(valor => valor + 1);
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

  const importCsv = async () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".csv";
    fileInput.click();
    fileInput.onchange = async e => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("contacts", file);
      try {
        api
          .post("/contacts/importCsv", formData, {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          })
          .then(() => {
            toast.success(i18n.t("contacts.toasts.imported"));
          })
          .catch(err => {
            toastError(err);
          });
      } catch (err) {
        toastError(err);
      }
    };
  };

  const exportCsv = async () => {
    try {
      const { data } = await api.get("/contacts/exportCsv", {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "contacts.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <MainContainer
      className={`${classes.mainContainer} sv-operations sv-screen-contacts`}
    >
      <ContactModal
        open={contactModalOpen}
        onClose={handleCloseContactModal}
        aria-labelledby="form-dialog-title"
        contactId={selectedContactId}
      ></ContactModal>
      <ConfirmationModal
        title={`${i18n.t("contacts.confirmationModal.deleteTitle")} ${deletingContact?.name}?`}
        open={deleteConfirmOpen}
        onClose={setDeleteConfirmOpen}
        onConfirm={() => handleDeleteContact(deletingContact.id)}
      >
        {i18n.t("contacts.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <ConfirmationModal
        title={`${i18n.t("contacts.confirmationModal.importTitlte")}`}
        rawChildren
        okEnabled={importConnectionId}
        open={importConfirmOpen}
        onClose={setImportConfirmOpen}
        onConfirm={() => handleimportContact()}
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
                onChange={e => setImportConnectionId(e.target.value)}
              >
                <MenuItem value="">&nbsp;</MenuItem>
                {connections.map(
                  connection =>
                    connection.channel === "whatsapp" && (
                      <MenuItem
                        key={connection.id}
                        value={connection.id}
                        disabled={isOfficialApiConnection(connection)}
                        title={
                          isOfficialApiConnection(connection)
                            ? i18n.t(
                                "connections.toolTips.notAvailableOfficial"
                              )
                            : undefined
                        }
                      >
                        {connection.name}
                      </MenuItem>
                    )
                )}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </ConfirmationModal>
      <MainHeader>
        <StardewEmblem item="villager" />
        <CabecalhoPagina
          titulo={i18n.t("contacts.title")}
          descricao={i18n.t("visual.descricaoContatos")}
        />
        <div
          className="ew-ui"
          style={{ ...identidade, display: "flex", gap: 8 }}
        >
          {user?.profile === "admin" && (
            <MenuAcoes
              compacto={false}
              icone={Upload}
              rotulo={i18n.t("visual.importar")}
              itens={[
                {
                  rotulo: i18n.t("redesign.importarCsv"),
                  icone: Upload,
                  aoSelecionar: importCsv
                },
                {
                  rotulo: i18n.t("contacts.buttons.import"),
                  icone: MessageCircle,
                  aoSelecionar: () => setImportConfirmOpen(true)
                },
                {
                  rotulo: i18n.t("redesign.exportarCsv"),
                  icone: Download,
                  aoSelecionar: exportCsv
                }
              ]}
            />
          )}
          <Botao variante="primary" onClick={handleOpenContactModal}>
            <Plus size={16} />
            {i18n.t("visual.novoContato")}
          </Botao>
        </div>
      </MainHeader>
      <Tabs.Root
        value={segmento}
        onValueChange={setSegmento}
        className="ew-ui"
        style={identidade}
      >
        <Tabs.List
          className="ew-tabs"
          aria-label={i18n.t("contexto.segmentos")}
        >
          <Tabs.Trigger value="contatos" className="ew-tab">
            <Users size={15} />
            {i18n.t("contacts.title")}
            {segmento === "contatos" && (
              <span className="ew-badge ew-badge--brand">{total}</span>
            )}
          </Tabs.Trigger>
          <Tabs.Trigger value="grupos" className="ew-tab">
            <UsersRound size={15} />
            {i18n.t("contexto.grupos")}
            {segmento === "grupos" && <span className="ew-badge">{total}</span>}
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
      <TabelaContatos
        contatos={contacts}
        carregando={loading}
        total={total}
        pagina={pageNumber}
        proxima={hasMore}
        aoPaginar={setPageNumber}
        busca={searchParam}
        aoBuscar={handleSearch}
        aoAtualizar={() => setAtualizacao(valor => valor + 1)}
        selecao={selecao}
        aoSelecionar={setSelecao}
        editar={hadleEditContact}
        excluir={contact => {
          setDeletingContact(contact);
          setDeleteConfirmOpen(true);
        }}
        administrador={user.profile === "admin"}
      />
    </MainContainer>
  );
};

export default Contacts;
