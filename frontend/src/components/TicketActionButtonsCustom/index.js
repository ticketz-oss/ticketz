import React, { useContext, useState } from "react";
import { useHistory } from "react-router-dom";

import {
  makeStyles,
  createTheme,
  ThemeProvider
} from "@material-ui/core/styles";
import { IconButton } from "@material-ui/core";
import { MoreVert, Replay } from "@material-ui/icons";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import TicketOptionsMenu from "../TicketOptionsMenu";
import ButtonWithSpinner from "../ButtonWithSpinner";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import UndoRoundedIcon from "@material-ui/icons/UndoRounded";
import AddBoxIcon from "@material-ui/icons/AddBox";
import { Call, CallEnd } from "@material-ui/icons";
import Tooltip from "@material-ui/core/Tooltip";
import { green } from "@material-ui/core/colors";
import { PhoneCallContext } from "../../context/PhoneCall/PhoneCallContext";
import { wavoipAvailable, wavoipCall } from "../../helpers/wavoipCallManager";
import {
  ArrowRightLeft,
  CalendarClock,
  Tags,
  History,
  StickyNote,
  Files,
  Users,
  Printer
} from "../AnimatedIcon";
import { BotaoIcone } from "../interface";
import canReopenTicket from "./canReopenTicket";

const useStyles = makeStyles(theme => ({
  actionButtons: {
    marginRight: 6,
    flex: "none",
    alignSelf: "center",
    marginLeft: "auto",
    "& > *": {
      margin: theme.spacing(0.5)
    }
  }
}));

