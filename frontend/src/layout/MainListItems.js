import Navegacao from "./Navegacao";
import React, { useContext, useEffect, useReducer, useState } from "react";

import { Badge } from "@material-ui/core";
import {
  LayoutDashboard as DashboardOutlinedIcon,
  MessageCircle as WhatsAppIcon,
  Refresh as SyncAltIcon,
  Settings as SettingsOutlinedIcon,
  Users as PeopleAltOutlinedIcon,
  Contact as ContactPhoneOutlinedIcon,
  Workflow as AccountTreeOutlinedIcon,
  Zap as FlashOnIcon,
  CircleHelp as HelpOutlineIcon,
  MessageSquare as ChatOutlinedIcon,
  Calendar as EventIcon,
  Tag as LocalOfferIcon,
  Calendar as EventAvailableIcon,
  Users as PeopleIcon,
  List as ListIcon,
  Megaphone as AnnouncementIcon,
  MessageSquare as ForumIcon,
  Banknote as LocalAtmIcon,
  ReceiptText as ReceiptIcon,
  Pencil as BorderColorIcon,
  Search as SearchIcon
} from "../components/AnimatedIcon";
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { podeVerCentralCobranca } from "../helpers/billingConsole";
import { podeVerProspeccao } from "../helpers/prospeccao";
import { SocketContext } from "../context/Socket/SocketContext";
import { isArray } from "lodash";
import api from "../services/api";
import toastError from "../errors/toastError";
import { canSeeScreen, screenForPath } from "../helpers/screenAccess";

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
  const { drawerClose, drawerOpen } = props;
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user } = useContext(AuthContext);
  const [connectionWarning, setConnectionWarning] = useState(false);

  const [showCampaigns, setShowCampaigns] = useState(false);
  const [invisible, setInvisible] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam] = useState("");
  const [chats, dispatch] = useReducer(reducer, []);

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

  const item = (to, chave, icone) => ({
    to,
    chave: `mainDrawer.listItems.${chave}`,
    icone
  });
  const administrador =
    user.profile === "admin" || Array.isArray(user.visibleScreens);
  // Central de Cobrança: só no tenant dono da plataforma. O backend repete a
  // checagem; aqui é pra não oferecer um menu que responderia 401.
  const centralCobranca = podeVerCentralCobranca(user);
  // Prospecção: mesma ideia da Central de Cobrança — só no tenant dono da
  // ferramenta, e o backend repete a checagem.
  const prospeccao = podeVerProspeccao(user);
  const grupos = [
    {
      chave: "redesign.operacao",
      itens: [
        ...(administrador
          ? [
              {
                to: "/",
                chave: "redesign.visaoGeral",
                icone: <DashboardOutlinedIcon />
              }
            ]
          : []),
        item("/tickets", "tickets", <WhatsAppIcon />),
        item(
          "/chats",
          "chats",
          <Badge
            color="secondary"
            variant="dot"
            overlap="rectangular"
            invisible={invisible}
          >
            <ForumIcon />
          </Badge>
        ),
        item("/todolist", "tasks", <BorderColorIcon />)
      ]
    },
    {
      chave: "redesign.relacionamento",
      itens: [
        item("/contacts", "contacts", <ContactPhoneOutlinedIcon />),
        item("/tags", "tags", <LocalOfferIcon />),
        ...(administrador && showCampaigns
          ? [
              {
                chave: "mainDrawer.listItems.campaigns",
                icone: <EventAvailableIcon />,
                filhos: [
                  {
                    to: "/campaigns",
                    chave: "redesign.envios",
                    icone: <ListIcon />
                  },
                  {
                    to: "/contact-lists",
                    chave: "redesign.listasContatos",
                    icone: <PeopleIcon />
                  },
                  {
                    to: "/campaigns-config",
                    chave: "mainDrawer.listItems.settings",
                    icone: <SettingsOutlinedIcon />
                  }
                ]
              }
            ]
          : []),
        item("/schedules", "schedules", <EventIcon />),
        ...(prospeccao
          ? [item("/prospeccao", "prospeccao", <SearchIcon />)]
          : [])
      ]
    },
    {
      chave: "redesign.automacao",
      itens: [
        ...(administrador
          ? [
              {
                to: "/fluxos",
                chave: "fluxos.titulo",
                icone: <AccountTreeOutlinedIcon />
              },
              item("/queues", "queues", <AccountTreeOutlinedIcon />),
              item("/chatgpt", "chatgpt", <ChatOutlinedIcon />)
            ]
          : []),
        item("/quick-messages", "quickMessages", <FlashOnIcon />),
        ...(administrador
          ? [
              item(
                "/connections",
                "connections",
                <Badge
                  badgeContent={connectionWarning ? "!" : 0}
                  color="error"
                  overlap="rectangular"
                >
                  <SyncAltIcon />
                </Badge>
              )
            ]
          : [])
      ]
    },
    {
      chave: "redesign.administracao",
      itens: [
        ...(administrador
          ? [
              item("/users", "users", <PeopleAltOutlinedIcon />),
              item("/announcements", "annoucements", <AnnouncementIcon />),
              item("/financeiro", "financeiro", <LocalAtmIcon />),
              ...(centralCobranca
                ? [item("/cobranca", "cobranca", <ReceiptIcon />)]
                : []),
              item("/settings", "settings", <SettingsOutlinedIcon />)
            ]
          : []),
        item("/helps", "helps", <HelpOutlineIcon />)
      ]
    }
  ];
  const visibleGroups = grupos
    .map(group => ({
      ...group,
      itens: group.itens
        .map(entry =>
          entry.filhos
            ? {
                ...entry,
                filhos: entry.filhos.filter(child =>
                  canSeeScreen(user, screenForPath(child.to))
                )
              }
            : entry
        )
        .filter(entry =>
          entry.filhos
            ? entry.filhos.length > 0
            : !screenForPath(entry.to) ||
              canSeeScreen(user, screenForPath(entry.to))
        )
    }))
    .filter(group => group.itens.length);
  return (
    <Navegacao
      grupos={visibleGroups}
      expandido={drawerOpen}
      aoNavegar={drawerClose}
    />
  );
};

export default MainListItems;
