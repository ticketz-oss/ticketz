import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Palette,
  Sliders,
  Bot,
  HardDrive,
  Bell,
  Server,
  Upload,
  Check,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";
import api, { getBackendUrl } from "../../services/api";
import { useTickets } from "../../context/TicketsContext";
import { useSettingsContext } from "../../context/SettingsContext";
import { useAudioPlayback } from "../../context/AudioPlaybackContext";
import { useAppUpdate } from "../../context/AppUpdateContext";
import { useEscapeKey } from "../common/useEscapeKey";

type SettingsTab = "visual" | "service" | "ai" | "storage" | "privacy" | "server";

export const SettingsModal: React.FC = () => {
  const { activeModal, setActiveModal } = useTickets();
  const { updateSettingValue, refreshSettings } = useSettingsContext();
  const { proximityEarpieceEnabled, setProximityEarpieceEnabled } = useAudioPlayback();
  const { currentVersion, isChecking: isCheckingUpdate, checkUpdatesManual } = useAppUpdate();
  const [manualUpdateMsg, setManualUpdateMsg] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<SettingsTab>("visual");
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveSuccessKey, setSaveSuccessKey] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [restartLoading, setRestartLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Settings Dictionary state
  const [settings, setSettings] = useState<Record<string, string>>({});

  const backendUrl = getBackendUrl();
  const fileInputLightRef = useRef<HTMLInputElement | null>(null);
  const fileInputDarkRef = useRef<HTMLInputElement | null>(null);
  const fileInputFaviconRef = useRef<HTMLInputElement | null>(null);
  const fileInputSidePanelRef = useRef<HTMLInputElement | null>(null);
  const fileInputBgRef = useRef<HTMLInputElement | null>(null);

  useEscapeKey(() => {
    setActiveModal(null);
  }, activeModal === "settings");

  useEffect(() => {
    if (activeModal === "settings") {
      loadSettings();
    }
  }, [activeModal]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<any[]>("/settings");
      if (Array.isArray(data)) {
        const dict: Record<string, string> = {};
        data.forEach((s) => {
          if (s.key) dict[s.key] = s.value ?? "";
        });
        setSettings(dict);
      }
    } catch (err) {
      console.error("Error loading settings:", err);
      setStatusMsg({ type: "error", text: "Erro ao carregar configurações do servidor." });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    setSavingKey(key);
    try {
      await api.put(`/settings/${key}`, { value });
      setSettings((prev) => ({ ...prev, [key]: value }));
      await updateSettingValue(key, value);
      setSaveSuccessKey(key);
      setTimeout(() => {
        setSaveSuccessKey((prev) => (prev === key ? null : prev));
      }, 2000);
    } catch (err: any) {
      console.error(`Error saving setting ${key}:`, err);
      setStatusMsg({
        type: "error",
        text: err?.response?.data?.message || `Erro ao salvar a configuração "${key}".`,
      });
      setTimeout(() => setStatusMsg(null), 4000);
    } finally {
      setSavingKey(null);
    }
  };

  const handleUploadLogo = async (mode: "Light" | "Dark" | "Favicon", file: File) => {
    setUploadingLogo(mode);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);

      const { data } = await api.post("/settings/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const settingKey = `appLogo${mode}`;
      const newFilename = typeof data === "string" ? data : file.name;
      setSettings((prev) => ({ ...prev, [settingKey]: newFilename }));
      await refreshSettings();
      setStatusMsg({ type: "success", text: `Logo ${mode} atualizado com sucesso!` });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error(`Error uploading logo ${mode}:`, err);
      setStatusMsg({
        type: "error",
        text: err?.response?.data?.message || `Erro ao enviar logotipo ${mode}.`,
      });
      setTimeout(() => setStatusMsg(null), 4000);
    } finally {
      setUploadingLogo(null);
    }
  };

  const handleUploadPublicFile = async (settingKey: "loginSidePanelImage" | "loginBackgroundContent", file: File) => {
    setUploadingLogo(settingKey);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("settingKey", settingKey);

      const { data } = await api.post("/settings/publicFile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newFilename = typeof data === "string" ? data : file.name;
      setSettings((prev) => ({ ...prev, [settingKey]: newFilename }));
      await refreshSettings();
      setStatusMsg({ type: "success", text: `Arquivo da tela de login atualizado com sucesso!` });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error(`Error uploading public file ${settingKey}:`, err);
      setStatusMsg({
        type: "error",
        text: err?.response?.data?.message || "Erro ao enviar imagem de login.",
      });
      setTimeout(() => setStatusMsg(null), 4000);
    } finally {
      setUploadingLogo(null);
    }
  };

  const handleRestartBackend = async () => {
    if (
      !window.confirm(
        "Tem certeza que deseja reiniciar o servidor backend agora? As conexões ativas serão restabelecidas em poucos segundos."
      )
    ) {
      return;
    }

    setRestartLoading(true);
    try {
      await api.post("/restart");
      setStatusMsg({
        type: "success",
        text: "Comando de reinicialização enviado. O servidor estará de volta em instantes.",
      });
    } catch (err: any) {
      console.error("Error restarting backend:", err);
      setStatusMsg({
        type: "error",
        text: err?.response?.data?.message || "Erro ao enviar comando de reinicialização.",
      });
    } finally {
      setTimeout(() => setRestartLoading(false), 3000);
    }
  };

  if (activeModal !== "settings") return null;

  const getMediaUrl = (filename?: string) => {
    if (!filename) return "";
    if (filename.startsWith("http")) return filename;
    const base = backendUrl.startsWith("http") ? `${backendUrl}/public` : `/backend/public`;
    return `${base}/${filename}`;
  };

  const tabs: { id: SettingsTab; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
    { id: "visual", label: "Identidade & Visual", icon: Palette },
    { id: "service", label: "Atendimento & Filas", icon: Sliders },
    { id: "ai", label: "Inteligência Artificial", icon: Bot },
    { id: "storage", label: "Armazenamento & Mídia", icon: HardDrive },
    { id: "privacy", label: "Notificações & Regras", icon: Bell },
    { id: "server", label: "Sistema & Servidor", icon: Server },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={() => setActiveModal(null)}
    >
      <div
        className="w-full max-w-4xl bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#222e35] flex flex-col overflow-hidden max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-gray-200 dark:border-[#2a3942] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-whatsapp-green/15 text-whatsapp-green flex items-center justify-center">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-900 dark:text-[#e9edef]">
                Configurações do Sistema
              </h2>
              <p className="text-xs text-gray-500 dark:text-[#8696a0]">
                Personalize identidade visual, atendimento, inteligência artificial e servidor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadSettings}
              disabled={loading}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#2a3942] transition"
              title="Recarregar Configurações"
            >
              <RefreshCw size={17} className={loading ? "animate-spin text-whatsapp-green" : ""} />
            </button>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#2a3942] transition"
              title="Fechar (Esc)"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* Status Toast Banner */}
        {statusMsg && (
          <div
            className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b animate-fadeIn ${
              statusMsg.type === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400"
            }`}
          >
            {statusMsg.type === "success" ? <Check size={15} /> : <AlertTriangle size={15} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Modal Body with Sidebar Tabs */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Navigation Tabs (Vertical on desktop, horizontal scroll on mobile) */}
          <div className="w-full md:w-56 bg-[#f7f8fa] dark:bg-[#182229] border-r border-gray-200 dark:border-[#222e35] flex md:flex-col overflow-x-auto md:overflow-x-visible p-2 gap-1 shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCurrentTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition text-left ${
                    isActive
                      ? "bg-whatsapp-green text-white shadow-xs"
                      : "text-gray-600 dark:text-[#8696a0] hover:bg-gray-200/70 dark:hover:bg-[#202c33] hover:text-gray-900 dark:hover:text-[#e9edef]"
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white dark:bg-[#111b21] space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
                <Loader2 size={28} className="animate-spin text-whatsapp-green" />
                <span className="text-xs">Carregando configurações...</span>
              </div>
            ) : (
              <>
                {/* TAB 1: VISUAL & MARCA */}
                {currentTab === "visual" && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="border-b border-gray-200 dark:border-[#222e35] pb-3">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-[#e9edef] flex items-center gap-2">
                        <Palette size={16} className="text-whatsapp-green" />
                        Identidade Visual & Cores (Whitelabel)
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-[#8696a0]">
                        Defina o nome da sua empresa, logotipos e paleta de cores do sistema
                      </p>
                    </div>

                    {/* Versão e Atualizador do App */}
                    <div className="p-4 rounded-xl border border-gray-200 dark:border-[#2a3942] bg-gray-50/70 dark:bg-[#202c33]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                            Versão do Aplicativo
                          </span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-whatsapp-green/20 text-whatsapp-green border border-whatsapp-green/30">
                            v{currentVersion}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-[#8696a0] block">
                          Mantenha o app atualizado para receber novas melhorias e correções sem precisar reinstalar.
                        </span>
                        {manualUpdateMsg && (
                          <span className="text-[11px] text-whatsapp-green font-semibold block animate-fadeIn">
                            ✓ {manualUpdateMsg}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          setManualUpdateMsg(null);
                          const res = await checkUpdatesManual();
                          if (!res.hasUpdate) {
                            setManualUpdateMsg("Você já está na versão mais recente!");
                            setTimeout(() => setManualUpdateMsg(null), 4000);
                          }
                        }}
                        disabled={isCheckingUpdate}
                        className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#00a884] to-[#25d366] hover:from-[#009170] hover:to-[#20ba59] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {isCheckingUpdate ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Verificando...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw size={14} />
                            <span>Verificar Atualizações</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* App Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Nome da Aplicação (Título da Janela e Header)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={settings.appName || ""}
                          onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                          className="flex-1 px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202c33] border border-gray-200 dark:border-[#2a3942] text-gray-900 dark:text-[#e9edef] focus:outline-none focus:border-whatsapp-green"
                          placeholder="Ex: Chat Atendimento"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateSetting("appName", settings.appName || "")}
                          disabled={savingKey === "appName"}
                          className="px-4 py-2 bg-whatsapp-green hover:bg-whatsapp-green-dark text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                        >
                          {savingKey === "appName" ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : saveSuccessKey === "appName" ? (
                            <Check size={13} />
                          ) : null}
                          <span>Salvar</span>
                        </button>
                      </div>
                    </div>

                    {/* Primary Color */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Cor Primária do Tema
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.primaryColorLight || "#170FAD"}
                          onChange={(e) =>
                            setSettings({ ...settings, primaryColorLight: e.target.value })
                          }
                          className="w-10 h-10 rounded-xl cursor-pointer border border-gray-200 dark:border-[#2a3942] p-0.5 bg-transparent"
                        />
                        <input
                          type="text"
                          value={settings.primaryColorLight || "#170FAD"}
                          onChange={(e) =>
                            setSettings({ ...settings, primaryColorLight: e.target.value })
                          }
                          className="w-32 px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202c33] border border-gray-200 dark:border-[#2a3942] font-mono text-gray-900 dark:text-[#e9edef] focus:outline-none focus:border-whatsapp-green"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateSetting(
                              "primaryColorLight",
                              settings.primaryColorLight || "#170FAD"
                            )
                          }
                          disabled={savingKey === "primaryColorLight"}
                          className="px-4 py-2 bg-whatsapp-green hover:bg-whatsapp-green-dark text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                        >
                          {savingKey === "primaryColorLight" ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : saveSuccessKey === "primaryColorLight" ? (
                            <Check size={13} />
                          ) : null}
                          <span>Salvar Cor</span>
                        </button>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[11px] text-gray-400">Cores rápidas:</span>
                        {[
                          { name: "Verde WhatsApp", hex: "#00a884" },
                          { name: "Ticketz Blue", hex: "#170FAD" },
                          { name: "Azul Real", hex: "#2563eb" },
                          { name: "Roxo", hex: "#7c3aed" },
                          { name: "Laranja", hex: "#ea580c" },
                        ].map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => {
                              setSettings({ ...settings, primaryColorLight: c.hex });
                              handleUpdateSetting("primaryColorLight", c.hex);
                            }}
                            className="w-6 h-6 rounded-full border-2 border-white dark:border-[#111b21] shadow-xs hover:scale-110 transition"
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Logos Upload Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      {/* Logo Light */}
                      <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#182229] border border-gray-200 dark:border-[#222e35] space-y-3 flex flex-col">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-800 dark:text-[#e9edef]">
                            Logo Modo Claro
                          </span>
                          <span className="text-[10px] text-gray-400">PNG / SVG</span>
                        </div>
                        <div className="h-20 bg-white rounded-xl border border-gray-200 flex items-center justify-center p-2 overflow-hidden shadow-2xs">
                          {settings.appLogoLight ? (
                            <img
                              src={getMediaUrl(settings.appLogoLight)}
                              alt="Logo Claro"
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <ImageIcon size={28} className="text-gray-300" />
                          )}
                        </div>
                        <input
                          ref={fileInputLightRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleUploadLogo("Light", e.target.files[0]);
                            }
                          }}
                        />
                        <button
                          type="button"
                          disabled={uploadingLogo === "Light"}
                          onClick={() => fileInputLightRef.current?.click()}
                          className="w-full mt-auto py-1.5 px-3 bg-gray-200 hover:bg-gray-300 dark:bg-[#202c33] dark:hover:bg-[#2a3942] text-gray-700 dark:text-[#e9edef] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                        >
                          {uploadingLogo === "Light" ? (
                            <Loader2 size={13} className="animate-spin text-whatsapp-green" />
                          ) : (
                            <Upload size={13} />
                          )}
                          <span>Alterar Logo Claro</span>
                        </button>
                      </div>

                      {/* Logo Dark */}
                      <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#182229] border border-gray-200 dark:border-[#222e35] space-y-3 flex flex-col">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-800 dark:text-[#e9edef]">
                            Logo Modo Escuro
                          </span>
                          <span className="text-[10px] text-gray-400">PNG / SVG</span>
                        </div>
                        <div className="h-20 bg-[#111b21] rounded-xl border border-gray-700 flex items-center justify-center p-2 overflow-hidden shadow-2xs">
                          {settings.appLogoDark ? (
                            <img
                              src={getMediaUrl(settings.appLogoDark)}
                              alt="Logo Escuro"
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <ImageIcon size={28} className="text-gray-600" />
                          )}
                        </div>
                        <input
                          ref={fileInputDarkRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleUploadLogo("Dark", e.target.files[0]);
                            }
                          }}
                        />
                        <button
                          type="button"
                          disabled={uploadingLogo === "Dark"}
                          onClick={() => fileInputDarkRef.current?.click()}
                          className="w-full mt-auto py-1.5 px-3 bg-gray-200 hover:bg-gray-300 dark:bg-[#202c33] dark:hover:bg-[#2a3942] text-gray-700 dark:text-[#e9edef] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                        >
                          {uploadingLogo === "Dark" ? (
                            <Loader2 size={13} className="animate-spin text-whatsapp-green" />
                          ) : (
                            <Upload size={13} />
                          )}
                          <span>Alterar Logo Escuro</span>
                        </button>
                      </div>

                      {/* Favicon */}
                      <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#182229] border border-gray-200 dark:border-[#222e35] space-y-3 flex flex-col">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-800 dark:text-[#e9edef]">
                            Favicon (Ícone Navegador)
                          </span>
                          <span className="text-[10px] text-gray-400">ICO / PNG</span>
                        </div>
                        <div className="h-20 bg-gray-100 dark:bg-[#202c33] rounded-xl border border-gray-200 dark:border-[#2a3942] flex items-center justify-center p-2 overflow-hidden shadow-2xs">
                          {settings.appLogoFavicon ? (
                            <img
                              src={getMediaUrl(settings.appLogoFavicon)}
                              alt="Favicon"
                              className="w-10 h-10 object-contain"
                            />
                          ) : (
                            <ImageIcon size={28} className="text-gray-400" />
                          )}
                        </div>
                        <input
                          ref={fileInputFaviconRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleUploadLogo("Favicon", e.target.files[0]);
                            }
                          }}
                        />
                        <button
                          type="button"
                          disabled={uploadingLogo === "Favicon"}
                          onClick={() => fileInputFaviconRef.current?.click()}
                          className="w-full mt-auto py-1.5 px-3 bg-gray-200 hover:bg-gray-300 dark:bg-[#202c33] dark:hover:bg-[#2a3942] text-gray-700 dark:text-[#e9edef] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                        >
                          {uploadingLogo === "Favicon" ? (
                            <Loader2 size={13} className="animate-spin text-whatsapp-green" />
                          ) : (
                            <Upload size={13} />
                          )}
                          <span>Alterar Favicon</span>
                        </button>
                      </div>
                    </div>

                    {/* Login Screen Customization */}
                    <div className="pt-2 border-t border-gray-200 dark:border-[#222e35] space-y-3">
                      <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Personalização da Tela de Login
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Side Panel Image */}
                        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#182229] border border-gray-200 dark:border-[#222e35] flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-[#202c33] flex items-center justify-center overflow-hidden shrink-0">
                              {settings.loginSidePanelImage ? (
                                <img
                                  src={getMediaUrl(settings.loginSidePanelImage)}
                                  alt="Painel Login"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon size={20} className="text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-gray-800 dark:text-[#e9edef] block truncate">
                                Painel Lateral do Login
                              </span>
                              <span className="text-[10px] text-gray-400">Imagem de destaque</span>
                            </div>
                          </div>
                          <input
                            ref={fileInputSidePanelRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleUploadPublicFile("loginSidePanelImage", e.target.files[0]);
                              }
                            }}
                          />
                          <button
                            type="button"
                            disabled={uploadingLogo === "loginSidePanelImage"}
                            onClick={() => fileInputSidePanelRef.current?.click()}
                            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-[#202c33] dark:hover:bg-[#2a3942] text-gray-700 dark:text-[#e9edef] rounded-xl text-xs font-semibold transition shrink-0"
                          >
                            Trocar
                          </button>
                        </div>

                        {/* Background Content */}
                        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#182229] border border-gray-200 dark:border-[#222e35] flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-[#202c33] flex items-center justify-center overflow-hidden shrink-0">
                              {settings.loginBackgroundContent ? (
                                <img
                                  src={getMediaUrl(settings.loginBackgroundContent)}
                                  alt="Fundo Login"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon size={20} className="text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-gray-800 dark:text-[#e9edef] block truncate">
                                Fundo da Tela de Login
                              </span>
                              <span className="text-[10px] text-gray-400">Imagem ou Vídeo de fundo</span>
                            </div>
                          </div>
                          <input
                            ref={fileInputBgRef}
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleUploadPublicFile("loginBackgroundContent", e.target.files[0]);
                              }
                            }}
                          />
                          <button
                            type="button"
                            disabled={uploadingLogo === "loginBackgroundContent"}
                            onClick={() => fileInputBgRef.current?.click()}
                            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-[#202c33] dark:hover:bg-[#2a3942] text-gray-700 dark:text-[#e9edef] rounded-xl text-xs font-semibold transition shrink-0"
                          >
                            Trocar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: ATENDIMENTO & FILAS */}
                {currentTab === "service" && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="border-b border-gray-200 dark:border-[#222e35] pb-3">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-[#e9edef] flex items-center gap-2">
                        <Sliders size={16} className="text-whatsapp-green" />
                        Regras de Atendimento & Filas
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-[#8696a0]">
                        Controle o comportamento automático dos chamados, timeouts e avaliações
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Open Ticket Timeout (Segundos) */}
                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#182229] border border-gray-200 dark:border-[#222e35] space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-800 dark:text-[#e9edef]">
                            Timeout de Chamado Aberto
                          </label>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {Number(settings.openTicketTimeout || 0) > 0
                              ? `${Math.round(Number(settings.openTicketTimeout) / 60)} min`
                              : "Desativado"}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-[#8696a0]">
                          Tempo sem resposta do cliente para acionar ação automática (em minutos). Digite 0 para desativar.
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={Math.round(Number(settings.openTicketTimeout || 0) / 60)}
                            onChange={(e) => {
                              const mins = Number(e.target.value);
                              const seconds = String(mins * 60);
                              setSettings({ ...settings, openTicketTimeout: seconds });
                            }}
                            className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#202c33] border border-gray-200 dark:border-[#2a3942] text-gray-900 dark:text-[#e9edef] focus:outline-none focus:border-whatsapp-green"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateSetting("openTicketTimeout", settings.openTicketTimeout || "0")
                            }
                            disabled={savingKey === "openTicketTimeout"}
                            className="px-3 py-2 bg-whatsapp-green hover:bg-whatsapp-green-dark text-white text-xs font-semibold rounded-xl transition shadow-xs"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>

                      {/* Open Ticket Timeout Action */}
                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#182229] border border-gray-200 dark:border-[#222e35] space-y-2">
                        <label className="text-xs font-bold text-gray-800 dark:text-[#e9edef]">
                          Ação ao Estourar Timeout do Chamado
                        </label>
                        <p className="text-[11px] text-gray-500 dark:text-[#8696a0]">
                          O que fazer quando o cliente não responde no prazo configurado
                        </p>
                        <select
                          value={settings.openTicketTimeoutAction || "closed"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSettings({ ...settings, openTicketTimeoutAction: val });
                            handleUpdateSetting("openTicketTimeoutAction", val);
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#202c33] border border-gray-200 dark:border-[#2a3942] text-gray-900 dark:text-[#e9edef] focus:outline-none focus:border-whatsapp-green"
                        >
                          <option value="closed">Finalizar Chamado (Mover para Fechados)</option>
                          <option value="pending">Mover Chamado para Pendente / Aguardando</option>
                        </select>
                      </div>

                      {/* Accept WhatsApp Calls */}
                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#182229] border border-gray-200 dark:border-[#222e35] space-y-2">
                        <label className="text-xs font-bold text-gray-800 dark:text-[#e9edef]">
                          Aceitar Chamadas no WhatsApp
                        </label>
                        <p className="text-[11px] text-gray-500 dark:text-[#8696a0]">
                          Quando desativado, o sistema rejeita chamadas de áudio e vídeo com mensagem automática
                        </p>
                        <select
                          value={settings.call || "enabled"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSettings({ ...settings, call: val });
                            handleUpdateSetting("call", val);
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#202c33] border border-gray-200 dark:border-[#2a3942] text-gray-900 dark:text-[#e9edef] focus:outline-none focus:border-whatsapp-green"
                        >
                          <option value="enabled">Ativado (Aceitar e Registrar Chamadas)</option>
                          <option value="disabled">Desativado (Rejeitar Chamadas Automaticamente)</option>
                        </select>
                      </div>

                      {/* User Rating */}
                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#182229] border border-gray-200 dark:border-[#222e35] space-y-2">
                        <label className="text-xs font-bold text-gray-800 dark:text-[#e9edef]">
                          Pesquisa de Avaliação ao Finalizar
                        </label>
                        <p className="text-[11px] text-gray-500 dark:text-[#8696a0]">
                          Envia enquete de satisfação ao cliente quando o ticket for resolvido
                        </p>
                        <select
                          value={settings.userRating || "disabled"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSettings({ ...settings, userRating: val });
                            handleUpdateSetting("userRating", val);
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#202c33] border border-gray-200 dark:border-[#2a3942] text-gray-900 dark:text-[#e9edef] focus:outline-none focus:border-whatsapp-green"
                        >
                          <option value="disabled">Desativado (Sem Avaliação)</option>
                          <option value="enabled">Ativado (Enviar Pesquisa de Satisfação)</option>
                        </select>
                      </div>

                      {/* Tags Mode */}
                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#182229] border border-gray-200 dark:border-[#222e35] space-y-2">
                        <label className="text-xs font-bold text-gray-800 dark:text-[#e9edef]">
                          Modo de Associação das Etiquetas (Tags)
                        </label>
                        <p className="text-[11px] text-gray-500 dark:text-[#8696a0]">
                          Vincular etiquetas ao contato ou individualmente a cada atendimento
                        </p>
                        <select
                          value={settings.tagsMode || "contact"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSettings({ ...settings, tagsMode: val });
                            handleUpdateSetting("tagsMode", val);
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#202c33] border border-gray-200 dark:border-[#2a3942] text-gray-900 dark:text-[#e9edef] focus:outline-none focus:border-whatsapp-green"
                        >
                          <option value="contact">Por Contato (Persiste em todos os chamados dele)</option>
                          <option value="ticket">Por Chamado (Específico deste atendimento)</option>
                        </select>
                      </div>

                      {/* ChatBot Type */}
                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#182229] border border-gray-200 dark:border-[#222e35] space-y-2">
                        <label className="text-xs font-bold text-gray-800 dark:text-[#e9edef]">
                          Tipo de Menu do Chatbot
                        </label>
                        <p className="text-[11px] text-gray-500 dark:text-[#8696a0]">
                          Formato de exibição dos menus de opções e filas
                        </p>
                        <select
                          value={settings.chatBotType || "text"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSettings({ ...settings, chatBotType: val });
                            handleUpdateSetting("chatBotType", val);
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#202c33] border border-gray-200 dark:border-[#2a3942] text-gray-900 dark:text-[#e9edef] focus:outline-none focus:border-whatsapp-green"
                        >
                          <option value="text">Texto Numérico (1, 2, 3...)</option>
                          <option value="button">Botões Interativos (Quando suportado)</option>
                          <option value="list">Lista de Seleção (Menu Dropdown)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: INTELIGÊNCIA ARTIFICIAL */}
                {currentTab === "ai" && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="border-b border-gray-200 dark:border-[#222e35] pb-3">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-[#e9edef] flex items-center gap-2">
                        <Bot size={16} className="text-whatsapp-green" />
                        Inteligência Artificial & Transcrição de Áudio
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-[#8696a0]">
                        Configure o motor de IA para transcrição automática de mensagens de voz e respostas inteligentes
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* AI Provider */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Provedor de IA
                        </label>
                        <select
                          value={settings.aiProvider || "groq"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSettings({ ...settings, aiProvider: val });
                            handleUpdateSetting("aiProvider", val);
                          }}
                          className="w-full sm:w-80 px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202c33] border border-gray-200 dark:border-[#2a3942] text-gray-900 dark:text-[#e9edef] focus:outline-none focus:border-whatsapp-green"
                        >
                          <option value="groq">Groq (Ultra Rápido / Whisper / Llama 3)</option>
                          <option value="openai">OpenAI (Whisper / GPT-4o)</option>
                        </select>
                      </div>

                      {/* API Key */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Chave da API ({settings.aiProvider === "groq" ? "Groq API Key" : "OpenAI API Key"})
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type={showApiKey ? "text" : "password"}
                              value={settings.openAiKey || ""}
                              onChange={(e) =>
                                setSettings({ ...settings, openAiKey: e.target.value })
                              }
                              className="w-full pl-3 pr-10 py-2 text-xs font-mono rounded-xl bg-gray-50 dark:bg-[#202c33] border border-gray-200 dark:border-[#2a3942] text-gray-900 dark:text-[#e9edef] focus:outline-none focus:border-whatsapp-green"
                              placeholder={
                                settings.aiProvider === "groq" ? "gsk_..." : "sk-..."
                              }
                            />
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                              {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateSetting("openAiKey", settings.openAiKey || "")
                            }
                            disabled={savingKey === "openAiKey"}
                            className="px-4 py-2 bg-whatsapp-green hover:bg-whatsapp-green-dark text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                          >
                            {savingKey === "openAiKey" ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : saveSuccessKey === "openAiKey" ? (
                              <Check size={13} />
                            ) : null}
                            <span>Salvar Chave</span>
                          </button>
                        </div>
                      </div>

                      {/* Audio Transcriptions Toggle */}
                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#182229] border border-gray-200 dark:border-[#222e35] flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-gray-800 dark:text-[#e9edef] block">
                            Transcrição Automática de Áudios Recebidos
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-[#8696a0] block">
                            Transcreve mensagens de voz do cliente em texto na conversa usando IA (Groq Whisper / OpenAI)
                          </span>
                        </div>
                        <select
                          value={settings.audioTranscriptions || "enabled"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSettings({ ...settings, audioTranscriptions: val });
                            handleUpdateSetting("audioTranscriptions", val);
                          }}
                          className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#202c33] border border-gray-200 dark:border-[#2a3942] text-gray-900 dark:text-[#e9edef] focus:outline-none focus:border-whatsapp-green shrink-0"
                        >
                          <option value="enabled">Ativado (Transcrever Áudios)</option>
                          <option value="disabled">Desativado</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: ARMAZENAMENTO & MÍDIA */}
                {currentTab === "storage" && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="border-b border-gray-200 dark:border-[#222e35] pb-3">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-[#e9edef] flex items-center gap-2">
                        <HardDrive size={16} className="text-whatsapp-green" />
                        Armazenamento & Limites de Mídia
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-[#8696a0]">
                        Controle o tamanho máximo de arquivos e vídeos transferidos no chat
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Upload Limit */}
                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#182229] border border-gray-200 dark:border-[#222e35] space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-800 dark:text-[#e9edef]">
                            Limite Máximo de Upload
                          </label>
                          <span className="text-[11px] font-mono text-whatsapp-green font-bold">
                            {settings.uploadLimit || "500"} MB
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-[#8696a0]">
                          Tamanho máximo de vídeos, áudios e documentos enviados pelos atendentes
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            max="2048"
                            value={settings.uploadLimit || "500"}
                            onChange={(e) =>
                              setSettings({ ...settings, uploadLimit: e.target.value })
                            }
                            className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#202c33] border border-gray-200 dark:border-[#2a3942] text-gray-900 dark:text-[#e9edef] focus:outline-none focus:border-whatsapp-green"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateSetting("uploadLimit", settings.uploadLimit || "500")
                            }
                            disabled={savingKey === "uploadLimit"}
                            className="px-3 py-2 bg-whatsapp-green hover:bg-whatsapp-green-dark text-white text-xs font-semibold rounded-xl transition shadow-xs"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>

                      {/* Download Limit */}
                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#182229] border border-gray-200 dark:border-[#222e35] space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-800 dark:text-[#e9edef]">
                            Limite Máximo de Download
                          </label>
                          <span className="text-[11px] font-mono text-whatsapp-green font-bold">
                            {settings.downloadLimit || "500"} MB
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-[#8696a0]">
                          Tamanho máximo de mídias recebidas de clientes salvas no servidor
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            max="2048"
                            value={settings.downloadLimit || "500"}
                            onChange={(e) =>
                              setSettings({ ...settings, downloadLimit: e.target.value })
                            }
                            className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#202c33] border border-gray-200 dark:border-[#2a3942] text-gray-900 dark:text-[#e9edef] focus:outline-none focus:border-whatsapp-green"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateSetting("downloadLimit", settings.downloadLimit || "500")
                            }
                            disabled={savingKey === "downloadLimit"}
                            className="px-3 py-2 bg-whatsapp-green hover:bg-whatsapp-green-dark text-white text-xs font-semibold rounded-xl transition shadow-xs"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>

                      {/* Proximity Sensor Earpiece Toggle */}
                      <div className="sm:col-span-2 p-4 rounded-2xl bg-gray-50 dark:bg-[#182229] border border-gray-200 dark:border-[#222e35] flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-gray-800 dark:text-[#e9edef] block">
                            👂 Aproxime para Ouvir (Sensor de Proximidade)
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-[#8696a0] block leading-relaxed">
                            Ao aproximar o celular do ouvido enquanto escuta um áudio, escurece a tela contra toques acidentais do rosto e direciona o som ao fone do ouvido. Desative se o sensor do seu celular apresentar falhas.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProximityEarpieceEnabled(!proximityEarpieceEnabled)}
                          className={`w-12 h-6 rounded-full transition-colors flex items-center px-0.5 cursor-pointer shrink-0 ${
                            proximityEarpieceEnabled ? "bg-whatsapp-green justify-end" : "bg-gray-300 dark:bg-gray-600 justify-start"
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-white shadow-md" />
                        </button>
                      </div>

                      {/* App Version & Auto-Update Card */}
                      <div className="sm:col-span-2 p-4 rounded-2xl bg-gray-50 dark:bg-[#182229] border border-gray-200 dark:border-[#222e35] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-800 dark:text-[#e9edef]">
                              🚀 Versão do Aplicativo
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-whatsapp-green/20 text-whatsapp-green border border-whatsapp-green/30">
                              v{currentVersion}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-500 dark:text-[#8696a0] block leading-relaxed">
                            Mantenha o app atualizado para receber novas melhorias e correções sem precisar reinstalar.
                          </span>
                          {manualUpdateMsg && (
                            <span className="text-[11px] text-whatsapp-green font-semibold block animate-fadeIn">
                              ✓ {manualUpdateMsg}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={async () => {
                              setManualUpdateMsg(null);
                              const res = await checkUpdatesManual();
                              if (!res.hasUpdate) {
                                setManualUpdateMsg("Você já está na versão mais recente!");
                                setTimeout(() => setManualUpdateMsg(null), 4000);
                              }
                            }}
                            disabled={isCheckingUpdate}
                            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#00a884] to-[#25d366] hover:from-[#009170] hover:to-[#20ba59] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                          >
                            {isCheckingUpdate ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Verificando...</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw size={14} />
                                <span>Verificar Atualizações</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: NOTIFICAÇÕES & REGRAS */}
                {currentTab === "privacy" && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="border-b border-gray-200 dark:border-[#222e35] pb-3">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-[#e9edef] flex items-center gap-2">
                        <Bell size={16} className="text-whatsapp-green" />
                        Notificações, Grupos & Acesso
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-[#8696a0]">
                        Preferências de mensagens em grupo, cadastros e idioma do sistema
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* CheckMsgIsGroup */}
                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#182229] border border-gray-200 dark:border-[#222e35] flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-gray-800 dark:text-[#e9edef] block">
                            Ignorar Mensagens de Grupos de WhatsApp
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-[#8696a0] block">
                            Não criar novos chamados a partir de mensagens enviadas em grupos
                          </span>
                        </div>
                        <select
                          value={settings.CheckMsgIsGroup || "enabled"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSettings({ ...settings, CheckMsgIsGroup: val });
                            handleUpdateSetting("CheckMsgIsGroup", val);
                          }}
                          className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#202c33] border border-gray-200 dark:border-[#2a3942] text-gray-900 dark:text-[#e9edef] focus:outline-none focus:border-whatsapp-green shrink-0"
                        >
                          <option value="enabled">Ativado (Ignorar Grupos)</option>
                          <option value="disabled">Desativado (Receber Grupos no Chat)</option>
                        </select>
                      </div>

                      {/* Allow Signup */}
                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#182229] border border-gray-200 dark:border-[#222e35] flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-gray-800 dark:text-[#e9edef] block">
                            Permitir Cadastro Público na Tela de Login
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-[#8696a0] block">
                            Exibir botão &quot;Criar conta&quot; para registro de novos usuários
                          </span>
                        </div>
                        <select
                          value={settings.allowSignup || "enabled"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSettings({ ...settings, allowSignup: val });
                            handleUpdateSetting("allowSignup", val);
                          }}
                          className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#202c33] border border-gray-200 dark:border-[#2a3942] text-gray-900 dark:text-[#e9edef] focus:outline-none focus:border-whatsapp-green shrink-0"
                        >
                          <option value="enabled">Ativado (Permitir Cadastro)</option>
                          <option value="disabled">Desativado (Apenas Administrador Cria Usuários)</option>
                        </select>
                      </div>

                      {/* Default Language */}
                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#182229] border border-gray-200 dark:border-[#222e35] flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-gray-800 dark:text-[#e9edef] block">
                            Idioma Padrão do Sistema
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-[#8696a0] block">
                            Idioma base para templates e mensagens do sistema
                          </span>
                        </div>
                        <select
                          value={settings.defaultLanguage || "pt"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSettings({ ...settings, defaultLanguage: val });
                            handleUpdateSetting("defaultLanguage", val);
                          }}
                          className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#202c33] border border-gray-200 dark:border-[#2a3942] text-gray-900 dark:text-[#e9edef] focus:outline-none focus:border-whatsapp-green shrink-0"
                        >
                          <option value="pt">Português (Brasil)</option>
                          <option value="en">English (Inglês)</option>
                          <option value="es">Español (Espanhol)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 6: SISTEMA & SERVIDOR */}
                {currentTab === "server" && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="border-b border-gray-200 dark:border-[#222e35] pb-3">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-[#e9edef] flex items-center gap-2">
                        <Server size={16} className="text-whatsapp-green" />
                        Diagnóstico & Ações do Servidor
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-[#8696a0]">
                        Gerencie a execução do serviço backend e consulte informações de ambiente
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Connection URL info */}
                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#182229] border border-gray-200 dark:border-[#222e35] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-800 dark:text-[#e9edef]">
                            Endpoint Backend Configurado
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/15 text-green-600 dark:text-green-400">
                            Online
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-gray-600 dark:text-[#8696a0] break-all">
                          {backendUrl}
                        </p>
                      </div>

                      {/* Server Restart */}
                      <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-3">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs">
                          <AlertTriangle size={16} />
                          <span>Reinicialização do Backend Ticketz</span>
                        </div>
                        <p className="text-[11px] text-gray-600 dark:text-[#8696a0]">
                          Reinicia o container backend do Ticketz para recarregar módulos, conexões do WhatsApp e
                          aplicar alterações estruturais. A interrupção dura menos de 10 segundos.
                        </p>
                        <button
                          type="button"
                          onClick={handleRestartBackend}
                          disabled={restartLoading}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs disabled:opacity-50"
                        >
                          {restartLoading ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <RefreshCw size={14} />
                          )}
                          <span>Reiniciar Servidor Agora</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
