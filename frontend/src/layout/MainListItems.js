import React, { useContext, useEffect, useReducer, useState } from "react";
import { Link as RouterLink, useHistory, useLocation } from "react-router-dom";
import clsx from "clsx";

import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Divider from "@material-ui/core/Divider";
import { Badge, Collapse, List } from "@material-ui/core";
import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import SyncAltIcon from "@material-ui/icons/SyncAlt";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";
import ContactPhoneOutlinedIcon from "@material-ui/icons/ContactPhoneOutlined";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import FlashOnIcon from "@material-ui/icons/FlashOn";
import CalendarToday from "@material-ui/icons/CalendarToday";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import CodeRoundedIcon from "@material-ui/icons/CodeRounded";
import EventIcon from "@material-ui/icons/Event";
import InfoIcon from "@material-ui/icons/Info";
import DarkMode from "../components/DarkMode";

import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import EventAvailableIcon from "@material-ui/icons/EventAvailable";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import PeopleIcon from "@material-ui/icons/People";
import ListIcon from "@material-ui/icons/ListAlt";
import LoyaltyRoundedIcon from "@material-ui/icons/LoyaltyRounded";
import AnnouncementIcon from "@material-ui/icons/Announcement";
import ForumIcon from "@material-ui/icons/Forum";
import LocalAtmIcon from "@material-ui/icons/LocalAtm";
import RotateRight from "@material-ui/icons/RotateRight";
import { i18n } from "../translate/i18n";
import BorderColorIcon from "@material-ui/icons/BorderColor";
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { Can } from "../components/Can";
import { SocketContext } from "../context/Socket/SocketContext";
import { isArray } from "lodash";
import api from "../services/api";
import toastError from "../errors/toastError";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import { loadJSON } from "../helpers/loadJSON";

const gitinfo = loadJSON("/gitinfo.json");

const useStyles = makeStyles(theme => ({
  ListSubheader: {
    height: 26,
    marginTop: "-15px",
    marginBottom: "-10px"
  },
  sectionHeader: {
    position: "relative",
    fontSize: "0.72rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 700,
    color: theme.palette.messageIcons,
    backgroundColor: "transparent",
    lineHeight: 1.2,
    padding: theme.spacing(1.5, 2, 0.75)
  },
  navItem: {
    margin: theme.spacing(0.5, 1),
    borderRadius: 10,
    minHeight: 42,
    transition: "background-color 160ms ease, transform 160ms ease",
    "&:hover": {
      backgroundColor: theme.palette.mode === "light" ? "#F2F2EE" : "#2B2D33"
    }
  },
  navItemActive: {
    backgroundColor:
      theme.palette.mode === "light" ? "rgba(255,122,0,0.12)" : "rgba(255,154,47,0.22)",
    border: `1px solid ${
      theme.palette.mode === "light"
        ? "rgba(255,122,0,0.28)"
        : "rgba(255,154,47,0.36)"
    }`,
    "&:hover": {
      backgroundColor:
        theme.palette.mode === "light" ? "rgba(255,122,0,0.16)" : "rgba(255,154,47,0.28)"
    }
  },
  navItemCollapsed: {
    margin: theme.spacing(0.5),
    justifyContent: "center"
  },
  navItemIcon: {
    minWidth: 34,
    color: theme.palette.mode === "light" ? "#565660" : "#C3C3CB"
  },
  navItemText: {
    "& .MuiListItemText-primary": {
      fontSize: "0.84rem",
      fontWeight: 600,
      color: theme.palette.textCommon
    }
  },
  nestedList: {
    paddingLeft: 0,
    paddingBottom: theme.spacing(0.5)
  },
  nestedItem: {
    margin: theme.spacing(0.25, 1, 0.25, 2.5),
    borderRadius: 8,
    minHeight: 36,
    "& .MuiListItemIcon-root": {
      minWidth: 32,
      color: theme.palette.messageIcons
    },
    "& .MuiListItemText-primary": {
      fontSize: "0.8rem"
    }
  },
  versionText: {
    fontSize: "11px",
    padding: "10px",
    textAlign: "right",
    fontWeight: 700,
    color: theme.palette.messageIcons
  }
}));

