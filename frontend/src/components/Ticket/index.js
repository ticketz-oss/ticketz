import React, { useState, useEffect, useContext } from "react";
import { useParams, useHistory } from "react-router-dom";

import { toast } from "react-toastify";
import clsx from "clsx";

import { Paper, makeStyles } from "@material-ui/core";

import ContactDrawer from "../ContactDrawer";
import CompositorAtendimento from "../Conversa/CompositorAtendimento";
import PainelMensagens from "../Conversa/PainelMensagens";
import { BotaoIcone, useIdentidade } from "../interface";
import { Search, PanelRight, Hash, Headphones, Radio, X } from "lucide-react";
import { i18n } from "../../translate/i18n";
import "../Conversa/conversa.css";
import TicketHeader from "../TicketHeader";
import TicketInfo from "../TicketInfo";
import TicketActionButtons from "../TicketActionButtonsCustom";
import MessagesList from "../MessagesList";
import api from "../../services/api";
import { ReplyMessageProvider } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { EditMessageProvider } from "../../context/EditingMessage/EditingMessageContext";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

import { SocketContext } from "../../context/Socket/SocketContext";
import useSettings from "../../hooks/useSettings";
import useFecharConversaComEscape from "../../hooks/useFecharConversaComEscape";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    height: "100%",
    position: "relative",
    overflow: "hidden"
  },

  mainWrapper: {
    flex: 1,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderRadius: 16,
    border: `1px solid ${theme.palette.divider}`,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    })
  },

  mainWrapperShift: {
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    }),
    marginRight: 10
  },
  drawerShade: {
    display: "none",
    [theme.breakpoints.down(1400)]: {
      display: "block",
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backdropFilter: "blur(2px)",
      zIndex: 100
    }
  }
}));

