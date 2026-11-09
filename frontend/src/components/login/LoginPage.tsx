import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSettingsContext } from "../../context/SettingsContext";
import api, { DEFAULT_BACKEND_URL, getBackendUrl } from "../../services/api";
import { APP_VERSION } from "../../config/appConfig";
import {
  MessageSquare,
  Server,
  Lock,
  Mail,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowRight,
  Sun,
  Moon,
  ExternalLink,
} from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login, backendUrl, updateBackendUrl } = useAuth();
  const { settings, getMediaUrl } = useSettingsContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [customUrl, setCustomUrl] = useState(() => {
    const current = getBackendUrl();
    if (!current || !current.startsWith("http")) {
      return DEFAULT_BACKEND_URL;
    }
    return current;
  });
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

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

  const appName = settings.appName || "Ticketz Neo";
  const brandLogo = isDark
    ? settings.appLogoDark || settings.appLogoLight
    : settings.appLogoLight || settings.appLogoDark;

  const bgContent = settings.loginBackgroundContent;
  const isVideoBg = Boolean(bgContent && bgContent.match(/\.(mp4|webm|ogg)$/i));
  const sidePanelImg = settings.loginSidePanelImage;

  // Parse login page custom links
  let links: { title: string; url: string }[] = [];
  if (settings.loginPageLinks) {
    try {
      const parsed = JSON.parse(settings.loginPageLinks);
      if (Array.isArray(parsed)) {
        links = parsed.filter((l) => l && l.title && l.url);
      }
    } catch {}
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let targetUrl = (customUrl || "").trim();
      if (!targetUrl || !targetUrl.startsWith("http")) {
        targetUrl = DEFAULT_BACKEND_URL;
        setCustomUrl(targetUrl);
      }

      if (targetUrl !== backendUrl) {
        updateBackendUrl(targetUrl);
      }

      const { data } = await api.post("/auth/login", {
        email,
        password,
      });

      if (data.token && data.user) {
        login(data.token, data.user, data.user.companyId || "1");
      } else {
        setError("Resposta de login inválida do servidor.");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Não foi possível conectar ao servidor. Verifique seu login e URL da API.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-whatsapp-light-bg dark:bg-whatsapp-dark-bg p-4 select-none overflow-hidden">
      {/* Dynamic Background Content (Video or Image) */}
      {bgContent && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {isVideoBg ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              src={getMediaUrl(bgContent)}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={getMediaUrl(bgContent)}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs" />
        </div>
      )}

      {/* Theme Toggle Button */}
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/80 dark:bg-[#202c33]/80 backdrop-blur-sm text-gray-700 dark:text-gray-200 shadow-md hover:scale-105 transition"
        title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Container: Single card or Two-column with Side Panel */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col md:flex-row bg-white/95 dark:bg-[#111b21]/95 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/80 dark:border-[#222e35] overflow-hidden my-auto animate-fadeIn">
        {/* Left Side Panel Image (if configured) */}
        {sidePanelImg && (
          <div className="hidden md:flex md:w-1/2 relative bg-gray-100 dark:bg-[#182229] overflow-hidden items-center justify-center">
            <img
              src={getMediaUrl(sidePanelImg)}
              alt={appName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8 text-white">
              <h2 className="text-2xl font-bold">{appName}</h2>
              <p className="text-xs text-white/80 mt-1">
                Atendimento multicanal integrado e comunicação unificada
              </p>
            </div>
          </div>
        )}

        {/* Right / Main Form Panel */}
        <div className={`flex-1 p-8 sm:p-10 flex flex-col justify-center ${sidePanelImg ? "" : "max-w-md mx-auto"}`}>
          {/* Header Brand */}
          <div className="flex items-center gap-3 mb-6">
            {brandLogo ? (
              <div className="max-h-12 max-w-[160px] flex items-center justify-center">
                <img
                  src={getMediaUrl(brandLogo)}
                  alt={appName}
                  className="max-h-12 max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-whatsapp-green flex items-center justify-center text-white shadow-lg shadow-whatsapp-green/20">
                <MessageSquare size={26} />
              </div>
            )}
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-900 dark:text-[#e9edef] tracking-tight">
                {appName}
              </h1>
              <span className="text-[11px] text-gray-500 dark:text-[#8696a0]">
                Painel do Atendente
              </span>
            </div>
          </div>

          <h2 className="text-base font-bold text-gray-900 dark:text-[#e9edef] mb-4">
            Acesse sua conta
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                E-mail
              </label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-gray-50 dark:bg-[#202c33] border border-gray-200 dark:border-[#2a3942] rounded-xl pl-9 pr-3 py-2.5 text-xs text-gray-900 dark:text-[#e9edef] placeholder-gray-400 outline-none focus:border-whatsapp-green transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Senha
              </label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 dark:bg-[#202c33] border border-gray-200 dark:border-[#2a3942] rounded-xl pl-9 pr-3 py-2.5 text-xs text-gray-900 dark:text-[#e9edef] placeholder-gray-400 outline-none focus:border-whatsapp-green transition"
                />
              </div>
            </div>

            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setShowServerConfig(!showServerConfig)}
                className="text-[11px] text-gray-500 dark:text-[#8696a0] hover:text-whatsapp-green flex items-center gap-1 transition"
              >
                <Server size={12} />
                <span>Configurar URL do Backend Ticketz</span>
                {showServerConfig ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {showServerConfig && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-[#202c33] rounded-xl border border-gray-200 dark:border-[#2a3942] animate-fadeIn">
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
                    URL da API do Ticketz
                  </label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder={DEFAULT_BACKEND_URL}
                    className="w-full bg-white dark:bg-[#111b21] border border-gray-200 dark:border-[#2a3942] rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-[#e9edef] outline-none focus:border-whatsapp-green"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-whatsapp-green hover:bg-whatsapp-green-dark text-white rounded-xl font-bold text-xs transition active:scale-95 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar no Atendimento</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Download Mobile App Link */}
          <div className="mt-5 pt-3 border-t border-gray-100 dark:border-[#222e35] flex items-center justify-center">
            <a
              href="/mobile"
              className="text-[11px] text-gray-500 hover:text-whatsapp-green dark:text-[#8696a0] dark:hover:text-[#25d366] flex items-center gap-1.5 transition font-medium"
            >
              <span>📱</span>
              <span>Baixar aplicativo para Android (APK v{APP_VERSION})</span>
            </a>
          </div>

          {/* Custom Footer Links if configured */}
          {links.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-[#222e35] flex flex-wrap items-center justify-center gap-3 text-[11px] text-gray-500">
              {links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-whatsapp-green flex items-center gap-1 transition"
                >
                  <span>{link.title}</span>
                  <ExternalLink size={10} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