function ListItemLink(props) {
  const { icon, primary, to, className, selected } = props;
  const classes = useStyles();

  const renderLink = React.useMemo(
    () =>
      React.forwardRef((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} />
      )),
    [to]
  );

  return (
    <li>
      <ListItem
        button
        dense
        component={renderLink}
        className={clsx(classes.navItem, className, selected && classes.navItemActive)}
      >
        {icon ? <ListItemIcon className={classes.navItemIcon}>{icon}</ListItemIcon> : null}
        <ListItemText className={classes.navItemText} primary={primary} />
      </ListItem>
    </li>
  );
}

const reducer = (state, action) => {
  if (action.type === "LOAD_CHATS") {
    const chats = action.payload;
    const newChats = [];

    if (isArray(chats)) {
      chats.forEach(chat => {
        const chatIndex = state.findIndex(u => u.id === chat.id);
        if (chatIndex !== -1) {
          state[chatIndex] = chat;
        } else {
          newChats.push(chat);
        }
      });
    }

    return [...state, ...newChats];
  }

  if (action.type === "UPDATE_CHATS") {
    const chat = action.payload;
    const chatIndex = state.findIndex(u => u.id === chat.id);

    if (chatIndex !== -1) {
      state[chatIndex] = chat;
      return [...state];
    } else {
      return [chat, ...state];
    }
  }

  if (action.type === "DELETE_CHAT") {
    const chatId = action.payload;

    const chatIndex = state.findIndex(u => u.id === chatId);
    if (chatIndex !== -1) {
      state.splice(chatIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }

  if (action.type === "CHANGE_CHAT") {
    const changedChats = state.map(chat => {
      if (chat.id === action.payload.chat.id) {
        return action.payload.chat;
      }
      return chat;
    });
    return changedChats;
  }
};

const MainListItems = props => {
  const classes = useStyles();
  const { drawerClose, drawerOpen } = props;
  const location = useLocation();
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user, handleLogout } = useContext(AuthContext);
  const [connectionWarning, setConnectionWarning] = useState(false);
  const [openCampaignSubmenu, setOpenCampaignSubmenu] = useState(false);
  const [openKanbanSubmenu, setOpenKanbanSubmenu] = useState(false);

  const [showCampaigns, setShowCampaigns] = useState(false);
  const history = useHistory();
  const [invisible, setInvisible] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam] = useState("");
  const [chats, dispatch] = useReducer(reducer, []);
  const [version, setVersion] = useState("v N/A");

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchChats();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);

    const onCompanyChatMainListItems = data => {
      if (data.action === "new-message") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
      if (data.action === "update") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
    };

    socket.on(`company-${companyId}-chat`, onCompanyChatMainListItems);
    return () => {
      socket.disconnect();
    };
  }, [socketManager]);

  useEffect(() => {
    let unreadsCount = 0;
    if (chats.length > 0) {
      for (let chat of chats) {
        for (let chatUser of chat.users) {
          if (chatUser.userId === user.id) {
            unreadsCount += chatUser.unreads;
          }
        }
      }
    }
    if (unreadsCount > 0) {
      setInvisible(false);
    } else {
      setInvisible(true);
    }
  }, [chats, user.id]);

  useEffect(() => {
    if (localStorage.getItem("cshow")) {
      setShowCampaigns(true);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (whatsApps.length > 0) {
        const offlineWhats = whatsApps.filter(whats => {
          return (
            whats.status === "qrcode" ||
            whats.status === "PAIRING" ||
            whats.status === "DISCONNECTED" ||
            whats.status === "TIMEOUT" ||
            whats.status === "OPENING"
          );
        });
        if (offlineWhats.length > 0) {
          setConnectionWarning(true);
        } else {
          setConnectionWarning(false);
        }
      }
    }, 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [whatsApps]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get("/chats/", {
        params: { searchParam, pageNumber }
      });
      dispatch({ type: "LOAD_CHATS", payload: data.records });
    } catch (err) {
      toastError(err);
    }
  };

  const handleClickLogout = () => {
    //handleCloseMenu();
    handleLogout();
  };

  return (
    <div onClick={drawerClose}>
      <Can
        role={user.profile}
        perform={"drawer-service-items:view"}
        style={{
          overflowY: "scroll"
        }}
        no={() => (
          <>
            <ListSubheader
              hidden={!drawerOpen}
              className={classes.sectionHeader}
              inset
              color="inherit"
            >
              {i18n.t("mainDrawer.listItems.service")}
            </ListSubheader>
            <>
              <ListItemLink
                to="/tickets"
                primary={i18n.t("mainDrawer.listItems.tickets")}
                icon={<WhatsAppIcon />}
                selected={location.pathname.startsWith("/tickets")}
                className={!drawerOpen ? classes.navItemCollapsed : undefined}
              />
              <ListItemLink
                to="/todolist"
                primary={i18n.t("mainDrawer.listItems.tasks")}
                icon={<BorderColorIcon />}
                selected={location.pathname.startsWith("/todolist")}
                className={!drawerOpen ? classes.navItemCollapsed : undefined}
              />
              <ListItemLink
                to="/quick-messages"
                primary={i18n.t("mainDrawer.listItems.quickMessages")}
                icon={<FlashOnIcon />}
                selected={location.pathname.startsWith("/quick-messages")}
                className={!drawerOpen ? classes.navItemCollapsed : undefined}
              />
              <ListItemLink
                to="/contacts"
                primary={i18n.t("mainDrawer.listItems.contacts")}
                icon={<ContactPhoneOutlinedIcon />}
                selected={location.pathname.startsWith("/contacts")}
                className={!drawerOpen ? classes.navItemCollapsed : undefined}
              />
              <ListItemLink
                to="/schedules"
                primary={i18n.t("mainDrawer.listItems.schedules")}
                icon={<EventIcon />}
                selected={location.pathname.startsWith("/schedules")}
                className={!drawerOpen ? classes.navItemCollapsed : undefined}
              />
              <ListItemLink
                to="/tags"
                primary={i18n.t("mainDrawer.listItems.tags")}
                icon={<LocalOfferIcon />}
                selected={location.pathname.startsWith("/tags")}
                className={!drawerOpen ? classes.navItemCollapsed : undefined}
              />
              <ListItemLink
                to="/chats"
                primary={i18n.t("mainDrawer.listItems.chats")}
                icon={
                  <Badge color="secondary" variant="dot" invisible={invisible}>
                    <ForumIcon />
                  </Badge>
                }
                selected={location.pathname.startsWith("/chats")}
                className={!drawerOpen ? classes.navItemCollapsed : undefined}
              />
              <ListItemLink
                to="/helps"
                primary={i18n.t("mainDrawer.listItems.helps")}
                icon={<HelpOutlineIcon />}
                selected={location.pathname.startsWith("/helps")}
                className={!drawerOpen ? classes.navItemCollapsed : undefined}
              />
            </>
          </>
        )}
      />

      <Can
        role={user.profile}
        perform={"drawer-admin-items:view"}
        yes={() => (
          <>
            <Divider />
            <ListSubheader
              hidden={!drawerOpen}
              className={classes.sectionHeader}
              inset
              color="inherit"
            >
              {i18n.t("mainDrawer.listItems.management")}
            </ListSubheader>
            <ListItemLink
              small
              to="/"
              primary="Dashboard"
              icon={<DashboardOutlinedIcon />}
              selected={location.pathname === "/"}
              className={!drawerOpen ? classes.navItemCollapsed : undefined}
            />
          </>
        )}
      />
      <Can
        role={user.profile}
        perform="drawer-admin-items:view"
        yes={() => (
          <>
            <Divider />
            <ListSubheader
              hidden={!drawerOpen}
              className={classes.sectionHeader}
              inset
              color="inherit"
            >
              {i18n.t("mainDrawer.listItems.administration")}
            </ListSubheader>

            {showCampaigns && (
              <>
                <ListItem
                  button
                  onClick={() => setOpenCampaignSubmenu(prev => !prev)}
                  className={clsx(classes.navItem, !drawerOpen && classes.navItemCollapsed)}
                >
                  <ListItemIcon className={classes.navItemIcon}>
                    <EventAvailableIcon />
                  </ListItemIcon>
                  <ListItemText
                    className={classes.navItemText}
                    primary={i18n.t("mainDrawer.listItems.campaigns")}
                  />
                  {openCampaignSubmenu ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </ListItem>
                <Collapse
                  style={{ paddingLeft: 10 }}
                  in={openCampaignSubmenu}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding className={classes.nestedList}>
                    <ListItem
                      onClick={() => history.push("/campaigns")}
                      button
                      className={classes.nestedItem}
                    >
                      <ListItemIcon>
                        <ListIcon />
                      </ListItemIcon>
                      <ListItemText primary="Listagem" />
                    </ListItem>
                    <ListItem
                      onClick={() => history.push("/contact-lists")}
                      button
                      className={classes.nestedItem}
                    >
                      <ListItemIcon>
                        <PeopleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Listas de Contatos" />
                    </ListItem>
                    <ListItem
                      onClick={() => history.push("/campaigns-config")}
                      button
                      className={classes.nestedItem}
                    >
                      <ListItemIcon>
                        <SettingsOutlinedIcon />
                      </ListItemIcon>
                      <ListItemText primary="Configurações" />
                    </ListItem>
                  </List>
                </Collapse>
              </>
            )}
            {user.super && (
              <ListItemLink
                to="/announcements"
                primary={i18n.t("mainDrawer.listItems.annoucements")}
                icon={<AnnouncementIcon />}
                selected={location.pathname.startsWith("/announcements")}
                className={!drawerOpen ? classes.navItemCollapsed : undefined}
              />
            )}
            <ListItemLink
              to="/connections"
              primary={i18n.t("mainDrawer.listItems.connections")}
              icon={
                <Badge badgeContent={connectionWarning ? "!" : 0} color="error">
                  <SyncAltIcon />
                </Badge>
              }
              selected={location.pathname.startsWith("/connections")}
              className={!drawerOpen ? classes.navItemCollapsed : undefined}
            />
            <ListItemLink
              to="/queues"
              primary={i18n.t("mainDrawer.listItems.queues")}
              icon={<AccountTreeOutlinedIcon />}
              selected={location.pathname.startsWith("/queues")}
              className={!drawerOpen ? classes.navItemCollapsed : undefined}
            />
            <ListItemLink
              to="/users"
              primary={i18n.t("mainDrawer.listItems.users")}
              icon={<PeopleAltOutlinedIcon />}
              selected={location.pathname.startsWith("/users")}
              className={!drawerOpen ? classes.navItemCollapsed : undefined}
            />
            <ListItemLink
              to="/messages-api"
              primary={i18n.t("mainDrawer.listItems.messagesAPI")}
              icon={<CodeRoundedIcon />}
              selected={location.pathname.startsWith("/messages-api")}
              className={!drawerOpen ? classes.navItemCollapsed : undefined}
            />
            <ListItemLink
              to="/financeiro"
              primary={i18n.t("mainDrawer.listItems.financeiro")}
              icon={<LocalAtmIcon />}
              selected={location.pathname.startsWith("/financeiro")}
              className={!drawerOpen ? classes.navItemCollapsed : undefined}
            />

            <ListItemLink
              to="/settings"
              primary={i18n.t("mainDrawer.listItems.settings")}
              icon={<SettingsOutlinedIcon />}
              selected={location.pathname.startsWith("/settings")}
              className={!drawerOpen ? classes.navItemCollapsed : undefined}
            />

            {drawerOpen && (
              <>
                <Divider />
                <Typography className={classes.versionText}>
                  {`${gitinfo.tagName || gitinfo.branchName + " " + gitinfo.commitHash}`}
                  &nbsp;/&nbsp;
                  {`${gitinfo.buildTimestamp}`}
                </Typography>
              </>
            )}
          </>
        )}
      />
      <Divider />
    </div>
  );
};

export default MainListItems;
