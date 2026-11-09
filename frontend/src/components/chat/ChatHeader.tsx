import React, { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Smartphone,
  RotateCcw,
  ArrowRightLeft,
  Info,
  UserCheck,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import type { Ticket } from "../../types";
import { useTickets } from "../../context/TicketsContext";

interface ChatHeaderProps {
  ticket: Ticket;
  onBackMobile: () => void;
  onOpenImageModal?: (url: string) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  ticket,
  onBackMobile,
  onOpenImageModal,
}) => {
  const {
    acceptTicket,
    returnToQueue,
    resolveTicket,
    setActiveModal,
    contactDrawerOpen,
    setContactDrawerOpen,
    presences,
  } = useTickets();

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, text?: string, field?: string) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
    if (field) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const contactName = ticket.contact?.name || ticket.contact?.number || "Sem Nome";
  const isPending = ticket.status === "pending";

  const currentPresence = presences[ticket.id]?.presence || ticket.contact?.presence;
  const isTyping = currentPresence === "composing";
  const isRecording = currentPresence === "recording";
  const isOnline = currentPresence === "available";

  const handleAccept = async () => {
    setLoadingAction("accept");
    try {
      await acceptTicket(ticket.id);
    } catch (err) {
      console.error("Error accepting ticket:", err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReturnToQueue = async () => {
    if (!window.confirm("Deseja realmente devolver este atendimento para a fila?")) return;
    setLoadingAction("return");
    try {
      await returnToQueue(ticket.id);
    } catch (err) {
      console.error("Error returning ticket to queue:", err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResolve = async () => {
    setLoadingAction("resolve");
    try {
      await resolveTicket(ticket.id);
    } catch (err) {
      console.error("Error resolving ticket:", err);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="min-h-14 px-3.5 bg-whatsapp-light-panel dark:bg-whatsapp-dark-panel border-b border-whatsapp-light-border dark:border-whatsapp-dark-border flex items-center justify-between select-none shrink-0 z-10 shadow-xs pt-[env(safe-area-inset-top)]">
      {/* Contact Profile & Queue info */}
      <div className="flex items-center gap-2.5 overflow-hidden">
        <button
          onClick={onBackMobile}
          type="button"
          className="sm:hidden p-2 -ml-1.5 rounded-full min-w-[40px] min-h-[40px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover text-whatsapp-light-text dark:text-whatsapp-dark-text transition cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>

        <div
          onClick={(e) => {
            if (ticket.contact?.profilePicUrl && !imgError && onOpenImageModal) {
              e.stopPropagation();
              onOpenImageModal(ticket.contact.profilePicUrl);
            } else {
              setContactDrawerOpen(!contactDrawerOpen);
            }
          }}
          className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 text-xs overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-whatsapp-green transition"
          title={ticket.contact?.profilePicUrl && !imgError ? "Ampliar foto de perfil" : "Ver dados do contato"}
        >
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

        <div className="flex flex-col min-w-0 select-text">
          <div className="flex items-center gap-2">
            <span
              onClick={() => {
                const sel = window.getSelection()?.toString();
                if (sel && sel.length > 0) return;
                setContactDrawerOpen(!contactDrawerOpen);
              }}
              data-selectable="true"
              className="font-bold text-xs sm:text-sm text-whatsapp-light-text dark:text-whatsapp-dark-text truncate leading-tight cursor-pointer hover:underline select-text"
              title="Clique para ver dados do contato (ou arraste para selecionar)"
            >
              {contactName}
            </span>
            {ticket.queue && (
              <span
                className="text-[9px] px-1.5 py-0.2 rounded-full font-bold truncate shrink-0 select-none"
                style={{
                  backgroundColor: `${ticket.queue.color}20`,
                  color: ticket.queue.color,
                }}
              >
                {ticket.queue.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] truncate select-text">
            {isTyping ? (
              <span className="text-whatsapp-green font-semibold animate-pulse select-none">
                digitando...
              </span>
            ) : isRecording ? (
              <span className="text-whatsapp-green font-semibold animate-pulse select-none">
                gravando áudio...
              </span>
            ) : isOnline ? (
              <span className="text-whatsapp-green font-medium flex items-center gap-1 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-whatsapp-green animate-pulse" />
                online
              </span>
            ) : (
              <div className="flex items-center gap-1">
                <span
                  data-selectable="true"
                  className="text-gray-500 dark:text-gray-400 select-text cursor-text font-mono"
                  title="Clique e arraste para selecionar o número"
                >
                  {ticket.contact?.number}
                </span>
                {ticket.contact?.number && (
                  <button
                    type="button"
                    onClick={(e) => handleCopy(e, ticket.contact?.number, "header-number")}
                    className="p-0.5 rounded text-gray-400 hover:text-whatsapp-green transition shrink-0 cursor-pointer"
                    title="Copiar número"
                  >
                    {copiedField === "header-number" ? (
                      <Check size={11} className="text-whatsapp-green" />
                    ) : (
                      <Copy size={11} />
                    )}
                  </button>
                )}
              </div>
            )}
            {ticket.user && (
              <span className="hidden sm:inline text-gray-400 select-none">
                • {ticket.user.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Action Buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Connection name pill */}
        {ticket.whatsapp && (
          <div
            className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] bg-gray-100 dark:bg-whatsapp-dark-hover text-gray-500 dark:text-gray-300 border border-whatsapp-light-border dark:border-whatsapp-dark-border"
            title={`Linha ${ticket.whatsapp.name}`}
          >
            <Smartphone size={11} className="text-whatsapp-green" />
            <span className="max-w-[80px] truncate">{ticket.whatsapp.name}</span>
          </div>
        )}

        {/* If pending: Show "Aceitar Atendimento" button */}
        {isPending ? (
          <button
            onClick={handleAccept}
            disabled={loadingAction === "accept"}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-whatsapp-green text-white hover:bg-whatsapp-green/90 transition shadow-sm active:scale-95 disabled:opacity-50"
            title="Aceitar e iniciar atendimento deste cliente"
          >
            {loadingAction === "accept" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <UserCheck size={14} />
            )}
            <span>Aceitar</span>
          </button>
        ) : (
          <>
            {/* Return to queue button */}
            <button
              onClick={handleReturnToQueue}
              disabled={loadingAction === "return"}
              type="button"
              className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-500/10 transition cursor-pointer"
              title="Devolver atendimento para a fila"
            >
              {loadingAction === "return" ? (
                <Loader2 size={16} className="animate-spin text-amber-500" />
              ) : (
                <RotateCcw size={16} />
              )}
            </button>

            {/* Transfer ticket button */}
            <button
              onClick={() => setActiveModal("transfer")}
              type="button"
              className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-500/10 transition cursor-pointer"
              title="Transferir para outra fila ou atendente"
            >
              <ArrowRightLeft size={16} />
            </button>

            {/* Resolve / Finalize ticket button */}
            <button
              onClick={handleResolve}
              disabled={loadingAction === "resolve"}
              type="button"
              className="flex items-center gap-1 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold bg-whatsapp-green/10 text-whatsapp-green hover:bg-whatsapp-green hover:text-white transition active:scale-95 border border-whatsapp-green/30 cursor-pointer"
              title="Finalizar atendimento"
            >
              {loadingAction === "resolve" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              <span className="hidden sm:inline">Finalizar</span>
            </button>
          </>
        )}

        {/* Contact Info Drawer toggle button */}
        <button
          onClick={() => setContactDrawerOpen(!contactDrawerOpen)}
          type="button"
          className={`p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition cursor-pointer ${
            contactDrawerOpen
              ? "bg-whatsapp-green/15 text-whatsapp-green font-bold"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover"
          }`}
          title="Ver detalhes do cliente, tags e notas"
        >
          <Info size={17} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
