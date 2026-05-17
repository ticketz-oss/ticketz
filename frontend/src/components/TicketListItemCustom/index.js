import React, { useState, useEffect, useRef, useContext } from "react";

import { useHistory, useParams } from "react-router-dom";
import { parseISO, format, isSameDay } from "date-fns";
import clsx from "clsx";

import { makeStyles } from "@material-ui/core/styles";
import { green, grey, red, blue } from "@material-ui/core/colors";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import Typography from "@material-ui/core/Typography";
import Avatar from "@material-ui/core/Avatar";
import Divider from "@material-ui/core/Divider";
import Badge from "@material-ui/core/Badge";
import Box from "@material-ui/core/Box";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import WhatsMarked from "react-whatsmarked";
import { Tooltip } from "@material-ui/core";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import toastError from "../../errors/toastError";
import { v4 as uuidv4 } from "uuid";

import RoomIcon from "@material-ui/icons/Room";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import AndroidIcon from "@material-ui/icons/Android";
import VisibilityIcon from "@material-ui/icons/Visibility";
import TicketMessagesDialog from "../TicketMessagesDialog";
import DoneIcon from "@material-ui/icons/Done";
import ClearOutlinedIcon from "@material-ui/icons/ClearOutlined";
import { generateColor } from "../../helpers/colorGenerator";
import { getInitials } from "../../helpers/getInitials";
import pastRelativeDate from "../../helpers/pastRelativeDate";
import TagsLine from "../TagsLine";

const useStyles = makeStyles(theme => ({
  ticketContainer: {
    position: "relative"
  },
  ticket: {
    position: "relative",
    minHeight: 96,
    paddingHorizontal: 10,
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
    margin: theme.spacing(0.35, 0.75),
    borderRadius: 12,
    border: `1px solid ${theme.palette.backgroundContrast.border}`,
    backgroundColor: theme.palette.background.paper,
    transition: "background-color 160ms ease, border-color 160ms ease",
    "&:hover": {
      backgroundColor:
        theme.mode === "light" ? "rgba(255,122,0,0.06)" : "rgba(255,154,47,0.08)",
      borderColor:
        theme.mode === "light" ? "rgba(255,122,0,0.22)" : "rgba(255,154,47,0.24)"
    },
    "&.Mui-selected": {
      backgroundColor:
        theme.mode === "light" ? "rgba(255,122,0,0.14)" : "rgba(255,154,47,0.2)",
      borderColor:
        theme.mode === "light" ? "rgba(255,122,0,0.30)" : "rgba(255,154,47,0.3)"
    }
  },

  pendingTicket: {
    cursor: "unset"
  },

  noTicketsDiv: {
    display: "flex",
    height: "100px",
    margin: 40,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },

  noTicketsText: {
    textAlign: "center",
    color: "rgb(104, 121, 146)",
    fontSize: "14px",
    lineHeight: "1.4"
  },

  noTicketsTitle: {
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0px"
  },

  contactNameWrapper: {
    display: "grid",
    justifyContent: "space-between",
    width: "100%",
    gap: 2
  },

  contactName: {
    fontWeight: 600,
    letterSpacing: "-0.01em"
  },

  lastMessageTime: {
    justifySelf: "flex-end",
    textAlign: "right",
    position: "relative",
    top: -23,
    fontSize: 11,
    color: theme.palette.messageIcons,
    fontWeight: 500
  },

  closedBadge: {
    alignSelf: "center",
    justifySelf: "flex-end",
    marginRight: 32,
    marginLeft: "auto"
  },

  contactLastMessage: {
    fontSize: "0.8rem",
    color: theme.palette.messageIcons
  },

  avatar: {
    backgroundColor: props => generateColor(props?.contact?.number),
    color: "white",
    fontWeight: "bold",
    width: 44,
    height: 44,
    fontSize: "0.9rem"
  },

  newMessagesCount: {
    alignSelf: "center",
    marginRight: 0,
    marginLeft: "auto",
    top: -10,
    right: 10
  },

  badgeStyle: {
    color: "white",
    backgroundColor: green[500],
    right: 0,
    top: 10,
    fontWeight: 700
  },

  acceptButton: {
    position: "absolute",
    right: "108px"
  },

  ticketQueueColor: {
    flex: "none",
    width: "3px",
    height: "100%",
    position: "absolute",
    top: "0%",
    left: "0%",
    borderRadius: "10px 0 0 10px"
  },

  ticketInfo: {
    position: "relative",
    top: 0
  },

  ticketInfo1: {
    position: "relative",
    top: 40,
    right: 0
  },
  listItemText: {
    paddingBottom: 10
  },
  whatsAppIcon: {
    color: grey[700]
  },
  ticketInfoAction: {
    left: 73
  },
  badgePill: {
    height: 20,
    padding: "3px 8px",
    position: "inherit",
    borderRadius: 999,
    color: "white",
    top: -6,
    marginRight: 3,
    fontWeight: 700
  },
  closedStatusPill: {
    height: 22,
    padding: "3px 10px",
    borderRadius: 999,
    color: "white",
    top: -28,
    marginRight: 5,
    fontWeight: 700
  },
  actionIconBubble: {
    padding: 2,
    height: 23,
    width: 23,
    fontSize: 12,
    borderRadius: 50,
    position: "absolute",
    top: -8,
    color: "#fff",
    cursor: "pointer"
  },
  closeActionPrimary: {
    backgroundColor: red[700],
    right: 0
  },
  spyActionPrimary: {
    backgroundColor: blue[700],
    right: 28
  },
  closeActionPending: {
    backgroundColor: red[700],
    right: 48
  },
  acceptActionPending: {
    backgroundColor: green[700],
    right: 25
  },
  spyActionPending: {
    backgroundColor: blue[700],
    right: 0
  },
  closeActionSimple: {
    color: red[700],
    cursor: "pointer",
    marginRight: 5,
    right: 49,
    top: -8,
    position: "absolute"
  },
  chatbotIcon: {
    color: grey[700],
    marginRight: 5
  },
  Radiusdot: {
    "& .MuiBadge-badge": {
      borderRadius: 2,
      position: "inherit",
      height: 16,
      margin: 2,
      padding: 3,
      fontSize: 10
    },
    "& .MuiBadge-anchorOriginTopRightRectangle": {
      transform: "scale(1) translate(0%, -40%)"
    }
  },
  presence: {
    color: theme.mode === "light" ? "#16A34A" : "#86EFAC",
    fontWeight: "bold"
  }
}));

