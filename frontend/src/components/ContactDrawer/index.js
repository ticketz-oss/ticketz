import * as Tabs from "@radix-ui/react-tabs";
import { UserRound, ClipboardList, History, StickyNote } from "lucide-react";
import { useIdentidade } from "../interface";
import HistoricoContato from "./HistoricoContato";
import "./contexto.css";
import React, { useEffect, useState } from "react";

import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import Drawer from "@material-ui/core/Drawer";
import Link from "@material-ui/core/Link";
import AvatarContato from "../AvatarContato";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import CircularProgress from "@material-ui/core/CircularProgress";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemText from "@material-ui/core/ListItemText";
import Chip from "@material-ui/core/Chip";

import { i18n } from "../../translate/i18n";
import {
  formatWhatsappContactName,
  formatWhatsappContactNumber
} from "../../helpers/formatWhatsappDisplay";

import ContactDrawerSkeleton from "../ContactDrawerSkeleton";
import WhatsMarked from "react-whatsmarked";
import { CardHeader } from "@material-ui/core";
import ContactModal from "../ContactModal";
import ExtraInfoDialog from "./ExtraInfoDialog";
import { TicketNotes } from "../TicketNotes";
import { corAvatar as generateColor } from "../../helpers/coresAvatar";
import { getInitials } from "../../helpers/getInitials";
import { TagsContainer } from "../TagsContainer";
import useSettings from "../../hooks/useSettings";
import api from "../../services/api";

const drawerWidth = 300;

const useStyles = makeStyles(theme => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    [theme.breakpoints.down(1400)]: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0
    }
  },

  drawerHidden: {
    display: "none"
  },

  drawerPaper: {
    width: drawerWidth,
    display: "flex",
    borderTop: `1px solid ${theme.palette.divider}`,
    borderRight: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
    borderRadius: 16,
    border: `1px solid ${theme.palette.divider}`
  },
  header: {
    display: "flex",
    borderBottom: `1px solid ${theme.palette.divider}`,
    alignItems: "center",
    padding: theme.spacing(0, 1),
    minHeight: "54px",
    justifyContent: "flex-start"
  },
  content: {
    display: "flex",
    minWidth: 0,
    flexDirection: "column",
    padding: "16px",
    height: "100%",
    overflowY: "scroll",
    overflowX: "hidden",
    ...theme.scrollbarStyles
  },

  contactAvatar: {
    margin: 15,
    width: 100,
    height: 100
  },

  contactHeader: {
    display: "flex",
    padding: 8,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    "& > *": {
      margin: 4
    }
  },

  contactDetails: {
    marginTop: 8,
    padding: 8,
    display: "flex",
    flexDirection: "column"
  },
  contactExtraInfo: {
    marginTop: 4,
    padding: 6
  },
  participants: {
    marginTop: 8,
    padding: 8
  },
  participantsHeader: {
    padding: theme.spacing(0, 1, 1)
  },
  participantItem: {
    borderTop: "1px solid rgba(0, 0, 0, 0.08)"
  },
  participantRole: {
    height: 22,
    fontSize: 11
  },
  participantsStatus: {
    display: "flex",
    justifyContent: "center",
    padding: theme.spacing(3),
    color: theme.palette.text.secondary
  }
}));

