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

import RoomIcon from '@material-ui/icons/Room';
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import AndroidIcon from "@material-ui/icons/Android";
import VisibilityIcon from "@material-ui/icons/Visibility";
import TicketMessagesDialog from "../TicketMessagesDialog";
import DoneIcon from '@material-ui/icons/Done';
import ClearOutlinedIcon from '@material-ui/icons/ClearOutlined';
import PersonIcon from '@material-ui/icons/Person';
import SyncAltIcon from '@material-ui/icons/SyncAlt';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import { generateColor } from "../../helpers/colorGenerator";
import { getInitials } from "../../helpers/getInitials";
import { isMobile } from "../../helpers/isMobile";
import pastRelativeDate from "../../helpers/pastRelativeDate";
import TagsLine from "../TagsLine";
import useSettings from "../../hooks/useSettings";

const useStyles = makeStyles((theme) => ({
  ticket: {
    position: "relative",
    height: 98,
    paddingLeft: "20px",
    paddingHorizontal: 10,
    paddingVertical: 0
  },

  pendingTicket: {
    cursor: "unset",
  },

  noTicketsDiv: {
    display: "flex",
    height: "100px",
    margin: 40,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  noTicketsText: {
    textAlign: "center",
    color: "rgb(104, 121, 146)",
    fontSize: "14px",
    lineHeight: "1.4",
  },

  noTicketsTitle: {
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0px",
  },

  contactNameWrapper: {
    display: "grid",
    justifyContent: "space-between",
  },

  lastMessageTime: {
    justifySelf: "flex-end",
    textAlign: "right",
    position: "relative",
    fontSize: 12
  },

  closedBadge: {
    alignSelf: "center",
    justifySelf: "flex-end",
    marginRight: 32,
    marginLeft: "auto",
  },

  contactLastMessage: {
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
    top: 10
  },

  acceptButton: {
    position: "absolute",
    right: "108px",
  },

  ticketQueueColor: {
    flex: "none",
    width: "92px",
    height: "15px",
    position: "absolute",
    left: "-37px",
    top: "40px",
    textAlign: "center",
    color: "#fff",
    padding: "0px",
    fontSize: "10px",
    fontWeight: "bold",
    transform: "rotate(-90deg)",
    borderRadius: "6px",
    marginTop: "3px",
    marginBottom: "3px",
    overflow: "hidden",
  },
  
  avatar: {
    width: 44,
    minWidth: "unset",
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
  Radiusdot: {

    "& .MuiBadge-badge": {
      borderRadius: 2,
      position: "inherit",
      height: 16,
      margin: 2,
      padding: 3,
      fontSize: 10,
    },
    "& .MuiBadge-anchorOriginTopRightRectangle": {
      transform: "scale(1) translate(0%, -40%)",
    },
  },
  presence: {
    color: theme.mode === 'light' ? "green" : "lightgreen",
    fontWeight: "bold",
  },
  userAndConnection: {
    height: 18,
    padding: 5,
    position: "inherit",
    borderRadius: 7,
    fontSize: 12,
    fontWeight: "bold",
    top: -6,
    marginRight: 3,
    maxWidth: "45%",
    display: "inline-block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  ticketActions: {
    position: "absolute",
    right: -12,
    bottom: 0,
    marginBottom: 6,
    display: "flex",
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: 22,
    padding: 4,
    minWidth: 23,
    cursor: "default",
    transition: "max-width 0.5s ease",
    overflow: "hidden",
    backgroundColor: theme.palette.background.paper,
  },
  actionButton: {
    padding: 2,
    marginLeft: 3,
    marginRight: 6,
    height: 35,
    width: 35,
    fontSize: 12,
    cursor: "pointer",
    borderRadius: 50,
  },
}));

const TicketListItemCustom = ({ ticket, setTabOpen, groupActionButtons }) => {
  const classes = useStyles();
  const history = useHistory();
  const [ticketUser, setTicketUser] = useState(null);
  const [whatsAppName, setWhatsAppName] = useState(null);
  const [allowClose, setAllowClose] = useState(false);
  const [desktopActionIconZoom, setDesktopActionIconZoom] = useState(0.8);

  const [openTicketMessageDialog, setOpenTicketMessageDialog] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const { ticketId } = useParams();
  const isMounted = useRef(true);
  const { setCurrentTicket } = useContext(TicketsContext);
  const { user } = useContext(AuthContext);
  const { profile } = user;
  const { getCachedSetting } = useSettings();
  
  useEffect(() => {
    getCachedSetting("allowSilentlyClose", "enabled").then((res) => {
      setAllowClose(user.profile === "admin" || res === "enabled");
    });
    getCachedSetting("desktopActionIconZoom", "0.6").then((res) => {
      setDesktopActionIconZoom(parseFloat(res));
    });
  }, [getCachedSetting, user.profile]);

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

  const handleCloseTicket = async (id) => {
    try {
      await api.put(`/tickets/${id}`, {
        status: "closed",
        justClose: true,
        userId: user?.id,
      });
    } catch (err) {
      toastError(err);
    }
    history.push(`/tickets/`);
  };

  const handleAcceptTicket = async (id) => {
    try {
      await api.put(`/tickets/${id}`, {
        status: "open",
        userId: user?.id,
      });
    } catch (err) {
      toastError(err);
    }

    history.push(`/tickets/${ticket.uuid}`);
    setTabOpen("open");
  };

  const handleSelectTicket = (ticket) => {
    const code = uuidv4();
    const { id, uuid } = ticket;
    setCurrentTicket({ id, uuid, code });
  };


  const renderTicketActions = () => {
    return (
      <div
        className={classes.ticketActions}
        style={{
           maxWidth: showActions ? "200px" : "44px",
           zoom: !isMobile() ? desktopActionIconZoom || 0.8 : 1
         }}
        onMouseOver={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onClick={(e) => e.stopPropagation()}
      >
        { showActions && (
          <>
        {["open","pending"].includes(ticket.status) && (groupActionButtons || !ticket.isGroup) && allowClose && (
          <Tooltip title="Fechar Conversa">
            <ClearOutlinedIcon
              onClick={() => handleCloseTicket(ticket.id)}
              fontSize="small"
              className={classes.actionButton}
              style={{
                color: '#fff',
                backgroundColor: red[700],
              }}
            />
          </Tooltip>
        )}
        {profile === "admin" && (
          <Tooltip title="Espiar Conversa">
            <VisibilityIcon
              onClick={(e) => {
                e.stopPropagation();
                setOpenTicketMessageDialog(true)
              }}
              fontSize="small"
              className={classes.actionButton}
              style={{
                color: '#fff',
                backgroundColor: blue[700],
              }}
            />
          </Tooltip>
        )}
        {ticket.status === "pending" && (groupActionButtons || !ticket.isGroup) && (
          <Tooltip title="Aceitar Conversa">
            <DoneIcon
              onClick={() => handleAcceptTicket(ticket.id)}
              fontSize="small"
              className={classes.actionButton}
              style={{
                color: '#fff',
                backgroundColor: green[700],
              }}
            />
          </Tooltip>
        )}
          <span style={{
              width: 26,
            }}></span>
          <span
          onClick={(e) => e.stopPropagation()} 
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: 38,
            height: 43,
             }}></span>
        </>
        )}

        {!showActions &&
          <Tooltip title="Ações">
            <MoreHorizIcon
              onClick={(e) => { e.stopPropagation(); setShowActions(true) } }
              fontSize="small"
              style={{
                color: '#888',
                cursor: "pointer",
                //margin: '0 5 0 5',
                padding: 2,
                height: 35,
                width: 35,
                fontSize: 18,
                borderRadius: 50,
              }}
            />
          </Tooltip>
        }
      </div>
    );
  }

  const renderTicketInfo = () => {
    if (ticketUser && ticket.status !== "pending") {
      return (
        <>
          <span className={classes.userAndConnection}>
            <PersonIcon style={{ height: 14, marginBottom: -2, width: 14 }} />
            {ticketUser}
          </span>

          {ticket.whatsappId && (
            <span className={classes.userAndConnection}>
              <SyncAltIcon style={{ height: 14, marginBottom: -2, width: 14 }} />
              {whatsAppName}
            </span>
          )}

          {ticket.chatbot && (
            <Tooltip title="Chatbot">
              <AndroidIcon
                fontSize="small"
                style={{ color: grey[700], marginRight: 5 }}
              />
            </Tooltip>
          )}

          {renderTicketActions()}

        </>
      );
    } else {
      return (
        <>

          {ticket.whatsappId && (
            <span className={classes.userAndConnection}>
              <SyncAltIcon style={{ height: 14, marginBottom: -2, width: 14 }} />
              {whatsAppName}
            </span>
          )}

          {ticket.chatbot && (
            <Tooltip title="Chatbot">
              <AndroidIcon
                fontSize="small"
                style={{ color: grey[700], marginRight: 5 }}
              />
            </Tooltip>
          )}
          
          {renderTicketActions()}
        </>
      );
    }
  };


  return (
    <React.Fragment key={ticket.id}>
      <TicketMessagesDialog
        open={openTicketMessageDialog}
        handleClose={() => setOpenTicketMessageDialog(false)}
        ticketId={ticket.id}
      ></TicketMessagesDialog>
      <ListItem
        dense
        button
        onClick={(e) => {
          if ((groupActionButtons || !ticket.isGroup) && ticket.status === "pending") return;
          handleSelectTicket(ticket);
        }}
        selected={ticketId && +ticketId === ticket.id}
        className={clsx(classes.ticket, {
          [classes.pendingTicket]: ticket.status === "pending",
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
          >{ticket.queue?.name || "Sem fila"}</span>
        </Tooltip>
        <ListItemAvatar className={classes.avatar}>
          <Avatar style={{ backgroundColor: generateColor(ticket?.contact?.number), color: "white", fontWeight: "bold" }} src={ticket?.contact?.profilePicUrl}>{ getInitials(ticket?.contact?.name || "") }</Avatar>
        </ListItemAvatar>
        <ListItemText
          disableTypography
          primary={
            <span className={classes.contactNameWrapper}>

              <Typography
                noWrap
                component="span"
                variant="body2"
                color="textPrimary"
              >
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
                  {ticket.lastMessage?.includes('data:image/png;base64') ? <div>Localização</div> : <WhatsMarked oneline>{ticket.lastMessage.startsWith('{"ticketzvCard"') ? "🪪" : ticket.lastMessage.split("\n")[0] }</WhatsMarked>}
                </>
              )}
              </Typography>
              <TagsLine ticket={ticket} />
              <ListItemSecondaryAction style={{ left: 57 }}>
                <Box className={classes.ticketInfo1}>{renderTicketInfo()}</Box>
              </ListItemSecondaryAction>
            </span>

          }
        />
        <ListItemSecondaryAction style={{ pointerEvents: "none", textAlign: 'right', right: 4, height: "100%", display: "block" }}>
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

              { !!ticket.unreadMessages && (
              <>
              <br />
              <Badge
                className={classes.newMessagesCount}
                badgeContent={ticket.unreadMessages}
                classes={{
                  badge: classes.badgeStyle,
                }}
              />
              </>
              )}
            </>
          )}

          {ticket.status === "closed" && (
            <>
            <br />
            <Badge
              className={classes.Radiusdot}
              badgeContent={"FECHADO"}
              //color="primary"
              style={{
                backgroundColor: '#888',
                height: 18,
                padding: 5,
                paddingHorizontal: 12,
                borderRadius: 7,
                color: "white",
                marginRight: 5

              }}
            />
            </>
          )}


        </ListItemSecondaryAction>

      </ListItem>
      <Divider variant="inset" component="li" />
    </React.Fragment>
  );
};

export default TicketListItemCustom;