import * as Abas from "@radix-ui/react-tabs";
import { Plus, Search, Archive, UsersRound } from "../AnimatedIcon";
import { Botao, BotaoIcone, useIdentidade } from "../interface";
import "../../pages/TicketsCustom/atendimento.css";
import "../TabelaDados/tabela.css";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";

import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";

import NewTicketModal from "../NewTicketModal";
import TicketsList from "../TicketsListCustom";
import TabPanel from "../TabPanel";

import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../Can";
import TicketsQueueSelect from "../TicketsQueueSelect";
import { Box } from "@material-ui/core";
import { TagsFilter } from "../TagsFilter";
import { UsersFilter } from "../UsersFilter";
import useSettings from "../../hooks/useSettings";
import { ContactSelect } from "../ContactSelect";
import api from "../../services/api";
import { SocketContext } from "../../context/Socket/SocketContext";
import StoriesStrip from "../WhatsappStatus/StoriesStrip";

const useStyles = makeStyles(theme => ({
  ticketsWrapper: {
    "& .MuiTab-wrapper": { flexDirection: "row", gap: 6 },
    "& .MuiTab-labelIcon": { minHeight: 44 },
    "& .MuiTab-labelIcon .MuiTab-wrapper > *:first-child": { marginBottom: 0 },
    position: "relative",
    display: "flex",
    height: "100%",
    flexDirection: "column",
    overflow: "hidden",
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12
  },

  tabsHeader: {
    flex: "none"
    // backgroundColor: "#eee",
  },

  settingsIcon: {
    alignSelf: "center",
    marginLeft: "auto",
    padding: 8
  },

  tabWithGroups: {
    minWidth: 0,
    flex: 1,
    fontSize: 12,
    padding: "6px 8px"
  },

  tab: {
    minWidth: 0,
    flex: 1
  },

  ticketOptionsBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    // background: "#fafafa",
    padding: theme.spacing(1)
  },

  serachInputWrapper: {
    flex: 1,
    // background: "#fff",
    display: "flex",
    borderRadius: 8,
    border: `1px solid ${theme.palette.divider}`,
    padding: 6,
    marginRight: theme.spacing(1)
  },

  searchIcon: {
    color: "grey",
    marginLeft: 6,
    marginRight: 6,
    alignSelf: "center"
  },

  searchInput: {
    flex: 1,
    border: "none",
    borderRadius: 8
  },

  badge: {
    right: "-10px"
  },
  show: {
    display: "block"
  },
  hide: {
    display: "none !important"
  },

  icon24: {
    width: 24,
    height: 24
  }
}));

