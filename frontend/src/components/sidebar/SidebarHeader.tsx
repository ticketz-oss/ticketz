import React, { useState } from "react";
import { User, Smartphone, Layers, ChevronDown, Check, Lock, Unlock, Bell, VolumeX, RefreshCw, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTickets } from "../../context/TicketsContext";
import { useNotification } from "../../context/NotificationContext";
import { useAppUpdate } from "../../context/AppUpdateContext";
import {
  isPrivateName,
  isWhatsappPrivate,
  getUserAllowedWhatsappIds,
} from "../../services/privacyService";

export const SidebarHeader: React.FC = () => {
  const { user, privateLinesHidden, setPrivateLinesHidden } = useAuth();
  const {
    whatsapps,
    selectedWhatsappId,
    setSelectedWhatsappId,
    queues,
    selectedQueueIds,
    setSelectedQueueIds,
    showAll,
    setShowAll,
    setActiveModal,
  } = useTickets();
  const { volume, muted } = useNotification();
  const {
    updateInfo,
    hasUpdate,
    currentVersion,
    isChecking: isCheckingUpdate,
    checkUpdatesManual,
    openUpdateModal,
  } = useAppUpdate();

  const [whatsappDropdown, setWhatsappDropdown] = useState(false);
  const [queueDropdown, setQueueDropdown] = useState(false);

  // Filter queues according to permissions and privacy lock
  const allowedUserQueueIds = user?.queues?.map((q) => q.id) || [];
  const filteredQueues = queues.filter((q) => {
    if (privateLinesHidden && isPrivateName(q.name)) return false;
    if (allowedUserQueueIds.length > 0 && !allowedUserQueueIds.includes(q.id)) return false;
    return true;
  });

  // Filter whatsapps according to permissions and privacy lock
  const allowedUserWhatsappIds = getUserAllowedWhatsappIds(user?.id);
  const filteredWhatsapps = whatsapps.filter((w) => {
    if (privateLinesHidden && isWhatsappPrivate(w.id, w.name)) return false;
    if (allowedUserWhatsappIds && allowedUserWhatsappIds.length > 0 && !allowedUserWhatsappIds.includes(w.id)) {
      return false;
    }
    return true;
  });

  const selectedWhatsapp = filteredWhatsapps.find((w) => w.id === selectedWhatsappId);
  const selectedQueue =
    selectedQueueIds.length === 1
      ? filteredQueues.find((q) => q.id === selectedQueueIds[0])
      : null;

  return (
    <div className="px-3 py-2 bg-whatsapp-light-panel dark:bg-whatsapp-dark-panel border-b border-whatsapp-light-border dark:border-whatsapp-dark-border flex flex-col gap-2 select-none shrink-0">
      {/* Top row: User Profile & Admin "Meus / Todos" Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-whatsapp-green/20 dark:bg-whatsapp-green/30 text-whatsapp-green flex items-center justify-center font-bold text-xs shrink-0">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : <User size={16} />}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold truncate leading-tight text-whatsapp-light-text dark:text-whatsapp-dark-text">
              {user?.name || "Atendente"}
            </span>
            <span className="text-[10px] text-gray-400 capitalize">
              {user?.profile === "admin" ? "Administrador" : "Atendente"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Versão e Verificação de Atualização do App */}
          {hasUpdate ? (
            <button
              type="button"
              onClick={openUpdateModal}
              className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold flex items-center gap-1 animate-pulse transition cursor-pointer"
              title={`Nova atualização v${updateInfo?.version} disponível! Clique para instalar.`}
            >
              <Sparkles size={11} className="text-emerald-500" />
              <span>v{updateInfo?.version}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                const res = await checkUpdatesManual();
                if (!res.hasUpdate) {
                  alert(`O aplicativo já está na versão mais recente (v${res.currentVersion}).`);
                }
              }}
              disabled={isCheckingUpdate}
              className="px-1.5 py-0.5 rounded-lg border border-transparent hover:border-gray-300 dark:hover:border-gray-700 text-gray-400 hover:text-whatsapp-green dark:text-[#8696a0] dark:hover:text-whatsapp-green text-[10px] font-medium flex items-center gap-1 transition cursor-pointer"
              title="Versão do sistema - Clique para verificar atualizações"
            >
              <RefreshCw size={10} className={isCheckingUpdate ? "animate-spin text-whatsapp-green" : ""} />
              <span>v{currentVersion}</span>
            </button>
          )}

          {/* Som e Notificações (Atalho para abrir modal de sons) */}
          <button
            type="button"
            onClick={() => setActiveModal("notifications")}
            className={`p-1.5 rounded-lg border text-[11px] transition ${
              muted
                ? "bg-red-500/10 border-red-500/25 text-red-500 hover:bg-red-500/20"
                : "bg-gray-100 dark:bg-whatsapp-dark-hover border-gray-300 dark:border-gray-700 text-gray-500 hover:text-whatsapp-green"
            }`}
            title={muted ? "Sons mutados (Clique para configurar)" : `Sons ativos (${Math.round(volume * 100)}%)`}
          >
            {muted ? <VolumeX size={13} /> : <Bell size={13} />}
          </button>

          {/* Trava Particular (Cadeado) */}
          <button
            type="button"
            onClick={() => {
              if (privateLinesHidden) {
                if (window.confirm("Deseja desbloquear e exibir atendimentos de linhas/filas particulares?")) {
                  setPrivateLinesHidden(false);
                }
              } else {
                setPrivateLinesHidden(true);
              }
            }}
            className={`px-2 py-0.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition ${
              privateLinesHidden
                ? "bg-amber-500/15 border-amber-500/30 text-amber-500 hover:bg-amber-500/25"
                : "bg-gray-100 dark:bg-whatsapp-dark-hover border-gray-300 dark:border-gray-700 text-gray-500 hover:text-gray-700"
            }`}
            title={
              privateLinesHidden
                ? "Cadeado ATIVADO: Linhas particulares OCULTAS (Clique para desbloquear)"
                : "Cadeado DESATIVADO: Linhas particulares VISÍVEIS (Clique para trancar)"
            }
          >
            {privateLinesHidden ? <Lock size={12} /> : <Unlock size={12} />}
            <span className="hidden sm:inline">
              {privateLinesHidden ? "Particular" : "Aberto"}
            </span>
          </button>

          {/* Admin ShowAll Toggle Pill: "Meus" vs "Todos" */}
          {user?.profile === "admin" && (
            <div className="flex items-center bg-gray-100 dark:bg-whatsapp-dark-hover p-0.5 rounded-lg border border-whatsapp-light-border dark:border-whatsapp-dark-border text-[11px]">
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className={`px-2 py-0.5 rounded-md font-medium transition ${
                  !showAll
                    ? "bg-white dark:bg-whatsapp-dark-panel text-whatsapp-green font-bold shadow-xs"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
                title="Exibir apenas atendimentos atribuídos a mim"
              >
                Meus
              </button>
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className={`px-2 py-0.5 rounded-md font-medium transition ${
                  showAll
                    ? "bg-white dark:bg-whatsapp-dark-panel text-whatsapp-green font-bold shadow-xs"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
                title="Exibir atendimentos de todos os atendentes"
              >
                Todos
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Queue Filter & WhatsApp Line Filter */}
      <div className="flex items-center gap-1.5 w-full">
        {/* Queue Dropdown */}
        <div className="relative flex-1">
          <button
            onClick={() => {
              setQueueDropdown(!queueDropdown);
              setWhatsappDropdown(false);
            }}
            type="button"
            className="w-full flex items-center justify-between px-2 py-1 rounded-lg text-[11px] bg-gray-50 dark:bg-whatsapp-dark-hover hover:bg-gray-100 dark:hover:bg-whatsapp-dark-active transition border border-whatsapp-light-border dark:border-whatsapp-dark-border text-whatsapp-light-text dark:text-whatsapp-dark-text"
            title="Filtrar por fila/setor"
          >
            <div className="flex items-center gap-1.5 truncate">
              {selectedQueue ? (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: selectedQueue.color }}
                />
              ) : (
                <Layers size={12} className="text-whatsapp-green shrink-0" />
              )}
              <span className="truncate font-medium">
                {selectedQueue ? selectedQueue.name : "Todas as Filas"}
              </span>
            </div>
            <ChevronDown size={12} className="text-gray-400 shrink-0 ml-1" />
          </button>

          {queueDropdown && (
            <div
              className="absolute left-0 mt-1 w-48 bg-white dark:bg-whatsapp-dark-panel rounded-xl shadow-xl border border-whatsapp-light-border dark:border-whatsapp-dark-border py-1 z-30 animate-fadeIn"
              onMouseLeave={() => setQueueDropdown(false)}
            >
              <div
                onClick={() => {
                  setSelectedQueueIds([]);
                  setQueueDropdown(false);
                }}
                className={`px-3 py-1.5 text-xs flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover ${
                  selectedQueueIds.length === 0 ? "font-bold text-whatsapp-green" : ""
                }`}
              >
                <span>Todas as Filas</span>
                {selectedQueueIds.length === 0 && <Check size={12} />}
              </div>

              <div className="h-px bg-gray-200 dark:bg-whatsapp-dark-border my-1" />

              {filteredQueues.map((q) => (
                <div
                  key={q.id}
                  onClick={() => {
                    setSelectedQueueIds([q.id]);
                    setQueueDropdown(false);
                  }}
                  className={`px-3 py-1.5 text-xs flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover ${
                    selectedQueueIds.includes(q.id) ? "font-bold text-whatsapp-green" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: q.color }}
                    />
                    <span className="truncate">{q.name}</span>
                  </div>
                  {selectedQueueIds.includes(q.id) && <Check size={12} />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WhatsApp Line Dropdown */}
        <div className="relative flex-1">
          <button
            onClick={() => {
              setWhatsappDropdown(!whatsappDropdown);
              setQueueDropdown(false);
            }}
            type="button"
            className="w-full flex items-center justify-between px-2 py-1 rounded-lg text-[11px] bg-gray-50 dark:bg-whatsapp-dark-hover hover:bg-gray-100 dark:hover:bg-whatsapp-dark-active transition border border-whatsapp-light-border dark:border-whatsapp-dark-border text-whatsapp-light-text dark:text-whatsapp-dark-text"
            title="Filtrar por conexão WhatsApp"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Smartphone size={12} className="text-whatsapp-green shrink-0" />
              <span className="truncate font-medium">
                {selectedWhatsapp ? selectedWhatsapp.name : "Todas Linhas"}
              </span>
            </div>
            <ChevronDown size={12} className="text-gray-400 shrink-0 ml-1" />
          </button>

          {whatsappDropdown && (
            <div
              className="absolute right-0 mt-1 w-48 bg-white dark:bg-whatsapp-dark-panel rounded-xl shadow-xl border border-whatsapp-light-border dark:border-whatsapp-dark-border py-1 z-30 animate-fadeIn"
              onMouseLeave={() => setWhatsappDropdown(false)}
            >
              <div
                onClick={() => {
                  setSelectedWhatsappId(null);
                  setWhatsappDropdown(false);
                }}
                className={`px-3 py-1.5 text-xs flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover ${
                  selectedWhatsappId === null ? "font-bold text-whatsapp-green" : ""
                }`}
              >
                <span>Todas as Linhas</span>
                {selectedWhatsappId === null && <Check size={12} />}
              </div>

              <div className="h-px bg-gray-200 dark:bg-whatsapp-dark-border my-1" />

              {filteredWhatsapps.map((w) => (
                <div
                  key={w.id}
                  onClick={() => {
                    setSelectedWhatsappId(w.id);
                    setWhatsappDropdown(false);
                  }}
                  className={`px-3 py-1.5 text-xs flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover ${
                    selectedWhatsappId === w.id ? "font-bold text-whatsapp-green" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        w.status === "CONNECTED" ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <span className="truncate">{w.name}</span>
                  </div>
                  {selectedWhatsappId === w.id && <Check size={12} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarHeader;
