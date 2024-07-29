import React, { useContext, useEffect, useReducer, useState } from "react";
import { Link as RouterLink, useHistory } from "react-router-dom";

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
import LoyaltyRoundedIcon from '@material-ui/icons/LoyaltyRounded';
import AnnouncementIcon from "@material-ui/icons/Announcement";
import ForumIcon from "@material-ui/icons/Forum";
import LocalAtmIcon from '@material-ui/icons/LocalAtm';
import RotateRight from "@material-ui/icons/RotateRight";
import { i18n } from "../translate/i18n";
import BorderColorIcon from '@material-ui/icons/BorderColor';
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

const gitinfo = loadJSON('/gitinfo.json');


const useStyles = makeStyles((theme) => ({
  ListSubheader: {
    height: 26,
    marginTop: "-15px",
    marginBottom: "-10px",
  },
}));


function ListItemLink(props) {
  const { icon, primary, to, className } = props;

  const renderLink = React.useMemo(
    () =>
      React.forwardRef((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} />
      )),
    [to]
  );

  return (
    <li>
      <ListItem button dense component={renderLink} className={className}>
        {icon ? <ListItemIcon>{icon}</ListItemIcon> : null}
        <ListItemText primary={primary} />
      </ListItem>
    </li>
  );
}

const reducer = (state, action) => {
  if (action.type === "LOAD_CHATS") {
    const chats = action.payload;
    const newChats = [];

    if (isArray(chats)) {
      chats.forEach((chat) => {
        const chatIndex = state.findIndex((u) => u.id === chat.id);
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
    const chatIndex = state.findIndex((u) => u.id === chat.id);

    if (chatIndex !== -1) {
      state[chatIndex] = chat;
      return [...state];
    } else {
      return [chat, ...state];
    }
  }

  if (action.type === "DELETE_CHAT") {
    const chatId = action.payload;

    const chatIndex = state.findIndex((u) => u.id === chatId);
    if (chatIndex !== -1) {
      state.splice(chatIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }

  if (action.type === "CHANGE_CHAT") {
    const changedChats = state.map((chat) => {
      if (chat.id === action.payload.chat.id) {
        return action.payload.chat;
      }
      return chat;
    });
    return changedChats;
  }
};

const MainListItems = (props) => {
  const classes = useStyles();
  const { drawerClose, drawerOpen} = props;
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user ,handleLogout} = useContext(AuthContext);
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

    const onCompanyChatMainListItems = (data) => {
      if (data.action === "new-message") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
      if (data.action === "update") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
    }

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
        const offlineWhats = whatsApps.filter((whats) => {
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
        params: { searchParam, pageNumber },
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
          overflowY: "scroll",
        }}
        no={()=>(
        <>
          <ListSubheader 
          hidden={!drawerOpen}
        style={{
          position:"relative",
          fontSize: "17px",
          textAlign: "left",
          paddingLeft: 20
        }}   
        inset
        color="inherit">
              {i18n.t("mainDrawer.listItems.service")}
          </ListSubheader>
          <>
            
            <ListItemLink
              to="/tickets"
              primary={i18n.t("mainDrawer.listItems.tickets")}
              icon={<img src={`${process.env.PUBLIC_URL}/icones/tickets.png`} alt="Atendimentos" style={{ width: '24px', height: '24px' }} />}
            />
      <ListItemLink
        to="/todolist"
        primary={i18n.t("Tarefas")}
        icon={<img src={`${process.env.PUBLIC_URL}/icones/tarefas.png`} alt="Tarefas" style={{ width: '24px', height: '24px' }} />}
      />
            <ListItemLink
              to="/quick-messages"
              primary={i18n.t("mainDrawer.listItems.quickMessages")}
              icon={<img src={`${process.env.PUBLIC_URL}/icones/respostarapida.png`} alt="Respostas Rápidas" style={{ width: '24px', height: '24px' }} />}
            />
            <ListItemLink
              to="/contacts"
              primary={i18n.t("mainDrawer.listItems.contacts")}
              icon={<img src={`${process.env.PUBLIC_URL}/icones/listadecontatos.png`} alt="Contatos" style={{ width: '24px', height: '24px' }} />}
            />
            <ListItemLink
              to="/schedules"
              primary={i18n.t("mainDrawer.listItems.schedules")}
              icon={<img src={`${process.env.PUBLIC_URL}/icones/anotacao.png`} alt="Agendamentos" style={{ width: '24px', height: '24px' }} />}
            />
            <ListItemLink
              to="/tags"
              primary={i18n.t("mainDrawer.listItems.tags")}
              icon={<img src={`${process.env.PUBLIC_URL}/icones/rotulo.png`} alt="Tags" style={{ width: '24px', height: '24px' }} />}
            />
            <ListItemLink
              to="/chats"
              primary={i18n.t("mainDrawer.listItems.chats")}
              icon={<Badge color="secondary" variant="dot" invisible={invisible}><img src={`${process.env.PUBLIC_URL}/icones/chatinterno.png`} alt="Chat Interno" style={{ width: '24px', height: '24px' }} />
              </Badge>
              }
            />
            <ListItemLink
                to="/helps"
                primary={i18n.t("mainDrawer.listItems.helps")}
                icon={<img src={`${process.env.PUBLIC_URL}/icones/ajuda.png`} alt="Ajuda" style={{ width: '24px', height: '24px' }} />}
              />

            <ListItem
              button
              dense
              onClick={handleClickLogout}>
              
              {<img src={`${process.env.PUBLIC_URL}/icones/sair.png`} alt="Sair" style={{ width: '24px', height: '24px' }} />}
              <ListItemIcon></ListItemIcon>
              <ListItemText primary={i18n.t("mainDrawer.listItems.logout")}
            />
            </ListItem>
          </>
        </>
        )}
      />

      <Can
        role={user.profile}
        perform={"drawer-admin-items:view"}
        yes={()=>(
          <>
            <Divider/>
            <ListSubheader 
            hidden={!drawerOpen}
            style={{
              position:"relative",
              fontSize: "17px",
              textAlign: "left",
              paddingLeft: 20
            }} 
            inset
            color="inherit">
              {i18n.t("mainDrawer.listItems.management")}
            </ListSubheader>
            <ListItemLink
            small
            to="/"
            primary="Dashboard"
            icon={<img src={`${process.env.PUBLIC_URL}/icones/painel.png`} alt="Dashboard" style={{ width: '24px', height: '24px' }} />}
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
            style={{
              position:"relative",
              fontSize: "17px",
              textAlign: "left",
              paddingLeft: 20
            }} 
            inset
            color="inherit">
              {i18n.t("mainDrawer.listItems.administration")}
            </ListSubheader>
            
            {showCampaigns && (
              <>
                <ListItem
                  button
                  onClick={() => setOpenCampaignSubmenu((prev) => !prev)}
                >
                  <ListItemIcon>
                    <EventAvailableIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={i18n.t("mainDrawer.listItems.campaigns")}
                  />
                  {openCampaignSubmenu ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </ListItem>
                <Collapse
                  style={{ paddingLeft: 15 }}
                  in={openCampaignSubmenu}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    <ListItem onClick={() => history.push("/campaigns")} button>
                      <ListItemIcon>
                        <ListIcon />
                      </ListItemIcon>
                      <ListItemText primary="Listagem" />
                    </ListItem>
                    <ListItem
                      onClick={() => history.push("/contact-lists")}
                      button
                    >
                      <ListItemIcon>
                        <PeopleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Listas de Contatos" />
                    </ListItem>
                    <ListItem
                      onClick={() => history.push("/campaigns-config")}
                      button
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
                icon={<img src={`${process.env.PUBLIC_URL}/icones/informacao.png`} alt="Informativos" style={{ width: '24px', height: '24px' }} />}
              />
            )}
            <ListItemLink
              to="/connections"
              primary={i18n.t("mainDrawer.listItems.connections")}
              icon={<img src={`${process.env.PUBLIC_URL}/icones/sinal.png`} alt="Conexões" style={{ width: '24px', height: '24px' }} />}
            />
            <ListItemLink
              to="/queues"
              primary={i18n.t("mainDrawer.listItems.queues")}
              icon={<img src={`${process.env.PUBLIC_URL}/icones/votacao.png`} alt="Filas & Chatbot" style={{ width: '24px', height: '24px' }} />}
            />
            <ListItemLink
              to="/users"
              primary={i18n.t("mainDrawer.listItems.users")}
              icon={<img src={`${process.env.PUBLIC_URL}/icones/equipe.png`} alt="Usuários" style={{ width: '24px', height: '24px' }} />}
            />
            <ListItemLink
              to="/messages-api"
              primary={i18n.t("mainDrawer.listItems.messagesAPI")}
              icon={<img src={`${process.env.PUBLIC_URL}/icones/api.png`} alt="API" style={{ width: '24px', height: '24px' }} />}
            />
             <ListItemLink
                to="/financeiro"
                primary={i18n.t("mainDrawer.listItems.financeiro")}
                icon={<img src={`${process.env.PUBLIC_URL}/icones/lucro.png`} alt="Financeiro" style={{ width: '24px', height: '24px' }} />}
              />

            <ListItemLink
              to="/settings"
              primary={i18n.t("mainDrawer.listItems.settings")}
              icon={<img src={`${process.env.PUBLIC_URL}/icones/configuracao.png`} alt="Configurações" style={{ width: '24px', height: '24px' }} />}
            />

            <ListItem
              button
              dense
              onClick={handleClickLogout}>
              
              {<img src={`${process.env.PUBLIC_URL}/icones/sair.png`} alt="Sair" style={{ width: '24px', height: '24px' }} />}
              <ListItemIcon></ListItemIcon>
              <ListItemText primary={i18n.t("mainDrawer.listItems.logout")}
            />

          {}

          </>
        )}
      />
      <Divider />
    </div>
  );
};

export default MainListItems;