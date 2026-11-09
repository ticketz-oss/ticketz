import React, { useState } from "react";
import { X, Layers, Plus } from "lucide-react";
import api from "../../services/api";
import { useTickets } from "../../context/TicketsContext";
import { useAuth } from "../../context/AuthContext";
import { useEscapeKey } from "../common/useEscapeKey";
import type { Queue } from "../../types";

export const QueuesModal: React.FC = () => {
  const { activeModal, setActiveModal, queues, refreshAll } = useTickets();
  const { user } = useAuth();

  useEscapeKey(() => setActiveModal(null), activeModal === "queues");

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#1273DE");
  const [greetingMessage, setGreetingMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (activeModal !== "queues") return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Informe o nome da fila.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      await api.post("/queue", {
        name: name.trim(),
        color,
        greetingMessage: greetingMessage.trim() || undefined,
      });
      setName("");
      setGreetingMessage("");
      setShowAdd(false);
      refreshAll();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Erro ao salvar fila.");
    } finally {
      setSaving(false);
    }
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
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-sm">
              🏢
            </div>
            <div>
              <h2 className="text-base font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text">
                Filas de Atendimento ({queues.length})
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Setores e departamentos da sua empresa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user?.profile === "admin" && (
              <button
                onClick={() => setShowAdd(!showAdd)}
                type="button"
                className="px-3 py-1.5 rounded-xl bg-whatsapp-green text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-whatsapp-green/90 transition shadow-sm"
              >
                <Plus size={14} />
                <span>{showAdd ? "Fechar" : "Nova Fila"}</span>
              </button>
            )}

            <button
              onClick={() => setActiveModal(null)}
              type="button"
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showAdd && (
          <form
            onSubmit={handleSave}
            className="p-4 bg-gray-50 dark:bg-whatsapp-dark-hover/50 border-b border-whatsapp-light-border dark:border-whatsapp-dark-border space-y-3 animate-fadeIn"
          >
            <div className="text-xs font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text">
              Cadastrar Nova Fila / Setor
            </div>

            {errorMsg && (
              <div className="p-2 text-xs rounded bg-red-500/10 text-red-500 border border-red-500/20">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold">
                Nome da Fila:
              </label>
              <input
                type="text"
                placeholder="Ex: Comercial, Suporte Técnico, Financeiro..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-whatsapp-dark-panel text-xs border border-whatsapp-light-border dark:border-whatsapp-dark-border focus:outline-hidden focus:border-whatsapp-green"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold">
                Cor:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded border-none cursor-pointer"
                />
                <span className="text-xs font-mono">{color}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold">
                Mensagem de Saudação (opcional):
              </label>
              <textarea
                rows={2}
                placeholder="Olá, você está no setor de Suporte..."
                value={greetingMessage}
                onChange={(e) => setGreetingMessage(e.target.value)}
                className="w-full p-2 rounded-lg bg-white dark:bg-whatsapp-dark-panel text-xs border border-whatsapp-light-border dark:border-whatsapp-dark-border focus:outline-hidden focus:border-whatsapp-green resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-200 dark:hover:bg-whatsapp-dark-hover transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-whatsapp-green text-white text-xs font-semibold hover:bg-whatsapp-green/90 transition disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar Fila"}
              </button>
            </div>
          </form>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-whatsapp-light-border/40 dark:divide-whatsapp-dark-border/40">
          {queues.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Layers size={28} className="mb-2 opacity-30 text-blue-500" />
              <span className="text-xs">Nenhuma fila configurada.</span>
            </div>
          ) : (
            queues.map((q: Queue) => (
              <div
                key={q.id}
                className="px-4 py-3 flex items-start justify-between hover:bg-whatsapp-light-hover dark:hover:bg-whatsapp-dark-hover transition"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: q.color }}
                  />
                  <div>
                    <span className="text-xs font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text block">
                      {q.name}
                    </span>
                    {q.greetingMessage ? (
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                        {q.greetingMessage}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400">Sem mensagem inicial</span>
                    )}
                  </div>
                </div>

                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold"
                  style={{ backgroundColor: `${q.color}20`, color: q.color }}
                >
                  ID #{q.id}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default QueuesModal;
