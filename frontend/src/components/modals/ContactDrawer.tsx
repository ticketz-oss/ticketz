import React, { useState, useEffect } from "react";
import {
  X,
  Tag,
  Plus,
  StickyNote,
  Trash2,
  Loader2,
  Image as ImageIcon,
  FileText,
  Link2,
  ExternalLink,
  Download,
  Copy,
  Check,
} from "lucide-react";
import api, { getBackendUrl } from "../../services/api";
import { useTickets } from "../../context/TicketsContext";
import { useAuth } from "../../context/AuthContext";
import { useEscapeKey } from "../common/useEscapeKey";
import type { Tag as TagType, TicketNote, Message } from "../../types";

interface ContactDrawerProps {
  onOpenImageModal?: (url: string) => void;
}

export const ContactDrawer: React.FC<ContactDrawerProps> = ({ onOpenImageModal }) => {
  const {
    contactDrawerOpen,
    setContactDrawerOpen,
    selectedTicket,
    syncTicketTags,
  } = useTickets();
  const { user } = useAuth();

  useEscapeKey(() => setContactDrawerOpen(false), contactDrawerOpen);

  const [availableTags, setAvailableTags] = useState<TagType[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<number | "">("");
  const [notes, setNotes] = useState<TicketNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaTab, setMediaTab] = useState<"media" | "docs" | "links">("media");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const backendUrl = getBackendUrl();

  const handleCopyText = (text?: string, field?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
    if (field) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const getFullMediaUrl = (url?: string) => {
    if (!url || typeof url !== "string") return "";
    if (url.startsWith("http")) return url;
    const base = backendUrl.startsWith("http") ? `${backendUrl}/public` : `/backend/public`;
    return `${base}/${url}`;
  };

  // Fetch available tags
  useEffect(() => {
    if (contactDrawerOpen) {
      api.get<any>("/tags/list").then(({ data }) => {
        const list = Array.isArray(data) ? data : data.tags || [];
        setAvailableTags(list);
      }).catch(console.error);
    }
  }, [contactDrawerOpen]);

  // Fetch ticket notes & conversation messages for media history
  useEffect(() => {
    if (contactDrawerOpen && selectedTicket) {
      setLoadingNotes(true);
      api.get<any>("/ticket-notes/list", {
        params: {
          contactId: selectedTicket.contactId || selectedTicket.contact?.id,
          ticketId: selectedTicket.id,
        },
      }).then(({ data }) => {
        const list = Array.isArray(data) ? data : data.ticketNotes || [];
        setNotes(list);
      }).catch(console.error).finally(() => setLoadingNotes(false));

      setLoadingMedia(true);
      api
        .get<any>(`/messages/${selectedTicket.id}`)
        .then((res) => {
          const msgs: Message[] = res.data?.messages || (Array.isArray(res.data) ? res.data : []);
          setConversationMessages(msgs);
        })
        .catch(console.error)
        .finally(() => setLoadingMedia(false));
    }
  }, [contactDrawerOpen, selectedTicket?.id]);

  if (!contactDrawerOpen || !selectedTicket) return null;

  const currentTags = selectedTicket.tags || [];

  const handleAddTag = async () => {
    if (!selectedTagId) return;
    const tagToAdd = availableTags.find((t) => t.id === Number(selectedTagId));
    if (!tagToAdd) return;

    if (currentTags.some((t) => t.id === tagToAdd.id)) return;

    const newTagIds = [...currentTags.map((t) => t.id), tagToAdd.id];
    await syncTicketTags(selectedTicket.id, newTagIds);
    setSelectedTagId("");
  };

  const handleRemoveTag = async (tagId: number) => {
    const newTagIds = currentTags.filter((t) => t.id !== tagId).map((t) => t.id);
    await syncTicketTags(selectedTicket.id, newTagIds);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setAddingNote(true);
    try {
      const { data } = await api.post<TicketNote>("/ticket-notes", {
        note: newNote.trim(),
        ticketId: selectedTicket.id,
        contactId: selectedTicket.contactId || selectedTicket.contact?.id,
        userId: user?.id,
      });
      setNotes((prev) => [data, ...prev]);
      setNewNote("");
    } catch (err) {
      console.error("Error creating ticket note:", err);
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await api.delete(`/ticket-notes/${noteId}`);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      console.error("Error deleting note:", err);
    }
  };

  const contact = selectedTicket.contact;

  const mediaItems = conversationMessages.filter(
    (m) =>
      m.mediaUrl &&
      (m.mediaType === "image" ||
        m.mediaType === "video" ||
        m.mediaType === "sticker" ||
        m.mediaUrl.match(/\.(png|jpe?g|webp|gif|mp4|mov|webm)$/i))
  );

  const docItems = conversationMessages.filter(
    (m) =>
      m.mediaUrl &&
      (m.mediaType === "document" ||
        m.mediaType === "application" ||
        m.mediaUrl.match(/\.(pdf|doc|docx|xls|xlsx|txt|zip|rar)$/i))
  );

  const linkItems: { url: string; date: string; fromMe?: boolean }[] = [];
  conversationMessages.forEach((m) => {
    if (m.body && typeof m.body === "string") {
      const matches = m.body.match(/https?:\/\/[^\s]+/gi);
      if (matches) {
        matches.forEach((url) => {
          if (!linkItems.some((l) => l.url === url)) {
            linkItems.push({ url, date: m.createdAt, fromMe: m.fromMe });
          }
        });
      }
    }
  });

  return (
    <div className="w-80 h-full bg-white dark:bg-whatsapp-dark-panel border-l border-whatsapp-light-border dark:border-whatsapp-dark-border flex flex-col shrink-0 z-20 select-text animate-fadeIn">
      {/* Header */}
      <div className="h-14 px-4 border-b border-whatsapp-light-border dark:border-whatsapp-dark-border flex items-center justify-between">
        <span className="font-bold text-sm text-whatsapp-light-text dark:text-whatsapp-dark-text">
          Dados do Contato
        </span>
        <button
          onClick={() => setContactDrawerOpen(false)}
          type="button"
          className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center">
          <div
            onClick={() => {
              if (contact?.profilePicUrl && !imgError && onOpenImageModal) {
                onOpenImageModal(contact.profilePicUrl);
              }
            }}
            className={`w-20 h-20 rounded-full bg-whatsapp-green/20 text-whatsapp-green font-bold text-xl flex items-center justify-center overflow-hidden shadow-sm mb-2.5 ${
              contact?.profilePicUrl && !imgError && onOpenImageModal
                ? "cursor-pointer hover:ring-2 hover:ring-whatsapp-green transition"
                : ""
            }`}
            title={contact?.profilePicUrl && !imgError ? "Clique para ampliar a foto" : undefined}
          >
            {contact?.profilePicUrl && !imgError ? (
              <img
                src={contact.profilePicUrl}
                alt=""
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              (contact?.name || "C").slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-1 max-w-full">
            <h3
              data-selectable="true"
              className="font-bold text-sm text-whatsapp-light-text dark:text-whatsapp-dark-text select-text cursor-text truncate"
              title="Clique e arraste para selecionar o nome"
            >
              {contact?.name || contact?.number}
            </h3>
            {contact?.name && (
              <button
                type="button"
                onClick={() => handleCopyText(contact.name, "name")}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover text-gray-400 hover:text-whatsapp-green transition shrink-0 cursor-pointer"
                title="Copiar nome do contato"
              >
                {copiedField === "name" ? (
                  <Check size={13} className="text-whatsapp-green" />
                ) : (
                  <Copy size={13} />
                )}
              </button>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <span
              data-selectable="true"
              className="text-xs text-gray-500 dark:text-gray-400 select-text cursor-text font-mono"
              title="Clique e arraste para selecionar o número"
            >
              {contact?.number}
            </span>
            {contact?.number && (
              <button
                type="button"
                onClick={() => handleCopyText(contact.number, "number")}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover text-gray-400 hover:text-whatsapp-green transition shrink-0 cursor-pointer"
                title="Copiar número de telefone"
              >
                {copiedField === "number" ? (
                  <Check size={13} className="text-whatsapp-green" />
                ) : (
                  <Copy size={13} />
                )}
              </button>
            )}
          </div>

          {contact?.email && (
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span
                data-selectable="true"
                className="text-xs text-gray-400 select-text cursor-text"
              >
                {contact.email}
              </span>
              <button
                type="button"
                onClick={() => handleCopyText(contact.email, "email")}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover text-gray-400 hover:text-whatsapp-green transition shrink-0 cursor-pointer"
                title="Copiar e-mail"
              >
                {copiedField === "email" ? (
                  <Check size={13} className="text-whatsapp-green" />
                ) : (
                  <Copy size={13} />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Mídia, links e docs Section */}
        <div className="space-y-2.5 pt-3 border-t border-whatsapp-light-border dark:border-whatsapp-dark-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text flex items-center gap-1.5">
              <ImageIcon size={14} className="text-whatsapp-green" />
              Mídia, links e docs ({mediaItems.length + docItems.length + linkItems.length})
            </span>
          </div>

          {/* Subtabs */}
          <div className="flex rounded-lg bg-gray-100 dark:bg-whatsapp-dark-hover p-0.5 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setMediaTab("media")}
              className={`flex-1 py-1 rounded-md transition text-center ${
                mediaTab === "media"
                  ? "bg-white dark:bg-[#111b21] text-whatsapp-light-text dark:text-whatsapp-dark-text shadow-xs"
                  : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              Mídias ({mediaItems.length})
            </button>
            <button
              type="button"
              onClick={() => setMediaTab("docs")}
              className={`flex-1 py-1 rounded-md transition text-center ${
                mediaTab === "docs"
                  ? "bg-white dark:bg-[#111b21] text-whatsapp-light-text dark:text-whatsapp-dark-text shadow-xs"
                  : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              Docs ({docItems.length})
            </button>
            <button
              type="button"
              onClick={() => setMediaTab("links")}
              className={`flex-1 py-1 rounded-md transition text-center ${
                mediaTab === "links"
                  ? "bg-white dark:bg-[#111b21] text-whatsapp-light-text dark:text-whatsapp-dark-text shadow-xs"
                  : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              Links ({linkItems.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="max-h-56 overflow-y-auto">
            {loadingMedia ? (
              <div className="text-center py-4 text-xs text-gray-400">Carregando mídias...</div>
            ) : (
              <>
                {mediaTab === "media" && (
                  mediaItems.length === 0 ? (
                    <span className="text-[11px] text-gray-400 block text-center py-3">
                      Nenhuma foto ou vídeo compartilhado.
                    </span>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5">
                      {mediaItems.map((m) => {
                        const full = getFullMediaUrl(m.mediaUrl);
                        const isVid = m.mediaType === "video" || Boolean(m.mediaUrl?.match(/\.(mp4|mov|webm)$/i));
                        return (
                          <div
                            key={m.id}
                            onClick={() => onOpenImageModal?.(full)}
                            className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-black/20 cursor-pointer hover:opacity-85 transition relative group"
                            title="Clique para ampliar mídia"
                          >
                            {isVid ? (
                              <div className="w-full h-full flex items-center justify-center bg-black/60 text-white text-xs">
                                ▶ Vídeo
                              </div>
                            ) : (
                              <img
                                src={full}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {mediaTab === "docs" && (
                  docItems.length === 0 ? (
                    <span className="text-[11px] text-gray-400 block text-center py-3">
                      Nenhum documento compartilhado.
                    </span>
                  ) : (
                    <div className="space-y-1.5">
                      {docItems.map((m) => {
                        const full = getFullMediaUrl(m.mediaUrl);
                        const filename =
                          m.body || (m.mediaUrl ? decodeURIComponent(m.mediaUrl.split("/").pop() || "") : "Documento");
                        return (
                          <div
                            key={m.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-whatsapp-dark-hover/50 border border-gray-100 dark:border-gray-800 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText size={18} className="text-red-500 shrink-0" />
                              <span className="truncate block font-medium" title={filename}>
                                {filename}
                              </span>
                            </div>
                            <a
                              href={full}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="p-1 rounded-md text-gray-400 hover:text-whatsapp-green transition shrink-0"
                              title="Baixar documento"
                            >
                              <Download size={14} />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {mediaTab === "links" && (
                  linkItems.length === 0 ? (
                    <span className="text-[11px] text-gray-400 block text-center py-3">
                      Nenhum link compartilhado.
                    </span>
                  ) : (
                    <div className="space-y-1.5">
                      {linkItems.map((l, idx) => (
                        <a
                          key={idx}
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-whatsapp-dark-hover/50 border border-gray-100 dark:border-gray-800 text-xs hover:border-whatsapp-green/40 transition group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Link2 size={16} className="text-blue-500 shrink-0" />
                            <span className="truncate text-blue-600 dark:text-blue-400 group-hover:underline">
                              {l.url}
                            </span>
                          </div>
                          <ExternalLink size={13} className="text-gray-400 shrink-0 ml-1" />
                        </a>
                      ))}
                    </div>
                  )
                )}
              </>
            )}
          </div>
        </div>

        {/* Tags Section */}
        <div className="space-y-2 pt-2 border-t border-whatsapp-light-border dark:border-whatsapp-dark-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text flex items-center gap-1.5">
              <Tag size={13} className="text-purple-500" />
              Etiquetas
            </span>
          </div>

          {/* Current tags */}
          <div className="flex flex-wrap gap-1.5 min-h-6">
            {currentTags.length === 0 ? (
              <span className="text-[11px] text-gray-400">Nenhuma tag vinculada</span>
            ) : (
              currentTags.map((t) => (
                <span
                  key={t.id}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 group"
                  style={{
                    backgroundColor: `${t.color || "#10B981"}20`,
                    color: t.color || "#10B981",
                  }}
                >
                  {t.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t.id)}
                    className="hover:opacity-75"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Add tag selector */}
          <div className="flex items-center gap-1.5 pt-1">
            <select
              value={selectedTagId}
              onChange={(e) => setSelectedTagId(e.target.value === "" ? "" : Number(e.target.value))}
              className="flex-1 px-2.5 py-1 bg-gray-50 dark:bg-whatsapp-dark-hover rounded-lg text-xs border border-whatsapp-light-border dark:border-whatsapp-dark-border focus:outline-hidden"
            >
              <option value="">Adicionar tag...</option>
              {availableTags
                .filter((at) => !currentTags.some((ct) => ct.id === at.id))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
            <button
              type="button"
              disabled={!selectedTagId}
              onClick={handleAddTag}
              className="p-1.5 rounded-lg bg-whatsapp-green text-white hover:bg-whatsapp-green/90 disabled:opacity-40 transition"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Ticket Notes Section */}
        <div className="space-y-2.5 pt-2 border-t border-whatsapp-light-border dark:border-whatsapp-dark-border">
          <span className="text-xs font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text flex items-center gap-1.5">
            <StickyNote size={13} className="text-amber-500" />
            Notas Internas ({notes.length})
          </span>

          {/* Add note input */}
          <form onSubmit={handleAddNote} className="space-y-1.5">
            <textarea
              rows={2}
              placeholder="Adicionar anotação interna..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full p-2 bg-gray-50 dark:bg-whatsapp-dark-hover rounded-lg text-xs border border-whatsapp-light-border dark:border-whatsapp-dark-border focus:outline-hidden focus:border-whatsapp-green resize-none text-whatsapp-light-text dark:text-whatsapp-dark-text"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={addingNote || !newNote.trim()}
                className="px-3 py-1 rounded-lg bg-whatsapp-green text-white text-xs font-medium hover:bg-whatsapp-green/90 transition disabled:opacity-40 flex items-center gap-1"
              >
                {addingNote ? <Loader2 size={12} className="animate-spin" /> : "Salvar Nota"}
              </button>
            </div>
          </form>

          {/* Notes list */}
          <div className="space-y-2 pt-1">
            {loadingNotes ? (
              <div className="text-center py-3 text-xs text-gray-400">Carregando notas...</div>
            ) : notes.length === 0 ? (
              <span className="text-[11px] text-gray-400 block text-center py-2">
                Nenhuma anotação neste atendimento.
              </span>
            ) : (
              notes.map((n) => (
                <div
                  key={n.id}
                  className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1 relative group"
                >
                  <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                    <span className="font-bold">{n.user?.name || "Atendente"}</span>
                    <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{n.note}</p>
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(n.id)}
                    className="absolute top-1.5 right-1.5 p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                    title="Excluir nota"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactDrawer;
