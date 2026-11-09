import React, { useState, useEffect } from "react";
import { X, Tag as TagIcon, Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import api from "../../services/api";
import { useTickets } from "../../context/TicketsContext";
import { useEscapeKey } from "../common/useEscapeKey";
import type { Tag } from "../../types";

const PRESET_COLORS = [
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#EF4444", // Red
  "#F59E0B", // Amber
  "#14B8A6", // Teal
  "#64748B", // Slate
];

export const TagsModal: React.FC = () => {
  const { activeModal, setActiveModal } = useTickets();

  useEscapeKey(() => setActiveModal(null), activeModal === "tags");

  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchTags = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<any>("/tags/list");
      const list = Array.isArray(data) ? data : data.tags || [];
      setTags(list);
    } catch (err) {
      console.error("Error fetching tags:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeModal === "tags") {
      fetchTags();
    }
  }, [activeModal]);

  if (activeModal !== "tags") return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Informe o nome da tag.");
      return;
    }

    setSaving(true);
    try {
      if (editingTag) {
        await api.put(`/tags/${editingTag.id}`, {
          name: name.trim(),
          color,
        });
      } else {
        await api.post("/tags", {
          name: name.trim(),
          color,
        });
      }

      setName("");
      setColor(PRESET_COLORS[0]);
      setEditingTag(null);
      setShowAddForm(false);
      fetchTags();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Erro ao salvar tag.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir esta tag?")) return;
    try {
      await api.delete(`/tags/${id}`);
      setTags((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Error deleting tag:", err);
    }
  };

  const openEdit = (t: Tag) => {
    setEditingTag(t);
    setName(t.name);
    setColor(t.color || PRESET_COLORS[0]);
    setShowAddForm(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={() => setActiveModal(null)}
    >
      <div
        className="bg-white dark:bg-whatsapp-dark-panel rounded-2xl w-full max-w-md shadow-2xl border border-whatsapp-light-border dark:border-whatsapp-dark-border overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-whatsapp-light-border dark:border-whatsapp-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-sm">
              🏷️
            </div>
            <div>
              <h2 className="text-base font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text">
                Etiquetas / Tags ({tags.length})
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Categorize e organize seus atendimentos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingTag(null);
                setName("");
                setColor(PRESET_COLORS[0]);
                setShowAddForm(!showAddForm);
              }}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-whatsapp-green text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-whatsapp-green/90 transition shadow-sm"
            >
              <Plus size={14} />
              <span>{showAddForm ? "Fechar" : "Nova Tag"}</span>
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

        {/* Form */}
        {showAddForm && (
          <form
            onSubmit={handleSave}
            className="p-4 bg-gray-50 dark:bg-whatsapp-dark-hover/50 border-b border-whatsapp-light-border dark:border-whatsapp-dark-border space-y-3 animate-fadeIn"
          >
            <div className="text-xs font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text">
              {editingTag ? "Editar Tag" : "Cadastrar Nova Tag"}
            </div>

            {formError && (
              <div className="p-2 text-xs rounded bg-red-500/10 text-red-500 border border-red-500/20">
                {formError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold">
                Nome da Tag:
              </label>
              <input
                type="text"
                placeholder="Ex: Urgente, Orçamento, Concluído..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-whatsapp-dark-panel text-xs border border-whatsapp-light-border dark:border-whatsapp-dark-border focus:outline-hidden focus:border-whatsapp-green"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold">
                Cor:
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition transform ${
                      color === c ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
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
                {saving ? "Salvando..." : "Salvar Tag"}
              </button>
            </div>
          </form>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-whatsapp-light-border/40 dark:divide-whatsapp-dark-border/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Loader2 className="animate-spin mb-2" size={24} />
              <span className="text-xs">Carregando tags...</span>
            </div>
          ) : tags.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <TagIcon size={28} className="mb-2 opacity-30 text-purple-500" />
              <span className="text-xs">Nenhuma tag cadastrada ainda.</span>
            </div>
          ) : (
            tags.map((t) => (
              <div
                key={t.id}
                className="px-4 py-2.5 flex items-center justify-between hover:bg-whatsapp-light-hover dark:hover:bg-whatsapp-dark-hover transition"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: t.color || "#10B981" }}
                  />
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: `${t.color || "#10B981"}20`,
                      color: t.color || "#10B981",
                    }}
                  >
                    {t.name}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(t)}
                    type="button"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover transition"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    type="button"
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-500/10 transition"
                  >
                    <Trash2 size={13} />
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

export default TagsModal;
