import React from "react";
import { MessageSquare, X, ChevronRight } from "lucide-react";
import { useNotification, type NotificationToast } from "../../context/NotificationContext";
import { useTickets } from "../../context/TicketsContext";
import { getBackendUrl } from "../../services/api";

export const NotificationToastsContainer: React.FC = () => {
  const { toasts, dismissToast } = useNotification();
  const { setSelectedTicket, setTab } = useTickets();
  const backendUrl = getBackendUrl();

  if (toasts.length === 0) return null;

  const handleOpenTicket = (toast: NotificationToast) => {
    if (toast.ticket) {
      setSelectedTicket(toast.ticket);
      if (toast.ticket.status) {
        setTab(toast.ticket.status as any);
      }
    }
    dismissToast(toast.id);
  };

  const getFullAvatarUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const base = backendUrl.startsWith("http") ? `${backendUrl}/public` : `/backend/public`;
    return `${base}/${url}`;
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => handleOpenTicket(toast)}
          className="pointer-events-auto bg-white dark:bg-whatsapp-dark-panel border border-whatsapp-light-border dark:border-whatsapp-dark-border rounded-2xl p-3.5 shadow-2xl flex items-start gap-3 cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all transform animate-fadeIn duration-200"
          style={{
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            {toast.profilePicUrl ? (
              <img
                src={getFullAvatarUrl(toast.profilePicUrl)}
                alt={toast.contactName}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-whatsapp-green/40"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-whatsapp-green/15 text-whatsapp-green font-bold flex items-center justify-center text-sm ring-2 ring-whatsapp-green/30">
                {toast.contactName ? toast.contactName.slice(0, 2).toUpperCase() : "WA"}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-whatsapp-green text-white flex items-center justify-center ring-2 ring-white dark:ring-whatsapp-dark-panel">
              <MessageSquare size={9} />
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="font-bold text-xs text-whatsapp-light-text dark:text-whatsapp-dark-text truncate">
                {toast.contactName}
              </span>
              <span className="text-[10px] text-gray-400 shrink-0">{toast.time}</span>
            </div>

            {toast.queueName && (
              <span
                className="inline-block text-[9px] px-1.5 py-0.2 rounded font-medium my-0.5"
                style={{
                  backgroundColor: `${toast.queueColor || "#1273DE"}20`,
                  color: toast.queueColor || "#1273DE",
                }}
              >
                {toast.queueName}
              </span>
            )}

            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-0.5 leading-snug">
              {toast.messageBody}
            </p>

            <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-gray-100 dark:border-gray-800">
              <span className="text-[10px] text-whatsapp-green font-semibold flex items-center gap-0.5 hover:underline">
                <span>Clique para responder</span>
                <ChevronRight size={11} />
              </span>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismissToast(toast.id);
            }}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover transition -mr-1 -mt-1"
            title="Fechar"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToastsContainer;