const TicketsManagerTabs = () => {
  const classes = useStyles();
  const identidade = useIdentidade();
  const history = useHistory();

  const [searchParam, setSearchParam] = useState("");
  const [textoBusca, setTextoBusca] = useState("");
  const [tab, setTab] = useState("open");
  const [tabOpen, setTabOpen] = useState("open");
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const searchInputRef = useRef();
  const { user } = useContext(AuthContext);
  const { profile } = user;

  const [openCount, setOpenCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [groupUnreadCount, setGroupUnreadCount] = useState(0);
  const groupUnreadRequestRef = useRef(0);

  const userQueueIds = user.queues.map(q => q.id);
  const [availableQueues, setAvailableQueues] = useState(user.queues || []);
  const [selectedQueueIds, setSelectedQueueIds] = useState(userQueueIds || []);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const { getSetting } = useSettings();
  const [showTabGroups, setShowTabGroups] = useState(false);
  const [groupMode, setGroupMode] = useState("conversation");
  const [groupTicketStatus, setGroupTicketStatus] = useState("pending");
  const socketManager = useContext(SocketContext);

  useEffect(() => {
    if (profile !== "admin") {
      setAvailableQueues(user.queues || []);
      setSelectedQueueIds(user.queues.map(queue => queue.id));
      return undefined;
    }

    let active = true;
    api
      .get("/queue")
      .then(({ data }) => {
        if (!active) return;
        const queues = Array.isArray(data) ? data : [];
        setAvailableQueues(queues);
        setSelectedQueueIds(current => {
          const assignedIds = new Set(user.queues.map(queue => queue.id));
          const hadEveryAssignedQueue =
            current.length === assignedIds.size &&
            current.every(queueId => assignedIds.has(queueId));
          return hadEveryAssignedQueue
            ? queues.map(queue => queue.id)
            : current.filter(queueId =>
                queues.some(queue => queue.id === queueId)
              );
        });
      })
      .catch(() => {
        // Assigned queues remain usable if the complete admin list cannot be
        // refreshed during a transient request failure.
      });

    return () => {
      active = false;
    };
  }, [profile, user.companyId, user.queues]);

  const refreshGroupUnreadCount = useCallback(async () => {
    const requestId = ++groupUnreadRequestRef.current;
    try {
      const { data } = await api.get("/whatsapp-groups/unread-count");
      if (requestId === groupUnreadRequestRef.current) {
        setGroupUnreadCount(Number(data.count) || 0);
      }
    } catch {
      // Preserve the last known count during a transient connection failure.
    }
  }, []);

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
    if (!showTabGroups) {
      setGroupUnreadCount(0);
      return undefined;
    }

    refreshGroupUnreadCount();
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);
    const onConnect = () => socket.emit("joinNotification");
    const onMessage = data => {
      if (data.action === "create" && data.ticket?.isGroup) {
        refreshGroupUnreadCount();
      }
    };
    const onTicket = data => {
      if (
        data.action === "updateUnread" ||
        (data.action === "update" && data.ticket?.isGroup)
      ) {
        refreshGroupUnreadCount();
      }
    };
    const onRefresh = refreshRequired => {
      if (refreshRequired) refreshGroupUnreadCount();
    };

    socketManager.onConnect(onConnect);
    socket.on(`company-${companyId}-appMessage`, onMessage);
    socket.on(`company-${companyId}-ticket`, onTicket);
    socket.on("wsRefreshRequired", onRefresh);

    return () => socket.disconnect();
  }, [showTabGroups, socketManager, refreshGroupUnreadCount]);

  useEffect(() => {
    if (user.profile.toUpperCase() === "ADMIN") {
      setShowAllTickets(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "search") {
      searchInputRef.current.focus();
    } else {
      clearTimeout(searchTimeout.current);
      setTextoBusca("");
      setSearchParam("");
    }
  }, [tab]);

  const searchTimeout = useRef();
  useEffect(() => () => clearTimeout(searchTimeout.current), []);

  const handleSearch = e => {
    setTextoBusca(e.target.value);
    const searchedTerm = e.target.value.toLowerCase();

    clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
      setSearchParam(searchedTerm);
    }, 500);
  };

  const applyPanelStyle = status => {
    if (tabOpen !== status) {
      return { width: 0, height: 0 };
    }
  };

  const handleCloseOrOpenTicket = ticket => {
    setNewTicketModalOpen(false);
    if (ticket !== undefined && ticket.uuid !== undefined) {
      history.push(`/tickets/${ticket.uuid}`);
    }
  };

  const handleSelectedTags = selecteds => {
    const tags = selecteds.map(t => t.id);
    setSelectedTags(tags);
  };

  const handleSelectedUsers = selecteds => {
    const users = selecteds.map(t => t.id);
    setSelectedUsers(users);
  };

  return (
    <Paper
      elevation={0}
      variant="outlined"
      className={`${classes.ticketsWrapper} ew-ui fila-atendimento`}
      style={identidade}
    >
      <NewTicketModal
        modalOpen={newTicketModalOpen}
        onClose={ticket => {
          handleCloseOrOpenTicket(ticket);
        }}
      />
      <StoriesStrip companyId={user.companyId} userId={user.id} />
      <Abas.Root
        value={tab === "open" ? tabOpen : tab}
        onValueChange={valor => {
          setTab("open");
          setTabOpen(valor);
        }}
        className="fila-status"
      >
        <Abas.List className="ew-tabs" aria-label={i18n.t("visual.suporte")}>
          <Abas.Trigger value="open" className="ew-tab">
            {i18n.t("ticketsList.assignedHeader")}
            <span className="ew-badge">{openCount}</span>
          </Abas.Trigger>
          <Abas.Trigger value="pending" className="ew-tab">
            {i18n.t("ticketsList.pendingHeader")}
            <span className="ew-badge">{pendingCount}</span>
          </Abas.Trigger>
        </Abas.List>
      </Abas.Root>
      <div className="fila-pesquisa">
        <label className="tabela-busca">
          <Search size={15} />
          <input
            type="search"
            ref={searchInputRef}
            value={textoBusca}
            placeholder={i18n.t("visual.buscarAtendimentos")}
            aria-label={i18n.t("visual.buscarAtendimentos")}
            onChange={event => {
              setTab("search");
              handleSearch(event);
            }}
          />
        </label>
        <BotaoIcone
          titulo={i18n.t("ticketsManager.buttons.newTicket")}
          onClick={() => setNewTicketModalOpen(true)}
        >
          <Plus size={16} />
        </BotaoIcone>
      </div>
      <div className="fila-atalhos">
        <Botao
          variante="ghost"
          className={tab === "closed" ? "is-active" : ""}
          onClick={() => setTab("closed")}
        >
          <Archive size={13} />
          {i18n.t("tickets.tabs.closed.title")}
        </Botao>
        <Botao
          variante="ghost"
          className={tab === "search" ? "is-active" : ""}
          onClick={() => setTab("search")}
        >
          <Search size={13} />
          {i18n.t("visual.filtrar")}
        </Botao>
        {showTabGroups && (
          <Botao
            variante="ghost"
            className={tab === "groups" ? "is-active" : ""}
            onClick={() => setTab("groups")}
          >
            <UsersRound size={13} />
            {i18n.t("tickets.tabs.groups.title")}
            {groupUnreadCount > 0 && (
              <span className="ew-badge">{groupUnreadCount}</span>
            )}
          </Botao>
        )}
      </div>
      <Paper
        square
        elevation={0}
        className={`${classes.ticketOptionsBox} fila-opcoes`}
      >
        {tab === "open" && (
          <Can
            role={user.profile}
            perform="tickets-manager:showall"
            yes={() => (
              <FormControlLabel
                label={i18n.t("tickets.buttons.showAll")}
                labelPlacement="start"
                control={
                  <Switch
                    size="small"
                    checked={showAllTickets}
                    onChange={() => setShowAllTickets(valor => !valor)}
                    name="showAllTickets"
                    color="primary"
                  />
                }
              />
            )}
          />
        )}
        <TicketsQueueSelect
          style={{ marginLeft: 6 }}
          selectedQueueIds={selectedQueueIds}
          userQueues={availableQueues}
          onChange={values => setSelectedQueueIds(values)}
        />
      </Paper>
      <TabPanel value={tab} name="open" className={classes.ticketsWrapper}>
        <Paper square elevation={0} className={classes.ticketsWrapper}>
          <TicketsList
            status="open"
            showAll={showAllTickets}
            selectedQueueIds={selectedQueueIds}
            updateCount={val => setOpenCount(val)}
            style={applyPanelStyle("open")}
            setTabOpen={setTabOpen}
            showTabGroups={showTabGroups}
          />
          <TicketsList
            status="pending"
            selectedQueueIds={selectedQueueIds}
            updateCount={val => setPendingCount(val)}
            style={applyPanelStyle("pending")}
            setTabOpen={setTabOpen}
            showTabGroups={showTabGroups}
          />
        </Paper>
      </TabPanel>
      <TabPanel value={tab} name="closed" className={classes.ticketsWrapper}>
        <TicketsList
          status="closed"
          showAll={true}
          selectedQueueIds={selectedQueueIds}
          showTabGroups={showTabGroups}
        />
      </TabPanel>
      <TabPanel value={tab} name="groups" className={classes.ticketsWrapper}>
        <Tabs
          value={groupMode}
          onChange={(_, value) => setGroupMode(value)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab
            value="conversation"
            label={i18n.t("tickets.tabs.groups.conversations")}
          />
          <Tab
            value="ticket"
            label={i18n.t("tickets.tabs.groups.attendances")}
          />
        </Tabs>
        {groupMode === "conversation" ? (
          <TicketsList
            groups={true}
            groupMode="conversation"
            showAll={true}
            selectedQueueIds={selectedQueueIds}
            showTabGroups={showTabGroups}
          />
        ) : (
          <>
            <Tabs
              value={groupTicketStatus}
              onChange={(_, value) => setGroupTicketStatus(value)}
              indicatorColor="secondary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab
                value="pending"
                label={i18n.t("tickets.tabs.groups.pending")}
              />
              <Tab value="open" label={i18n.t("tickets.tabs.groups.open")} />
              <Tab
                value="closed"
                label={i18n.t("tickets.tabs.groups.closed")}
              />
            </Tabs>
            <TicketsList
              groups={true}
              groupMode="ticket"
              status={groupTicketStatus}
              showAll={true}
              selectedQueueIds={selectedQueueIds}
              showTabGroups={showTabGroups}
            />
          </>
        )}
      </TabPanel>
      <TabPanel value={tab} name="search" className={classes.ticketsWrapper}>
        <Box style={{ paddingRight: 10, paddingLeft: 10 }}>
          <ContactSelect
            onSelected={contactId => {
              setSelectedContact(contactId);
            }}
            allowCreate={false}
          />
        </Box>
        <TagsFilter onFiltered={handleSelectedTags} />
        {profile === "admin" && (
          <UsersFilter onFiltered={handleSelectedUsers} />
        )}
        <TicketsList
          isSearch={true}
          searchParam={searchParam}
          showAll={true}
          contactId={selectedContact}
          tags={selectedTags}
          users={selectedUsers}
          selectedQueueIds={selectedQueueIds}
          showTabGroups={showTabGroups}
        />
      </TabPanel>
    </Paper>
  );
};

export default TicketsManagerTabs;
