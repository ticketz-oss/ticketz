import React, { useState, useEffect, useRef } from "react";
import { Smile, Image as ImageIcon, Search, Plus, Clock, Loader2, X } from "lucide-react";
import api, { getBackendUrl } from "../../services/api";
import { useEscapeKey } from "../common/useEscapeKey";

interface EmojiStickerPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onSelectSticker: (stickerUrl: string) => void;
  onUploadSticker: (file: File) => void;
  onClose: () => void;
  ticketId: number;
}

const EMOJI_CATEGORIES = [
  {
    name: "Carinhas",
    icon: "😀",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
      "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨",
      "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕",
      "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐", "😕", "😟",
      "🙁", "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣",
      "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👹"
    ]
  },
  {
    name: "Mãos & Gestos",
    icon: "👍",
    emojis: [
      "👍", "👎", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💪", "🤙", "✌️", "🤞", "🫰", "🤟", "🤘",
      "👈", "👉", "👆", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✊", "👊", "🤛",
      "🤜", "🤳", "💅", "🫶", "🫲", "🫱", "🫳", "🫴", "🫵"
    ]
  },
  {
    name: "Corações & Fogo",
    icon: "❤️",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
      "💘", "💝", "🔥", "✨", "💥", "⭐", "🌟", "💫", "💯", "💢", "🎉", "🎊", "🎯", "🏆", "🥇", "🥈"
    ]
  },
  {
    name: "Tecnologia & Escritório",
    icon: "💻",
    emojis: [
      "💻", "🖥️", "🖨️", "⌨️", "🖱️", "📱", "📲", "☎️", "📞", "🔋", "🔌", "💡", "🪙", "💰", "💳", "🛠️",
      "🔧", "🔨", "⚙️", "🔒", "🔓", "🔑", "📦", "📫", "📝", "📄", "📁", "📂", "📊", "📈", "📅", "⏰"
    ]
  },
  {
    name: "Comidas & Bebidas",
    icon: "☕",
    emojis: [
      "☕", "🍵", "🧃", "🥤", "🍺", "🍻", "🍷", "🍕", "🍔", "🍟", "🌭", "🥪", "🌮", "🍰", "🍦", "🍫",
      "🍿", "🍩", "🍪", "🍎", "🍉", "🍇", "🍓"
    ]
  }
];

