import React, { useState, useRef, useEffect, useContext } from "react";
import { useTheme } from "@material-ui/core/styles";

import { useHistory } from "react-router-dom";
import { format } from "date-fns";
import useSound from "use-sound";

import Popover from "@material-ui/core/Popover";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import { makeStyles } from "@material-ui/core/styles";
import Badge from "@material-ui/core/Badge";
import ChatIcon from "@material-ui/icons/Chat";

import TicketListItem from "../TicketListItem";
import { i18n } from "../../translate/i18n";
import useTickets from "../../hooks/useTickets";
import alertSound from "../../assets/sound.mp3";
import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import Favicon from "react-favicon";
import useSettings from "../../hooks/useSettings";
import {
  closeLocalNotification,
  enablePushNotifications,
  getNotificationPermission,
  hasActivePushSubscription,
  isPushSupported,
  showLocalNotification,
  syncPushSubscription,
  updateAppBadge
} from "../../services/pushNotifications";

const defaultLogoFavicon = "/branding/icon.png";

const useStyles = makeStyles(theme => ({
  tabContainer: {
    overflowY: "auto",
    maxHeight: 350,
    ...theme.scrollbarStyles
  },
  noShadow: {
    boxShadow: "none !important"
  }
}));

const NotificationsPopOver = props => {
  const classes = useStyles();
  const theme = useTheme();

  const history = useHistory();
  const { user } = useContext(AuthContext);
  const ticketIdUrl = +history.location.pathname.split("/")[2];
  const ticketIdRef = useRef(ticketIdUrl);
  const anchorEl = useRef();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [soundGroupNotifications, setSoundGroupNotifications] = useState(false);
  const [showTabGroups, setShowTabGroups] = useState(false);
  const { profile, queues } = user;
  const [queueIds, setQueueIds] = useState(queues.map(q => q.id));

  const { tickets, refetch: refetchTickets } = useTickets({
    notClosed: "true",
    withUnreadMessages: "true"
  });
  const [play] = useSound(alertSound, { volume: props.volume });
  const soundAlertRef = useRef();
  // Ref e nao state: o handler do socket e registrado uma vez por efeito e
  // capturaria um valor velho se isso fosse state.
  const pushActiveRef = useRef(false);
  const { getSetting } = useSettings();

  const socketManager = useContext(SocketContext);

  function clearTicket(ticketId) {
    setNotifications(prevState => {
      const ticketIndex = prevState.findIndex(t => t.id === ticketId);
      if (ticketIndex !== -1) {
        prevState.splice(ticketIndex, 1);
        return [...prevState];
      }
      return prevState;
    });

    closeLocalNotification(ticketId);
  }

  useEffect(() => {
    let active = true;
    getSetting("soundGroupNotifications")
      .then(soundGroupNotifications => {
        if (active)
          setSoundGroupNotifications(soundGroupNotifications === "enabled");
      })
      .catch(() => {});

    Promise.all([getSetting("CheckMsgIsGroup"), getSetting("groupsTab")])
      .then(([ignoreGroups, groupsTab]) => {
        if (active)
          setShowTabGroups(
            ignoreGroups === "disabled" && groupsTab === "enabled"
          );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [getSetting]);

  useEffect(() => {
    soundAlertRef.current = play;
  }, [play]);

  useEffect(() => {
    if (!isPushSupported()) {
      console.log("This browser doesn't support push notifications");
      return;
    }

    // Pedir a permissao aqui nao funciona: o Safari (desktop e iOS) so aceita
    // requestPermission dentro de um gesto do usuario, e o iOS so entrega
    // notificacao para PWA instalado na tela de inicio. Com a permissao ja
    // concedida, so refazemos a inscricao para este login.
    if (getNotificationPermission() === "granted") {
      syncPushSubscription().then(() => {
        hasActivePushSubscription().then(active => {
          pushActiveRef.current = active;
        });
      });
    }
  }, []);

  useEffect(() => {
    setNotifications(tickets);
  }, [tickets]);

  // Com o sistema aberto a contagem confiavel e a da tela, entao ela assume o
  // numero do icone no lugar do que o service worker deixou.
  useEffect(() => {
    updateAppBadge(notifications.length);
  }, [notifications.length]);

  useEffect(() => {
    ticketIdRef.current = ticketIdUrl;
  }, [ticketIdUrl]);

  useEffect(() => {
    setQueueIds(queues.map(q => q.id));
  }, [queues]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);

    const onConnectNotificationsPopover = () => {
      socket.emit("joinNotification");
    };

    const onCompanyTicketNotificationsPopover = data => {
      if (data.action === "update" || data.ticket?.status === "closed") {
        clearTicket(data.ticket.id);
      }

      if (data.action === "updateUnread" || data.action === "delete") {
        clearTicket(data.ticketId);
      }
    };

    const onCompanyAppMessageNotificationsPopover = data => {
      if (
        data.action === "create" &&
        !data.message.read &&
        (data.ticket.userId === user?.id ||
          (data.ticket.isGroup && !data.ticket.userId) ||
          (!data.ticket.userId &&
            (queueIds.includes(data.ticket.queueId) ||
              (!data.ticket.queueId && profile === "admin"))))
      ) {
        setNotifications(prevState => {
          const ticketIndex = prevState.findIndex(t => t.id === data.ticket.id);
          if (ticketIndex !== -1) {
            prevState[ticketIndex] = data.ticket;
            return [...prevState];
          }
          return [data.ticket, ...prevState];
        });

        const shouldNotNotificate =
          (data.message.ticketId === ticketIdRef.current &&
            document.visibilityState === "visible") ||
          (data.ticket.userId && data.ticket.userId !== user?.id) ||
          (data.ticket.isGroup && !soundGroupNotifications);

        if (shouldNotNotificate) return;

        handleNotifications(data);
      }
    };

    const onCompanyContactNotificationsPopover = data => {
      if (data.action !== "update") {
        return;
      }

      setNotifications(prevState =>
        prevState.map(ticket =>
          ticket.contactId === data.contact?.id
            ? { ...ticket, contact: { ...ticket.contact, ...data.contact } }
            : ticket
        )
      );
    };

    socketManager.onConnect(onConnectNotificationsPopover);
    socket.on(
      `company-${companyId}-ticket`,
      onCompanyTicketNotificationsPopover
    );
    socket.on(
      `company-${companyId}-appMessage`,
      onCompanyAppMessageNotificationsPopover
    );
    socket.on(
      `company-${companyId}-contact`,
      onCompanyContactNotificationsPopover
    );
    socket.on("wsRefreshRequired", refreshRequired => {
      if (refreshRequired) {
        refetchTickets();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [
    user,
    profile,
    queues,
    queueIds,
    soundGroupNotifications,
    socketManager,
    refetchTickets
  ]);

  const handleNotifications = data => {
    const { message, contact, ticket } = data;

    const body = message.body.startsWith('{"ticketzvCard"')
      ? "🪪"
      : message.body;

    // Com push ativo neste dispositivo a mesma mensagem ja vai chegar pelo
    // service worker. Exibir tambem a local faria o aparelho alertar duas
    // vezes. O som continua tocando nos dois casos.
    if (!pushActiveRef.current) {
      showLocalNotification(
        `${i18n.t("tickets.notification.message")} ${contact.name}`,
        {
          body: `${format(new Date(), "HH:mm")}\n${body}`,
          icon: contact.profilePicUrl,
          tag: ticket.id,
          url: `/tickets/${ticket.uuid}`
        }
      );
    }

    soundAlertRef.current();
  };

  const handleClick = () => {
    // Unico ponto da tela que e um gesto do usuario e tem relacao direta com
    // notificacao, entao e daqui que sai o pedido de permissao. Sem gesto o
    // Safari ignora o requestPermission em silencio.
    if (isPushSupported() && getNotificationPermission() === "default") {
      enablePushNotifications().then(result => {
        pushActiveRef.current = Boolean(result?.ok);
      });
    }
    setIsOpen(prevState => !prevState);
  };

  const handleClickAway = () => {
    setIsOpen(false);
  };

  const NotificationTicket = ({ children }) => {
    return <div onClick={handleClickAway}>{children}</div>;
  };

  const browserNotification = () => {
    const numbers = "⓿➊➋➌➍➎➏➐➑➒➓⓫⓬⓭⓮⓯⓰⓱⓲⓳⓴";
    if (notifications.length > 0) {
      if (notifications.length < 21) {
        document.title =
          numbers.substring(notifications.length, notifications.length + 1) +
          " - " +
          (theme.appName || "...");
      } else {
        document.title =
          "(" + notifications.length + ")" + (theme.appName || "...");
      }
    } else {
      document.title = theme.appName || "...";
    }
    return (
      <>
        <Favicon
          animated={true}
          url={
            theme?.appLogoFavicon ? theme.appLogoFavicon : defaultLogoFavicon
          }
          alertCount={notifications.length}
          iconSize={195}
        />
      </>
    );
  };

  return (
    <>
      {browserNotification()}
      <IconButton
        onClick={handleClick}
        ref={anchorEl}
        aria-label="Mostrar Notificações"
        variant="contained"
      >
        <ChatIcon style={{ color: theme.palette.text.secondary }} />
        {notifications.length > 0 ? (
          <Badge
            variant="dot"
            color="secondary"
            overlap="rectangular"
            style={{ marginTop: "-25px" }}
          ></Badge>
        ) : (
          ""
        )}
      </IconButton>
      <Popover
        disableScrollLock
        open={isOpen}
        anchorEl={anchorEl.current}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right"
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right"
        }}
        classes={{ paper: classes.popoverPaper }}
        onClose={handleClickAway}
      >
        <List dense className={classes.tabContainer}>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText>{i18n.t("notifications.noTickets")}</ListItemText>
            </ListItem>
          ) : (
            notifications.map(ticket => (
              <NotificationTicket key={ticket.id}>
                <TicketListItem
                  ticket={ticket}
                  groupActionButtons={!showTabGroups}
                />
              </NotificationTicket>
            ))
          )}
        </List>
      </Popover>
    </>
  );
};

export default NotificationsPopOver;
