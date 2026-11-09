import React, { useState, useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";
import ContactDrawer from "../modals/ContactDrawer";
import { useTickets } from "../../context/TicketsContext";
import api from "../../services/api";
import socketService from "../../services/socket";
import type { Message, MediaUploadItem } from "../../types";
import { Shield, MessageSquare, UploadCloud, Clock, CheckCircle2, RotateCcw, Loader2, Mic, ChevronDown } from "lucide-react";
import MediaPreviewModal from "../common/MediaPreviewModal";
import { ImageLightboxModal } from "../common/ImageLightboxModal";
import { PdfViewerModal } from "../common/PdfViewerModal";
import MessageInfoModal from "../modals/MessageInfoModal";
import MessageEditHistoryModal from "../modals/MessageEditHistoryModal";
import MessageEditModal from "../modals/MessageEditModal";
import { loadContactMessagesHistory } from "../../services/contactHistoryService";
import { getSignMessagePreference } from "../../services/privacyService";
import { useSettingsContext } from "../../context/SettingsContext";

interface ChatAreaProps {
  onBackMobile: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ onBackMobile }) => {
  const {
    selectedTicket,
    queues,
    reopenTicket,
    presences,
    zoomedImage,
    setZoomedImage,
    pdfModalData,
    setPdfModalData,
    droppedFiles,
    setDroppedFiles,
  } = useTickets();
  const { settings, getMediaUrl } = useSettingsContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Presence status for current ticket (typing indicator)
  const activePresence = selectedTicket?.id ? presences[selectedTicket.id]?.presence : undefined;
  const isTyping = activePresence === "composing";
  const isRecordingAudio = activePresence === "recording";
  const showTimelineTyping = isTyping || isRecordingAudio;

  // WhatsApp Message Actions States
  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);
  const [infoMessage, setInfoMessage] = useState<Message | null>(null);
  const [historyMessage, setHistoryMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [localReactions, setLocalReactions] = useState<Record<string, string[]>>({});
  const [floatingDateLabel, setFloatingDateLabel] = useState<string>("");
  const [isScrollingDate, setIsScrollingDate] = useState<boolean>(false);
  const scrollDateTimeoutRef = useRef<any>(null);
  const [showScrollBottom, setShowScrollBottom] = useState<boolean>(false);

  const INITIAL_VISIBLE_COUNT = 60;
  const BATCH_SIZE = 50;
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_VISIBLE_COUNT);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const isPrependingRef = useRef(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const dragCounterRef = useRef(0);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    if (showTimelineTyping) {
      scrollToBottom(true);
    }
  }, [showTimelineTyping]);

  useEffect(() => {
    setZoomedImage(null);
    setPdfModalData(null);
    setReplyingMessage(null);
    setInfoMessage(null);
    setHistoryMessage(null);
    setEditingMessage(null);
    setVisibleLimit(INITIAL_VISIBLE_COUNT);

    if (!selectedTicket?.id) {
      setMessages([]);
      return;
    }

    setLoading(true);
    socketService.joinChat(selectedTicket.id);

    let isMounted = true;

    // 1. Load current ticket messages immediately for instant display
    api
      .get<any>(`/messages/${selectedTicket.id}`)
      .then((res) => {
        if (!isMounted) return;
        const msgList = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.messages)
          ? res.data.messages
          : [];
        setMessages(msgList);
        setTimeout(() => scrollToBottom(false), 50);
      })
      .catch((err) => {
        console.error("Error loading messages:", err);
      });

    // 2. Load complete contact history across all tickets in background
    loadContactMessagesHistory(selectedTicket, true, queues.map((q) => q.id))
      .then((fullList) => {
        if (!isMounted) return;
        if (fullList.length > 0) {
          setMessages(fullList);
          setTimeout(() => scrollToBottom(false), 50);
        }
      })
      .catch((err) => {
        console.error("Error loading full contact history:", err);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      socketService.leaveChat(selectedTicket.id);
    };
  }, [selectedTicket?.id]);

  useEffect(() => {
    const socket = socketService.getSocket();
    const companyId = localStorage.getItem("companyId");
    if (!socket || !companyId || !selectedTicket?.id) return;

    const onAppMessage = (data: { action: string; message: Message; ticket: any }) => {
      const isMatch =
        data.message.ticketId === selectedTicket.id ||
        (Boolean(selectedTicket.contactId) && data.ticket?.contactId === selectedTicket.contactId);

      if (data.action === "create" && isMatch) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        setTimeout(scrollToBottom, 60);
      } else if (data.action === "update" && isMatch) {
        setMessages((prev) =>
          prev.map((m) => (m.id === data.message.id ? { ...m, ...data.message } : m))
        );
      }
    };

    socket.on(`company-${companyId}-appMessage`, onAppMessage);

    return () => {
      socket.off(`company-${companyId}-appMessage`, onAppMessage);
    };
  }, [selectedTicket?.id]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const types = Array.from(e.dataTransfer.types || []);
    // Only accept actual file drops from external OS filesystem, NOT dragged DOM elements
    if (!types.includes("Files")) return;

    dragCounterRef.current += 1;
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      setIsDraggingOver(false);
      dragCounterRef.current = 0;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const types = Array.from(e.dataTransfer.types || []);
    if (!types.includes("Files")) {
      e.dataTransfer.dropEffect = "none";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounterRef.current = 0;

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      setDroppedFiles(files);
    }
  };

  const handleSendDroppedMedia = async (items: MediaUploadItem[], captionText: string) => {
    setDroppedFiles([]);
    if (!selectedTicket?.id) return;
    const formData = new FormData();
    formData.append("fromMe", "true");

    const signMessage = getSignMessagePreference(selectedTicket.whatsappId, selectedTicket.whatsapp?.name);
    let bodyText = captionText.trim();
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    if (bodyText && signMessage && user?.name) {
      bodyText = `*${user.name}:*\n${bodyText}`;
    }

    if (bodyText) {
      formData.append("body", bodyText);
    }

    items.forEach((item) => {
      formData.append("medias", item.file, item.name);
    });

    await api.post(`/messages/${selectedTicket.id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    scrollToBottom(true);
  };

  const handleReactMessage = async (msg: Message, emoji: string) => {
    if (!selectedTicket?.id) return;
    try {
      const currentList = localReactions[msg.id] || [];
      const hasReaction = currentList.includes(emoji);
      const emojiToSend = hasReaction ? "" : emoji;

      setLocalReactions((prev) => {
        const current = prev[msg.id] || [];
        const next = hasReaction ? current.filter((e) => e !== emoji) : [...current, emoji];
        return { ...prev, [msg.id]: next };
      });

      await api.post(`/messages/react/${msg.id}`, {
        ticketId: selectedTicket.id,
        emoji: emojiToSend,
      });
    } catch (err) {
      console.error("Error reacting to message:", err);
    }
  };

  const handleDeleteMessage = async (msg: Message) => {
    if (!window.confirm("Deseja realmente apagar esta mensagem para todos?")) return;
    try {
      await api.delete(`/messages/${msg.id}`);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, isDeleted: true } : m))
      );
    } catch (err) {
      console.error("Error deleting message:", err);
      alert("Não foi possível apagar a mensagem.");
    }
  };

  // Separate reactions from visible messages
  const visibleMessages: Message[] = [];
  const reactionsMap: Record<string, string[]> = { ...localReactions };

  messages.forEach((msg) => {
    if (msg.mediaType === "reactionMessage") {
      const targetId = msg.quotedMsgId || msg.quotedMsg?.id;
      if (targetId && msg.body) {
        if (!reactionsMap[targetId]) {
          reactionsMap[targetId] = [];
        }
        if (!reactionsMap[targetId].includes(msg.body)) {
          reactionsMap[targetId].push(msg.body);
        }
      }
    } else {
      visibleMessages.push(msg);
    }
  });

  const totalVisible = visibleMessages.length;
  const hasOlderMessages = totalVisible > visibleLimit;
  const displayedMessages = hasOlderMessages
    ? visibleMessages.slice(-visibleLimit)
    : visibleMessages;

  const handleTimelineScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;

    // 1. Detect scroll position away from bottom (> 200px)
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollBottom(distanceFromBottom > 200);

    // 2. Prepend older messages when near top
    if (container.scrollTop < 80 && hasOlderMessages && !isPrependingRef.current) {
      isPrependingRef.current = true;
      const prevScrollHeight = container.scrollHeight;
      const prevScrollTop = container.scrollTop;

      setVisibleLimit((prev) => {
        const next = prev + BATCH_SIZE;
        requestAnimationFrame(() => {
          if (timelineRef.current) {
            const heightDiff = timelineRef.current.scrollHeight - prevScrollHeight;
            timelineRef.current.scrollTop = prevScrollTop + heightDiff;
          }
          setTimeout(() => {
            isPrependingRef.current = false;
          }, 100);
        });
        return next;
      });
    }

    // 3. Detect active date of messages currently visible near top
    const containerRect = container.getBoundingClientRect();
    const msgElements = container.querySelectorAll("[data-msg-date]");
    let activeDate: string | null = null;
    for (let i = 0; i < msgElements.length; i++) {
      const el = msgElements[i];
      const rect = el.getBoundingClientRect();
      if (rect.bottom >= containerRect.top + 35) {
        activeDate = el.getAttribute("data-msg-date");
        break;
      }
    }

    if (activeDate) {
      const label = getDateSeparatorLabel(activeDate);
      if (label) {
        setFloatingDateLabel(label);
      }
    }

    setIsScrollingDate(true);
    if (scrollDateTimeoutRef.current) clearTimeout(scrollDateTimeoutRef.current);
    scrollDateTimeoutRef.current = setTimeout(() => {
      setIsScrollingDate(false);
    }, 1500);
  };

  const handleScrollToQuoted = (targetId: string) => {
    const idx = visibleMessages.findIndex((m) => m.id === targetId);
    if (idx !== -1) {
      const needed = totalVisible - idx + 10;
      setVisibleLimit((prev) => Math.max(prev, needed));
      setTimeout(() => {
        const el = document.getElementById(`msg-${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("highlight-quote-flash");
          setTimeout(() => el.classList.remove("highlight-quote-flash"), 1600);
        }
      }, 80);
    }
  };

  const getDateSeparatorLabel = (dateStr?: string): string => {
    if (!dateStr) return "";
    try {
      const msgDate = new Date(dateStr);
      if (isNaN(msgDate.getTime())) return "";

      const today = new Date();
      const msgDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
      const curDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const diffDays = Math.round((curDay.getTime() - msgDay.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Hoje";
      if (diffDays === 1) return "Ontem";

      if (diffDays > 1 && diffDays < 7) {
        const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(msgDate);
        return weekday.charAt(0).toUpperCase() + weekday.slice(1);
      }

      if (msgDate.getFullYear() === today.getFullYear()) {
        return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(msgDate);
      }

      return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(msgDate);
    } catch {
      return "";
    }
  };

  const getDateKey = (dateStr?: string): string => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    } catch {
      return "";
    }
  };

  if (!selectedTicket) {
    const isDarkMode = document.documentElement.classList.contains("dark");
    const heroLogo = isDarkMode
      ? settings.appLogoDark || settings.appLogoLight
      : settings.appLogoLight || settings.appLogoDark;

    return (
      <div className="hidden md:flex flex-1 h-full flex-col items-center justify-center bg-whatsapp-light-bg dark:bg-whatsapp-dark-bg p-8 select-none text-center border-b-[6px] border-whatsapp-green animate-fadeIn">
        {heroLogo ? (
          <div className="max-w-[220px] max-h-24 mb-5 flex items-center justify-center">
            <img
              src={getMediaUrl(heroLogo)}
              alt={settings.appName || "Logo"}
              className="max-h-24 max-w-full object-contain filter drop-shadow-md"
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-whatsapp-green/10 flex items-center justify-center text-whatsapp-green mb-4">
            <MessageSquare size={40} />
          </div>
        )}
        <h2 className="text-xl font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text mb-2">
          {settings.appName || "Ticketz Neo Atendimento"}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mb-6 leading-relaxed">
          Envie e receba mensagens com suporte a envio rápido de arquivos,
          áudios de voz e respostas rápidas com a identidade da sua empresa.
        </p>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <Shield size={14} className="text-whatsapp-green" />
          <span>Suas conversas sincronizadas diretamente com seu WhatsApp.</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative flex-1 h-full flex flex-col overflow-hidden bg-whatsapp-light-bg dark:bg-whatsapp-dark-bg"
    >
      {/* Fullscreen Drag Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-40 bg-whatsapp-green/90 dark:bg-whatsapp-green-dark/95 backdrop-blur-sm flex flex-col items-center justify-center text-white border-4 border-dashed border-white m-3 rounded-2xl animate-fadeIn">
          <UploadCloud size={64} className="animate-bounce mb-3" />
          <h3 className="text-lg font-bold">Solte os arquivos aqui!</h3>
          <p className="text-xs text-white/80 mt-1">
            Você poderá adicionar legendas e visualizar antes de enviar.
          </p>
        </div>
      )}

      {/* Media Preview Modal for Drop */}
      <MediaPreviewModal
        files={droppedFiles}
        isOpen={droppedFiles.length > 0}
        onClose={() => setDroppedFiles([])}
        onSend={handleSendDroppedMedia}
      />

      {/* Advanced Image Lightbox Modal with Zoom, Fullscreen, Pan, Rotate, Carousel & Download */}
      <ImageLightboxModal
        src={zoomedImage}
        images={messages
          .filter((m) => m.mediaUrl && (m.mediaType === "image" || m.mediaUrl.match(/\.(png|jpe?g|webp)$/i)))
          .map((m) => getMediaUrl(m.mediaUrl))}
        onClose={() => setZoomedImage(null)}
      />

      {/* In-app PDF Viewer Modal */}
      <PdfViewerModal
        url={pdfModalData?.url || null}
        filename={pdfModalData?.filename}
        onClose={() => setPdfModalData(null)}
      />

      {/* Header */}
      <ChatHeader
        ticket={selectedTicket}
        onBackMobile={onBackMobile}
        onOpenImageModal={(url) => setZoomedImage(url)}
      />

      {/* Main Chat Body & Contact Drawer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages and Input */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Message Timeline */}
          <div
            ref={timelineRef}
            onScroll={handleTimelineScroll}
            className="flex-1 overflow-y-auto py-2 chat-wallpaper"
          >
            {/* WhatsApp Floating Sticky Date Pill while scrolling */}
            <div
              className={`sticky top-2 z-20 flex justify-center pointer-events-none transition-opacity duration-300 ${
                isScrollingDate && floatingDateLabel ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="px-3.5 py-1 rounded-lg bg-white/95 dark:bg-[#182229]/95 text-gray-700 dark:text-[#8696a0] text-[11px] font-semibold shadow-md border border-gray-200/80 dark:border-[#222d34] backdrop-blur-md">
                {floatingDateLabel}
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32 text-xs text-gray-400">
                Carregando histórico...
              </div>
            ) : displayedMessages.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-xs text-gray-400">
                Inicie a conversa enviando uma mensagem abaixo.
              </div>
            ) : (
              <>
                {hasOlderMessages && (
                  <div className="flex justify-center my-2 select-none">
                    <button
                      type="button"
                      onClick={() => {
                        if (timelineRef.current) {
                          const container = timelineRef.current;
                          const prevHeight = container.scrollHeight;
                          const prevTop = container.scrollTop;
                          setVisibleLimit((prev) => prev + BATCH_SIZE);
                          requestAnimationFrame(() => {
                            const diff = container.scrollHeight - prevHeight;
                            container.scrollTop = prevTop + diff;
                          });
                        }
                      }}
                      className="px-3 py-1 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-gray-500 dark:text-gray-400 text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs backdrop-blur-xs"
                    >
                      <Clock size={12} />
                      <span>Carregar mensagens anteriores ({totalVisible - visibleLimit} restantes)</span>
                    </button>
                  </div>
                )}
                {displayedMessages.map((message, idx) => {
                  const prevMsg = idx > 0 ? displayedMessages[idx - 1] : null;
                  const currentDayKey = getDateKey(message.createdAt);
                  const prevDayKey = prevMsg ? getDateKey(prevMsg.createdAt) : null;
                  const isDateChanged = idx === 0 || (Boolean(currentDayKey) && currentDayKey !== prevDayKey);
                  const dateLabel = isDateChanged ? getDateSeparatorLabel(message.createdAt) : "";

                  const isDifferentTicket =
                    prevMsg &&
                    message.ticketId &&
                    prevMsg.ticketId &&
                    message.ticketId !== prevMsg.ticketId;

                  return (
                    <div key={message.id} data-msg-date={message.createdAt} className="w-full">
                      {isDateChanged && dateLabel && (
                        <div className="flex justify-center my-3 select-none">
                          <span className="px-3 py-1 rounded-lg bg-white/90 dark:bg-[#182229]/95 text-gray-600 dark:text-[#8696a0] text-[11px] font-medium shadow-xs border border-gray-200/60 dark:border-[#222d34] backdrop-blur-xs">
                            {dateLabel}
                          </span>
                        </div>
                      )}
                      {isDifferentTicket && (
                        <div className="flex items-center justify-center my-3 select-none">
                          <span className="px-3 py-1 rounded-full bg-black/10 dark:bg-white/10 text-[10px] text-gray-500 dark:text-gray-400 font-medium border border-black/5 dark:border-white/5 shadow-2xs backdrop-blur-xs">
                            ── Atendimento Anterior Finalizado ──
                          </span>
                        </div>
                      )}
                      <MessageItem
                        message={message}
                        reactions={reactionsMap[message.id] || []}
                        onOpenImageModal={(url) => setZoomedImage(url)}
                        onOpenPdfModal={(url, filename) => setPdfModalData({ url, filename })}
                        onReply={(msg) => setReplyingMessage(msg)}
                        onReact={handleReactMessage}
                        onEdit={(msg) => setEditingMessage(msg)}
                        onDelete={handleDeleteMessage}
                        onInfo={(msg) => setInfoMessage(msg)}
                        onShowHistory={(msg) => setHistoryMessage(msg)}
                        onScrollToQuoted={handleScrollToQuoted}
                      />
                    </div>
                  );
                })}
              </>
            )}
            {/* Incoming typing/audio recording bubble in timeline */}
            {showTimelineTyping && (
              <div className="flex justify-start my-2 animate-fadeIn select-none">
                <div className="bg-whatsapp-light-panel dark:bg-whatsapp-dark-panel border border-whatsapp-light-border dark:border-whatsapp-dark-border text-whatsapp-light-text dark:text-whatsapp-dark-text rounded-2xl rounded-tl-xs px-3.5 py-2 shadow-xs flex items-center gap-2 max-w-[260px]">
                  {isTyping ? (
                    <>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium italic">digitando</span>
                      <span className="flex items-center gap-1 ml-0.5">
                        <span className="w-1.5 h-1.5 bg-whatsapp-green rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-whatsapp-green rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-whatsapp-green rounded-full animate-bounce" />
                      </span>
                    </>
                  ) : (
                    <>
                      <Mic size={15} className="text-red-500 animate-pulse shrink-0" />
                      <span className="text-xs text-red-500 dark:text-red-400 font-medium italic">gravando áudio...</span>
                    </>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* WhatsApp Floating Scroll to Bottom Button */}
          {showScrollBottom && (
            <button
              type="button"
              onClick={() => {
                scrollToBottom(true);
                setShowScrollBottom(false);
              }}
              className="absolute bottom-16 sm:bottom-20 right-4 sm:right-6 z-30 w-10 h-10 rounded-full bg-white dark:bg-[#202c33] text-gray-600 dark:text-gray-300 shadow-xl border border-gray-200/90 dark:border-[#2a3942] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#2a3942] active:scale-95 transition-all cursor-pointer animate-fadeIn"
              title="Rolar para as novas mensagens"
            >
              <ChevronDown size={22} className="stroke-[2.5]" />
            </button>
          )}

          {/* Bottom Input or Reopen Banner for Closed Tickets */}
          {selectedTicket.status === "closed" ? (
            <div className="p-4 bg-whatsapp-light-panel dark:bg-whatsapp-dark-panel border-t border-whatsapp-light-border dark:border-whatsapp-dark-border flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left select-none animate-fadeIn">
              <div className="flex items-center gap-2.5 text-gray-500 dark:text-gray-400">
                <CheckCircle2 size={20} className="text-gray-400 shrink-0" />
                <span className="text-xs">
                  Este atendimento está <strong>finalizado</strong>. Reabra o chamado para enviar mensagens.
                </span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setReopening(true);
                  try {
                    await reopenTicket(selectedTicket.id);
                  } catch (err: any) {
                    alert(err?.response?.data?.message || "Erro ao reabrir atendimento.");
                  } finally {
                    setReopening(false);
                  }
                }}
                disabled={reopening}
                className="px-4 py-2 bg-whatsapp-green hover:bg-whatsapp-green-dark text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
              >
                {reopening ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                <span>Reabrir Atendimento</span>
              </button>
            </div>
          ) : (
            <MessageInput
              ticketId={selectedTicket.id}
              whatsappId={selectedTicket.whatsappId}
              whatsappName={selectedTicket.whatsapp?.name}
              replyingMessage={replyingMessage}
              onCancelReply={() => setReplyingMessage(null)}
              onMessageSent={() => {
                setReplyingMessage(null);
                scrollToBottom(true);
              }}
            />
          )}
        </div>

        {/* Contact Drawer on the right */}
        <ContactDrawer onOpenImageModal={(url) => setZoomedImage(url)} />
      </div>

      {/* Message Info Modal */}
      <MessageInfoModal
        message={infoMessage}
        onClose={() => setInfoMessage(null)}
      />

      {/* Message Edit History Modal */}
      <MessageEditHistoryModal
        message={historyMessage}
        onClose={() => setHistoryMessage(null)}
      />

      {/* Message Edit Modal */}
      <MessageEditModal
        message={editingMessage}
        onClose={() => setEditingMessage(null)}
        onUpdated={(msgId, newBody) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === msgId ? { ...m, body: newBody, isEdited: true } : m))
          );
        }}
      />
    </div>
  );
};

export default ChatArea;