const TicketListItemCustom = ({ ticket, setTabOpen, groupActionButtons }) => {
  const classes = useStyles(ticket);
  const history = useHistory();
  const [ticketUser, setTicketUser] = useState(null);
  const [whatsAppName, setWhatsAppName] = useState(null);

  const [openTicketMessageDialog, setOpenTicketMessageDialog] = useState(false);
  const { ticketId } = useParams();
  const isMounted = useRef(true);
  const { setCurrentTicket } = useContext(TicketsContext);
  const { user } = useContext(AuthContext);
  const { profile } = user;

  useEffect(() => {
    if (ticket.userId && ticket.user) {
      setTicketUser(ticket.user.name);
    }

    if (ticket.whatsappId && ticket.whatsapp) {
      setWhatsAppName(ticket.whatsapp.name);
    }

    return () => {
      isMounted.current = false;
    };
  }, [ticket]);

  const handleCloseTicket = async id => {
    try {
      await api.put(`/tickets/${id}`, {
        status: "closed",
        justClose: true,
        userId: user?.id
      });
    } catch (err) {
      toastError(err);
    }
    history.push(`/tickets/`);
  };

  const handleAcceptTicket = async id => {
    try {
      await api.put(`/tickets/${id}`, {
        status: "open",
        userId: user?.id
      });
    } catch (err) {
      toastError(err);
    }

    history.push(`/tickets/${ticket.uuid}`);
    setTabOpen("open");
  };

  const handleSelectTicket = ticket => {
    const code = uuidv4();
    const { id, uuid } = ticket;
    setCurrentTicket({ id, uuid, code });
  };

  const renderTicketInfo = () => {
    if (ticketUser && ticket.status !== "pending") {
      return (
        <>
          <Badge
            className={classes.Radiusdot}
            badgeContent={`${ticketUser}`}
            //color="primary"
            style={{ ...classes.badgePill, backgroundColor: "#3498db" }}
          />

          {ticket.whatsappId && (
            <Badge
              className={classes.Radiusdot}
              badgeContent={`${whatsAppName}`}
              style={{ ...classes.badgePill, backgroundColor: "#7d79f2" }}
            />
          )}

          {ticket.queue?.name !== null && (
            <Badge
              className={classes.Radiusdot}
              style={{
                ...classes.badgePill,
                backgroundColor: ticket.queue?.color || "#7C7C7C"
              }}
              badgeContent={ticket.queue?.name || "Sem fila"}
              //color="primary"
            />
          )}
          {ticket.status === "open" && (
            <Tooltip title="Fechar Conversa">
              <ClearOutlinedIcon
                onClick={() => handleCloseTicket(ticket.id)}
                fontSize="small"
                className={clsx(
                  classes.actionIconBubble,
                  classes.closeActionPrimary
                )}
              />
            </Tooltip>
          )}
          {profile === "admin" && (
            <Tooltip title="Espiar Conversa">
              <VisibilityIcon
                onClick={e => {
                  e.stopPropagation();
                  setOpenTicketMessageDialog(true);
                }}
                fontSize="small"
                className={clsx(
                  classes.actionIconBubble,
                  classes.spyActionPrimary
                )}
              />
            </Tooltip>
          )}
          {ticket.chatbot && (
            <Tooltip title="Chatbot">
              <AndroidIcon fontSize="small" className={classes.chatbotIcon} />
            </Tooltip>
          )}
        </>
      );
    } else {
      return (
        <>
          {ticket.whatsappId && (
            <Badge
              className={classes.Radiusdot}
              badgeContent={`${whatsAppName}`}
              style={{ ...classes.badgePill, backgroundColor: "#7d79f2" }}
            />
          )}

          {ticket.queue?.name !== null && (
            <Badge
              className={classes.Radiusdot}
              style={{
                ...classes.badgePill,
                backgroundColor: ticket.queue?.color || "#7C7C7C",
                marginRight: 2
              }}
              badgeContent={ticket.queue?.name || "Sem fila"}
              //color=
            />
          )}
          {ticket.status === "pending" &&
            (groupActionButtons || !ticket.isGroup) && (
              <Tooltip title="Fechar Conversa">
                <ClearOutlinedIcon
                  onClick={() => handleCloseTicket(ticket.id)}
                  fontSize="small"
                  className={clsx(
                    classes.actionIconBubble,
                    classes.closeActionPending
                  )}
                />
              </Tooltip>
            )}
          {ticket.chatbot && (
            <Tooltip title="Chatbot">
              <AndroidIcon fontSize="small" className={classes.chatbotIcon} />
            </Tooltip>
          )}
          {ticket.status === "open" &&
            (groupActionButtons || !ticket.isGroup) && (
              <Tooltip title="Fechar Conversa">
                <ClearOutlinedIcon
                  onClick={() => handleCloseTicket(ticket.id)}
                  fontSize="small"
                  className={classes.closeActionSimple}
                />
              </Tooltip>
            )}
          {ticket.status === "pending" &&
            (groupActionButtons || !ticket.isGroup) && (
              <Tooltip title="Aceitar Conversa">
                <DoneIcon
                  onClick={() => handleAcceptTicket(ticket.id)}
                  fontSize="small"
                  className={clsx(
                    classes.actionIconBubble,
                    classes.acceptActionPending
                  )}
                />
              </Tooltip>
            )}

          {profile === "admin" && (groupActionButtons || !ticket.isGroup) && (
            <Tooltip title="Espiar Conversa">
              <VisibilityIcon
                onClick={e => {
                  e.stopPropagation();
                  setOpenTicketMessageDialog(true);
                }}
                fontSize="small"
                className={clsx(
                  classes.actionIconBubble,
                  classes.spyActionPending
                )}
              />
            </Tooltip>
          )}
        </>
      );
    }
  };

  return (
    <div key={`ticket-${ticket.id}`} className={classes.ticketContainer}>
      <TicketMessagesDialog
        open={openTicketMessageDialog}
        handleClose={() => setOpenTicketMessageDialog(false)}
        ticketId={ticket.id}
      ></TicketMessagesDialog>
      <ListItem
        dense
        button
        onClick={e => {
          if (
            (groupActionButtons || !ticket.isGroup) &&
            ticket.status === "pending"
          )
            return;
          handleSelectTicket(ticket);
        }}
        selected={ticketId && +ticketId === ticket.id}
        className={clsx(classes.ticket, {
          [classes.pendingTicket]: ticket.status === "pending"
        })}
      >
        <Tooltip
          arrow
          placement="right"
          title={ticket.queue?.name || "Sem fila"}
        >
          <span
            style={{ backgroundColor: ticket.queue?.color || "#7C7C7C" }}
            className={classes.ticketQueueColor}
          ></span>
        </Tooltip>
        <ListItemAvatar>
          <Avatar className={classes.avatar} src={ticket?.contact?.profilePicUrl}>
            {getInitials(ticket?.contact?.name || "")}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          className={classes.listItemText}
          disableTypography
          primary={
            <span className={classes.contactNameWrapper}>
              <Typography
                noWrap
                component="span"
                variant="body2"
                color="textPrimary"
                className={classes.contactName}
              >
                {ticket.channel === "whatsapp" && (
                  <Tooltip title={`Atribuido à ${ticketUser}`}>
                    <WhatsAppIcon
                      fontSize="inherit"
                      className={classes.whatsAppIcon}
                    />
                  </Tooltip>
                )}{" "}
                {ticket.contact.name}
              </Typography>
            </span>
          }
          secondary={
            <span className={classes.contactNameWrapper}>
              <Typography
                className={classes.contactLastMessage}
                noWrap
                component="span"
                variant="body2"
                color="textSecondary"
              >
                {["composing", "recording"].includes(ticket?.presence) ? (
                  <span className={classes.presence}>
                    {i18n.t(`presence.${ticket.presence}`)}
                  </span>
                ) : (
                  <>
                    {ticket.lastMessage?.includes("data:image/png;base64") ? (
                      <div>Localização</div>
                    ) : (
                      <WhatsMarked oneline>
                        {ticket.lastMessage.startsWith('{"ticketzvCard"')
                          ? "🪪"
                          : ticket.lastMessage.split("\n")[0]}
                      </WhatsMarked>
                    )}
                  </>
                )}
              </Typography>
              <TagsLine ticket={ticket} />
              <ListItemSecondaryAction className={classes.ticketInfoAction}>
                <Box className={classes.ticketInfo1}>{renderTicketInfo()}</Box>
              </ListItemSecondaryAction>
            </span>
          }
        />
        <ListItemSecondaryAction>
          {ticket.status === "closed" && (
            <Badge
              className={classes.Radiusdot}
              badgeContent={i18n.t("common.closed")}
              //color="primary"
              style={{
                ...classes.closedStatusPill,
                backgroundColor: ticket.queue?.color || "#ff0000",
              }}
            />
          )}

          {ticket.lastMessage && (
            <>
              <Typography
                className={classes.lastMessageTime}
                component="span"
                variant="body2"
                color="textSecondary"
              >
                {pastRelativeDate(parseISO(ticket.updatedAt))}
              </Typography>

              <Badge
                className={classes.newMessagesCount}
                badgeContent={
                  ticket.unreadMessages ? ticket.unreadMessages : null
                }
                classes={{
                  badge: classes.badgeStyle
                }}
              />
              <br />
            </>
          )}
        </ListItemSecondaryAction>
      </ListItem>
      <Divider variant="inset" component="li" />
    </div>
  );
};

export default TicketListItemCustom;
