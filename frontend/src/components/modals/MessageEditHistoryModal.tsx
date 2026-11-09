import React, { useState, useEffect } from "react";
import { X, History, Loader2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import api from "../../services/api";
import type { Message } from "../../types";
import { useEscapeKey } from "../common/useEscapeKey";

interface MessageEditHistoryModalProps {
  message: Message | null;
  onClose: () => void;
}

interface OldMessage {
  id: number;
  messageId: string;
  body: string;
  createdAt: string;
}

export const MessageEditHistoryModal: React.FC<MessageEditHistoryModalProps> = ({
  message,
  onClose,
}) => {
  useEscapeKey(onClose, Boolean(message));

  const [oldMessages, setOldMessages] = useState<OldMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!message?.id) return;
    setLoading(true);

    api
      .get<{ oldMessages: OldMessage[] }>(`/messages/${message.id}/history`)
      .then((res) => {
        setOldMessages(res.data.oldMessages || []);
      })
      .catch((err) => {
        console.error("Error loading message edit history:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [message?.id]);

  if (!message) return null;

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-whatsapp-dark-panel rounded-2xl shadow-2xl border border-whatsapp-light-border dark:border-whatsapp-dark-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-14 px-5 border-b border-whatsapp-light-border dark:border-whatsapp-dark-border flex items-center justify-between bg-whatsapp-light-panel dark:bg-whatsapp-dark-panel">
          <div className="flex items-center gap-2">
            <History size={18} className="text-whatsapp-green" />
            <span className="font-bold text-sm text-whatsapp-light-text dark:text-whatsapp-dark-text">
              Histórico de Edições da Mensagem
            </span>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4 text-xs">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Loader2 size={24} className="animate-spin mb-2" />
              <span>Buscando versões anteriores...</span>
            </div>
          ) : oldMessages.length === 0 ? (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-whatsapp-dark-hover/30 text-gray-500 text-center">
              Nenhuma versão anterior registrada no banco para esta mensagem.
            </div>
          ) : (
            <div className="space-y-4">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Como era antes ({oldMessages.length} {oldMessages.length === 1 ? "versão anterior" : "versões anteriores"})
              </span>

              {oldMessages.map((old, idx) => (
                <div
                  key={old.id || idx}
                  className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-whatsapp-light-text dark:text-whatsapp-dark-text space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                    <span>Versão #{idx + 1} (Original / Anterior)</span>
                    <span>{formatDate(old.createdAt)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/5 dark:bg-black/30 font-normal leading-relaxed select-text whitespace-pre-wrap">
                    {old.body}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Current Message Version */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-whatsapp-green uppercase tracking-wider">
              <ArrowRight size={13} />
              <span>Versão Atual da Mensagem</span>
            </div>
            <div className="p-3 rounded-xl bg-whatsapp-green/10 border border-whatsapp-green/30 text-whatsapp-light-text dark:text-whatsapp-dark-text select-text whitespace-pre-wrap leading-relaxed">
              {message.body}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageEditHistoryModal;
