import React from "react";
import { ArrowLeft, X, Check, CheckCheck, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Message } from "../../types";
import { useEscapeKey } from "../common/useEscapeKey";
import { WhatsAppFormattedText } from "../common/WhatsAppFormattedText";

interface MessageInfoModalProps {
  message: Message | null;
  onClose: () => void;
}

export const MessageInfoModal: React.FC<MessageInfoModalProps> = ({ message, onClose }) => {
  useEscapeKey(onClose, Boolean(message));

  if (!message) return null;

  const formatMessageTime = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr), "HH:mm");
    } catch {
      return "";
    }
  };

  const formatStatusTime = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const time = format(date, "HH:mm");
      if (isToday) {
        return `Hoje às ${time}`;
      }
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const ack = message.ack ?? (message.fromMe ? 1 : 3);
  const isRead = ack >= 3;
  const isDelivered = ack >= 2;
  const isSent = ack >= 1;

  // Timestamps
  const sentTime = formatStatusTime(message.createdAt);
  const deliveredTime = isDelivered ? formatStatusTime(message.updatedAt || message.createdAt) : "—";
  const readTime = isRead ? formatStatusTime(message.updatedAt || message.createdAt) : "—";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm sm:max-w-md bg-[#ffffff] dark:bg-[#111b21] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#222e35] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header matching WhatsApp Mobile / Web */}
        <div className="h-14 px-4 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-gray-200 dark:border-[#222e35] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              type="button"
              className="p-1 rounded-full text-gray-600 dark:text-[#aebac1] hover:bg-black/10 dark:hover:bg-white/10 transition"
              title="Voltar"
            >
              <ArrowLeft size={20} />
            </button>
            <span className="font-semibold text-base text-gray-900 dark:text-[#e9edef]">
              Dados da mensagem
            </span>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-[#e9edef] transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Bubble Preview Section on Chat Background */}
        <div className="p-4 sm:p-6 bg-[#efeae2] dark:bg-[#0b141a] border-b border-gray-200 dark:border-[#222e35] flex justify-end">
          <div
            className={`max-w-[85%] rounded-lg px-3 py-2 shadow-sm text-xs select-text ${
              message.fromMe
                ? "bg-whatsapp-light-outgoing dark:bg-whatsapp-dark-outgoing text-whatsapp-light-text dark:text-whatsapp-dark-text rounded-tr-none"
                : "bg-whatsapp-light-incoming dark:bg-whatsapp-dark-incoming text-whatsapp-light-text dark:text-whatsapp-dark-text rounded-tl-none"
            }`}
          >
            {/* Sender Name */}
            <span className="font-bold text-whatsapp-green block truncate mb-1">
              {message.fromMe ? "Você:" : `${message.contact?.name || "Cliente"}:`}
            </span>

            {/* Body */}
            {message.body ? (
              <div className="whitespace-pre-wrap break-words leading-relaxed">
                <WhatsAppFormattedText text={message.body} />
              </div>
            ) : message.mediaUrl ? (
              <span className="italic text-gray-400">Arquivo de mídia</span>
            ) : null}

            {/* Time & Ack */}
            <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-gray-400 select-none">
              <span>{formatMessageTime(message.createdAt)}</span>
              {message.fromMe && (
                isRead ? (
                  <CheckCheck size={14} className="text-[#53bdeb]" />
                ) : isDelivered ? (
                  <CheckCheck size={14} className="text-gray-400" />
                ) : isSent ? (
                  <Check size={14} className="text-gray-400" />
                ) : (
                  <Clock size={12} className="text-gray-400" />
                )
              )}
            </div>
          </div>
        </div>

        {/* Read / Delivered / Sent Delivery Status List (exact WhatsApp Mobile layout) */}
        <div className="p-4 sm:p-6 space-y-4 bg-white dark:bg-[#111b21] text-xs">
          {/* 1. Lida */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {isRead ? (
                <CheckCheck size={18} className="text-[#53bdeb]" />
              ) : (
                <CheckCheck size={18} className="text-gray-300 dark:text-gray-600" />
              )}
            </div>
            <div className="flex-1">
              <span className="font-semibold text-sm text-gray-900 dark:text-[#e9edef] block">
                Lida
              </span>
              <span className={`text-xs ${isRead ? "text-gray-600 dark:text-[#8696a0]" : "text-gray-400 dark:text-gray-500 italic"}`}>
                {readTime}
              </span>
            </div>
          </div>

          <div className="border-b border-gray-100 dark:border-[#222e35] ml-7" />

          {/* 2. Entregue */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {isDelivered ? (
                <CheckCheck size={18} className="text-gray-400 dark:text-gray-400" />
              ) : (
                <Clock size={18} className="text-gray-300 dark:text-gray-600" />
              )}
            </div>
            <div className="flex-1">
              <span className="font-semibold text-sm text-gray-900 dark:text-[#e9edef] block">
                Entregue
              </span>
              <span className={`text-xs ${isDelivered ? "text-gray-600 dark:text-[#8696a0]" : "text-gray-400 dark:text-gray-500 italic"}`}>
                {deliveredTime}
              </span>
            </div>
          </div>

          <div className="border-b border-gray-100 dark:border-[#222e35] ml-7" />

          {/* 3. Enviada */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {isSent ? (
                <Check size={18} className="text-gray-400 dark:text-gray-400" />
              ) : (
                <Clock size={18} className="text-gray-300 dark:text-gray-600" />
              )}
            </div>
            <div className="flex-1">
              <span className="font-semibold text-sm text-gray-900 dark:text-[#e9edef] block">
                Enviada
              </span>
              <span className="text-xs text-gray-600 dark:text-[#8696a0]">
                {sentTime}
              </span>
            </div>
          </div>

          {/* Extra metadata if edited or deleted */}
          {(message.isEdited || message.isDeleted) && (
            <div className="pt-2 mt-2 border-t border-gray-100 dark:border-[#222e35] flex items-center gap-2">
              {message.isEdited && (
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium text-[11px]">
                  Mensagem editada
                </span>
              )}
              {message.isDeleted && (
                <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-medium text-[11px]">
                  Mensagem apagada
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageInfoModal;