export const normalizeStickerUrl = (url: string): string => {
  if (!url || typeof url !== "string") return "";
  let clean = url.trim();
  const backend = getBackendUrl().replace(/\/+$/, "");

  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }

  clean = clean.replace(/^\/+/, "");
  if (clean.startsWith("backend/public/")) {
    const sub = clean.replace(/^backend\/public\//, "");
    return `${backend}/public/${sub}`;
  }
  if (clean.startsWith("public/")) {
    const sub = clean.replace(/^public\//, "");
    return `${backend}/public/${sub}`;
  }
  return `${backend}/public/${clean}`;
};

export const EmojiStickerPicker: React.FC<EmojiStickerPickerProps> = ({
  onSelectEmoji,
  onSelectSticker,
  onUploadSticker,
  onClose,
  ticketId,
}) => {
  const [activeTab, setActiveTab] = useState<"emojis" | "stickers">("emojis");
  const [search, setSearch] = useState("");
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [topStickers, setTopStickers] = useState<string[]>([]);
  const [otherStickers, setOtherStickers] = useState<string[]>([]);
  const [loadingStickers, setLoadingStickers] = useState(false);
  const stickerInputRef = useRef<HTMLInputElement | null>(null);

  useEscapeKey(onClose);

  // Load recent emojis from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chatv2_recent_emojis");
      if (stored) {
        setRecentEmojis(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const handleEmojiClick = (emoji: string) => {
    onSelectEmoji(emoji);
    // Update recent emojis
    try {
      const updated = [emoji, ...recentEmojis.filter((e) => e !== emoji)].slice(0, 24);
      setRecentEmojis(updated);
      localStorage.setItem("chatv2_recent_emojis", JSON.stringify(updated));
    } catch {}
  };

  // Load unified stickers across ALL conversations + local usage & recents
  useEffect(() => {
    if (activeTab === "stickers") {
      setLoadingStickers(true);

      // 1. Read local recents & usage counts
      let storedList: string[] = [];
      let usageMap: Record<string, number> = {};
      try {
        const stored = JSON.parse(localStorage.getItem("chatv2_recent_stickers") || "[]");
        stored.forEach((s: string) => {
          const norm = normalizeStickerUrl(s);
          if (norm && !storedList.includes(norm)) {
            storedList.push(norm);
          }
        });
        usageMap = JSON.parse(localStorage.getItem("chatv2_sticker_usage") || "{}");
      } catch {}

      // 2. Fetch unified stickers across all conversations from backend
      const fetchBackend = api
        .get<{ stickers: string[]; received: string[]; mostUsed: string[] }>("/messages/stickers")
        .then((res) => res.data)
        .catch(() => ({ stickers: [], received: [], mostUsed: [] }));

      // 3. Also fetch current ticket messages if ticketId is provided to capture any real-time fresh stickers
      const fetchCurrentTicket = ticketId
        ? api
            .get<any>(`/messages/${ticketId}`)
            .then((res) => {
              const msgs: any[] = res.data?.messages || (Array.isArray(res.data) ? res.data : []);
              const currentUrls: string[] = [];
              msgs.forEach((m) => {
                const url = m.mediaUrl;
                if (url && typeof url === "string") {
                  const lower = url.toLowerCase();
                  if (
                    m.mediaType === "sticker" ||
                    lower.endsWith(".webp") ||
                    (m.dataJson && m.dataJson.includes("stickerMessage"))
                  ) {
                    const norm = normalizeStickerUrl(url);
                    if (norm && !currentUrls.includes(norm)) {
                      currentUrls.push(norm);
                    }
                  }
                }
              });
              return currentUrls;
            })
            .catch(() => [])
        : Promise.resolve([]);

      Promise.all([fetchBackend, fetchCurrentTicket])
        .then(([backendData, currentTicketUrls]) => {
          const backendMostUsed = (backendData.mostUsed || []).map(normalizeStickerUrl).filter(Boolean);
          const backendAll = (backendData.stickers || []).map(normalizeStickerUrl).filter(Boolean);
          const backendReceived = (backendData.received || []).map(normalizeStickerUrl).filter(Boolean);

          // Build unified master set of all unique stickers
          const masterSet = new Set<string>();
          storedList.forEach((s) => masterSet.add(s));
          currentTicketUrls.forEach((s) => masterSet.add(s));
          backendMostUsed.forEach((s) => masterSet.add(s));
          backendReceived.forEach((s) => masterSet.add(s));
          backendAll.forEach((s) => masterSet.add(s));

          const allUniqueList = Array.from(masterSet);

          // Compute usage & ranking score for each sticker
          const getScore = (url: string) => {
            let score = (usageMap[url] || 0) * 10;
            const bIdx = backendMostUsed.indexOf(url);
            if (bIdx !== -1) {
              score += Math.max(1, 30 - bIdx);
            }
            const rIdx = storedList.indexOf(url);
            if (rIdx !== -1) {
              score += Math.max(1, 20 - rIdx);
            }
            return score;
          };

          // Sort by highest score DESC
          const sortedByUsage = [...allUniqueList].sort((a, b) => getScore(b) - getScore(a));

          // Top Most Used: stickers with positive score (up to 16), or first 16 if none used yet
          const topScored = sortedByUsage.filter((u) => getScore(u) > 0).slice(0, 16);
          const topFinal = topScored.length > 0 ? topScored : sortedByUsage.slice(0, 16);

          // Other stickers: all remaining unified stickers
          const others = allUniqueList.filter((u) => !topFinal.includes(u));

          setTopStickers(topFinal);
          setOtherStickers(others);
        })
        .finally(() => setLoadingStickers(false));
    }
  }, [activeTab, ticketId]);

  const handlePickSticker = (url: string) => {
    const norm = normalizeStickerUrl(url);
    try {
      // Update local recent stickers
      const stored = JSON.parse(localStorage.getItem("chatv2_recent_stickers") || "[]");
      const filtered = stored.map((s: string) => normalizeStickerUrl(s)).filter((s: string) => s && s !== norm);
      const updated = [norm, ...filtered].slice(0, 50);
      localStorage.setItem("chatv2_recent_stickers", JSON.stringify(updated));

      // Increment global sticker usage counter
      const usage: Record<string, number> = JSON.parse(localStorage.getItem("chatv2_sticker_usage") || "{}");
      usage[norm] = (usage[norm] || 0) + 1;
      localStorage.setItem("chatv2_sticker_usage", JSON.stringify(usage));
    } catch {}

    onSelectSticker(norm);
    onClose();
  };

  const handleStickerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadSticker(file);
      onClose();
    }
  };

  // Filter emojis
  const filteredCategories = EMOJI_CATEGORIES.map((cat) => ({
    ...cat,
    emojis: cat.emojis.filter((e) => !search || e.includes(search)),
  })).filter((cat) => cat.emojis.length > 0);

  const totalCount = topStickers.length + otherStickers.length;

  return (
    <div className="absolute bottom-full mb-2 left-2 z-40 w-80 sm:w-96 bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2a3942] flex flex-col h-80 overflow-hidden animate-fadeIn select-none">
      {/* Top Header & Tabs */}
      <div className="h-11 px-3 border-b border-gray-200 dark:border-[#2a3942] flex items-center justify-between bg-gray-50 dark:bg-[#182229]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("emojis")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === "emojis"
                ? "bg-whatsapp-green text-white shadow-xs"
                : "text-gray-600 dark:text-[#8696a0] hover:bg-gray-200 dark:hover:bg-[#202c33]"
            }`}
          >
            <Smile size={14} />
            <span>Emojis</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("stickers")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === "stickers"
                ? "bg-whatsapp-green text-white shadow-xs"
                : "text-gray-600 dark:text-[#8696a0] hover:bg-gray-200 dark:hover:bg-[#202c33]"
            }`}
          >
            <ImageIcon size={14} />
            <span>Figurinhas</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tab 1: Emojis */}
      {activeTab === "emojis" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search bar */}
          <div className="p-2 border-b border-gray-100 dark:border-[#2a3942]">
            <div className="flex items-center bg-gray-100 dark:bg-[#111b21] rounded-xl px-2.5 py-1 text-xs">
              <Search size={13} className="text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar emoji..."
                className="w-full bg-transparent text-gray-900 dark:text-[#e9edef] placeholder-gray-400 outline-none focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Emoji Grid */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Recent Emojis */}
            {!search && recentEmojis.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  <Clock size={11} />
                  <span>Mais Usados</span>
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {recentEmojis.map((emoji, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleEmojiClick(emoji)}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-[#111b21] rounded-lg transition hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Categorized Emojis */}
            {filteredCategories.map((cat, ci) => (
              <div key={ci}>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  {cat.icon} {cat.name}
                </span>
                <div className="grid grid-cols-8 gap-1">
                  {cat.emojis.map((emoji, ei) => (
                    <button
                      key={ei}
                      type="button"
                      onClick={() => handleEmojiClick(emoji)}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-[#111b21] rounded-lg transition hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Stickers */}
      {activeTab === "stickers" && (
        <div className="flex-1 flex flex-col overflow-hidden p-3">
          {/* Action bar: Upload custom sticker */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-[#2a3942]">
            <span className="text-xs font-semibold text-gray-700 dark:text-[#e9edef]">
              Figurinhas do WhatsApp ({totalCount})
            </span>
            <button
              type="button"
              onClick={() => stickerInputRef.current?.click()}
              className="px-2.5 py-1 bg-whatsapp-green text-white text-[11px] font-semibold rounded-lg flex items-center gap-1 hover:bg-whatsapp-green-dark transition shadow-xs cursor-pointer"
            >
              <Plus size={12} />
              <span>Enviar figurinha</span>
            </button>
            <input
              ref={stickerInputRef}
              type="file"
              accept="image/webp,image/png,image/jpeg"
              onChange={handleStickerFileChange}
              className="hidden"
            />
          </div>

          {/* Stickers Content */}
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
            {loadingStickers ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                <Loader2 size={24} className="animate-spin text-whatsapp-green" />
                <span className="text-xs">Buscando figurinhas...</span>
              </div>
            ) : totalCount === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center px-4 space-y-2">
                <span className="text-3xl">🖼️</span>
                <p className="text-xs">
                  Nenhuma figurinha recebida ou salva ainda.
                </p>
                <button
                  type="button"
                  onClick={() => stickerInputRef.current?.click()}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-[#111b21] hover:bg-whatsapp-green hover:text-white rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  Carregar imagem do computador
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. Top Section: Mais Usadas no Geral */}
                {topStickers.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      <Clock size={12} className="text-whatsapp-green" />
                      <span>Mais Usadas no Geral ({topStickers.length})</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {topStickers.map((url, i) => (
                        <button
                          key={`top-${url}-${i}`}
                          type="button"
                          onClick={() => handlePickSticker(url)}
                          className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#111b21] border border-transparent hover:border-whatsapp-green/40 transition group flex items-center justify-center relative aspect-square cursor-pointer"
                          title="Clique para enviar figurinha"
                        >
                          <img
                            src={url}
                            alt="Sticker"
                            className="w-full h-full object-contain group-hover:scale-105 transition"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget.parentElement as HTMLElement)?.style.setProperty("display", "none");
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Separator line & 2. Bottom Section: Todas as Figurinhas Recebidas */}
                {otherStickers.length > 0 && (
                  <div>
                    <div className="my-3 border-t border-gray-200 dark:border-[#2a3942]" />
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      <ImageIcon size={12} className="text-gray-400" />
                      <span>Todas as Figurinhas ({otherStickers.length})</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {otherStickers.map((url, i) => (
                        <button
                          key={`other-${url}-${i}`}
                          type="button"
                          onClick={() => handlePickSticker(url)}
                          className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#111b21] border border-transparent hover:border-whatsapp-green/40 transition group flex items-center justify-center relative aspect-square cursor-pointer"
                          title="Clique para enviar figurinha"
                        >
                          <img
                            src={url}
                            alt="Sticker"
                            className="w-full h-full object-contain group-hover:scale-105 transition"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget.parentElement as HTMLElement)?.style.setProperty("display", "none");
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiStickerPicker;
