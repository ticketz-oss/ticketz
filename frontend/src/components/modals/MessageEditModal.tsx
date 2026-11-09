import React, { useState, useEffect } from "react";
import { X, Edit3, Check, Loader2 } from "lucide-react";
import api from "../../services/api";
import type { Message } from "../../types";
import { useEscapeKey } from "../common/useEscapeKey";

interface MessageEditModalProps {
  message: Message | null;
  onClose: () => void;
  onUpdated: (messageId: string, newBody: string) => void;
}

export const MessageEditModal: React.FC<MessageEditModalProps> = ({
  message,
  onClose,
  onUpdated,
}) => {
  useEscapeKey(onClose, Boolean(message));

  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (message?.body) {
      setText(message.body);
    }
    setErrorMsg("");
  }, [message]);

  if (!message) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setErrorMsg("O texto da mensagem não pode ficar vazio.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      await api.post(`/messages/edit/${message.id}`, {
        body: text.trim(),
      });
      onUpdated(message.id, text.trim());
      onClose();
    } catch (err: any) {
      console.error("Error editing message:", err);
      setErrorMsg(
        err.response?.data?.message || "Não foi possível editar esta mensagem no WhatsApp."
      );
    } finally {
      setSaving(false);
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
            <Edit3 size={18} className="text-whatsapp-green" />
            <span className="font-bold text-sm text-whatsapp-light-text dark:text-whatsapp-dark-text">
              Editar Mensagem Enviada
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

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            A mensagem será atualizada no WhatsApp do cliente e um histórico da versão anterior ficará salvo no sistema.
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-xl border border-whatsapp-light-border dark:border-whatsapp-dark-border bg-gray-50 dark:bg-whatsapp-dark-hover/40 text-xs text-whatsapp-light-text dark:text-whatsapp-dark-text focus:outline-none focus:border-whatsapp-green resize-y"
            placeholder="Digite o novo texto da mensagem..."
            autoFocus
          />

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !text.trim()}
              className="px-4 py-2 rounded-xl bg-whatsapp-green hover:bg-whatsapp-green-dark text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              <span>Salvar Alteração</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessageEditModal;
