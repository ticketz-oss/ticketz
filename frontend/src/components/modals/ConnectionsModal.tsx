import React, { useState, useEffect } from "react";
import { X, Smartphone, RefreshCw, Power, QrCode, Loader2, Plus, Trash2, Lock, Unlock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import api from "../../services/api";
import socketService from "../../services/socket";
import { useTickets } from "../../context/TicketsContext";
import { useEscapeKey } from "../common/useEscapeKey";
import {
  isWhatsappPrivate,
  setWhatsappPrivate,
  syncPrivacySettingsFromBackend,
} from "../../services/privacyService";
import type { Whatsapp } from "../../types";

export const ConnectionsModal: React.FC = () => {
  const { activeModal, setActiveModal, whatsapps, refreshAll, queues } = useTickets();

  const [loadingAction, setLoadingAction] = useState<number | null>(null);
  const [activeQrModal, setActiveQrModal] = useState<Whatsapp | null>(null);

  // New connection form
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [selectedQueueIds, setSelectedQueueIds] = useState<number[]>([]);
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEscapeKey(() => {
    if (activeQrModal) {
      setActiveQrModal(null);
    } else if (showAddForm) {
      setShowAddForm(false);
    } else {
      setActiveModal(null);
    }
  }, activeModal === "connections");

  useEffect(() => {
    if (activeModal === "connections") {
      syncPrivacySettingsFromBackend();
    }
  }, [activeModal]);

  // Real-time listener and active polling while QR Code modal is open
  useEffect(() => {
    if (!activeQrModal?.id) return;
    const socket = socketService.getSocket();
    const companyId = localStorage.getItem("companyId");

    const fetchLiveWhatsapp = async () => {
      try {
        const { data } = await api.get<Whatsapp>(`/whatsapp/${activeQrModal.id}`);
        if (data) {
          setActiveQrModal(data);
          if (data.status === "CONNECTED") {
            await refreshAll();
            setTimeout(() => setActiveQrModal(null), 1500);
          }
        }
      } catch {}
    };

    fetchLiveWhatsapp();
    const interval = setInterval(fetchLiveWhatsapp, 2500);

    const onWhatsappUpdate = (data: any) => {
      if (
        data.action === "update" &&
        (data.whatsapp?.id === activeQrModal.id || data.session?.id === activeQrModal.id)
      ) {
        const updated = data.whatsapp || data.session;
        setActiveQrModal((prev) => (prev ? { ...prev, ...updated } : updated));
        if (updated.status === "CONNECTED") {
          refreshAll();
          setTimeout(() => setActiveQrModal(null), 1500);
        }
      }
    };

    if (socket && companyId) {
      socket.on(`company-${companyId}-whatsapp`, onWhatsappUpdate);
      socket.on(`company-${companyId}-whatsappSession`, onWhatsappUpdate);
    }

    return () => {
      clearInterval(interval);
      if (socket && companyId) {
        socket.off(`company-${companyId}-whatsapp`, onWhatsappUpdate);
        socket.off(`company-${companyId}-whatsappSession`, onWhatsappUpdate);
      }
    };
  }, [activeQrModal?.id, refreshAll]);

  if (activeModal !== "connections") return null;

  const handleCreateConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Informe um nome para a conexão (ex: Linha Suporte ou Particular).");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const { data: newConn } = await api.post<Whatsapp>("/whatsapp", {
        name,
        isDefault: isDefault || whatsapps.length === 0,
        queueIds: selectedQueueIds,
      });

      setName("");
      setSelectedQueueIds([]);
      setShowAddForm(false);
      await refreshAll();

      // Immediately launch session to generate Baileys QR Code
      try {
        await api.post(`/whatsappsession/${newConn.id}`);
      } catch (sessErr) {
        console.warn("Session init request:", sessErr);
      }

      // Open QR code right away to pair
      setActiveQrModal(newConn);
    } catch (err: any) {
      console.error("Error creating connection:", err);
      setErrorMsg(err.response?.data?.message || "Erro ao criar nova conexão.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenQrModal = async (item: Whatsapp) => {
    setActiveQrModal(item);
    // Request start of whatsapp session if not running
    try {
      await api.post(`/whatsappsession/${item.id}`);
    } catch (err) {
      console.warn("Starting session error:", err);
    }
  };

  const handleRestart = async (id: number) => {
    setLoadingAction(id);
    try {
      await api.post(`/whatsappsession/${id}`);
      await refreshAll();
    } catch (err) {
      console.error("Error restarting whatsapp session:", err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDisconnect = async (id: number) => {
    if (!window.confirm("Deseja realmente desconectar esta linha de WhatsApp?")) return;
    setLoadingAction(id);
    try {
      await api.delete(`/whatsappsession/${id}`);
      await refreshAll();
    } catch (err) {
      console.error("Error disconnecting session:", err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente EXCLUIR esta conexão de WhatsApp?")) return;
    setLoadingAction(id);
    try {
      await api.delete(`/whatsapp/${id}`);
      await refreshAll();
    } catch (err) {
      console.error("Error deleting whatsapp connection:", err);
      alert("Não foi possível excluir a conexão.");
    } finally {
      setLoadingAction(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONNECTED":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-whatsapp-green/15 text-whatsapp-green">
            <span className="w-2 h-2 rounded-full bg-whatsapp-green animate-pulse" />
            Conectado
          </span>
        );
      case "PAIRING":
      case "qrcode":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Aguardando QR Code
          </span>
        );
      case "OPENING":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
            <Loader2 size={12} className="animate-spin text-blue-500" />
            Iniciando...
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/15 text-red-600 dark:text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Desconectado
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={() => setActiveModal(null)}
    >
      <div
        className="bg-white dark:bg-whatsapp-dark-panel rounded-2xl w-full max-w-xl shadow-2xl border border-whatsapp-light-border dark:border-whatsapp-dark-border overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-whatsapp-light-border dark:border-whatsapp-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center font-bold text-sm">
              📱
            </div>
            <div>
              <h2 className="text-base font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text">
                Conexões do WhatsApp ({whatsapps.length})
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Gerencie seus números e aparelhos conectados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-whatsapp-green text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-whatsapp-green/90 transition shadow-sm"
            >
              <Plus size={14} />
              <span>{showAddForm ? "Fechar" : "Nova Conexão"}</span>
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

        {/* Add Connection Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateConnection}
            className="p-4 bg-gray-50 dark:bg-whatsapp-dark-hover/40 border-b border-whatsapp-light-border dark:border-whatsapp-dark-border space-y-3 animate-fadeIn"
          >
            <span className="font-bold text-xs text-whatsapp-light-text dark:text-whatsapp-dark-text block">
              Adicionar Nova Linha de WhatsApp
            </span>

            {errorMsg && (
              <div className="p-2 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                Nome da Conexão / Linha *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Comercial 2, Suporte SP ou Particular"
                className="w-full px-3 py-1.5 bg-white dark:bg-whatsapp-dark-panel border border-whatsapp-light-border dark:border-whatsapp-dark-border rounded-lg text-xs text-whatsapp-light-text dark:text-whatsapp-dark-text focus:outline-none focus:border-whatsapp-green"
              />
            </div>

            {queues.length > 0 && (
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Filas vinculadas a esta linha:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {queues.map((q) => {
                    const isChecked = selectedQueueIds.includes(q.id);
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() =>
                          setSelectedQueueIds((prev) =>
                            prev.includes(q.id) ? prev.filter((id) => id !== q.id) : [...prev, q.id]
                          )
                        }
                        className={`px-2 py-0.5 rounded text-xs border transition ${
                          isChecked
                            ? "bg-whatsapp-green text-white border-whatsapp-green"
                            : "bg-white dark:bg-whatsapp-dark-panel border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {q.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="defaultCheck"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded text-whatsapp-green focus:ring-whatsapp-green"
              />
              <label htmlFor="defaultCheck" className="text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                Tornar conexão principal (padrão)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-whatsapp-green text-white text-xs font-semibold hover:bg-whatsapp-green/90 transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                <span>Salvar e Gerar QR Code</span>
              </button>
            </div>
          </form>
        )}

        {/* List of connections */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {whatsapps.map((item) => {
            const isConnected = item.status === "CONNECTED";
            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-whatsapp-light-border dark:border-whatsapp-dark-border bg-gray-50/50 dark:bg-whatsapp-dark-hover/30 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-whatsapp-green/10 text-whatsapp-green flex items-center justify-center shrink-0">
                    <Smartphone size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-whatsapp-light-text dark:text-whatsapp-dark-text truncate">
                        {item.name}
                      </span>
                      {item.isDefault && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-whatsapp-green/20 text-whatsapp-green">
                          Padrão
                        </span>
                      )}
                      {isWhatsappPrivate(item.id, item.name) && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <Lock size={9} />
                          Particular
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      <span>{item.number ? `+${item.number}` : "Sem número registrado"}</span>
                      <span>•</span>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Private line toggle button */}
                  <button
                    type="button"
                    onClick={() => {
                      const cur = isWhatsappPrivate(item.id, item.name);
                      setWhatsappPrivate(item.id, !cur);
                      refreshAll();
                    }}
                    className={`p-2 rounded-lg transition ${
                      isWhatsappPrivate(item.id, item.name)
                        ? "text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                    title={
                      isWhatsappPrivate(item.id, item.name)
                        ? "Linha Particular (protegida pelo cadeado). Clique para desmarcar."
                        : "Marcar como Linha Particular (proteger com cadeado)"
                    }
                  >
                    {isWhatsappPrivate(item.id, item.name) ? <Lock size={16} /> : <Unlock size={16} />}
                  </button>

                  {/* QR code button if disconnected or pairing */}
                  {!isConnected && (
                    <button
                      type="button"
                      onClick={() => handleOpenQrModal(item)}
                      className="px-2.5 py-1.5 rounded-lg bg-whatsapp-green text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-whatsapp-green/90 transition shadow-sm"
                      title="Escanear QR Code para conectar"
                    >
                      <QrCode size={14} />
                      <span>Conectar</span>
                    </button>
                  )}

                  {/* Restart session */}
                  <button
                    type="button"
                    disabled={loadingAction === item.id}
                    onClick={() => handleRestart(item.id)}
                    className="p-2 rounded-lg text-gray-500 hover:text-whatsapp-green hover:bg-black/5 dark:hover:bg-white/5 transition"
                    title="Reiniciar sessão do WhatsApp"
                  >
                    <RefreshCw
                      size={16}
                      className={loadingAction === item.id ? "animate-spin text-whatsapp-green" : ""}
                    />
                  </button>

                  {/* Disconnect session */}
                  {isConnected && (
                    <button
                      type="button"
                      disabled={loadingAction === item.id}
                      onClick={() => handleDisconnect(item.id)}
                      className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                      title="Desconectar linha"
                    >
                      <Power size={16} />
                    </button>
                  )}

                  {/* Delete connection */}
                  <button
                    type="button"
                    disabled={loadingAction === item.id}
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                    title="Excluir conexão"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* QR Code Inner Modal */}
        {activeQrModal && (
          <div className="p-4 bg-white dark:bg-whatsapp-dark-panel border-t border-whatsapp-light-border dark:border-whatsapp-dark-border flex flex-col items-center gap-3 animate-fadeIn">
            <span className="text-xs font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text">
              Escaneie o QR Code no seu WhatsApp ({activeQrModal.name})
            </span>
            <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center justify-center">
              {activeQrModal.qrcode ? (
                activeQrModal.qrcode.startsWith("data:image") ? (
                  <img
                    src={activeQrModal.qrcode}
                    alt="QR Code"
                    className="w-52 h-52 object-contain"
                  />
                ) : (
                  <QRCodeSVG
                    value={activeQrModal.qrcode}
                    size={210}
                    level="M"
                    includeMargin
                  />
                )
              ) : (
                <div className="w-52 h-52 flex flex-col items-center justify-center text-gray-500 text-xs text-center p-3">
                  <Loader2 size={28} className="animate-spin mb-3 text-whatsapp-green" />
                  <span className="font-semibold text-gray-700">Iniciando sessão do WhatsApp...</span>
                  <span className="text-[10px] text-gray-400 mt-1">Gerando QR Code com Baileys</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setActiveQrModal(null)}
              className="text-xs text-gray-500 hover:underline"
            >
              Fechar QR Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionsModal;
