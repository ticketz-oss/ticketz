import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Download,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEscapeKey } from "./useEscapeKey";

interface ImageLightboxModalProps {
  src: string | null;
  images?: string[];
  alt?: string;
  onClose: () => void;
}

const normalizeUrl = (u?: string | null): string => {
  if (!u) return "";
  return u
    .replace(/^https?:\/\/[^\/]+/, "")
    .replace(/^\/backend/, "")
    .replace(/^\/public/, "")
    .replace(/^\/+/, "");
};

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  src,
  images = [],
  alt = "Visualização da Imagem",
  onClose,
}) => {
  // Build the list of images
  const imageList = images.length > 0 ? images : src ? [src] : [];

  // Determine initial src: if src matches an item in imageList, pick that item;
  // otherwise, default to the last image in the conversation (most recent)
  const getInitialSrc = () => {
    if (src && imageList.length > 0) {
      const match = imageList.find((img) => normalizeUrl(img) === normalizeUrl(src));
      if (match) return match;
      return src;
    }
    if (imageList.length > 0) {
      return imageList[imageList.length - 1];
    }
    return src;
  };

  const [currentSrc, setCurrentSrc] = useState<string | null>(getInitialSrc);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const thumbnailStripRef = useRef<HTMLDivElement | null>(null);

  // Sync currentSrc when src or imageList changes
  useEffect(() => {
    if (!src) {
      setCurrentSrc(null);
      return;
    }
    if (imageList.length > 0) {
      const match = imageList.find((img) => normalizeUrl(img) === normalizeUrl(src));
      if (match) {
        setCurrentSrc(match);
      } else {
        // Fallback to the latest image if src is not matched
        setCurrentSrc(imageList[imageList.length - 1]);
      }
    } else {
      setCurrentSrc(src);
    }
  }, [src, images]);

  // Use capture-phase Escape listener to close ONLY this lightbox
  useEscapeKey(onClose, Boolean(currentSrc));

  // Reset transforms when image opens or changes
  useEffect(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, [currentSrc]);

  const currentIndex = currentSrc
    ? imageList.findIndex((img) => normalizeUrl(img) === normalizeUrl(currentSrc))
    : -1;
  const hasMultiple = imageList.length > 1;

  // Scroll active thumbnail into view
  useEffect(() => {
    if (thumbnailStripRef.current && currentIndex >= 0) {
      const activeThumb = thumbnailStripRef.current.children[currentIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [currentIndex]);

  // Sem loop: trava na primeira e trava na última!
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex >= 0 && currentIndex < imageList.length - 1;

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (canGoPrev) {
      setCurrentSrc(imageList[currentIndex - 1]);
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (canGoNext) {
      setCurrentSrc(imageList[currentIndex + 1]);
    }
  };

  // Keyboard navigation (ArrowLeft & ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentSrc) return;
      if (e.key === "ArrowLeft" && canGoPrev) {
        setCurrentSrc(imageList[currentIndex - 1]);
      } else if (e.key === "ArrowRight" && canGoNext) {
        setCurrentSrc(imageList[currentIndex + 1]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSrc, canGoPrev, canGoNext, currentIndex, imageList]);

  if (!currentSrc) return null;

  const handleZoomIn = () => setScale((prev) => Math.min(prev * 1.3, 5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev / 1.3, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev * 1.15, 5));
    } else {
      setScale((prev) => Math.max(prev / 1.15, 0.5));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handleDownload = async () => {
    if (!currentSrc) return;
    try {
      const response = await fetch(currentSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = currentSrc.split("/").pop() || "imagem.jpg";
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback
      const a = document.createElement("a");
      a.href = currentSrc;
      a.target = "_blank";
      a.download = "imagem.jpg";
      a.click();
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[90] bg-black/95 flex flex-col items-center justify-between p-4 select-none animate-fadeIn"
      onClick={onClose}
      onWheel={handleWheel}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Floating Controls Bar */}
      <div
        className="w-full max-w-xl flex items-center justify-between px-4 py-2 bg-gray-900/80 backdrop-blur-md rounded-full border border-white/10 text-white z-10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 rounded-full hover:bg-white/10 transition text-gray-300 hover:text-white"
            title="Aumentar zoom (+)"
          >
            <ZoomIn size={18} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 rounded-full hover:bg-white/10 transition text-gray-300 hover:text-white"
            title="Diminuir zoom (-)"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-xs font-mono text-gray-400 min-w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-full hover:bg-white/10 transition text-gray-300 hover:text-white"
            title="Redefinir tamanho"
          >
            <RotateCcw size={18} />
          </button>
          <div className="h-4 w-px bg-white/20 mx-1" />
          <button
            type="button"
            onClick={handleRotate}
            className="p-2 rounded-full hover:bg-white/10 transition text-gray-300 hover:text-white"
            title="Girar 90°"
          >
            <RotateCw size={18} />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-full hover:bg-white/10 transition text-gray-300 hover:text-white"
            title="Tela cheia"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-full hover:bg-white/10 transition text-whatsapp-green hover:text-whatsapp-green-dark"
            title="Baixar imagem"
          >
            <Download size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition ml-2"
          title="Fechar (Esc)"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Image Viewport with Navigation Arrows */}
      <div
        className="flex-1 w-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        {/* Left Arrow (Sem loop: desabilitada na primeira imagem) */}
        {hasMultiple && (
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canGoPrev}
            className={`absolute left-3 sm:left-6 z-20 w-11 h-11 rounded-full flex items-center justify-center transition shadow-2xl ${
              canGoPrev
                ? "bg-gray-900/80 hover:bg-black text-white hover:scale-110 active:scale-95 border border-white/20 cursor-pointer"
                : "bg-gray-900/40 text-gray-600 border border-white/5 cursor-not-allowed opacity-30"
            }`}
            title={canGoPrev ? "Imagem anterior (←)" : "Primeira imagem"}
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <img
          src={currentSrc}
          alt={alt}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? "none" : "transform 0.15s ease-out",
          }}
          className="max-h-[72vh] max-w-[88vw] object-contain rounded-lg shadow-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={() => (scale === 1 ? setScale(2) : handleReset())}
        />

        {/* Right Arrow (Sem loop: desabilitada na última imagem) */}
        {hasMultiple && (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext}
            className={`absolute right-3 sm:right-6 z-20 w-11 h-11 rounded-full flex items-center justify-center transition shadow-2xl ${
              canGoNext
                ? "bg-gray-900/80 hover:bg-black text-white hover:scale-110 active:scale-95 border border-white/20 cursor-pointer"
                : "bg-gray-900/40 text-gray-600 border border-white/5 cursor-not-allowed opacity-30"
            }`}
            title={canGoNext ? "Próxima imagem (→)" : "Última imagem"}
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Carousel Strip */}
      {hasMultiple && (
        <div
          ref={thumbnailStripRef}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl flex items-center gap-2 overflow-x-auto py-2 px-3 bg-gray-900/80 backdrop-blur-md rounded-2xl border border-white/10 z-10 my-1 scrollbar-thin"
        >
          {imageList.map((imgUrl, i) => {
            const isSelected = normalizeUrl(imgUrl) === normalizeUrl(currentSrc);
            return (
              <button
                key={imgUrl + i}
                type="button"
                onClick={() => setCurrentSrc(imgUrl)}
                className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                  isSelected
                    ? "border-whatsapp-green scale-105 shadow-md ring-2 ring-whatsapp-green/40 opacity-100"
                    : "border-transparent opacity-50 hover:opacity-85"
                }`}
                title={`Imagem ${i + 1} de ${imageList.length}`}
              >
                <img src={imgUrl} alt="" className="w-full h-full object-cover" />
              </button>
            );
          })}
        </div>
      )}

      {/* Hint footer */}
      <div className="text-[11px] text-gray-500 pointer-events-none select-none flex items-center gap-3">
        {hasMultiple && (
          <span className="font-mono text-gray-400">
            {currentIndex + 1} de {imageList.length}
          </span>
        )}
        <span>• Use as setas ← → para navegar • ESC para fechar</span>
      </div>
    </div>
  );
};