const TicketActionButtonsCustom = ({
  ticket,
  showTabGroups,
  lateral = false,
  aoAbrirContexto,
  aoAbrirArquivos
}) => {
  const classes = useStyles();
  const history = useHistory();
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const ticketOptionsMenuOpen = Boolean(anchorEl);
  const { user } = useContext(AuthContext);
  const { setCurrentTicket } = useContext(TicketsContext);
  const phoneContext = useContext(PhoneCallContext);
  const isGroupConversation =
    ticket.isGroup && ticket.contact?.groupMode !== "ticket";

  const customTheme = createTheme({
    palette: {
      primary: green
    }
  });

  const handleOpenTicketOptionsMenu = e => {
    setAnchorEl(e.currentTarget);
  };

  const handleCloseTicketOptionsMenu = e => {
    setAnchorEl(null);
  };

  const handleUpdateTicketStatus = async (e, status, userId) => {
    setLoading(true);
    try {
      await api.put(`/tickets/${ticket.id}`, {
        status: status,
        userId: userId || null
      });

      setLoading(false);
      if (status === "open") {
        setCurrentTicket({ ...ticket, code: "#open" });
      } else {
        setCurrentTicket({ id: null, code: null });
        history.push("/tickets");
      }
    } catch (err) {
      setLoading(false);
      toastError(err);
    }
  };

  const handleCall = async () => {
    wavoipCall(ticket, () => {
      phoneContext.disconnect();
    })
      .then(wavoipInstance => {
        phoneContext.updateCurrentCall({
          contact: ticket.contact,
          whatsapp: ticket.whatsapp,
          disconnect: () => {
            window.wavoipCallingSound.stop();
            wavoipInstance.endCall();
          }
        });
      })
      .catch(err => {
        toastError(err);
      });
  };

  return (
    <div className={lateral ? "conversa-acoes" : classes.actionButtons}>
      {ticket.status === "closed" && !isGroupConversation && (
        <>
          <Tooltip title={i18n.t("ticketsManager.buttons.newTicket")}>
            <IconButton
              onClick={() =>
                window.mentionClick({
                  contactId: ticket.contactId,
                  name: ticket.contact?.name,
                  number: ticket.contact?.number
                })
              }
            >
              <AddBoxIcon />
            </IconButton>
          </Tooltip>
          {canReopenTicket(user, ticket) && (
            <Tooltip title={i18n.t("messagesList.header.buttons.reopen")}>
              <IconButton
                onClick={e => handleUpdateTicketStatus(e, "open", user?.id)}
              >
                <Replay />
              </IconButton>
            </Tooltip>
          )}
        </>
      )}
      {(ticket.status === "open" || isGroupConversation) && (
        <>
          {!isGroupConversation &&
            wavoipAvailable() &&
            phoneContext &&
            !phoneContext.currentCall &&
            ticket.whatsapp?.wavoip?.token &&
            !ticket.contact.isGroup && (
              <Tooltip title={i18n.t("messagesList.header.buttons.call")}>
                <IconButton onClick={handleCall}>
                  <Call />
                </IconButton>
              </Tooltip>
            )}

          {wavoipAvailable() &&
            phoneContext &&
            phoneContext.currentCall &&
            phoneContext.currentCall.contact.id === ticket.contact.id &&
            phoneContext.currentCall.whatsapp.id === ticket.whatsapp.id && (
              <Tooltip title={i18n.t("messagesList.header.buttons.endCall")}>
                <IconButton onClick={phoneContext.disconnect}>
                  <CallEnd />
                </IconButton>
              </Tooltip>
            )}

          {!isGroupConversation && (
            <>
              <Tooltip title={i18n.t("messagesList.header.buttons.return")}>
                <IconButton
                  onClick={e => handleUpdateTicketStatus(e, "pending", null)}
                >
                  <UndoRoundedIcon />
                </IconButton>
              </Tooltip>
              <ThemeProvider theme={customTheme}>
                <Tooltip title={i18n.t("messagesList.header.buttons.resolve")}>
                  <IconButton
                    onClick={e =>
                      handleUpdateTicketStatus(e, "closed", user?.id)
                    }
                    color="primary"
                  >
                    <CheckCircleIcon />
                  </IconButton>
                </Tooltip>
              </ThemeProvider>
            </>
          )}

          <IconButton
            aria-label={i18n.t("conversa.maisAcoes")}
            onClick={handleOpenTicketOptionsMenu}
          >
            <MoreVert />
          </IconButton>
        </>
      )}
      {ticket.status === "pending" && !isGroupConversation && (
        <ButtonWithSpinner
          loading={loading}
          size="small"
          variant="contained"
          color="primary"
          onClick={e => handleUpdateTicketStatus(e, "open", user?.id)}
        >
          {i18n.t("messagesList.header.buttons.accept")}
        </ButtonWithSpinner>
      )}
      {ticket.contact && (
        <TicketOptionsMenu
          ticket={ticket}
          anchorEl={anchorEl}
          menuOpen={ticketOptionsMenuOpen}
          handleClose={handleCloseTicketOptionsMenu}
          showTabGroups={showTabGroups}
        >
          {lateral
            ? acoes => (
                <>
                  <span className="conversa-separador" />
                  {!isGroupConversation && (
                    <BotaoIcone
                      titulo={i18n.t("ticketOptionsMenu.transfer")}
                      onClick={acoes.transferir}
                    >
                      <ArrowRightLeft size={18} />
                    </BotaoIcone>
                  )}
                  {ticket.isGroup && (
                    <BotaoIcone
                      titulo={i18n.t("whatsappGroups.configure")}
                      onClick={acoes.configurarGrupo}
                    >
                      <Users size={18} />
                    </BotaoIcone>
                  )}
                  <BotaoIcone
                    titulo={i18n.t("conversa.etiquetas")}
                    onClick={() => aoAbrirContexto("atendimento")}
                  >
                    <Tags size={18} />
                  </BotaoIcone>
                  {!isGroupConversation && (
                    <BotaoIcone
                      titulo={i18n.t("conversa.notas")}
                      onClick={() => aoAbrirContexto("notas")}
                    >
                      <StickyNote size={18} />
                    </BotaoIcone>
                  )}
                  <span className="conversa-separador" />
                  <BotaoIcone
                    titulo={i18n.t("conversa.arquivos")}
                    onClick={aoAbrirArquivos}
                  >
                    <Files size={18} />
                  </BotaoIcone>
                  <BotaoIcone
                    titulo={i18n.t("contexto.historico")}
                    onClick={() => aoAbrirContexto("historico")}
                  >
                    <History size={18} />
                  </BotaoIcone>
                  {!ticket.isGroup && (
                    <BotaoIcone
                      titulo={i18n.t("ticketOptionsMenu.schedule")}
                      onClick={acoes.agendar}
                    >
                      <CalendarClock size={18} />
                    </BotaoIcone>
                  )}
                  <span className="conversa-separador" />
                  <BotaoIcone
                    titulo={i18n.t("conversa.imprimir")}
                    onClick={() => window.print()}
                  >
                    <Printer size={18} />
                  </BotaoIcone>
                </>
              )
            : null}
        </TicketOptionsMenu>
      )}
    </div>
  );
};

export default TicketActionButtonsCustom;
