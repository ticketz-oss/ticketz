import React, { useEffect, useState, useRef } from "react";
import { X, Eye, MessageCircle, Loader2, ArrowRight, XCircle } from "lucide-react";
import api, { getBackendUrl } from "../../services/api";
import { WhatsAppFormattedText } from "./WhatsAppFormattedText";
import { ImageLightboxModal } from "./ImageLightboxModal";
import { useEscapeKey } from "./useEscapeKey";
import { loadContactMessagesHistory } from "../../services/contactHistoryService";
import { useTickets } from "../../context/TicketsContext";
import type { Ticket, Message } from "../../types";

interface ChatPeekModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  onOpenFullChat: (ticket: Ticket) => void;
  onResolveTicket?: (ticket: Ticket) => void;
}

export const ChatPeekModal: React.FC<ChatPeekModalProps> = ({
  ticket,
  onClose,
  onOpenFullChat,
  onResolveTicket,
}) => {
  const { queues } = useTickets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [zoomedPic, setZoomedPic] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const backendUrl = getBackendUrl();

  // Escape key priority: If zoomedPic is open, ImageLightboxModal's useEscapeKey captures it first.
  // If zoomedPic is not open, this hook captures ESC, closes peek, and prevents App.tsx from closing the chat!
  useEscapeKey(onClose, Boolean(ticket) && !zoomedPic);

  useEffect(() => {
    setImgError(false);
  }, [ticket?.id]);

  useEffect(() => {
    if (!ticket?.id) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    // CRITICAL: markAsRead: "false" ensures Baileys/WhatsApp never sends blue ticks or marks as read!
    // 1. Load current ticket messages immediately
    api
      .get<any>(`/messages/${ticket.id}`, {
        params: { markAsRead: "false" },
      })
      .then(({ data }) => {
        if (isMounted) {
          const list = Array.isArray(data) ? data : data.messages || [];
          setMessages(list);
        }
      })
      .catch((err) => {
        console.error("Error peeking ticket messages:", err);
      });

    // 2. Load complete contact history across all previous tickets without marking as read
    loadContactMessagesHistory(ticket, false, queues.map((q) => q.id))
      .then((fullList) => {
        if (isMounted && fullList.length > 0) {
          setMessages(fullList);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
          }, 40);
        }
      })
      .catch((err) => {
        console.warn("Error loading contact history in peek:", err);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [ticket]);

  if (!ticket) return null;

  const contactName = ticket.contact?.name || ticket.contact?.number || "Contato";
  const contactNumber = ticket.contact?.number || "";

  const getMediaUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const base = backendUrl.startsWith("http") ? `${backendUrl}/public` : `/backend/public`;
    return `${base}/${url}`;
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="w-full max-w-lg bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#222e35] flex flex-col overflow-hidden max-h-[85vh] animate-scaleUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-gray-200 dark:border-[#2a3942] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="relative cursor-pointer group"
                onClick={() => {
                  if (ticket.contact?.profilePicUrl && !imgError) {
                    setZoomedPic(ticket.contact.profilePicUrl);
                  }
                }}
                title={ticket.contact?.profilePicUrl && !imgError ? "Clique para ampliar foto de perfil" : ""}
              >
                {ticket.contact?.profilePicUrl && !imgError ? (
                  <img
                    src={ticket.contact.profilePicUrl}
                    alt={contactName}
                    onError={() => setImgError(true)}
                    className="w-10 h-10 rounded-full object-cover group-hover:ring-2 group-hover:ring-whatsapp-green transition"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-whatsapp-green/20 text-whatsapp-green font-bold flex items-center justify-center text-sm">
                    {contactName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shadow" title="Modo Espiar">
                  <Eye size={10} />
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-whatsapp-light-text dark:text-whatsapp-dark-text truncate">
                    {contactName}
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                    Espiar
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {contactNumber} {ticket.unreadMessages && ticket.unreadMessages > 0 ? `• ${ticket.unreadMessages} não lidas` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullChat(ticket);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-whatsapp-green hover:bg-whatsapp-green-dark text-white font-medium text-xs flex items-center gap-1 transition shadow-sm"
                title="Abrir no painel principal e responder"
              >
                <span>Abrir</span>
                <ArrowRight size={13} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover transition"
                title="Fechar (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Message preview list with WhatsApp background */}
          <div className="flex-1 overflow-y-auto p-4 chat-wallpaper flex flex-col gap-2 min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center my-auto py-10 text-gray-400 gap-2">
                <Loader2 size={24} className="animate-spin text-whatsapp-green" />
                <span className="text-xs">Carregando histórico...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center my-auto py-10 text-gray-400">
                <MessageCircle size={28} className="mb-1 opacity-50" />
                <span className="text-xs">Nenhuma mensagem recente.</span>
              </div>
            ) : (
              messages.map((msg) => {
                const fromMe = msg.fromMe;
                return (
                  <div
                    key={msg.id}
                    className={`flex w-full ${fromMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-2.5 py-1.5 shadow-sm text-xs ${
                        fromMe
                          ? "bg-whatsapp-light-outgoing dark:bg-whatsapp-dark-outgoing text-whatsapp-light-text dark:text-whatsapp-dark-text"
                          : "bg-whatsapp-light-incoming dark:bg-whatsapp-dark-incoming text-whatsapp-light-text dark:text-whatsapp-dark-text"
                      }`}
                    >
                      {/* Media thumbnail if exists */}
                      {msg.mediaUrl && (
                        <div className="mb-1 rounded overflow-hidden">
                          {msg.mediaType === "image" || msg.mediaUrl.match(/\.(png|jpe?g|webp)$/i) ? (
                            <img
                              src={getMediaUrl(msg.mediaUrl)}
                              alt="Mídia"
                              className="max-h-40 w-full object-cover rounded cursor-pointer"
                              onClick={() => setZoomedPic(getMediaUrl(msg.mediaUrl))}
                            />
                          ) : msg.mediaType === "audio" || msg.mediaUrl.match(/\.(ogg|mp3|wav)$/i) ? (
                            <div className="text-[11px] text-gray-500 italic">🎵 Mensagem de voz</div>
                          ) : (
                            <div className="text-[11px] text-gray-500 italic">📎 {msg.body || "Documento anexo"}</div>
                          )}
                        </div>
                      )}

                      {/* Message body */}
                      {msg.body && (
                        <div className="break-words">
                          <WhatsAppFormattedText text={msg.body} />
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="flex justify-end mt-1 text-[10px] text-gray-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-gray-200 dark:border-[#2a3942] flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-[#8696a0] text-[11px]">
              {messages.length} mensagens no histórico
            </span>
            <div className="flex items-center gap-2">
              {onResolveTicket && ticket.status !== "closed" && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Deseja cancelar/finalizar o chamado de "${contactName}" e mover para os Finalizados?`
                      )
                    ) {
                      onResolveTicket(ticket);
                      onClose();
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 font-semibold transition flex items-center gap-1.5"
                  title="Cancelar / Finalizar direto sem responder"
                >
                  <XCircle size={14} />
                  <span>Cancelar Chamado</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullChat(ticket);
                }}
                className="px-3 py-1.5 bg-whatsapp-green hover:bg-whatsapp-green-dark text-white rounded-lg font-medium transition flex items-center gap-1.5 shadow-xs"
              >
                <span>Responder no Chat</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ImageLightboxModal
        src={zoomedPic}
        images={messages
          .filter((m) => m.mediaUrl && (m.mediaType === "image" || m.mediaUrl.match(/\.(png|jpe?g|webp)$/i)))
          .map((m) => getMediaUrl(m.mediaUrl))}
        alt={contactName}
        onClose={() => setZoomedPic(null)}
      />
    </>
  );
};

export default ChatPeekModal;