const ContactDrawer = ({
  open,
  handleDrawerClose,
  contact,
  ticket,
  loading,
  aba,
  aoAlterarAba,
  versaoNotas = 0
}) => {
  const classes = useStyles();
  const identidade = useIdentidade();
  const { getSetting } = useSettings();
  const formattedContactName = formatWhatsappContactName(contact, ticket);
  const isWhatsappGroup = !!ticket.isGroup;
  const isGroupConversation = ticket.isGroup && contact?.groupMode !== "ticket";

  const [modalOpen, setModalOpen] = useState(false);
  const [extraInfoOpen, setExtraInfoOpen] = useState(false);
  const [displayFields, setDisplayFields] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [tagsTicket, definirTagsTicket] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState(false);
  const [participantContactId, setParticipantContactId] = useState(null);

  useEffect(() => {
    setDisplayFields(contact?.extraInfo || []);
  }, [contact?.id, contact?.extraInfo]);

  useEffect(() => {
    getSetting("tagsMode").then(res => {
      setShowTags(["contact", "both"].includes(res));
      definirTagsTicket(["ticket", "both"].includes(res));
    });

    setOpenForm(false);
  }, [open, contact]);

  useEffect(() => {
    if (!open || !isWhatsappGroup || !ticket?.id) {
      setParticipants([]);
      setParticipantsError(false);
      return undefined;
    }

    let active = true;
    setParticipantsLoading(true);
    setParticipantsError(false);
    api
      .get(`/whatsapp-groups/${ticket.id}/participants`)
      .then(({ data }) => {
        if (active) setParticipants(data.participants || []);
      })
      .catch(() => {
        if (active) setParticipantsError(true);
      })
      .finally(() => {
        if (active) setParticipantsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, isWhatsappGroup, ticket?.id]);

  return (
    <>
      <Drawer
        className={open ? classes.drawer : classes.drawerHidden}
        variant="persistent"
        anchor="right"
        open={open}
        PaperProps={{
          className: "conversa-contato",
          style: { position: "absolute" }
        }}
        BackdropProps={{ style: { position: "absolute" } }}
        ModalProps={{
          container: document.getElementById("drawer-container"),
          style: { position: "absolute" }
        }}
        classes={{
          paper: classes.drawerPaper
        }}
      >
        <div className={`${classes.header} conversa-contato-cabecalho`}>
          <IconButton
            aria-label={i18n.t("fluxos.fechar")}
            onClick={handleDrawerClose}
            style={{ order: 2, marginLeft: "auto" }}
          >
            <CloseIcon />
          </IconButton>
          <Typography style={{ justifySelf: "center" }}>
            {i18n.t(
              isWhatsappGroup ? "contactDrawer.groupHeader" : "visual.contexto"
            )}
          </Typography>
        </div>
        {loading ? (
          <ContactDrawerSkeleton classes={classes} />
        ) : (
          <div className={`ew-ui ${classes.content}`} style={identidade}>
            <Tabs.Root
              value={aba}
              onValueChange={aoAlterarAba}
              defaultValue="contato"
              className="contexto-tabs"
            >
              <Tabs.List
                className="ew-tabs"
                aria-label={i18n.t("contexto.titulo")}
              >
                <Tabs.Trigger className="ew-tab" value="contato">
                  <UserRound size={14} />
                  {i18n.t("contexto.contato")}
                </Tabs.Trigger>
                <Tabs.Trigger className="ew-tab" value="atendimento">
                  <ClipboardList size={14} />
                  {i18n.t("contexto.atendimento")}
                </Tabs.Trigger>
                <Tabs.Trigger className="ew-tab" value="historico">
                  <History size={14} />
                  {i18n.t("contexto.historico")}
                </Tabs.Trigger>
                {!isGroupConversation && (
                  <Tabs.Trigger className="ew-tab" value="notas">
                    <StickyNote size={14} />
                    {i18n.t("conversa.notas")}
                  </Tabs.Trigger>
                )}
              </Tabs.List>
              <Tabs.Content value="contato">
                <div className={`${classes.contactHeader} contexto-perfil`}>
                  <CardHeader
                    onClick={() => {}}
                    style={{ cursor: "pointer", width: "100%", padding: 0 }}
                    titleTypographyProps={{ noWrap: true }}
                    subheaderTypographyProps={{ noWrap: true }}
                    avatar={
                      <AvatarContato
                        contact={contact}
                        preview
                        alt={formattedContactName}
                        style={{
                          width: 44,
                          height: 44,
                          backgroundColor: generateColor(contact?.number),
                          color: "white",
                          fontWeight: "bold"
                        }}
                      >
                        {getInitials(formattedContactName)}
                      </AvatarContato>
                    }
                    title={
                      <>
                        <Typography>{formattedContactName}</Typography>
                      </>
                    }
                    subheader={
                      <>
                        <Typography style={{ fontSize: 12 }}>
                          {formatWhatsappContactNumber(contact)}
                        </Typography>
                        <Typography style={{ fontSize: 12 }}>
                          <Link href={`mailto:${contact.email}`}>
                            {contact.email}
                          </Link>
                        </Typography>
                      </>
                    }
                  />
                </div>

                {!isGroupConversation && (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setExtraInfoOpen(true)}
                    style={{ fontSize: 12, marginTop: 8 }}
                  >
                    {i18n.t("contactDrawer.addExtraInfo", {
                      defaultValue: "Informações adicionais"
                    })}
                  </Button>
                )}
                {!isGroupConversation && (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setModalOpen(!openForm)}
                    style={{ fontSize: 12, marginTop: 8 }}
                  >
                    {i18n.t("contactDrawer.buttons.edit")}
                  </Button>
                )}
                <section className="contexto-grupo">
                  <h4>{i18n.t("conversa.cadastro")}</h4>
                  <dl className="contexto-cadastro">
                    <div>
                      <dt>{i18n.t("contactModal.form.number")}</dt>
                      <dd>{formatWhatsappContactNumber(contact) || "—"}</dd>
                    </div>
                    <div>
                      <dt>{i18n.t("contactModal.form.email")}</dt>
                      <dd>{contact.email || "—"}</dd>
                    </div>
                    {contact.createdAt && (
                      <div>
                        <dt>{i18n.t("conversa.cadastradoEm")}</dt>
                        <dd>
                          {new Date(contact.createdAt).toLocaleDateString(
                            i18n.language
                          )}
                        </dd>
                      </div>
                    )}
                  </dl>
                </section>
                {showTags && (
                  <section className="contexto-grupo">
                    <h4>{i18n.t("conversa.etiquetas")}</h4>
                    <TagsContainer contact={contact} />
                  </section>
                )}
                {displayFields.length > 0 && (
                  <div className={classes.contactExtraInfo}>
                    <Typography variant="subtitle1">
                      {i18n.t("contactModal.form.extraInfo")}
                    </Typography>
                    {displayFields.map(info => (
                      <WhatsMarked
                        key={info.id || info.name}
                      >{`*${info?.name}:* ${info?.value}`}</WhatsMarked>
                    ))}
                  </div>
                )}
                {isWhatsappGroup && (
                  <Paper
                    square
                    variant="outlined"
                    className={classes.participants}
                  >
                    <Typography
                      variant="subtitle1"
                      className={classes.participantsHeader}
                    >
                      {i18n.t("contactDrawer.participants")} (
                      {participants.length})
                    </Typography>
                    {participantsLoading ? (
                      <div className={classes.participantsStatus}>
                        <CircularProgress size={24} />
                      </div>
                    ) : participantsError ? (
                      <Typography className={classes.participantsStatus}>
                        {i18n.t("contactDrawer.participantsUnavailable")}
                      </Typography>
                    ) : (
                      <List disablePadding>
                        {participants.map(participant => (
                          <ListItem
                            className={classes.participantItem}
                            key={participant.id}
                            button={!!participant.contactId}
                            onClick={() => {
                              if (!participant.contactId) return;
                              setParticipantContactId(participant.contactId);
                              setModalOpen(true);
                            }}
                          >
                            <ListItemAvatar>
                              <AvatarContato
                                contact={{
                                  ...participant,
                                  id: participant.contactId
                                }}
                                style={{
                                  backgroundColor: generateColor(
                                    participant.number
                                  ),
                                  color: "white",
                                  fontWeight: "bold"
                                }}
                              >
                                {getInitials(participant.name)}
                              </AvatarContato>
                            </ListItemAvatar>
                            <ListItemText
                              primary={`${participant.name}${
                                participant.isMe
                                  ? ` (${i18n.t("contactDrawer.you")})`
                                  : ""
                              }`}
                              secondary={formatWhatsappContactNumber(
                                participant
                              )}
                            />
                            {participant.admin && (
                              <Chip
                                className={classes.participantRole}
                                variant="outlined"
                                color="primary"
                                label={i18n.t(
                                  participant.admin === "superadmin"
                                    ? "contactDrawer.owner"
                                    : "contactDrawer.admin"
                                )}
                              />
                            )}
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Paper>
                )}
              </Tabs.Content>
              <Tabs.Content value="atendimento">
                <dl className="contexto-dados">
                  <div>
                    <dt>{i18n.t("contexto.protocolo")}</dt>
                    <dd>#{ticket.id}</dd>
                  </div>
                  <div>
                    <dt>{i18n.t("contexto.responsavel")}</dt>
                    <dd>{ticket.user?.name || "—"}</dd>
                  </div>
                  <div>
                    <dt>{i18n.t("contexto.fila")}</dt>
                    <dd>{ticket.queue?.name || "—"}</dd>
                  </div>
                  <div>
                    <dt>{i18n.t("conversa.conexao")}</dt>
                    <dd>{ticket.whatsapp?.name || "—"}</dd>
                  </div>
                  <div>
                    <dt>{i18n.t("conversa.abertoEm")}</dt>
                    <dd>
                      {ticket.createdAt
                        ? new Date(ticket.createdAt).toLocaleString(
                            i18n.language
                          )
                        : "—"}
                    </dd>
                  </div>
                </dl>
                {(tagsTicket || showTags) && (
                  <section className="contexto-grupo">
                    <h4>{i18n.t("conversa.etiquetas")}</h4>
                    <TagsContainer
                      ticket={tagsTicket && ticket}
                      contact={!tagsTicket && contact}
                    />
                  </section>
                )}
              </Tabs.Content>
              <Tabs.Content value="historico">
                <HistoricoContato contactId={contact.id} ticketId={ticket.id} />
              </Tabs.Content>
              {!isGroupConversation && (
                <Tabs.Content value="notas">
                  <Paper
                    square
                    variant="outlined"
                    className={classes.contactDetails}
                  >
                    <Typography
                      variant="subtitle1"
                      style={{ marginBottom: 10 }}
                    >
                      {i18n.t("conversa.notas")}
                    </Typography>
                    <TicketNotes
                      key={`${ticket.id}-${versaoNotas}`}
                      ticket={ticket}
                      contactWide
                    />
                  </Paper>
                </Tabs.Content>
              )}
            </Tabs.Root>
            <ContactModal
              open={modalOpen}
              onClose={() => {
                setModalOpen(false);
                setParticipantContactId(null);
              }}
              contactId={participantContactId || contact.id}
            ></ContactModal>
            <ExtraInfoDialog
              open={extraInfoOpen}
              onClose={() => setExtraInfoOpen(false)}
              contact={contact}
              onSave={updated => setDisplayFields(updated.extraInfo || [])}
            />
          </div>
        )}
      </Drawer>
    </>
  );
};

export default ContactDrawer;
