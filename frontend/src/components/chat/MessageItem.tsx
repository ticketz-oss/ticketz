import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import {
  Check,
  CheckCheck,
  Clock,
  FileText,
  Download,
  MessageCircle,
  Eye,
  Sparkles,
  ChevronDown,
  Reply,
  Copy,
  Info,
  History,
  Edit3,
  Trash2,
  Ban,
  User,
} from "lucide-react";
import type { Message } from "../../types";
import { getBackendUrl } from "../../services/api";
import { CustomAudioPlayer } from "../common/CustomAudioPlayer";
import { WhatsAppFormattedText } from "../common/WhatsAppFormattedText";
import { useTickets } from "../../context/TicketsContext";
import { parsePixInfo } from "../../utils/pixParser";
import { PixCard } from "./PixCard";
import { parseLocationInfo } from "../../utils/locationParser";
import { LocationCard } from "./LocationCard";

interface MessageItemProps {
  message: Message;
  reactions?: string[];
  onOpenImageModal: (url: string) => void;
  onOpenPdfModal?: (url: string, filename: string) => void;
  onReply?: (message: Message) => void;
  onReact?: (message: Message, emoji: string) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onInfo?: (message: Message) => void;
  onShowHistory?: (message: Message) => void;
  onScrollToQuoted?: (messageId: string) => void;
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  reactions = [],
  onOpenImageModal,
  onOpenPdfModal,
  onReply,
  onReact,
  onEdit,
  onDelete,
  onInfo,
  onShowHistory,
  onScrollToQuoted,
}) => {
  const { openOrCreateTicket, selectedTicket } = useTickets();
  const fromMe = message.fromMe;
  const backendUrl = getBackendUrl();
  const pixInfo = parsePixInfo(message);
  const locationInfo = parseLocationInfo(message);

  const [menuOpen, setMenuOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const itemContainerRef = useRef<HTMLDivElement | null>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const getFullMediaUrl = (url?: string) => {
    if (!url || typeof url !== "string") return "";
    if (url.startsWith("http")) return url;
    const base = backendUrl.startsWith("http") ? `${backendUrl}/public` : `/backend/public`;
    return `${base}/${url}`;
  };

  const formatMessageTime = (dateStr: string) => {
    try {
      if (!dateStr) return "";
      return format(new Date(dateStr), "HH:mm");
    } catch {
      return "";
    }
  };

  const renderAck = (ack?: number) => {
    if (!fromMe) return null;
    if (ack === 0) return <Clock size={13} className="text-gray-400 inline ml-1 shrink-0" />;
    if (ack === 1) return <Check size={14} className="text-gray-400 inline ml-1 shrink-0" />;
    if (ack === 2) return <CheckCheck size={14} className="text-gray-400 inline ml-1 shrink-0" />;
    if (ack === 3 || ack === 4) {
      return <CheckCheck size={14} className="text-[#53bdeb] inline ml-1 shrink-0" />;
    }
    return <Check size={14} className="text-gray-400 inline ml-1 shrink-0" />;
  };

  // Improved robust vCard parsing & multi-card extraction
  const contactCards: Array<{ name: string; number: string }> = (() => {
    const cards: Array<{ name: string; number: string }> = [];

    const parseSingleVCard = (
      vcardStr: string,
      defaultName?: string,
      defaultNumber?: string
    ): { name: string; number: string } => {
      let name = defaultName || "";
      let number = defaultNumber || "";

      if (vcardStr) {
        const waidMatch = vcardStr.match(/waid=(\d+)/i);
        if (waidMatch) {
          number = waidMatch[1];
        } else {
          const telMatch = vcardStr.match(/(?:item\d*\.)?TEL[^:]*:([+0-9\s().-]+)/i);
          if (telMatch) {
            number = telMatch[1].replace(/\D/g, "");
          }
        }

        if (!name) {
          const fnMatch = vcardStr.match(/(?:^|\n)FN[^:]*:(.+)/i);
          if (fnMatch) {
            name = fnMatch[1].trim();
          }
        }

        if (!name) {
          const bizMatch = vcardStr.match(/X-WA-BIZ-NAME:(.+)/i);
          if (bizMatch) {
            name = bizMatch[1].trim();
          }
        }

        if (!name) {
          const nMatch = vcardStr.match(/(?:^|\n)N[^:]*:(.+)/i);
          if (nMatch) {
            const parts = nMatch[1].split(";").map((p) => p.trim()).filter(Boolean);
            if (parts.length > 0) {
              name = parts.reverse().join(" ");
            }
          }
        }
      }

      return {
        name: name || "Contato",
        number: number || "",
      };
    };

    // Try 1: message.body JSON (e.g. ticketzvCard or contacts array)
    if (typeof message.body === "string" && message.body.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(message.body);
        const rawCards =
          parsed?.ticketzvCard ||
          parsed?.contacts ||
          (parsed?.vcard ? [parsed] : null);

        if (Array.isArray(rawCards)) {
          for (const item of rawCards) {
            if (item?.vcard) {
              cards.push(parseSingleVCard(item.vcard, item.displayName || item.name, item.number));
            } else if (item?.displayName || item?.name || item?.number) {
              cards.push({
                name: item.displayName || item.name || "Contato",
                number: (item.number || "").replace(/\D/g, ""),
              });
            }
          }
        }
      } catch {}
    }

    // Try 2: message.body contains raw BEGIN:VCARD
    if (cards.length === 0 && typeof message.body === "string" && message.body.includes("BEGIN:VCARD")) {
      const rawBlocks = message.body.split(/(?=BEGIN:VCARD)/i).filter((b) => b.includes("BEGIN:VCARD"));
      for (const block of rawBlocks) {
        cards.push(parseSingleVCard(block));
      }
    }

    // Try 3: message.dataJson (Baileys contactMessage or contactsArrayMessage)
    if (cards.length === 0 && message.dataJson) {
      try {
        const dj = typeof message.dataJson === "string" ? JSON.parse(message.dataJson) : message.dataJson;
        const msgObj = dj?.message || dj;

        if (msgObj?.contactMessage) {
          const cm = msgObj.contactMessage;
          cards.push(parseSingleVCard(cm.vcard, cm.displayName));
        } else if (msgObj?.contactsArrayMessage?.contacts) {
          for (const cm of msgObj.contactsArrayMessage.contacts) {
            cards.push(parseSingleVCard(cm.vcard, cm.displayName));
          }
        }
      } catch {}
    }

    // Try 4: mediaType is contact or contactMessage
    if (
      cards.length === 0 &&
      (message.mediaType === "contact" ||
        message.mediaType === "contactMessage" ||
        message.mediaType === "contactsArrayMessage" ||
        message.mediaType === "vcard")
    ) {
      cards.push({
        name: message.body && !message.body.startsWith("{") ? message.body : "Contato",
        number: "",
      });
    }

    return cards;
  })();

  const isVCard = Boolean(
    contactCards.length > 0 ||
    message.mediaType === "contactMessage" ||
    message.mediaType === "contactsArrayMessage" ||
    message.mediaType === "contact" ||
    message.mediaType === "vcard" ||
    (typeof message.body === "string" &&
      (message.body.includes("ticketzvCard") || message.body.includes("BEGIN:VCARD")))
  );

  const hasMediaUrl = Boolean(message.mediaUrl && typeof message.mediaUrl === "string");
  const mediaUrlLower = hasMediaUrl ? (message.mediaUrl as string).toLowerCase() : "";

  const isSticker = Boolean(
    message.mediaType === "sticker" ||
      (message.dataJson && typeof message.dataJson === "string" && message.dataJson.includes("stickerMessage")) ||
      (hasMediaUrl && mediaUrlLower.endsWith(".webp") && (!message.body || message.body.trim() === ""))
  );

  const isAudio =
    hasMediaUrl &&
    (message.mediaType === "audio" ||
      Boolean(mediaUrlLower.match(/\.(ogg|mp3|wav|m4a|aac|webm)$/i)) ||
      Boolean(mediaUrlLower.includes("audio-record")));

  const isImage =
    !isSticker &&
    hasMediaUrl &&
    (message.mediaType === "image" ||
      Boolean(mediaUrlLower.match(/\.(png|jpe?g|webp|gif)$/i)));

  const isVideo =
    hasMediaUrl &&
    !isAudio &&
    !mediaUrlLower.includes("audio-record") &&
    (message.mediaType === "video" ||
      Boolean(mediaUrlLower.match(/\.(mp4|mov)$/i)));

  const isDocument =
    hasMediaUrl &&
    !isSticker &&
    (message.mediaType === "document" ||
      message.mediaType === "application" ||
      (!isAudio && !isImage && !isVideo));

  const isPdf =
    isDocument &&
    (mediaUrlLower.endsWith(".pdf") ||
      (typeof message.body === "string" && message.body.toLowerCase().endsWith(".pdf")));

  const hasAudioTranscription =
    isAudio &&
    typeof message.body === "string" &&
    message.body.trim() !== "" &&
    message.body !== "🔊" &&
    !message.body.endsWith(".ogg") &&
    !message.body.endsWith(".mp3") &&
    !message.body.endsWith(".wav");

  const documentName = (() => {
    // 1. If mediaUrl exists, extract filename
    if (hasMediaUrl) {
      const parts = (message.mediaUrl as string).split("/");
      const raw = decodeURIComponent(parts.pop() || "");
      if (raw && !raw.startsWith("http")) {
        // Strip timestamp prefix if formatted like 1793294533899_filename or 1793294533899-filename
        const cleanName = raw.replace(/^\d+[-_]/, "");
        return cleanName || raw;
      }
    }
    // 2. If message.body is non-empty and not just a signature or generic marker
    if (typeof message.body === "string" && message.body.trim()) {
      const trimmed = message.body.trim();
      if (!trimmed.match(/^\*[^*]+:\*$/)) {
        return trimmed;
      }
    }
    return "Documento";
  })();

  const handleCopy = () => {
    if (message.body) {
      navigator.clipboard.writeText(message.body);
    }
    setMenuOpen(false);
  };

  const handleOpenMenu = (triggerY?: number) => {
    const y = triggerY ?? itemContainerRef.current?.getBoundingClientRect().bottom ?? 0;
    const spaceBelow = window.innerHeight - y;
    setOpenUpwards(spaceBelow < 280);
    setMenuOpen(true);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    handleOpenMenu(e.clientY);
  };

  return (
    <div
      id={`msg-${message.id}`}
      ref={itemContainerRef}
      onContextMenu={handleContextMenu}
      className={`group relative flex w-full my-1 px-4 ${fromMe ? "justify-end" : "justify-start"}`}
    >
      {/* Main Message Bubble */}
      <div
        className={`relative text-xs select-text ${
          isSticker
            ? "bg-transparent shadow-none p-0 max-w-[140px] sm:max-w-[160px]"
            : `max-w-[85%] sm:max-w-[70%] md:max-w-[55%] rounded-lg px-2.5 py-1.5 shadow-sm ${
                fromMe
                  ? "bg-whatsapp-light-outgoing dark:bg-whatsapp-dark-outgoing text-whatsapp-light-text dark:text-whatsapp-dark-text rounded-tr-none"
                  : "bg-whatsapp-light-incoming dark:bg-whatsapp-dark-incoming text-whatsapp-light-text dark:text-whatsapp-dark-text rounded-tl-none"
              }`
        }`}
      >
        {/* Subtle WhatsApp-style down-chevron setinha on bubble hover */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (menuOpen) {
              setMenuOpen(false);
            } else {
              handleOpenMenu(e.clientY);
            }
          }}
          className={`absolute top-1 right-1 z-10 p-0.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-black/10 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition shadow-xs ${
            isSticker
              ? "bg-black/40 text-white hover:bg-black/60"
              : fromMe
              ? "bg-whatsapp-light-outgoing dark:bg-whatsapp-dark-outgoing"
              : "bg-whatsapp-light-incoming dark:bg-whatsapp-dark-incoming"
          }`}
          title="Opções da mensagem"
        >
          <ChevronDown size={14} />
        </button>
        {/* Quoted Message preview (click to scroll & highlight) */}
        {message.quotedMsg && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              const targetId = message.quotedMsg?.id;
              if (targetId) {
                const el = document.getElementById(`msg-${targetId}`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  el.classList.add("highlight-quote-flash");
                  setTimeout(() => el.classList.remove("highlight-quote-flash"), 1600);
                } else if (onScrollToQuoted) {
                  onScrollToQuoted(targetId);
                }
              }
            }}
            className="mb-1.5 p-1.5 rounded bg-black/5 dark:bg-black/20 border-l-4 border-whatsapp-green text-[11px] select-none cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition"
            title="Clique para ir até a mensagem citada"
          >
            <span className="font-bold text-whatsapp-green block truncate">
              {message.quotedMsg.contact?.name || "Mensagem"}
            </span>
            <div className="text-gray-600 dark:text-gray-400 line-clamp-2">
              <WhatsAppFormattedText text={message.quotedMsg.body} />
            </div>
          </div>
        )}

        {/* Deleted Message Banner */}
        {message.isDeleted && (
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 italic text-[11px] mb-1">
            <Ban size={13} className="text-red-400 shrink-0" />
            <span>Esta mensagem foi apagada</span>
          </div>
        )}

        {/* Media: Sticker (transparent bubble, proportional size, floating timestamp) */}
        {isSticker && (
          <div className="relative group/sticker cursor-pointer inline-block">
            <img
              src={getFullMediaUrl(message.mediaUrl)}
              alt="Figurinha"
              draggable={false}
              onClick={() => onOpenImageModal(getFullMediaUrl(message.mediaUrl))}
              className="w-32 h-32 sm:w-36 sm:h-36 object-contain drop-shadow-sm select-none rounded hover:scale-102 transition"
            />
            {/* Floating time badge */}
            <div className="absolute bottom-1 right-1 flex items-center gap-0.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full select-none backdrop-blur-xs">
              <span>{formatMessageTime(message.createdAt)}</span>
              {renderAck(message.ack)}
            </div>
          </div>
        )}

        {/* Media: Image (drag disabled) */}
        {isImage && (
          <div className="mb-1 cursor-pointer overflow-hidden rounded">
            <img
              src={getFullMediaUrl(message.mediaUrl)}
              alt="Mídia"
              draggable={false}
              onClick={() => onOpenImageModal(getFullMediaUrl(message.mediaUrl))}
              className="max-h-72 w-full object-cover rounded hover:opacity-95 transition pointer-events-auto"
            />
          </div>
        )}

        {/* Media: Video */}
        {isVideo && (
          <div className="mb-1 rounded overflow-hidden">
            <video
              src={getFullMediaUrl(message.mediaUrl)}
              controls
              draggable={false}
              className="max-h-72 w-full rounded"
            />
          </div>
        )}

        {/* Media: Audio with Transcription */}
        {isAudio && (
          <div className="mb-1">
            <CustomAudioPlayer
              id={message.id}
              src={getFullMediaUrl(message.mediaUrl)}
              fromMe={fromMe}
            />
            {hasAudioTranscription && (
              <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10 select-text">
                <div className="flex items-center gap-1.5 text-whatsapp-green font-semibold text-[10px] uppercase tracking-wider mb-0.5">
                  <Sparkles size={11} />
                  <span>Transcrição de Áudio</span>
                </div>
                <div className="text-gray-800 dark:text-gray-200 text-xs leading-relaxed italic">
                  "<WhatsAppFormattedText text={message.body} />"
                </div>
              </div>
            )}
          </div>
        )}

        {/* Media: Document (with PDF viewer support) */}
        {isDocument && (
          <div className="flex items-center gap-2 p-2 mb-1 bg-black/5 dark:bg-black/20 rounded border border-black/10 dark:border-white/10">
            <FileText size={28} className={isPdf ? "text-red-500 shrink-0" : "text-whatsapp-green shrink-0"} />
            <div
              className={`flex-1 min-w-0 ${isPdf ? "cursor-pointer hover:underline" : ""}`}
              onClick={() => {
                if (isPdf && onOpenPdfModal) {
                  onOpenPdfModal(getFullMediaUrl(message.mediaUrl), documentName);
                }
              }}
            >
              <span className="font-semibold truncate block text-xs">
                {documentName}
              </span>
              {isPdf && (
                <span className="text-[10px] text-gray-400 block">
                  Clique para visualizar PDF
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {isPdf && onOpenPdfModal && (
                <button
                  type="button"
                  onClick={() => onOpenPdfModal(getFullMediaUrl(message.mediaUrl), documentName)}
                  className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition text-gray-500 hover:text-whatsapp-green"
                  title="Visualizar PDF"
                >
                  <Eye size={16} />
                </button>
              )}

              <a
                href={getFullMediaUrl(message.mediaUrl)}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition text-gray-500 hover:text-whatsapp-green"
                title="Baixar arquivo"
              >
                <Download size={16} />
              </a>
            </div>
          </div>
        )}

        {/* Received Contact Cards (vCard) */}
        {isVCard && (
          <div className="flex flex-col gap-2 mb-1">
            {contactCards.length > 0 ? (
              contactCards.map((card, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-black/5 dark:bg-black/20 rounded-xl border border-black/10 dark:border-white/10 flex flex-col gap-2.5 min-w-[230px] max-w-[280px]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-whatsapp-green/20 text-whatsapp-green font-bold text-sm flex items-center justify-center shrink-0">
                      {(card.name || "C").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold block truncate text-xs sm:text-sm select-text text-whatsapp-light-text dark:text-whatsapp-dark-text">
                        {card.name}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 block truncate font-mono select-text">
                          {card.number || "Sem número"}
                        </span>
                        {card.number && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(card.number).catch(() => {});
                            }}
                            className="p-0.5 text-gray-400 hover:text-whatsapp-green transition shrink-0 cursor-pointer"
                            title="Copiar número"
                          >
                            <Copy size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {card.number && (
                    <button
                      onClick={() =>
                        openOrCreateTicket({
                          name: card.name,
                          number: card.number,
                          whatsappId: selectedTicket?.whatsappId || undefined,
                          queueId: selectedTicket?.queueId || undefined,
                        })
                      }
                      type="button"
                      className="w-full py-2 px-3 bg-whatsapp-green hover:bg-whatsapp-green-dark text-white rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer select-none"
                    >
                      <MessageCircle size={15} />
                      <span>Conversar agora</span>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-3 bg-black/5 dark:bg-black/20 rounded-xl border border-black/10 dark:border-white/10 flex items-center gap-2.5 min-w-[210px]">
                <div className="w-9 h-9 rounded-full bg-whatsapp-green/20 text-whatsapp-green font-bold flex items-center justify-center shrink-0">
                  <User size={18} />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold block truncate text-xs">Contato</span>
                  <span className="text-[11px] text-gray-400 block truncate">
                    {typeof message.body === "string" && !message.body.startsWith("{")
                      ? message.body
                      : "Contato compartilhado"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pix Card (WhatsApp Business style card) */}
        {pixInfo && (
          <PixCard pix={pixInfo} fromMe={fromMe} />
        )}

        {/* Location Card (Google Maps style card) */}
        {locationInfo && (
          <LocationCard location={locationInfo} fromMe={fromMe} />
        )}

        {/* Plain text / caption */}
        {!isVCard && !pixInfo && !locationInfo && message.body && !isAudio && (() => {
          const trimmed = message.body.trim();
          // Hide bare signatures if this message is an attachment
          if ((isDocument || isImage || isVideo) && trimmed.match(/^\*[^*]+:\*$/)) {
            return null;
          }
          // If this is a document and body is identical to the filename or documentName, don't duplicate it as caption
          if (isDocument && (trimmed === documentName || (hasMediaUrl && message.mediaUrl?.includes(trimmed)))) {
            return null;
          }
          return (
            <div className={message.isDeleted ? "line-through opacity-60 italic text-gray-500 dark:text-gray-400" : ""}>
              <WhatsAppFormattedText text={message.body} />
            </div>
          );
        })()}

        {/* Footer: Timestamp, Edited badge & Delivery status (hidden if sticker since sticker has floating badge) */}
        {!isSticker && (
          <div className="flex items-center justify-end gap-1 mt-0.5 text-[10px] text-gray-400 select-none">
            {message.isEdited && (
              <span
                onClick={() => onShowHistory?.(message)}
                className="italic text-gray-400 hover:text-whatsapp-green cursor-pointer mr-0.5 hover:underline"
                title="Mensagem editada - clique para ver histórico"
              >
                (editada)
              </span>
            )}
            <span>{formatMessageTime(message.createdAt)}</span>
            {renderAck(message.ack)}
          </div>
        )}

        {/* Reaction badge at bottom of message */}
        {reactions.length > 0 && (
          <div
            onClick={() => onReact?.(message, reactions[0])}
            className={`absolute -bottom-2.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white dark:bg-whatsapp-dark-panel border border-whatsapp-light-border dark:border-whatsapp-dark-border shadow text-[11px] cursor-pointer hover:scale-110 transition select-none z-10 ${
              fromMe ? "right-2" : "left-2"
            }`}
            title="Clique para remover ou alternar reação"
          >
            {reactions.map((r, i) => (
              <span key={i}>{r}</span>
            ))}
          </div>
        )}
      </div>

      {/* WhatsApp Dropdown Context Menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          className={`absolute z-30 w-52 rounded-xl bg-white dark:bg-whatsapp-dark-panel border border-whatsapp-light-border dark:border-whatsapp-dark-border shadow-xl py-1 text-xs text-whatsapp-light-text dark:text-whatsapp-dark-text select-none animate-fadeIn ${
            fromMe ? "right-6" : "left-6"
          } ${openUpwards ? "bottom-6" : "top-6"}`}
        >
          {/* Quick Reaction Emojis Row at the TOP of the Menu */}
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-black/20">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onReact?.(message, emoji);
                  setMenuOpen(false);
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:scale-130 transition text-sm hover:bg-white dark:hover:bg-whatsapp-dark-hover"
                title={`Reagir com ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Responder / Quote */}
          <button
            type="button"
            onClick={() => {
              onReply?.(message);
              setMenuOpen(false);
            }}
            className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-whatsapp-light-hover dark:hover:bg-whatsapp-dark-hover transition text-left"
          >
            <Reply size={15} className="text-whatsapp-green" />
            <span>Responder</span>
          </button>

          {/* Copiar */}
          {message.body && (
            <button
              type="button"
              onClick={handleCopy}
              className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-whatsapp-light-hover dark:hover:bg-whatsapp-dark-hover transition text-left"
            >
              <Copy size={15} className="text-gray-400" />
              <span>Copiar texto</span>
            </button>
          )}

          {/* Dados da mensagem */}
          <button
            type="button"
            onClick={() => {
              onInfo?.(message);
              setMenuOpen(false);
            }}
            className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-whatsapp-light-hover dark:hover:bg-whatsapp-dark-hover transition text-left"
          >
            <Info size={15} className="text-blue-500" />
            <span>Dados da mensagem</span>
          </button>

          {/* Ver Histórico de Edição */}
          {message.isEdited && (
            <button
              type="button"
              onClick={() => {
                onShowHistory?.(message);
                setMenuOpen(false);
              }}
              className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-whatsapp-light-hover dark:hover:bg-whatsapp-dark-hover transition text-left"
            >
              <History size={15} className="text-amber-500" />
              <span>Ver histórico de edição</span>
            </button>
          )}

          {/* Editar mensagem (apenas se enviada por mim e texto) */}
          {fromMe && !message.isDeleted && !isAudio && !isImage && !isVideo && !isDocument && (
            <button
              type="button"
              onClick={() => {
                onEdit?.(message);
                setMenuOpen(false);
              }}
              className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-whatsapp-light-hover dark:hover:bg-whatsapp-dark-hover transition text-left"
            >
              <Edit3 size={15} className="text-purple-500" />
              <span>Editar mensagem</span>
            </button>
          )}

          {/* Apagar mensagem (apenas se enviada por mim e não apagada) */}
          {fromMe && !message.isDeleted && (
            <button
              type="button"
              onClick={() => {
                onDelete?.(message);
                setMenuOpen(false);
              }}
              className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 transition text-left border-t border-gray-100 dark:border-gray-800"
            >
              <Trash2 size={15} />
              <span>Apagar para todos</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageItem;
