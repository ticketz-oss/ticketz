import React, { useState, useEffect } from "react";
import { X, Send, Plus, Trash2, FileText, Video, Music, Pencil } from "lucide-react";
import { useEscapeKey } from "./useEscapeKey";
import type { MediaUploadItem } from "../../types";
import ImageAnnotationEditor from "./ImageAnnotationEditor";

interface MediaPreviewModalProps {
  files: File[];
  isOpen: boolean;
  onClose: () => void;
  onSend: (items: MediaUploadItem[], caption: string) => Promise<void>;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  files,
  isOpen,
  onClose,
  onSend,
}) => {
  useEscapeKey(onClose, isOpen);

  const [items, setItems] = useState<MediaUploadItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [caption, setCaption] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);

  const createItemFromFile = (file: File, idx: number): MediaUploadItem => {
    const type = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
      ? "video"
      : file.type.startsWith("audio/")
      ? "audio"
      : "document";

    return {
      id: `${file.name}-${idx}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      type,
      caption: "",
      name: file.name,
      size: file.size,
    };
  };

  const appendFiles = (incomingFiles: File[]) => {
    if (incomingFiles.length === 0) return;
    setItems((prev) => {
      const existingSignatures = new Set(
        prev.map((it) => `${it.name}_${it.size}_${it.file.lastModified}`)
      );
      const trulyNewFiles = incomingFiles.filter(
        (f) => !existingSignatures.has(`${f.name}_${f.size}_${f.lastModified}`)
      );
      if (trulyNewFiles.length === 0) return prev;

      const addedItems = trulyNewFiles.map(createItemFromFile);
      const next = [...prev, ...addedItems];
      setCurrentIndex(next.length - 1);
      return next;
    });
  };

  // Support pasting additional files via Ctrl+V even when the preview modal is open!
  useEffect(() => {
    if (!isOpen) return;

    const handleWindowPaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        e.preventDefault();
        const incoming = Array.from(e.clipboardData.files);
        appendFiles(incoming);
      }
    };

    window.addEventListener("paste", handleWindowPaste);
    return () => window.removeEventListener("paste", handleWindowPaste);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      // Clean up object URLs
      items.forEach((it) => {
        try {
          URL.revokeObjectURL(it.previewUrl);
        } catch {}
      });
      setItems([]);
      setCurrentIndex(0);
      setCaption("");
      return;
    }

    if (files.length > 0) {
      // Fresh files incoming: revoke any old URLs and create fresh previews
      items.forEach((it) => {
        try {
          URL.revokeObjectURL(it.previewUrl);
        } catch {}
      });
      const newItems = files.map(createItemFromFile);
      setItems(newItems);
      setCurrentIndex(0);
    }
  }, [isOpen, files]);

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex];

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, idx) => idx !== index);
    if (updated.length === 0) {
      onClose();
      return;
    }
    setItems(updated);
    if (currentIndex >= updated.length) {
      setCurrentIndex(updated.length - 1);
    }
  };

  const handleAddMoreFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const addedFiles = Array.from(e.target.files);
    appendFiles(addedFiles);
    e.target.value = "";
  };

  const handleSend = async () => {
    if (items.length === 0 || isSending) return;
    setIsSending(true);
    try {
      // Ensure strictly deduplicated list before sending
      const uniqueItemsMap = new Map<string, MediaUploadItem>();
      items.forEach((it) => {
        const sig = `${it.name}_${it.size}_${it.file.lastModified}`;
        if (!uniqueItemsMap.has(sig)) {
          uniqueItemsMap.set(sig, it);
        }
      });
      const uniqueItems = Array.from(uniqueItemsMap.values());
      await onSend(uniqueItems, caption);
      onClose();
    } catch (err: any) {
      console.error("Error sending media bundle:", err);
      alert("Erro ao enviar foto: " + (err?.response?.data?.message || err?.message || "Verifique sua conexão"));
    } finally {
      setIsSending(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-whatsapp-dark-bg/95 backdrop-blur-sm text-whatsapp-dark-text select-none animate-fadeIn">
      <div className="flex items-center justify-between px-5 py-3 border-b border-whatsapp-dark-border bg-whatsapp-dark-panel">
        <button
          onClick={onClose}
          type="button"
          disabled={isSending}
          className="p-1.5 rounded-full hover:bg-whatsapp-dark-hover transition text-gray-400 hover:text-white"
          title="Cancelar envio"
        >
          <X size={22} />
        </button>

        <div className="text-sm font-medium">
          {items.length} {items.length === 1 ? "arquivo selecionado" : "arquivos selecionados"}
        </div>

        <div className="flex items-center gap-2">
          {currentItem?.type === "image" && (
            <button
              onClick={() => setIsEditingImage(true)}
              type="button"
              disabled={isSending}
              className="px-2.5 py-1.5 rounded-lg bg-whatsapp-green/20 hover:bg-whatsapp-green text-whatsapp-green hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
              title="Desenhar, circular ou apontar na imagem"
            >
              <Pencil size={15} />
              <span>Editar / Circular</span>
            </button>
          )}

          <button
            onClick={() => handleRemoveItem(currentIndex)}
            type="button"
            disabled={isSending}
            className="p-1.5 rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"
            title="Remover este arquivo"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {currentItem?.type === "image" && (
          <img
            src={currentItem.previewUrl}
            alt={currentItem.name}
            className="max-h-[60vh] max-w-full object-contain rounded shadow-lg"
          />
        )}

        {currentItem?.type === "video" && (
          <video
            src={currentItem.previewUrl}
            controls
            className="max-h-[60vh] max-w-full rounded shadow-lg"
          />
        )}

        {currentItem?.type === "document" && (
          <div className="flex flex-col items-center justify-center p-8 bg-whatsapp-dark-panel rounded-xl border border-whatsapp-dark-border shadow-xl min-w-[280px]">
            <FileText size={64} className="text-whatsapp-green mb-3" />
            <span className="font-semibold text-center text-sm break-all max-w-[260px]">
              {currentItem.name}
            </span>
            <span className="text-xs text-gray-400 mt-1">{formatSize(currentItem.size)}</span>
          </div>
        )}

        {currentItem?.type === "audio" && (
          <div className="flex flex-col items-center justify-center p-8 bg-whatsapp-dark-panel rounded-xl border border-whatsapp-dark-border shadow-xl min-w-[280px]">
            <Music size={64} className="text-whatsapp-green mb-3" />
            <span className="font-semibold text-center text-sm break-all max-w-[260px]">
              {currentItem.name}
            </span>
            <audio src={currentItem.previewUrl} controls className="mt-4" />
          </div>
        )}
      </div>

      <div className="bg-whatsapp-dark-panel border-t border-whatsapp-dark-border p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3 max-w-3xl mx-auto w-full">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isSending) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Adicione uma legenda ou texto..."
            className="flex-1 bg-whatsapp-dark-hover border border-whatsapp-dark-border rounded-full px-5 py-2.5 text-sm text-whatsapp-dark-text placeholder-gray-400 focus:outline-none focus:border-whatsapp-green transition"
            autoFocus
          />

          <button
            onClick={handleSend}
            disabled={isSending}
            type="button"
            className="w-11 h-11 rounded-full bg-whatsapp-green hover:bg-whatsapp-green-dark text-white flex items-center justify-center transition-all active:scale-95 shadow-md shrink-0 disabled:opacity-50"
            title="Enviar com legenda"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={19} className="ml-0.5" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-3xl mx-auto w-full px-1">
          {items.map((item, index) => (
            <div
              key={item.id}
              onClick={() => setCurrentIndex(index)}
              className={`relative cursor-pointer shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition ${
                index === currentIndex
                  ? "border-whatsapp-green ring-2 ring-whatsapp-green/40 scale-105"
                  : "border-transparent opacity-60 hover:opacity-90"
              }`}
            >
              {item.type === "image" ? (
                <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
              ) : item.type === "video" ? (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <Video size={20} className="text-white" />
                </div>
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <FileText size={20} className="text-white" />
                </div>
              )}
            </div>
          ))}

          <label className="shrink-0 w-14 h-14 rounded-lg border-2 border-dashed border-gray-600 hover:border-whatsapp-green flex items-center justify-center cursor-pointer transition text-gray-400 hover:text-whatsapp-green">
            <Plus size={22} />
            <input
              type="file"
              multiple
              onChange={handleAddMoreFiles}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Embedded Image Annotation & Drawing Editor */}
      {isEditingImage && currentItem?.type === "image" && (
        <ImageAnnotationEditor
          imageUrl={currentItem.previewUrl}
          onCancel={() => setIsEditingImage(false)}
          onSave={(blob) => {
            const newFile = new File([blob], currentItem.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            const newPreviewUrl = URL.createObjectURL(blob);

            setItems((prev) =>
              prev.map((it, idx) => {
                if (idx !== currentIndex) return it;
                return {
                  ...it,
                  file: newFile,
                  previewUrl: newPreviewUrl,
                  size: newFile.size,
                };
              })
            );
            setIsEditingImage(false);
          }}
        />
      )}
    </div>
  );
};

export default MediaPreviewModal;
