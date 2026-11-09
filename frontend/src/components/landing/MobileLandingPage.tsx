import React, { useState, useEffect } from "react";
import { Download, Smartphone, Globe, ChevronRight, Check, Share2, PlusSquare, ArrowUpRight } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { APP_DOWNLOAD_URL, APP_VERSION } from "../../config/appConfig";

interface MobileLandingPageProps {
  onContinueWeb?: () => void;
}

export const MobileLandingPage: React.FC<MobileLandingPageProps> = ({ onContinueWeb }) => {
  const downloadUrl = APP_DOWNLOAD_URL;
  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallPWA = async () => {
    if (isIOS) {
      setShowIosModal(true);
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      alert("Para instalar como App Web no Android, abra o menu de 3 pontinhos do Chrome e toque em 'Instalar aplicativo' ou 'Adicionar à tela inicial'.");
    }
  };

  const handleContinueToWeb = () => {
    try {
      localStorage.setItem("prefer_web", "true");
      sessionStorage.setItem("prefer_web", "true");
    } catch {}
    if (onContinueWeb) {
      onContinueWeb();
    } else {
      window.location.href = "/?web=true";
    }
  };

  return (
    <div className="h-full w-full bg-[#111b21] text-[#e9edef] flex flex-col overflow-y-auto selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="w-full border-b border-[#222e35] bg-[#111b21]/95 backdrop-blur-md sticky top-0 z-50 px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00a884] to-[#25d366] flex items-center justify-center shadow-md">
            <span className="text-white text-base font-black tracking-wider">TN</span>
          </div>
          <div>
            <h1 className="font-bold text-xs leading-tight text-white flex items-center gap-1.5">
              Ticketz Neo Mobile
              <span className="text-[9px] font-semibold bg-[#00a884]/20 text-[#00a884] px-1.5 py-0.2 rounded-full border border-[#00a884]/30">
                v{APP_VERSION}
              </span>
            </h1>
            <p className="text-[10px] text-[#8696a0]">Ticketz Community</p>
          </div>
        </div>

        <button
          onClick={handleContinueToWeb}
          className="text-xs text-[#8696a0] hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#2a3942] hover:bg-[#202c33] transition cursor-pointer"
        >
          <Globe size={13} className="text-[#00a884]" />
          <span>Acessar Web</span>
        </button>
      </header>

      {/* Main Content - Clean & Direct */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 flex flex-col items-center text-center justify-center">
        {/* Title & Subtitle */}
        <h2 className="text-2xl font-extrabold tracking-tight text-white mb-2">
          {isIOS ? "Ticketz Neo no iPhone & iPad" : "Ticketz Neo para Celular"}
        </h2>
        <p className="text-xs text-[#8696a0] max-w-sm mb-6 leading-relaxed">
          {isIOS
            ? "Instale o aplicativo web completo direto no seu iPhone ou acesse imediatamente pelo navegador."
            : "Baixe o aplicativo oficial (APK), instale como App Web (PWA) ou use direto pelo navegador."}
        </p>

        {/* Buttons Section */}
        <div className="w-full flex flex-col gap-2.5 mb-5">
          {isIOS ? (
            /* iOS PWA Install Card */
            <button
              onClick={() => setShowIosModal(true)}
              type="button"
              className="w-full group bg-gradient-to-r from-[#00a884] to-[#25d366] hover:from-[#009170] hover:to-[#20ba59] text-white py-3.5 px-4 rounded-2xl font-bold flex items-center justify-between shadow-xl shadow-emerald-950/40 hover:shadow-emerald-900/30 transition active:scale-[0.99] cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                <PlusSquare size={22} className="text-white" />
              </div>

              <div className="flex flex-col text-left flex-1 ml-3.5">
                <span className="text-sm font-extrabold tracking-wide leading-tight">
                  Instalar no iPhone (App Web)
                </span>
                <span className="text-[11px] text-white/80 font-normal">
                  Sem App Store • Abre em Tela Cheia
                </span>
              </div>

              <ChevronRight size={20} className="text-white/70 group-hover:translate-x-1 transition" />
            </button>
          ) : (
            /* Android APK Primary Download */
            <a
              href={downloadUrl}
              download="TicketzNeo.apk"
              className="w-full group bg-gradient-to-r from-[#00a884] to-[#25d366] hover:from-[#009170] hover:to-[#20ba59] text-white py-3.5 px-4 rounded-2xl font-bold flex items-center justify-between shadow-xl shadow-emerald-950/40 hover:shadow-emerald-900/30 transition active:scale-[0.99] cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                <Download size={22} className="text-white" />
              </div>

              <div className="flex flex-col text-left flex-1 ml-3.5">
                <span className="text-sm font-extrabold tracking-wide leading-tight">
                  Baixar Aplicativo Android (APK)
                </span>
                <span className="text-[11px] text-white/80 font-normal">
                  Arquivo APK • 10.3 MB • Download Direto
                </span>
              </div>

              <ChevronRight size={20} className="text-white/70 group-hover:translate-x-1 transition" />
            </a>
          )}

          {/* Android PWA Alternative Install Button */}
          {!isIOS && (
            <button
              onClick={handleInstallPWA}
              type="button"
              className="w-full bg-[#1f2c34] hover:bg-[#2a3942] border border-[#2a3942] text-white py-3 px-3.5 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Smartphone size={16} />
                </div>
                <div className="text-left">
                  <p className="font-bold leading-tight">Instalar como App Web (PWA)</p>
                  <p className="text-[10px] text-gray-400 font-normal">Sem baixar APK • Leve e Rápido</p>
                </div>
              </div>
              <ArrowUpRight size={16} className="text-gray-400" />
            </button>
          )}

          {/* Secondary Web Access Button */}
          <button
            onClick={handleContinueToWeb}
            className="w-full bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] text-[#d1d7db] hover:text-white py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Globe size={14} className="text-[#00a884]" />
            <span>Continuar para a versão Web pelo navegador</span>
          </button>
        </div>

        {/* QR Code Section for PC / Tablet Users */}
        <div className="hidden sm:flex flex-col items-center bg-[#202c33]/70 border border-[#2a3942] rounded-2xl p-4 mb-5 w-full">
          <div className="bg-white p-2.5 rounded-xl mb-2.5 shadow-md">
            <QRCodeSVG value={downloadUrl} size={110} />
          </div>
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Smartphone size={14} className="text-[#00a884]" />
            Aponte a câmera do celular para baixar
          </span>
          <span className="text-[10px] text-[#8696a0] mt-0.5">
            Escaneie o QR Code para acessar no celular
          </span>
        </div>

        {/* Quick Info */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-[#8696a0]">
          <span className="flex items-center gap-1">
            <Check size={13} className="text-[#00a884]" /> Tela Cheia
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Check size={13} className="text-[#00a884]" /> Notificações
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Check size={13} className="text-[#00a884]" /> Áudio PTT Nativo
          </span>
        </div>
      </main>

      {/* iOS Safari Installation Guide Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#1f2c34] border border-[#2a3942] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-slideUp">
            <div className="flex items-center justify-between border-b border-[#2a3942] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  🍎
                </div>
                <h3 className="font-extrabold text-white text-sm">Instalar no iPhone / iPad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="text-gray-400 hover:text-white p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-300 text-left">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#111b21]/70 border border-[#2a3942]">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-bold text-white flex items-center gap-1">
                    Toque no botão Compartilhar <Share2 size={13} className="text-blue-400 inline" />
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    No rodapé do Safari (ou topo no iPad), toque no ícone com o quadrado e a setinha para cima.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#111b21]/70 border border-[#2a3942]">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-bold text-white flex items-center gap-1">
                    Selecione "Adicionar à Tela de Início" <PlusSquare size={13} className="text-emerald-400 inline" />
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Role a folha de opções para cima até encontrar a opção com ícone de "+".
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#111b21]/70 border border-[#2a3942]">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-bold text-white">Toque em "Adicionar"</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    No canto superior direito da tela, confirme. O ícone do Ticketz Neo aparecerá entre seus apps!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIosModal(false);
                handleContinueToWeb();
              }}
              type="button"
              className="w-full bg-[#00a884] hover:bg-[#009170] text-white py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Entendi, Abrir Web Agora
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-[#222e35] py-3 text-center text-[10px] text-[#8696a0] shrink-0">
        <p>© {new Date().getFullYear()} Ticketz Community • Ticketz Neo</p>
      </footer>
    </div>
  );
};

export default MobileLandingPage;