const Ticket = () => {
  const { ticketId } = useParams();
  const history = useHistory();
  const fecharConversa = () => history.push("/tickets");
  useFecharConversaComEscape(fecharConversa, Boolean(ticketId));
  const classes = useStyles();

  const { user } = useContext(AuthContext);

  const [drawerOpen, setDrawerOpen] = useState(
    () => window.matchMedia("(min-width:1400px)").matches
  );
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState({});
  const [ticket, setTicket] = useState({});
  const [showTabGroups, setShowTabGroups] = useState(false);
  const identidade = useIdentidade();
  const [abaContexto, definirAbaContexto] = useState("contato");
  const [painel, definirPainel] = useState(null);
  const [mensagens, definirMensagens] = useState([]);
  const [versaoNotas, definirVersaoNotas] = useState(0);
  const abrirContexto = aba => {
    definirAbaContexto(aba);
    definirPainel(null);
    setDrawerOpen(true);
  };

  const { getSetting } = useSettings();

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    Promise.all([getSetting("CheckMsgIsGroup"), getSetting("groupsTab")]).then(
      ([ignoreGroups, groupsTab]) => {
        setShowTabGroups(
          user?.company?.whatsappMode !== "meta" &&
            ignoreGroups === "disabled" &&
            groupsTab === "enabled"
        );
      }
    );
  }, [user?.company?.whatsappMode]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchTicket = async () => {
        try {
          const { data } = await api.get("/tickets/u/" + ticketId);
          const { queueId } = data;
          const { queues, profile } = user;

          const queueAllowed = queues.find(q => q.id === queueId);
          if (
            queueAllowed === undefined &&
            profile !== "admin" &&
            !data.isGroup
          ) {
            toast.error("Acesso não permitido");
            history.push("/tickets");
            return;
          }

          setContact(data.contact);
          setTicket(data);
          setLoading(false);
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      };
      fetchTicket();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [ticketId, user, history]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");

    const socket = socketManager.GetSocket(companyId);

    const onConnectTicket = () => {
      socket.emit("joinChatBox", `${ticket.id}`);
    };

    socketManager.onConnect(onConnectTicket);

    const onCompanyTicket = data => {
      if (data.action === "update" && data.ticket.id === ticket.id) {
        setTicket(data.ticket);
      }

      if (data.action === "delete" && data.ticketId === ticket.id) {
        history.push("/tickets");
      }
    };

    const onCompanyContact = data => {
      if (data.action === "update") {
        setContact(prevState => {
          if (prevState.id === data.contact?.id) {
            return { ...prevState, ...data.contact };
          }
          return prevState;
        });
      }
    };

    socket.on(`company-${companyId}-ticket`, onCompanyTicket);
    socket.on(`company-${companyId}-contact`, onCompanyContact);

    return () => {
      socket.disconnect();
    };
  }, [ticketId, ticket, history, socketManager]);

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const renderTicketInfo = () => {
    if (ticket.user !== undefined) {
      return (
        <TicketInfo
          contact={contact}
          ticket={ticket}
          onClick={handleDrawerOpen}
        />
      );
    }
  };

  const renderMessagesList = () => {
    return (
      <>
        <MessagesList
          ticket={ticket}
          ticketId={ticket.id}
          isGroup={ticket.isGroup}
          markAsRead={true}
          aoAtualizarMensagens={definirMensagens}
        ></MessagesList>
        <CompositorAtendimento
          key={ticket.id}
          ticket={ticket}
          aoSalvarNota={() => definirVersaoNotas(v => v + 1)}
        />
      </>
    );
  };

  return (
    <div
      className={`${classes.root} ew-ui atendimento-conversa`}
      style={identidade}
      id="drawer-container"
    >
      <Paper
        variant="outlined"
        elevation={0}
        className={clsx(classes.mainWrapper, "conversa-painel", {
          [classes.mainWrapperShift]: drawerOpen
        })}
      >
        <div
          className={clsx({
            [classes.drawerShade]: drawerOpen
          })}
          onClick={() => setDrawerOpen(false)}
        ></div>
        <TicketHeader loading={loading}>
          {renderTicketInfo()}
          <div className="conversa-cabecalho-acoes">
            <BotaoIcone
              titulo={`${i18n.t("conversa.voltar")} (Esc)`}
              aria-keyshortcuts="Escape"
              onClick={fecharConversa}
            >
              <X size={18} />
            </BotaoIcone>
            <BotaoIcone
              titulo={i18n.t("conversa.pesquisa")}
              onClick={() => {
                definirPainel(painel === "pesquisa" ? null : "pesquisa");
                setDrawerOpen(false);
              }}
            >
              <Search size={18} />
            </BotaoIcone>
            <BotaoIcone
              titulo={i18n.t("contexto.titulo")}
              onClick={() => {
                definirPainel(null);
                setDrawerOpen(!drawerOpen);
              }}
            >
              <PanelRight size={18} />
            </BotaoIcone>
          </div>
        </TicketHeader>
        {!loading && (
          <div className="conversa-fatos">
            <span>
              <Hash size={12} />
              {ticket.id}
            </span>
            <span>
              <Headphones size={12} />
              {ticket.queue?.name || i18n.t("conversa.semFila")}
            </span>
            {ticket.whatsapp?.name && (
              <span>
                <Radio size={12} />
                {ticket.whatsapp.name}
              </span>
            )}
            {ticket.user?.name && <span>{ticket.user.name}</span>}
          </div>
        )}
        <div className="conversa-corpo">
          <div className="conversa-principal">
            <ReplyMessageProvider>
              <EditMessageProvider>
                {!loading && renderMessagesList()}
              </EditMessageProvider>
            </ReplyMessageProvider>
          </div>
          {!loading && (
            <TicketActionButtons
              lateral
              ticket={ticket}
              showTabGroups={showTabGroups}
              aoAbrirContexto={abrirContexto}
              aoAbrirArquivos={() => {
                definirPainel("arquivos");
                setDrawerOpen(false);
              }}
            />
          )}
        </div>
      </Paper>
      {painel && (
        <PainelMensagens
          key={`${ticket.id}-${painel}`}
          mensagens={mensagens}
          modo={painel}
          aoFechar={() => definirPainel(null)}
          aoSelecionar={id =>
            document
              .getElementById(String(id))
              ?.scrollIntoView({ behavior: "smooth", block: "center" })
          }
        />
      )}
      <ContactDrawer
        open={drawerOpen}
        handleDrawerClose={handleDrawerClose}
        contact={contact}
        loading={loading}
        ticket={ticket}
        aba={abaContexto}
        aoAlterarAba={definirAbaContexto}
        versaoNotas={versaoNotas}
      />
    </div>
  );
};

export default Ticket;
