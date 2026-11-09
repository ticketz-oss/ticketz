import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import api from "../services/api";
import socketService from "../services/socket";
import type { Ticket, Contact, Whatsapp, Queue } from "../types";
import { useAuth } from "./AuthContext";
import { useNotification } from "./NotificationContext";
import {
  isPrivateName,
  isWhatsappPrivate,
  getUserAllowedWhatsappIds,
  syncPrivacySettingsFromBackend,
} from "../services/privacyService";

export type TabType = "open" | "pending" | "closed" | "groups";

export type ModalType =
  | "newTicket"
  | "contacts"
  | "quickMessages"
  | "tags"
  | "queues"
  | "connections"
  | "transfer"
  | "users"
  | "notifications"
  | "settings"
  | null;

interface SearchResults {
  contacts: Contact[];
  messages: { ticket: Ticket; body: string; createdAt: string }[];
}

interface TabCounts {
  open: number;
  pending: number;
  closed: number;
  groups: number;
}

interface TicketsContextType {
  tickets: Ticket[];
  loading: boolean;
  selectedTicket: Ticket | null;
  setSelectedTicket: (ticket: Ticket | null) => void;
  tab: TabType;
  setTab: (tab: TabType) => void;
  tabCounts: TabCounts;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResults | null;
  whatsapps: Whatsapp[];
  selectedWhatsappId: number | null;
  setSelectedWhatsappId: (id: number | null) => void;
  queues: Queue[];
  selectedQueueIds: number[];
  setSelectedQueueIds: (ids: number[]) => void;
  showAll: boolean;
  setShowAll: (show: boolean) => void;
  activeModal: ModalType;
  setActiveModal: (modal: ModalType) => void;
  contactDrawerOpen: boolean;
  setContactDrawerOpen: (open: boolean) => void;
  zoomedImage: string | null;
  setZoomedImage: (url: string | null) => void;
  pdfModalData: { url: string; filename: string } | null;
  setPdfModalData: (data: { url: string; filename: string } | null) => void;
  droppedFiles: File[];
  setDroppedFiles: (files: File[]) => void;
  presences: Record<number, { presence: string; updatedAt: number }>;
  acceptTicket: (ticketId: number) => Promise<void>;
  reopenTicket: (ticketId: number) => Promise<Ticket>;
  returnToQueue: (ticketId: number) => Promise<void>;
  transferTicket: (ticketId: number, data: { queueId?: number | null; userId?: number | null }) => Promise<void>;
  resolveTicket: (ticketId: number) => Promise<void>;
  syncTicketTags: (ticketId: number, tagIds: number[]) => Promise<void>;
  openOrCreateTicket: (contactInfo: {
    name: string;
    number: string;
    id?: number;
    queueId?: number;
    whatsappId?: number;
  }) => Promise<Ticket | null>;
  fetchTickets: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const TicketsContext = createContext<TicketsContextType>({} as TicketsContextType);

export const TicketsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuth, privateLinesHidden } = useAuth();
  const { notifyNewMessage } = useNotification();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicketState] = useState<Ticket | null>(() => {
    try {
      const stored = localStorage.getItem("chatv2_selected_ticket");
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });

  const setSelectedTicket = useCallback(
    (valueOrUpdater: Ticket | null | ((prev: Ticket | null) => Ticket | null)) => {
      setSelectedTicketState((prev) => {
        const next = typeof valueOrUpdater === "function" ? valueOrUpdater(prev) : valueOrUpdater;
        try {
          if (next) {
            localStorage.setItem("chatv2_selected_ticket", JSON.stringify(next));
          } else {
            localStorage.removeItem("chatv2_selected_ticket");
          }
        } catch {}
        return next;
      });
    },
    []
  );
  const [tab, setTab] = useState<TabType>("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [presences, setPresences] = useState<Record<number, { presence: string; updatedAt: number }>>({});

  const [whatsapps, setWhatsapps] = useState<Whatsapp[]>([]);
  const [selectedWhatsappId, setSelectedWhatsappId] = useState<number | null>(null);

  const [queues, setQueues] = useState<Queue[]>([]);
  const [selectedQueueIds, setSelectedQueueIds] = useState<number[]>([]);
  const [showAll, setShowAllState] = useState<boolean>(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const u = storedUser ? JSON.parse(storedUser) : user;
      const uId = u?.id;
      if (uId) {
        const saved = localStorage.getItem(`chatv2_showAll_${uId}`);
        if (saved !== null) {
          return saved === "true";
        }
      }
      return u?.profile === "admin";
    } catch {}
    return true;
  });

  const setShowAll = useCallback(
    (valueOrUpdater: boolean | ((prev: boolean) => boolean)) => {
      setShowAllState((prev) => {
        const next = typeof valueOrUpdater === "function" ? valueOrUpdater(prev) : valueOrUpdater;
        try {
          const storedUser = localStorage.getItem("user");
          const u = storedUser ? JSON.parse(storedUser) : user;
          const uId = u?.id || user?.id;
          if (uId) {
            localStorage.setItem(`chatv2_showAll_${uId}`, String(next));
          }
        } catch {}
        return next;
      });
    },
    [user]
  );

  // Sync saved position if user logs in or profile changes
  useEffect(() => {
    if (user?.id) {
      try {
        const saved = localStorage.getItem(`chatv2_showAll_${user.id}`);
        if (saved !== null) {
          setShowAllState(saved === "true");
        } else if (user.profile === "admin") {
          setShowAllState(true);
        }
      } catch {}
    }
  }, [user?.id, user?.profile]);

  const [tabCounts, setTabCounts] = useState<TabCounts>({
    open: 0,
    pending: 0,
    closed: 0,
    groups: 0,
  });

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [contactDrawerOpen, setContactDrawerOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [pdfModalData, setPdfModalData] = useState<{ url: string; filename: string } | null>(null);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);

  // REFS to ensure stable callbacks and eliminate infinite re-render loops
  const queuesRef = useRef<Queue[]>([]);
  const whatsappsRef = useRef<Whatsapp[]>([]);
  const selectedQueueIdsRef = useRef<number[]>([]);
  const tabRef = useRef<TabType>("open");
  const showAllRef = useRef<boolean>(showAll);
  const selectedWhatsappIdRef = useRef<number | null>(null);
  const privateLinesHiddenRef = useRef<boolean>(privateLinesHidden);
  const selectedTicketRef = useRef<Ticket | null>(null);
  const previousTicketIdRef = useRef<number | null>(null);

  useEffect(() => { queuesRef.current = queues; }, [queues]);
  useEffect(() => { whatsappsRef.current = whatsapps; }, [whatsapps]);
  useEffect(() => { selectedQueueIdsRef.current = selectedQueueIds; }, [selectedQueueIds]);
  useEffect(() => { tabRef.current = tab; }, [tab]);
  useEffect(() => { showAllRef.current = showAll; }, [showAll]);
  useEffect(() => { selectedWhatsappIdRef.current = selectedWhatsappId; }, [selectedWhatsappId]);
  useEffect(() => { privateLinesHiddenRef.current = privateLinesHidden; }, [privateLinesHidden]);
  useEffect(() => { selectedTicketRef.current = selectedTicket; }, [selectedTicket]);

  // Determine active queue IDs safely from refs or user permissions
  const getQueueIds = useCallback((): number[] => {
    if (selectedQueueIdsRef.current.length > 0) {
      return selectedQueueIdsRef.current;
    }
    // Respect the queues assigned to this user first!
    if (user?.queues && user.queues.length > 0) {
      let uIds = user.queues.map((q) => q.id);
      if (privateLinesHiddenRef.current) {
        uIds = uIds.filter((id) => {
          const q = user.queues?.find((queue) => queue.id === id);
          return !isPrivateName(q?.name);
        });
      }
      return uIds.length > 0 ? uIds : [1];
    }
    if (queuesRef.current.length > 0) {
      let allIds = queuesRef.current.map((q) => q.id);
      if (privateLinesHiddenRef.current) {
        allIds = allIds.filter((id) => {
          const q = queuesRef.current.find((queue) => queue.id === id);
          return !isPrivateName(q?.name);
        });
      }
      return allIds.length > 0 ? allIds : [1];
    }
    return [1];
  }, [user?.queues]);

  // 1. Fetch Tab Counts without triggering re-fetch of tickets
  const fetchTabCounts = useCallback(async () => {
    if (!isAuth) return;
    try {
      const qIds = getQueueIds();
      const baseParams = {
        showAll: showAllRef.current ? "true" : "false",
        queueIds: JSON.stringify(qIds),
      };

      const [openRes, pendingRes] = await Promise.allSettled([
        api.get<{ count: number; tickets: Ticket[] }>("/tickets", {
          params: { ...baseParams, status: "open" },
        }),
        api.get<{ count: number; tickets: Ticket[] }>("/tickets", {
          params: { ...baseParams, status: "pending" },
        }),
      ]);

      const openCount =
        openRes.status === "fulfilled"
          ? (openRes.value.data.count ?? openRes.value.data.tickets?.length ?? 0)
          : 0;
      const pendingCount =
        pendingRes.status === "fulfilled"
          ? (pendingRes.value.data.count ?? pendingRes.value.data.tickets?.length ?? 0)
          : 0;

      setTabCounts((prev) => ({
        ...prev,
        open: openCount,
        pending: pendingCount,
      }));
    } catch (err) {
      console.error("Error fetching tab counts:", err);
    }
  }, [isAuth, getQueueIds]);

  // 2. Fetch Tickets for current tab & filters
  const fetchTickets = useCallback(async () => {
    if (!isAuth) return;

    // Only display full spinner if list is currently empty to prevent UI epilepsy/flickering
    setTickets((prev) => {
      if (prev.length === 0) setLoading(true);
      return prev;
    });

    try {
      const qIds = getQueueIds();
      const currentTab = tabRef.current;
      const currentShowAll = showAllRef.current;

      const params: Record<string, any> = {
        status: currentTab === "groups" ? "open" : currentTab,
        showAll: currentShowAll ? "true" : "false",
        queueIds: JSON.stringify(qIds),
      };

      if (currentTab === "groups") {
        params.groups = "true";
      }

      const { data } = await api.get<{ tickets: Ticket[]; count: number }>("/tickets", { params });

      let list = data.tickets || [];

      // 1. Filter by connection if selected in dropdown
      const wId = selectedWhatsappIdRef.current;
      if (wId) {
        list = list.filter((t) => t.whatsappId === wId);
      }

      // 2. Validate restricted connection access for this user
      if (user?.id) {
        const allowedWhatsapps = getUserAllowedWhatsappIds(user.id);
        if (allowedWhatsapps && allowedWhatsapps.length > 0) {
          list = list.filter((t) => !t.whatsappId || allowedWhatsapps.includes(t.whatsappId));
        }
      }

      // 3. Trava de Linha e Fila Particular (O CADEADO)
      // When privateLinesHidden is TRUE (default):
      // Hide ANY ticket whose queue is particular OR whose connection is particular/private!
      // This applies EVEN IF showAll ("Todos") is active!
      if (privateLinesHiddenRef.current) {
        list = list.filter((t) => {
          const qName = t.queue?.name || "";
          const wName = t.whatsapp?.name || "";
          const isPrivQ = isPrivateName(qName);
          const isPrivW = isWhatsappPrivate(t.whatsappId, wName);
          return !isPrivQ && !isPrivW;
        });
      }

      setTickets(list);

      setTabCounts((prev) => ({
        ...prev,
        [currentTab]: list.length,
      }));
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuth, getQueueIds]);

  // 3. Initial Load: runs ONCE when user authenticates
  useEffect(() => {
    if (!isAuth) return;

    let mounted = true;

    const init = async () => {
      try {
        await syncPrivacySettingsFromBackend();
        const [qRes, wRes] = await Promise.allSettled([
          api.get<Queue[]>("/queue"),
          api.get<Whatsapp[]>("/whatsapp/"),
        ]);

        if (!mounted) return;

        if (qRes.status === "fulfilled") {
          const loadedQueues = qRes.value.data || [];
          setQueues(loadedQueues);
          queuesRef.current = loadedQueues;
        }

        if (wRes.status === "fulfilled") {
          const loadedWhats = wRes.value.data || [];
          setWhatsapps(loadedWhats);
          whatsappsRef.current = loadedWhats;
        }

        // Fetch counts and initial ticket list
        await fetchTabCounts();
        await fetchTickets();
      } catch (err) {
        console.error("Error in initial load:", err);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [isAuth, fetchTabCounts, fetchTickets]);

  // 4. User Interaction Effect: triggers ONLY when user actively changes tab/filters
  useEffect(() => {
    if (isAuth) {
      fetchTickets();
    }
  }, [tab, showAll, selectedQueueIds, selectedWhatsappId, privateLinesHidden, isAuth, fetchTickets]);

  // 5. Two-tiered search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const cleanQuery = searchQuery.trim();
        const cleanDigits = cleanQuery.replace(/\D/g, "");
        const qIds = getQueueIds();

        const contactsPromise = api.get<Contact[]>("/contacts", {
          params: { searchParam: cleanDigits.length >= 4 ? cleanDigits : cleanQuery },
        });

        const ticketsPromise = api.get<{ tickets: Ticket[] }>("/tickets", {
          params: {
            searchParam: cleanQuery,
            showAll: "true",
            queueIds: JSON.stringify(qIds),
          },
        });

        const [contactsRes, ticketsRes] = await Promise.allSettled([contactsPromise, ticketsPromise]);

        const contactsList =
          contactsRes.status === "fulfilled"
            ? (contactsRes.value.data as any).contacts || contactsRes.value.data || []
            : [];

        const ticketsList =
          ticketsRes.status === "fulfilled" ? ticketsRes.value.data.tickets || [] : [];

        const messagesMatch = ticketsList.map((t) => ({
          ticket: t,
          body: t.lastMessage || "",
          createdAt: t.updatedAt,
        }));

        setSearchResults({
          contacts: contactsList.slice(0, 10),
          messages: messagesMatch.slice(0, 15),
        });
      } catch (err) {
        console.error("Search error:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, getQueueIds]);

  // 6. Stable WebSocket subscription: registered ONCE, does NOT disconnect on tab switch
  useEffect(() => {
    if (!isAuth) return;
    const socket = socketService.getSocket();
    const companyId = localStorage.getItem("companyId");
    if (!socket || !companyId) return;

    socket.emit("joinNotification");
    socket.emit("joinTickets", "open");
    socket.emit("joinTickets", "pending");
    socket.emit("joinTickets", "closed");

    const isTicketAllowed = (ticket?: Ticket): boolean => {
      if (!ticket) return false;

      // 1. Linha/Fila Particular e Cadeado de Proteção
      const qName = ticket.queue?.name || "";
      const wName = ticket.whatsapp?.name || "";
      const isPrivQ = isPrivateName(qName);
      const isPrivW = isWhatsappPrivate(ticket.whatsappId, wName);

      if (privateLinesHiddenRef.current && (isPrivQ || isPrivW)) {
        return false;
      }

      // 2. Permissão de Conexão do Usuário
      if (user?.id) {
        const allowedWhatsapps = getUserAllowedWhatsappIds(user.id);
        if (allowedWhatsapps !== null) {
          if (ticket.whatsappId && !allowedWhatsapps.includes(ticket.whatsappId)) {
            return false;
          }
        } else {
          // Se não há permissão explícita, linha particular NUNCA é permitida
          if (isPrivW) {
            return false;
          }
        }
      }

      // 3. Permissão de Fila (para não-admin)
      if (user?.profile !== "admin" && user?.queues && user.queues.length > 0) {
        if (ticket.queueId) {
          const userHasQueue = user.queues.some((q) => q.id === ticket.queueId);
          if (!userHasQueue) return false;
        }
      }

      // 4. Filtro de Conexão selecionada no dropdown
      const selectedWId = selectedWhatsappIdRef.current;
      if (selectedWId && ticket.whatsappId !== selectedWId) {
        return false;
      }

      return true;
    };

    const onTicketUpdate = (data: { action: string; ticket: Ticket; ticketId?: number }) => {
      if (data.action === "update" && data.ticket) {
        // If ticket is not allowed for current user, purge it from view immediately
        if (!isTicketAllowed(data.ticket)) {
          setTickets((prev) => prev.filter((t) => t.id !== data.ticket.id));
          setSelectedTicket((prev) => (prev && prev.id === data.ticket.id ? null : prev));
          return;
        }

        setTickets((prev) => {
          const index = prev.findIndex((t) => t.id === data.ticket.id);
          const currentTab = tabRef.current;
          if (index !== -1) {
            if (data.ticket.status !== currentTab && currentTab !== "groups") {
              return prev.filter((t) => t.id !== data.ticket.id);
            }
            const updated = [...prev];
            updated[index] = { ...updated[index], ...data.ticket };
            return updated;
          }
          if (data.ticket.status === currentTab) {
            return [data.ticket, ...prev];
          }
          return prev;
        });

        setSelectedTicket((prev) => {
          if (prev && prev.id === data.ticket.id) {
            return { ...prev, ...data.ticket };
          }
          return prev;
        });

        fetchTabCounts();
      }

      if (data.action === "delete" && data.ticketId) {
        setTickets((prev) => prev.filter((t) => t.id !== data.ticketId));
        setSelectedTicket((prev) => (prev && prev.id === data.ticketId ? null : prev));
        fetchTabCounts();
      }
    };

    const onAppMessage = (data: { action: string; message: any; ticket: Ticket }) => {
      if (data.action === "create" && data.ticket) {
        // STRICT PRIVACY CHECK: Drop immediately if unauthorized!
        // No sound, no notification popup, no flashing ticket in list!
        if (!isTicketAllowed(data.ticket)) {
          return;
        }

        // Trigger notification sound and pop-ups for incoming messages
        if (!data.message?.fromMe) {
          const isCurrent = selectedTicketRef.current?.id === data.ticket.id;
          notifyNewMessage({
            ticket: data.ticket,
            message: data.message,
            contact: data.ticket.contact,
            isCurrentTicketOpen: isCurrent,
            privateLinesHidden: privateLinesHiddenRef.current,
          });
        }

        setTickets((prev) => {
          const currentTab = tabRef.current;
          const exists = prev.find((t) => t.id === data.ticket.id);
          if (exists) {
            if (data.ticket.status !== currentTab && currentTab !== "groups") {
              return prev.filter((t) => t.id !== data.ticket.id);
            }
            const filtered = prev.filter((t) => t.id !== data.ticket.id);
            const updated: Ticket = {
              ...exists,
              ...data.ticket,
              lastMessage: data.message?.body || exists.lastMessage,
              unreadMessages: (exists.unreadMessages || 0) + (data.message?.fromMe ? 0 : 1),
              updatedAt: data.message?.createdAt || exists.updatedAt,
            };
            return [updated, ...filtered];
          }
          if (data.ticket.status === currentTab) {
            return [data.ticket, ...prev];
          }
          return prev;
        });

        fetchTabCounts();
      }
    };

    const onPresenceUpdate = (data: { ticketId: number; presence: string }) => {
      if (data?.ticketId) {
        setPresences((prev) => ({
          ...prev,
          [data.ticketId]: { presence: data.presence, updatedAt: Date.now() },
        }));

        if (data.presence === "composing" || data.presence === "recording") {
          setTimeout(() => {
            setPresences((prev) => {
              const current = prev[data.ticketId];
              if (current && Date.now() - current.updatedAt >= 4000) {
                return {
                  ...prev,
                  [data.ticketId]: { presence: "available", updatedAt: Date.now() },
                };
              }
              return prev;
            });
          }, 4500);
        }
      }
    };

    socket.on(`company-${companyId}-ticket`, onTicketUpdate);
    socket.on(`company-${companyId}-appMessage`, onAppMessage);
    socket.on(`company-${companyId}-presence`, onPresenceUpdate);

    return () => {
      socket.off(`company-${companyId}-ticket`, onTicketUpdate);
      socket.off(`company-${companyId}-appMessage`, onAppMessage);
      socket.off(`company-${companyId}-presence`, onPresenceUpdate);
    };
  }, [isAuth, fetchTabCounts]);

  // Track chatbox join/leave when active ticket changes
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const previousId = previousTicketIdRef.current;
    if (previousId && previousId !== selectedTicket?.id) {
      socket.emit("leaveChatBox", String(previousId));
    }

    if (selectedTicket?.id) {
      socket.emit("joinChatBox", String(selectedTicket.id));
      previousTicketIdRef.current = selectedTicket.id;
    } else {
      previousTicketIdRef.current = null;
    }
  }, [selectedTicket?.id]);

  // 7. Ticket Actions
  const acceptTicket = async (ticketId: number) => {
    try {
      const { data: updatedTicket } = await api.put<Ticket>(`/tickets/${ticketId}`, {
        status: "open",
        userId: user?.id,
      });
      setSelectedTicket(updatedTicket);
      setTab("open");
      await fetchTickets();
      fetchTabCounts();
    } catch (err) {
      console.error("Error accepting ticket:", err);
      throw err;
    }
  };

  const reopenTicket = async (ticketId: number): Promise<Ticket> => {
    try {
      const { data: updatedTicket } = await api.put<Ticket>(`/tickets/${ticketId}`, {
        status: "open",
        userId: user?.id,
      });
      setSelectedTicket(updatedTicket);
      await fetchTickets();
      fetchTabCounts();
      return updatedTicket;
    } catch (err) {
      console.error("Error reopening ticket:", err);
      throw err;
    }
  };

  const returnToQueue = async (ticketId: number) => {
    try {
      await api.put(`/tickets/${ticketId}`, {
        status: "pending",
        userId: null,
      });
      setSelectedTicket(null);
      await fetchTickets();
      fetchTabCounts();
    } catch (err) {
      console.error("Error returning ticket to queue:", err);
      throw err;
    }
  };

  const transferTicket = async (
    ticketId: number,
    data: { queueId?: number | null; userId?: number | null }
  ) => {
    try {
      const { data: updatedTicket } = await api.put<Ticket>(`/tickets/${ticketId}`, {
        queueId: data.queueId !== undefined ? data.queueId : undefined,
        userId: data.userId !== undefined ? data.userId : undefined,
        status: data.userId ? "open" : "pending",
      });
      setSelectedTicket(updatedTicket);
      setActiveModal(null);
      await fetchTickets();
      fetchTabCounts();
    } catch (err) {
      console.error("Error transferring ticket:", err);
      throw err;
    }
  };

  const resolveTicket = async (ticketId: number) => {
    try {
      await api.put(`/tickets/${ticketId}`, {
        status: "closed",
        userId: user?.id,
      });

      const currentIndex = tickets.findIndex((t) => t.id === ticketId);
      const remaining = tickets.filter((t) => t.id !== ticketId);
      setTickets(remaining);

      if (selectedTicket?.id === ticketId) {
        if (remaining.length > 0) {
          const nextTicket = remaining[Math.min(currentIndex, remaining.length - 1)];
          setSelectedTicket(nextTicket);
        } else {
          setSelectedTicket(null);
        }
      }
      fetchTabCounts();
    } catch (err) {
      console.error("Error resolving ticket:", err);
      throw err;
    }
  };

  const syncTicketTags = async (ticketId: number, tagIds: number[]) => {
    try {
      await api.post("/tags/sync", {
        ticketId,
        tags: tagIds,
      });
      if (selectedTicket && selectedTicket.id === ticketId) {
        const { data: refreshed } = await api.get<Ticket>(`/tickets/${ticketId}`);
        setSelectedTicket(refreshed);
      }
    } catch (err) {
      console.error("Error syncing tags:", err);
      throw err;
    }
  };

  const normalizeBrazilianPhone = (phone?: string): string => {
    if (!phone) return "";
    let d = phone.replace(/\D/g, "");
    if (d.startsWith("55") && d.length >= 12) {
      d = d.slice(2);
    }
    if (d.length === 11 && d[2] === "9") {
      d = d.slice(0, 2) + d.slice(3);
    }
    return d;
  };

  const isSamePhoneNumber = (num1?: string, num2?: string) => {
    if (!num1 || !num2) return false;
    const d1 = num1.replace(/\D/g, "");
    const d2 = num2.replace(/\D/g, "");
    if (!d1 || !d2) return false;
    if (d1 === d2) return true;
    const norm1 = normalizeBrazilianPhone(d1);
    const norm2 = normalizeBrazilianPhone(d2);
    if (norm1 && norm2 && norm1 === norm2) return true;
    if (d1.length >= 8 && d2.length >= 8 && d1.slice(-8) === d2.slice(-8)) {
      return true;
    }
    return false;
  };

  const activateTicketView = (targetTicket: Ticket) => {
    setTab(targetTicket.status === "pending" ? "pending" : "open");
    setSelectedTicket(targetTicket);
    setSearchQuery("");
    setSearchResults(null);
    setActiveModal(null);
    setTimeout(() => {
      const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
      textarea?.focus();
      const chatContainer = document.getElementById("chat-messages-container");
      if (chatContainer) {
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
      }
    }, 120);
  };

  const openOrCreateTicket = async (contactInfo: {
    name: string;
    number: string;
    id?: number;
    queueId?: number;
    whatsappId?: number;
  }) => {
    const cleanDigits = (contactInfo.number || "").replace(/\D/g, "");
    let contactId = contactInfo.id;
    const qIds = getQueueIds();

    try {
      // 1. If we don't have contactId, find or insert contact
      if (!contactId && (cleanDigits || contactInfo.name)) {
        try {
          const { data: contact } = await api.post<Contact>("/contacts/findOrInsert", {
            name: contactInfo.name || cleanDigits,
            number: cleanDigits,
          });
          contactId = contact.id;
        } catch (cErr) {
          console.warn("Could not findOrInsert contact:", cErr);
        }
      }

      // 2. Check in-memory tickets first
      const existingInState = tickets.find((t) => {
        if (contactId && t.contactId === contactId) return true;
        if (cleanDigits && t.contact?.number) {
          return isSamePhoneNumber(cleanDigits, t.contact.number);
        }
        return false;
      });

      if (existingInState) {
        activateTicketView(existingInState);
        return existingInState;
      }

      // 3. Check server for existing ticket by contactId or search
      if (contactId) {
        try {
          const { data: searchData } = await api.get<{ tickets: Ticket[] }>("/tickets", {
            params: {
              contactId,
              showAll: "true",
              notClosed: "true",
              queueIds: JSON.stringify(qIds),
            },
          });
          const found = (searchData.tickets || []).find(
            (t) => t.status === "open" || t.status === "pending"
          );
          if (found) {
            activateTicketView(found);
            return found;
          }
        } catch (sErr) {
          console.warn("Could not check existing tickets by contactId:", sErr);
        }
      }

      if (cleanDigits) {
        try {
          const searchParam = cleanDigits.length >= 8 ? cleanDigits.slice(-8) : cleanDigits;
          const { data: searchData } = await api.get<{ tickets: Ticket[] }>("/tickets", {
            params: {
              searchParam,
              showAll: "true",
              notClosed: "true",
              queueIds: JSON.stringify(qIds),
            },
          });
          const found = (searchData.tickets || []).find(
            (t) =>
              (t.status === "open" || t.status === "pending") &&
              (isSamePhoneNumber(cleanDigits, t.contact?.number) || (contactId && t.contactId === contactId))
          );
          if (found) {
            activateTicketView(found);
            return found;
          }
        } catch (sErr) {
          console.warn("Could not search existing tickets by cleanDigits:", sErr);
        }
      }

      // 4. Create or obtain ticket on current queue and whatsapp connection
      const defaultQueueId =
        contactInfo.queueId || selectedTicket?.queueId || (queuesRef.current.length > 0 ? queuesRef.current[0].id : 1);
      const chosenWhatsappId =
        contactInfo.whatsappId || selectedTicket?.whatsappId || selectedWhatsappId || undefined;

      const { data: ticket } = await api.post<Ticket>("/tickets", {
        contactId,
        status: "open",
        userId: user?.id,
        queueId: defaultQueueId,
        whatsappId: chosenWhatsappId,
      });

      activateTicketView(ticket);
      await fetchTickets();
      fetchTabCounts();
      return ticket;
    } catch (err: any) {
      console.error("Error opening or creating ticket:", err);
      if (err.response?.data?.ticket) {
        const existingTicket = err.response.data.ticket;
        activateTicketView(existingTicket);
        return existingTicket;
      }

      // If backend threw collision or error, locate and open the existing ticket
      try {
        const searchParam = cleanDigits.length >= 8 ? cleanDigits.slice(-8) : (cleanDigits || contactInfo.name);
        const { data: searchData } = await api.get<{ tickets: Ticket[] }>("/tickets", {
          params: {
            searchParam,
            showAll: "true",
            notClosed: "true",
            queueIds: JSON.stringify(qIds),
          },
        });
        const found =
          (searchData.tickets || []).find(
            (t) =>
              (contactId && t.contactId === contactId) ||
              (cleanDigits && isSamePhoneNumber(cleanDigits, t.contact?.number))
          ) || (searchData.tickets || [])[0];

        if (found) {
          activateTicketView(found);
          return found;
        }
      } catch (sErr) {
        console.warn("Could not find existing ticket after collision:", sErr);
      }
      return null;
    }
  };

  const refreshAll = useCallback(async () => {
    try {
      const [qRes, wRes] = await Promise.allSettled([
        api.get<Queue[]>("/queue"),
        api.get<Whatsapp[]>("/whatsapp/"),
      ]);

      if (qRes.status === "fulfilled") {
        setQueues(qRes.value.data || []);
      }
      if (wRes.status === "fulfilled") {
        setWhatsapps(wRes.value.data || []);
      }
      await fetchTabCounts();
      await fetchTickets();
    } catch (err) {
      console.error("Error refreshing all:", err);
    }
  }, [fetchTabCounts, fetchTickets]);

  return (
    <TicketsContext.Provider
      value={{
        tickets,
        loading,
        selectedTicket,
        setSelectedTicket,
        tab,
        setTab,
        tabCounts,
        searchQuery,
        setSearchQuery,
        searchResults,
        whatsapps,
        selectedWhatsappId,
        setSelectedWhatsappId,
        queues,
        selectedQueueIds,
        setSelectedQueueIds,
        showAll,
        setShowAll,
        activeModal,
        setActiveModal,
        contactDrawerOpen,
        setContactDrawerOpen,
        zoomedImage,
        setZoomedImage,
        pdfModalData,
        setPdfModalData,
        droppedFiles,
        setDroppedFiles,
        presences,
        acceptTicket,
        reopenTicket,
        returnToQueue,
        transferTicket,
        resolveTicket,
        syncTicketTags,
        openOrCreateTicket,
        fetchTickets,
        refreshAll,
      }}
    >
      {children}
    </TicketsContext.Provider>
  );
};

export const useTickets = () => useContext(TicketsContext);
