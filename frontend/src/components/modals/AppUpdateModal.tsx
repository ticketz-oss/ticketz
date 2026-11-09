import React, { useState, useEffect } from "react";
import {
  Download,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  ExternalLink,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";
import {
  startAppUpdate,
  checkCanInstallPackages,
  openInstallSettings,
} from "../../services/appUpdateService";
import type { VersionInfo } from "../../services/appUpdateService";
import type { DownloadProgress } from "../../services/appUpdatePlugin";
import { Capacitor } from "@capacitor/core";

interface AppUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: VersionInfo | null;
  currentVersion: string;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  isOpen,
  onClose,
  updateInfo,
  currentVersion,
}) => {
  const [status, setStatus] = useState<
    "idle" | "downloading" | "installing" | "permission_needed" | "error"
  >("idle");
  const [progress, setProgress] = useState<DownloadProgress>({
    percent: 0,
    bytesDownloaded: 0,
    totalBytes: 0,
  });
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setProgress({ percent: 0, bytesDownloaded: 0, totalBytes: 0 });
      setErrorMessage("");
    }
  }, [isOpen]);

  if (!isOpen || !updateInfo) return null;

  const isNative = Capacitor.isNativePlatform();

  const handleStartUpdate = async () => {
    if (!isNative) {
      // In web browser (Desktop / iMac / Chrome), clear cache and reload site
      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {}
      window.location.reload();
      return;
    }

    // Check unknown sources install permission first
    const canInstall = await checkCanInstallPackages();
    if (!canInstall) {
      setStatus("permission_needed");
      return;
    }

    executeDownload();
  };

  const executeDownload = async () => {
    setStatus("downloading");
    setErrorMessage("");

    const res = await startAppUpdate(updateInfo.apkUrl, (p) => {
      setProgress(p);
      if (p.percent >= 100) {
        setStatus("installing");
      }
    });

    if (!res.success) {
      setStatus("error");
      setErrorMessage(res.error || "Falha ao baixar atualização.");
    }
  };

  const handleGrantPermission = async () => {
    await openInstallSettings();
    // Re-check after 1.5s
    setTimeout(async () => {
      const allowed = await checkCanInstallPackages();
      if (allowed) {
        executeDownload();
      }
    }, 1500);
  };

  const formatMB = (bytes: number) => {
    if (!bytes || bytes <= 0) return "0 MB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn select-none">
      <div
        className="bg-white dark:bg-[#1f2c34] text-whatsapp-light-text dark:text-[#e9edef] rounded-2xl w-full max-w-md shadow-2xl border border-whatsapp-light-border dark:border-[#2a3942] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00a884] to-[#25d366] px-5 py-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xs">
              <Sparkles size={22} className="text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                Nova Versão Disponível!
              </h3>
              <p className="text-xs text-white/90">
                Ticketz Neo {updateInfo.version} {!isNative && "(Web)"}
                {updateInfo.releaseDate && ` • ${updateInfo.releaseDate}`}
              </p>
            </div>
          </div>

          {!updateInfo.mandatory && status !== "downloading" && status !== "installing" && (
            <button
              onClick={onClose}
              type="button"
              className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Web Desktop Notice */}
          {!isNative && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-500/20 text-xs">
              <RefreshCw size={18} className="shrink-0 text-emerald-500" />
              <span>
                Você está acessando pelo navegador. Clique abaixo para recarregar e atualizar o site imediatamente com as novas alterações.
              </span>
            </div>
          )}

          {/* Version Comparison Pill */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-[#111b21] p-3 rounded-xl border border-whatsapp-light-border dark:border-[#2a3942] text-xs">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 dark:text-[#8696a0]">Versão Atual</span>
              <span className="font-bold text-gray-700 dark:text-[#d1d7db]">{currentVersion}</span>
            </div>
            <div className="px-2 text-whatsapp-green font-bold">➔</div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-whatsapp-green font-bold">Nova Versão</span>
              <span className="font-bold text-whatsapp-green text-sm">{updateInfo.version}</span>
            </div>
          </div>

          {/* Release Notes */}
          {updateInfo.notes && updateInfo.notes.length > 0 && status !== "downloading" && status !== "installing" && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-500 dark:text-[#8696a0] uppercase tracking-wider">
                O que há de novo:
              </span>
              <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {updateInfo.notes.map((note, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-gray-700 dark:text-[#d1d7db] leading-relaxed"
                  >
                    <CheckCircle2
                      size={14}
                      className="text-whatsapp-green shrink-0 mt-0.5"
                    />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Downloading Progress View */}
          {status === "downloading" && (
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-whatsapp-green flex items-center gap-1.5">
                  <Loader2 size={15} className="animate-spin" />
                  Baixando atualização...
                </span>
                <span className="font-mono text-gray-700 dark:text-white">
                  {progress.percent}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-gray-200 dark:bg-[#111b21] rounded-full overflow-hidden p-0.5 border border-whatsapp-light-border dark:border-[#2a3942]">
                <div
                  className="h-full bg-gradient-to-r from-[#00a884] to-[#25d366] rounded-full transition-all duration-200 shadow-xs"
                  style={{ width: `${Math.max(5, progress.percent)}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-gray-500 dark:text-[#8696a0]">
                <span>{formatMB(progress.bytesDownloaded)} baixados</span>
                {progress.totalBytes > 0 && <span>Total: {formatMB(progress.totalBytes)}</span>}
              </div>
            </div>
          )}

          {/* Installing Status View */}
          {status === "installing" && (
            <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-whatsapp-green/20 text-whatsapp-green flex items-center justify-center animate-bounce">
                <Download size={24} />
              </div>
              <h4 className="font-bold text-sm text-gray-800 dark:text-white">
                Abrindo o instalador...
              </h4>
              <p className="text-xs text-gray-500 dark:text-[#8696a0] max-w-xs leading-relaxed">
                Confirme o toque em <strong>"Instalar"</strong> na tela do Android para atualizar o app em segundos.
              </p>
            </div>
          )}

          {/* Permission Needed View */}
          {status === "permission_needed" && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-amber-500 font-bold text-xs">
                <ShieldAlert size={16} />
                <span>Permissão necessária no Android</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-[#8696a0] leading-relaxed">
                Para atualizar automaticamente, permita que o Ticketz Neo instale aplicativos desconhecidos nas configurações do aparelho.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleGrantPermission}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-3 rounded-lg text-xs transition cursor-pointer"
                >
                  Abrir Configurações
                </button>
                <button
                  type="button"
                  onClick={executeDownload}
                  className="px-3 py-2 bg-gray-200 dark:bg-[#2a3942] text-xs font-semibold rounded-lg hover:bg-gray-300 transition cursor-pointer"
                >
                  Já permiti
                </button>
              </div>
            </div>
          )}

          {/* Error View */}
          {status === "error" && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-red-500 font-bold text-xs">
                <AlertTriangle size={16} />
                <span>Erro no download</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-[#8696a0] leading-relaxed">
                {errorMessage || "Não foi possível baixar o pacote de atualização."}
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={executeDownload}
                  className="flex-1 bg-whatsapp-green hover:bg-whatsapp-green/90 text-white font-bold py-2 px-3 rounded-lg text-xs transition cursor-pointer"
                >
                  Tentar Novamente
                </button>
                <a
                  href={updateInfo.apkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-gray-200 dark:bg-[#2a3942] text-xs font-semibold rounded-lg hover:bg-gray-300 transition flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink size={12} />
                  Navegador
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {status === "idle" && (
          <div className="p-4 bg-gray-50 dark:bg-[#111b21] border-t border-whatsapp-light-border dark:border-[#2a3942] flex items-center justify-end gap-2.5">
            {!updateInfo.mandatory && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-500 dark:text-[#8696a0] hover:bg-gray-200 dark:hover:bg-[#202c33] hover:text-gray-800 dark:hover:text-white transition cursor-pointer"
              >
                Lembrar Mais Tarde
              </button>
            )}

            <button
              type="button"
              onClick={handleStartUpdate}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00a884] to-[#25d366] hover:from-[#009170] hover:to-[#20ba59] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 active:scale-[0.98] transition cursor-pointer"
            >
              {!isNative ? <RefreshCw size={15} /> : <Download size={15} />}
              <span>{!isNative ? "Recarregar e Atualizar Site" : "Atualizar Agora"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppUpdateModal;
