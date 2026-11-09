import React from "react";
import type { Ticket } from "../../types";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Camera, Mic, FileText, Eye, XCircle, User } from "lucide-react";
import { useTickets } from "../../context/TicketsContext";

interface TicketListItemProps {
  ticket: Ticket;
  isSelected: boolean;
  onSelect: () => void;
  onPeek?: (ticket: Ticket) => void;
  onResolve?: (ticket: Ticket) => void;
}

export const TicketListItem: React.FC<TicketListItemProps> = ({
  ticket,
  isSelected,
  onSelect,
  onPeek,
  onResolve,
}) => {
  const { presences } = useTickets();
  const [imgError, setImgError] = React.useState(false);
  const contactName = ticket.contact?.name || ticket.contact?.number || "Sem Nome";
  const unread = ticket.unreadMessages || 0;

  const currentPresence = presences[ticket.id]?.presence;
  const isTyping = currentPresence === "composing";
  const isRecording = currentPresence === "recording";

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isToday(date)) return format(date, "HH:mm");
      if (isYesterday(date)) return "Ontem";
      return format(date, "dd/MM/yy", { locale: ptBR });
    } catch {
      return "";
    }
  };

  const getMediaIcon = (body?: string) => {
    if (!body) return null;
    if (body.includes("ticketzvCard") || body.includes("BEGIN:VCARD")) {
      return <User size={13} className="text-whatsapp-green shrink-0 inline mr-1" />;
    }
    if (body.includes("audio-record-site") || body.includes("Áudio") || body.includes("🔊")) {
      return <Mic size={13} className="text-gray-400 shrink-0 inline mr-1" />;
    }
    if (body.match(/\.(jpg|jpeg|png|webp|gif)/i) || body.includes("Foto")) {
      return <Camera size={13} className="text-gray-400 shrink-0 inline mr-1" />;
    }
    if (body.match(/\.(pdf|docx|xlsx|zip)/i)) {
      return <FileText size={13} className="text-gray-400 shrink-0 inline mr-1" />;
    }
    return null;
  };

  const formatLastMessageText = (body?: string) => {
    if (!body) return "Nova conversa";
    if (body.includes("ticketzvCard") || body.includes("BEGIN:VCARD")) {
      return "Contato compartilhado";
    }
    return body;
  };

  return (
    <div
      onClick={onSelect}
      className={`group h-[68px] px-3.5 flex items-center gap-3 cursor-pointer border-b border-whatsapp-light-border/60 dark:border-whatsapp-dark-border/40 transition select-none ${
        isSelected
          ? "bg-whatsapp-light-active dark:bg-whatsapp-dark-active"
          : "hover:bg-whatsapp-light-hover dark:hover:bg-whatsapp-dark-hover"
      }`}
    >
      <div className="relative shrink-0">
        <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 overflow-hidden text-sm">
          {ticket.contact?.profilePicUrl && !imgError ? (
            <img
              src={ticket.contact.profilePicUrl}
              alt=""
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            contactName.slice(0, 2).toUpperCase()
          )}
        </div>
        {ticket.isGroup && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white dark:border-whatsapp-dark-panel" />
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-semibold text-xs text-whatsapp-light-text dark:text-whatsapp-dark-text truncate">
            {contactName}
          </span>
          <span
            className={`text-[10px] shrink-0 ml-1 ${
              unread > 0 ? "text-whatsapp-green font-semibold" : "text-gray-400"
            }`}
          >
            {formatDate(ticket.updatedAt)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mb-1">
          {ticket.queue && (
            <span
              className="text-[9px] px-1.5 py-0.2 rounded font-medium truncate max-w-[90px]"
              style={{
                backgroundColor: `${ticket.queue.color}20`,
                color: ticket.queue.color,
                border: `1px solid ${ticket.queue.color}40`,
              }}
            >
              {ticket.queue.name}
            </span>
          )}

          {ticket.whatsapp && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium truncate max-w-[85px]">
              {ticket.whatsapp.name}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate flex items-center pr-2">
            {isTyping ? (
              <span className="text-whatsapp-green font-semibold animate-pulse">digitando...</span>
            ) : isRecording ? (
              <span className="text-whatsapp-green font-semibold animate-pulse">gravando áudio...</span>
            ) : (
              <>
                {getMediaIcon(ticket.lastMessage)}
                <span className="truncate">{formatLastMessageText(ticket.lastMessage)}</span>
              </>
            )}
          </p>

          <div className="flex items-center gap-1 shrink-0">
            {/* Quick Cancel/Resolve button (Envia direto para os finalizados sem precisar puxar) */}
            {ticket.status !== "closed" && onResolve && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    window.confirm(
                      `Deseja cancelar/finalizar o chamado de "${contactName}" e mover para os Finalizados?`
                    )
                  ) {
                    onResolve(ticket);
                  }
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-red-500/15 text-gray-400 hover:text-red-500 transition"
                title="Cancelar / Finalizar chamado direto (sem precisar atender)"
              >
                <XCircle size={13} />
              </button>
            )}

            {onPeek && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPeek(ticket);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-amber-500 transition"
                title="Espiar conversa (não marca como lido)"
              >
                <Eye size={13} />
              </button>
            )}

            {unread > 0 && (
              <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-whatsapp-green text-white text-[10px] font-bold flex items-center justify-center">
                {unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketListItem;
