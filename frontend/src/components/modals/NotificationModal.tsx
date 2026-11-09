import React from "react";
import {
  X,
  Bell,
  Volume2,
  VolumeX,
  Volume1,
  Play,
  Monitor,
  MessageSquare,
  Check,
} from "lucide-react";
import { useNotification } from "../../context/NotificationContext";
import { useTickets } from "../../context/TicketsContext";
import { useEscapeKey } from "../common/useEscapeKey";

export const NotificationModal: React.FC = () => {
  const { activeModal, setActiveModal } = useTickets();
  const {
    volume,
    setVolume,
    muted,
    setMuted,
    soundChoice,
    setSoundChoice,
    desktopEnabled,
    setDesktopEnabled,
    inAppPopupEnabled,
    setInAppPopupEnabled,
    permissionStatus,
    requestPermission,
    playTestSound,
  } = useNotification();

  useEscapeKey(() => setActiveModal(null), activeModal === "notifications");

  if (activeModal !== "notifications") return null;

  const handleTestSound = () => {
    playTestSound();
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      setDesktopEnabled(true);
    }
  };

  const volumePercent = Math.round(volume * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={() => setActiveModal(null)}
    >
      <div
        className="bg-white dark:bg-whatsapp-dark-panel rounded-2xl w-full max-w-md shadow-2xl border border-whatsapp-light-border dark:border-whatsapp-dark-border overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-whatsapp-light-border dark:border-whatsapp-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-whatsapp-green/10 text-whatsapp-green flex items-center justify-center font-bold">
              <Bell size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text">
                Sons e Notificações
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ajuste volume, alertas sonoros e pop-ups
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            type="button"
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* 1. Volume & Mute Section */}
          <div className="bg-gray-50 dark:bg-whatsapp-dark-hover/40 p-4 rounded-xl border border-whatsapp-light-border dark:border-whatsapp-dark-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text flex items-center gap-1.5">
                {muted ? (
                  <VolumeX size={16} className="text-red-500" />
                ) : volume > 0.5 ? (
                  <Volume2 size={16} className="text-whatsapp-green" />
                ) : (
                  <Volume1 size={16} className="text-whatsapp-green" />
                )}
                <span>Volume das Notificações</span>
              </span>
              <span className="text-xs font-bold text-whatsapp-green">
                {muted ? "Mutado (0%)" : `${volumePercent}%`}
              </span>
            </div>

            {/* Slider */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMuted(!muted)}
                className={`p-2 rounded-lg border transition ${
                  muted
                    ? "bg-red-500/10 border-red-500/30 text-red-500"
                    : "bg-white dark:bg-whatsapp-dark-panel border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-whatsapp-green"
                }`}
                title={muted ? "Desmutar" : "Mutar sons"}
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>

              <input
                type="range"
                min="0"
                max="100"
                value={muted ? 0 : volumePercent}
                onChange={(e) => {
                  const val = Number(e.target.value) / 100;
                  setVolume(val);
                  if (muted && val > 0) {
                    setMuted(false);
                  }
                }}
                className="w-full accent-whatsapp-green cursor-pointer h-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
              />

              <button
                type="button"
                onClick={handleTestSound}
                className="px-3 py-1.5 rounded-lg bg-whatsapp-green text-white text-xs font-semibold hover:bg-whatsapp-green/90 transition shadow-xs flex items-center gap-1 shrink-0"
                title="Tocar som de teste agora"
              >
                <Play size={12} className="fill-white" />
                <span>Testar</span>
              </button>
            </div>
          </div>

          {/* 2. Sound Choice */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text">
              Toque de Notificação:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSoundChoice("chat_notify");
                  playTestSound();
                }}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  soundChoice === "chat_notify"
                    ? "bg-whatsapp-green/10 border-whatsapp-green text-whatsapp-green font-bold shadow-xs"
                    : "bg-white dark:bg-whatsapp-dark-panel border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-whatsapp-dark-hover"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs">WhatsApp Ping</span>
                  {soundChoice === "chat_notify" && <Check size={14} className="text-whatsapp-green" />}
                </div>
                <span className="text-[10px] text-gray-400 font-normal">Toque sutil e rápido</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSoundChoice("sound");
                  playTestSound();
                }}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  soundChoice === "sound"
                    ? "bg-whatsapp-green/10 border-whatsapp-green text-whatsapp-green font-bold shadow-xs"
                    : "bg-white dark:bg-whatsapp-dark-panel border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-whatsapp-dark-hover"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs">Alerta Clássico</span>
                  {soundChoice === "sound" && <Check size={14} className="text-whatsapp-green" />}
                </div>
                <span className="text-[10px] text-gray-400 font-normal">Sino nítido de atendimento</span>
              </button>
            </div>
          </div>

          {/* 3. Pop-up & Desktop Notifications */}
          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <span className="block text-xs font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text">
              Funções de Pop-up:
            </span>

            {/* In-App Floating Toast Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-whatsapp-dark-hover/40 border border-whatsapp-light-border dark:border-whatsapp-dark-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-whatsapp-light-text dark:text-whatsapp-dark-text">
                    Pop-up Flutuante na Tela (In-App)
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Exibe cartão no canto da tela quando chegar mensagem de outra conversa
                  </div>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={inAppPopupEnabled}
                  onChange={(e) => setInAppPopupEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-whatsapp-green"></div>
              </label>
            </div>

            {/* Desktop OS Notification Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-whatsapp-dark-hover/40 border border-whatsapp-light-border dark:border-whatsapp-dark-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                  <Monitor size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-whatsapp-light-text dark:text-whatsapp-dark-text flex items-center gap-1.5">
                    <span>Notificações na Área de Trabalho (Desktop)</span>
                    {permissionStatus === "granted" ? (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                        Permitido
                      </span>
                    ) : permissionStatus === "denied" ? (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/15 text-red-500 font-bold">
                        Bloqueado
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Avisa pelo Windows mesmo com o navegador minimizado
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {permissionStatus !== "granted" ? (
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    className="px-2.5 py-1 rounded-lg bg-purple-600 text-white text-[11px] font-semibold hover:bg-purple-700 transition"
                  >
                    Ativar
                  </button>
                ) : (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={desktopEnabled}
                      onChange={(e) => setDesktopEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-whatsapp-green"></div>
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-whatsapp-light-border dark:border-whatsapp-dark-border bg-gray-50/50 dark:bg-black/20 flex justify-end">
          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="px-4 py-1.5 rounded-xl bg-whatsapp-green text-white text-xs font-semibold hover:bg-whatsapp-green/90 transition shadow-sm"
          >
            Pronto
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
