import React, { useState, useEffect } from "react";
import { X, Search, Plus, Zap, Copy, Edit2, Trash2, Check, Loader2 } from "lucide-react";
import api from "../../services/api";
import { useTickets } from "../../context/TicketsContext";
import { useEscapeKey } from "../common/useEscapeKey";
import type { QuickMessage } from "../../types";

export const QuickMessagesModal: React.FC = () => {
  const { activeModal, setActiveModal } = useTickets();

  useEscapeKey(() => setActiveModal(null), activeModal === "quickMessages");

  const [messages, setMessages] = useState<QuickMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Form
  const [shortcode, setShortcode] = useState("");
  const [message, setMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState<QuickMessage | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchQuickMessages = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<any>("/quick-messages");
      const list = data.records || data || [];
      setMessages(list);
    } catch (err) {
      console.error("Error fetching quick messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeModal === "quickMessages") {
      fetchQuickMessages();
    }
  }, [activeModal]);

  if (activeModal !== "quickMessages") return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const cleanShortcode = shortcode.trim().replace(/^\//, "");
    if (!cleanShortcode) {
      setFormError("Informe o atalho (ex: pix, saudacao).");
      return;
    }
    if (!message.trim()) {
      setFormError("Informe a mensagem.");
      return;
    }

    setSaving(true);
    try {
      if (editingMessage) {
        await api.put(`/quick-messages/${editingMessage.id}`, {
          shortcode: cleanShortcode,
          message: message.trim(),
        });
      } else {
        await api.post("/quick-messages", {
          shortcode: cleanShortcode,
          message: message.trim(),
        });
      }

      setShortcode("");
      setMessage("");
      setEditingMessage(null);
      setShowAddForm(false);
      fetchQuickMessages();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Erro ao salvar resposta rápida.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir esta resposta rápida?")) return;
    try {
      await api.delete(`/quick-messages/${id}`);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Error deleting quick message:", err);
    }
  };

  const handleCopy = (m: QuickMessage) => {
    navigator.clipboard.writeText(m.message);
    setCopiedId(m.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openEdit = (m: QuickMessage) => {
    setEditingMessage(m);
    setShortcode(m.shortcode);
    setMessage(m.message);
    setShowAddForm(true);
  };

  const filtered = messages.filter(
    (m) =>
      m.shortcode.toLowerCase().includes(search.toLowerCase()) ||
      m.message.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={() => setActiveModal(null)}
    >
      <div
        className="bg-white dark:bg-whatsapp-dark-panel rounded-2xl w-full max-w-2xl shadow-2xl border border-whatsapp-light-border dark:border-whatsapp-dark-border overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-whatsapp-light-border dark:border-whatsapp-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-sm">
              ⚡
            </div>
            <div>
              <h2 className="text-base font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text">
                Respostas Rápidas ({messages.length})
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Atalhos digitando "/" na conversa para agilizar atendimento
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingMessage(null);
                setShortcode("");
                setMessage("");
                setShowAddForm(!showAddForm);
              }}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-whatsapp-green text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-whatsapp-green/90 transition shadow-sm"
            >
              <Plus size={14} />
              <span>{showAddForm ? "Fechar" : "Nova Resposta"}</span>
            </button>

            <button
              onClick={() => setActiveModal(null)}
              type="button"
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <form
            onSubmit={handleSave}
            className="p-4 bg-gray-50 dark:bg-whatsapp-dark-hover/50 border-b border-whatsapp-light-border dark:border-whatsapp-dark-border space-y-3 animate-fadeIn"
          >
            <div className="text-xs font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text">
              {editingMessage ? "Editar Resposta Rápida" : "Cadastrar Nova Resposta"}
            </div>

            {formError && (
              <div className="p-2 text-xs rounded bg-red-500/10 text-red-500 border border-red-500/20">
                {formError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold">
                Atalho de ativação (sem a barra):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                  /
                </span>
                <input
                  type="text"
                  placeholder="ex: chavepix, horario, endereco"
                  value={shortcode}
                  onChange={(e) => setShortcode(e.target.value)}
                  className="w-full pl-6 pr-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#111b21] text-xs text-gray-900 dark:text-[#e9edef] border border-gray-300 dark:border-[#2a3942] focus:outline-hidden focus:ring-1 focus:ring-whatsapp-green"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold">
                Texto da Mensagem:
              </label>
              <textarea
                rows={3}
                placeholder="Digite a mensagem padrão que será enviada..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-gray-100 dark:bg-[#111b21] text-xs text-gray-900 dark:text-[#e9edef] border border-gray-300 dark:border-[#2a3942] focus:outline-hidden focus:ring-1 focus:ring-whatsapp-green resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-200 dark:hover:bg-whatsapp-dark-hover transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-whatsapp-green text-white text-xs font-semibold hover:bg-whatsapp-green/90 transition disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar Resposta"}
              </button>
            </div>
          </form>
        )}

        {/* Search */}
        <div className="p-3 border-b border-whatsapp-light-border dark:border-whatsapp-dark-border">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Pesquisar por atalho ou conteúdo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-[#111b21] rounded-xl text-xs border border-gray-300 dark:border-[#2a3942] focus:outline-hidden focus:ring-1 focus:ring-whatsapp-green text-gray-900 dark:text-[#e9edef] placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-whatsapp-light-border/40 dark:divide-whatsapp-dark-border/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Loader2 className="animate-spin mb-2" size={24} />
              <span className="text-xs">Carregando respostas rápidas...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Zap size={28} className="mb-2 opacity-30 text-amber-500" />
              <span className="text-xs">Nenhuma resposta rápida cadastrada.</span>
            </div>
          ) : (
            filtered.map((m) => (
              <div
                key={m.id}
                className="px-4 py-3 flex items-start justify-between hover:bg-whatsapp-light-hover dark:hover:bg-whatsapp-dark-hover transition gap-3"
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-xs">
                      /{m.shortcode}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap line-clamp-3">
                    {m.message}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  <button
                    onClick={() => handleCopy(m)}
                    type="button"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover transition"
                    title="Copiar texto"
                  >
                    {copiedId === m.id ? (
                      <Check size={14} className="text-whatsapp-green" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(m)}
                    type="button"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover transition"
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    type="button"
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-500/10 transition"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickMessagesModal;
