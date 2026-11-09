import React, { useRef, useState } from "react";
import { X, Download, ExternalLink, Maximize2, Minimize2, FileText, Loader2 } from "lucide-react";
import { useEscapeKey } from "./useEscapeKey";

interface PdfViewerModalProps {
  url: string | null;
  filename?: string;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  url,
  filename = "documento.pdf",
  onClose,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on Escape key (capture phase stops propagation)
  useEscapeKey(onClose, Boolean(url));

  if (!url) return null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Google Docs Viewer renders the PDF inside an HTML5 Canvas/SVG,
  // preventing browsers/Android WebView from triggering an unwanted native file download!
  const isExternalUrl = url.startsWith("http://") || url.startsWith("https://");
  const viewerSrc = isExternalUrl
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
    : `${url}#toolbar=1&navpanes=1`;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[92vh] bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#222e35] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-gray-200 dark:border-[#2a3942] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={20} className="text-red-500 shrink-0" />
            <span className="font-semibold text-xs sm:text-sm text-whatsapp-light-text dark:text-whatsapp-dark-text truncate">
              {filename}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1 text-xs cursor-pointer"
              title="Abrir diretamente em nova aba"
            >
              <ExternalLink size={16} />
              <span className="hidden sm:inline">Nova Aba</span>
            </a>

            {/* Separate explicit Download action */}
            <a
              href={url}
              download={filename}
              className="p-1.5 rounded-lg bg-whatsapp-green/10 text-whatsapp-green hover:bg-whatsapp-green hover:text-white transition flex items-center gap-1 text-xs font-semibold cursor-pointer"
              title="Baixar arquivo no dispositivo"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Baixar</span>
            </a>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
              title="Tela cheia"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition ml-1 cursor-pointer"
              title="Fechar (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Embedded PDF Canvas Viewer without downloading */}
        <div className="flex-1 w-full h-full bg-gray-100 dark:bg-black/40 relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-[#111b21] z-10 space-y-2">
              <Loader2 size={32} className="text-whatsapp-green animate-spin" />
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Carregando visualização do PDF...
              </span>
            </div>
          )}
          <iframe
            src={viewerSrc}
            title={filename}
            onLoad={() => setIsLoading(false)}
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
};
