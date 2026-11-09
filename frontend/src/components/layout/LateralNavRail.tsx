import React, { useState } from "react";
import {
  MessageSquare,
  Plus,
  Users,
  Zap,
  Tag,
  Layers,
  Smartphone,
  Moon,
  Sun,
  LogOut,
  UserCog,
  Bell,
  VolumeX,
  Settings,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTickets, type ModalType } from "../../context/TicketsContext";
import { useNotification } from "../../context/NotificationContext";
import { useSettingsContext } from "../../context/SettingsContext";
import { useAppUpdate } from "../../context/AppUpdateContext";

export const LateralNavRail: React.FC = () => {
  const { user, logout } = useAuth();
  const { volume, muted } = useNotification();
  const { settings, getMediaUrl } = useSettingsContext();
  const {
    updateInfo,
    hasUpdate,
    currentVersion,
    isChecking: isCheckingUpdate,
    checkUpdatesManual,
    openUpdateModal,
  } = useAppUpdate();
  const {
    tabCounts,
    whatsapps,
    activeModal,
    setActiveModal,
    setSelectedTicket,
  } = useTickets();

  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  const brandLogo = isDark
    ? settings.appLogoDark || settings.appLogoLight
    : settings.appLogoLight || settings.appLogoDark;

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) {
      root.classList.remove("dark");
      setIsDark(false);
    } else {
      root.classList.add("dark");
      setIsDark(true);
    }
  };

  // Check if any WhatsApp connection is disconnected or waiting for QR code
  const hasConnectionWarning = whatsapps.some(
    (w) =>
      w.status === "qrcode" ||
      w.status === "PAIRING" ||
      w.status === "DISCONNECTED" ||
      w.status === "TIMEOUT"
  );

  const navItems: {
    id: string;
    label: string;
    icon: React.FC<{ size?: number; className?: string }>;
    modal?: ModalType;
    badge?: number;
    onClick?: () => void;
  }[] = [
    {
      id: "tickets",
      label: "Atendimentos",
      icon: MessageSquare,
      badge: tabCounts.open > 0 ? tabCounts.open : undefined,
      onClick: () => {
        setActiveModal(null);
      },
    },
    {
      id: "newTicket",
      label: "Novo Atendimento",
      icon: Plus,
      modal: "newTicket",
      onClick: () => setActiveModal("newTicket"),
    },
    {
      id: "contacts",
      label: "Contatos",
      icon: Users,
      modal: "contacts",
      onClick: () => setActiveModal("contacts"),
    },
    {
      id: "quickMessages",
      label: "Respostas Rápidas",
      icon: Zap,
      modal: "quickMessages",
      onClick: () => setActiveModal("quickMessages"),
    },
    {
      id: "tags",
      label: "Tags",
      icon: Tag,
      modal: "tags",
      onClick: () => setActiveModal("tags"),
    },
    {
      id: "queues",
      label: "Filas / Departamentos",
      icon: Layers,
      modal: "queues",
      onClick: () => setActiveModal("queues"),
    },
    {
      id: "connections",
      label: "Conexões WhatsApp",
      icon: Smartphone,
      modal: "connections",
      onClick: () => setActiveModal("connections"),
    },
    ...(user?.profile === "admin"
      ? [
          {
            id: "users",
            label: "Usuários e Atendentes",
            icon: UserCog,
            modal: "users" as ModalType,
            onClick: () => setActiveModal("users"),
          },
          {
            id: "settings",
            label: "Configurações do Sistema",
            icon: Settings,
            modal: "settings" as ModalType,
            onClick: () => setActiveModal("settings"),
          },
        ]
      : []),
  ];

  return (
    <aside className="w-14 h-full bg-whatsapp-light-panel dark:bg-whatsapp-dark-panel border-r border-whatsapp-light-border dark:border-whatsapp-dark-border flex flex-col items-center justify-between py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] pb-[max(0.625rem,env(safe-area-inset-bottom))] select-none shrink-0 z-20 overflow-y-auto overflow-x-hidden no-scrollbar">
      {/* Top section: Brand icon & Navigation Items */}
      <div className="flex flex-col items-center gap-1 w-full">
        {/* Brand App Icon */}
        <div
          onClick={() => {
            setActiveModal(null);
            setSelectedTicket(null);
          }}
          className="w-10 h-10 rounded-xl bg-whatsapp-green flex items-center justify-center text-white font-black text-lg cursor-pointer shadow-md shadow-whatsapp-green/20 hover:scale-105 active:scale-95 transition mb-1 overflow-hidden p-1 shrink-0"
          title={settings.appName || "Ticketz Neo - Painel de Atendimento"}
        >
          {brandLogo ? (
            <img
              src={getMediaUrl(brandLogo)}
              alt={settings.appName || "Logo"}
              className="w-full h-full object-contain"
            />
          ) : (
            <span>💬</span>
          )}
        </div>

        {/* Navigation list */}
        <div className="flex flex-col items-center gap-1 w-full px-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isItemActive =
              item.modal === activeModal || (!activeModal && item.id === "tickets");

            return (
              <div key={item.id} className="relative group w-full flex justify-center">
                <button
                  type="button"
                  onClick={item.onClick}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition relative ${
                    isItemActive
                      ? "bg-whatsapp-green text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover hover:text-whatsapp-light-text dark:hover:text-whatsapp-dark-text"
                  }`}
                  aria-label={item.label}
                >
                  <Icon size={19} />

                  {/* Warning dot for WhatsApp connections */}
                  {item.id === "connections" && hasConnectionWarning && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-whatsapp-dark-panel animate-pulse" />
                  )}

                  {/* Open tickets count badge */}
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-1 px-1 min-w-4 h-4 rounded-full bg-whatsapp-green text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-white dark:ring-whatsapp-dark-panel">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </button>

                {/* WhatsApp-style Hover Tooltip */}
                <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-50">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom section: Sounds, Theme, Logout */}
      <div className="flex flex-col items-center gap-1 w-full px-1.5 pt-2 shrink-0">
        {/* Sounds & Notifications */}
        <div className="relative group w-full flex justify-center">
          <button
            type="button"
            onClick={() => setActiveModal("notifications")}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition relative ${
              activeModal === "notifications"
                ? "bg-whatsapp-green text-white shadow-sm"
                : muted
                ? "text-red-400 hover:bg-red-500/10"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover"
            }`}
            title="Sons e Notificações"
          >
            {muted ? (
              <VolumeX size={18} />
            ) : volume > 0 ? (
              <Bell size={18} />
            ) : (
              <VolumeX size={18} />
            )}
            {muted && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
            )}
          </button>
          <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-50">
            {muted ? "Sons: Mutados" : `Sons e Notificações (${Math.round(volume * 100)}%)`}
          </div>
        </div>

        {/* Theme Switcher */}
        <div className="relative group w-full flex justify-center">
          <button
            type="button"
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover transition"
            title="Alternar Tema Claro/Escuro"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-50">
            {isDark ? "Modo Claro" : "Modo Escuro"}
          </div>
        </div>

        {/* App Version & Updater */}
        <div className="relative group w-full flex justify-center">
          <button
            type="button"
            onClick={async () => {
              if (hasUpdate) {
                openUpdateModal();
              } else {
                const res = await checkUpdatesManual();
                if (!res.hasUpdate) {
                  alert(`O sistema está na versão mais recente (v${res.currentVersion}).`);
                }
              }
            }}
            disabled={isCheckingUpdate}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition relative ${
              hasUpdate
                ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 animate-pulse hover:bg-emerald-500/30"
                : "text-gray-400 hover:text-whatsapp-green hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover"
            }`}
            title={hasUpdate ? `Nova versão v${updateInfo?.version} disponível!` : `Versão v${currentVersion}`}
          >
            {hasUpdate ? (
              <Sparkles size={18} className="text-emerald-500" />
            ) : (
              <RefreshCw size={16} className={isCheckingUpdate ? "animate-spin text-whatsapp-green" : ""} />
            )}
            {hasUpdate && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#111b21]" />
            )}
          </button>
          <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-50">
            {hasUpdate ? `Atualização disponível: v${updateInfo?.version}` : `Versão v${currentVersion} (Clique p/ checar)`}
          </div>
        </div>

        {/* Logout */}
        <div className="relative group w-full flex justify-center">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Deseja realmente sair do sistema?")) {
                logout();
              }
            }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500/10 transition"
            title="Sair do Ticketz"
          >
            <LogOut size={18} />
          </button>
          <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-50">
            Sair
          </div>
        </div>
      </div>
    </aside>
  );
};

export default LateralNavRail;
