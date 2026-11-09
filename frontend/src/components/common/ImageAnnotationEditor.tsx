import React, { useRef, useState, useEffect } from "react";
import {
  Pencil,
  Circle,
  Square,
  ArrowRight,
  RotateCcw,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { useEscapeKey } from "./useEscapeKey";

interface ImageAnnotationEditorProps {
  imageUrl: string;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

type ToolType = "pen" | "circle" | "rect" | "arrow";

const COLORS = [
  { label: "Vermelho", value: "#ef4444" },
  { label: "Amarelo", value: "#eab308" },
  { label: "Verde", value: "#22c55e" },
  { label: "Azul", value: "#3b82f6" },
  { label: "Branco", value: "#ffffff" },
  { label: "Preto", value: "#000000" },
];

const LINE_WIDTHS = [
  { label: "Fino", value: 3 },
  { label: "Médio", value: 6 },
  { label: "Grosso", value: 12 },
];

export const ImageAnnotationEditor: React.FC<ImageAnnotationEditorProps> = ({
  imageUrl,
  onSave,
  onCancel,
}) => {
  useEscapeKey(onCancel);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolType>("pen");
  const [selectedColor, setSelectedColor] = useState<string>("#ef4444");
  const [selectedWidth, setSelectedWidth] = useState<number>(6);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // References for drawing coordinates
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const snapshotBeforeShapeRef = useRef<ImageData | null>(null);

  // Load image onto canvas once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      ctx.drawImage(img, 0, 0);

      // Save initial clean state to history
      const initialSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialSnapshot]);
      setLoaded(true);
    };
  }, [imageUrl]);

  // Transform client/touch event coordinates into canvas internal pixel coordinates
  const getCanvasCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (clientX: number, clientY: number) => {
    const coords = getCanvasCoords(clientX, clientY);
    if (!coords) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    setIsDrawing(true);
    startPosRef.current = coords;

    // Save snapshot before this stroke/shape begins
    snapshotBeforeShapeRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (selectedTool === "pen") {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = selectedWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  };

  const drawMove = (clientX: number, clientY: number) => {
    if (!isDrawing || !startPosRef.current) return;
    const coords = getCanvasCoords(clientX, clientY);
    if (!coords) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    if (selectedTool === "pen") {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else {
      // Shapes: revert back to snapshot then preview shape
      if (snapshotBeforeShapeRef.current) {
        ctx.putImageData(snapshotBeforeShapeRef.current, 0, 0);
      }
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = selectedWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const start = startPosRef.current;
      if (selectedTool === "circle") {
        const radiusX = Math.abs(coords.x - start.x) / 2;
        const radiusY = Math.abs(coords.y - start.y) / 2;
        const centerX = Math.min(start.x, coords.x) + radiusX;
        const centerY = Math.min(start.y, coords.y) + radiusY;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, Math.max(radiusX, 1), Math.max(radiusY, 1), 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (selectedTool === "rect") {
        ctx.beginPath();
        ctx.strokeRect(start.x, start.y, coords.x - start.x, coords.y - start.y);
      } else if (selectedTool === "arrow") {
        drawArrow(ctx, start.x, start.y, coords.x, coords.y, selectedWidth * 3);
      }
    }
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    headlen: number
  ) => {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    startPosRef.current = null;
    snapshotBeforeShapeRef.current = null;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Push new snapshot to history (limit to 20 for memory)
    const newSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-19), newSnapshot]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const nextHistory = [...history];
    nextHistory.pop(); // Remove current
    const previous = nextHistory[nextHistory.length - 1];
    ctx.putImageData(previous, 0, 0);
    setHistory(nextHistory);
  };

  const handleClear = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const initial = history[0];
    ctx.putImageData(initial, 0, 0);
    setHistory([initial]);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onSave(blob);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-whatsapp-dark-bg select-none animate-fadeIn">
      {/* Top Bar with Tools & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-whatsapp-dark-panel border-b border-whatsapp-dark-border">
        {/* Left: Tools */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedTool("pen")}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
              selectedTool === "pen"
                ? "bg-whatsapp-green text-white"
                : "text-gray-300 hover:bg-whatsapp-dark-hover"
            }`}
            title="Caneta livre (circular livremente)"
          >
            <Pencil size={16} />
            <span className="hidden sm:inline">Livre</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTool("circle")}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
              selectedTool === "circle"
                ? "bg-whatsapp-green text-white"
                : "text-gray-300 hover:bg-whatsapp-dark-hover"
            }`}
            title="Ferramenta Círculo (destacar e circular)"
          >
            <Circle size={16} />
            <span className="hidden sm:inline">Círculo</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTool("rect")}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
              selectedTool === "rect"
                ? "bg-whatsapp-green text-white"
                : "text-gray-300 hover:bg-whatsapp-dark-hover"
            }`}
            title="Retângulo"
          >
            <Square size={16} />
            <span className="hidden sm:inline">Retângulo</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTool("arrow")}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
              selectedTool === "arrow"
                ? "bg-whatsapp-green text-white"
                : "text-gray-300 hover:bg-whatsapp-dark-hover"
            }`}
            title="Seta apontadora"
          >
            <ArrowRight size={16} />
            <span className="hidden sm:inline">Seta</span>
          </button>
        </div>

        {/* Center: Color & Thickness Palette */}
        <div className="flex items-center gap-3">
          {/* Colors */}
          <div className="flex items-center gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setSelectedColor(c.value)}
                style={{ backgroundColor: c.value }}
                className={`w-6 h-6 rounded-full border-2 transition ${
                  selectedColor === c.value
                    ? "border-white scale-110 shadow-md ring-2 ring-whatsapp-green"
                    : "border-black/30 opacity-70 hover:opacity-100"
                }`}
                title={c.label}
              />
            ))}
          </div>

          <div className="h-5 w-[1px] bg-white/10 hidden sm:block" />

          {/* Stroke Widths */}
          <div className="hidden sm:flex items-center gap-1">
            {LINE_WIDTHS.map((w) => (
              <button
                key={w.value}
                type="button"
                onClick={() => setSelectedWidth(w.value)}
                className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                  selectedWidth === w.value
                    ? "bg-white/20 text-white border border-white/30"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Undo, Clear, Cancel, Save */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length <= 1}
            className="p-2 rounded-lg text-gray-300 hover:bg-whatsapp-dark-hover disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Desfazer traço"
          >
            <RotateCcw size={17} />
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={history.length <= 1}
            className="p-2 rounded-lg text-gray-300 hover:bg-whatsapp-dark-hover disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Limpar todos os desenhos"
          >
            <Trash2 size={17} />
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg border border-whatsapp-dark-border text-xs font-semibold text-gray-300 hover:bg-whatsapp-dark-hover transition flex items-center gap-1"
          >
            <X size={15} />
            <span>Cancelar</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1.5 rounded-lg bg-whatsapp-green hover:bg-whatsapp-green-dark text-white text-xs font-bold transition shadow-md flex items-center gap-1.5 active:scale-95"
          >
            <Check size={16} />
            <span>Concluir</span>
          </button>
        </div>
      </div>

      {/* Drawing Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden touch-none relative">
        {!loaded && (
          <div className="text-xs text-gray-400">Carregando editor de imagem...</div>
        )}
        <canvas
          ref={canvasRef}
          onMouseDown={(e) => startDraw(e.clientX, e.clientY)}
          onMouseMove={(e) => drawMove(e.clientX, e.clientY)}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={(e) => {
            if (e.touches.length > 0) {
              startDraw(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length > 0) {
              drawMove(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchEnd={endDraw}
          className="max-h-[75vh] max-w-full object-contain rounded shadow-2xl cursor-crosshair border border-white/10"
        />
      </div>
    </div>
  );
};

export default ImageAnnotationEditor;
