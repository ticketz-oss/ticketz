import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { PixInfo } from "../../utils/pixParser";

interface PixCardProps {
  pix: PixInfo;
  fromMe?: boolean;
}

export const PixCard: React.FC<PixCardProps> = ({ pix }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!pix.key) return;
    navigator.clipboard.writeText(pix.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="flex flex-col min-w-[240px] max-w-[320px] rounded-lg overflow-hidden my-1 bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10 select-none">
      {/* Top Header Card Info */}
      <div className="p-3 flex items-center gap-3">
        {/* White circle with official Pix icon */}
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
          <svg
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-7 text-[#00bdae]"
          >
            <path
              d="M112.5 124.7c14.2-14.2 37.3-14.2 51.5 0l55.8 55.8c4.2 4.2 11.1 4.2 15.3 0l55.8-55.8c14.2-14.2 37.3-14.2 51.5 0l57.7 57.7c14.2 14.2 14.2 37.3 0 51.5l-55.8 55.8c-4.2 4.2-4.2 11.1 0 15.3l55.8 55.8c14.2 14.2 14.2 37.3 0 51.5l-57.7 57.7c-14.2 14.2-37.3 14.2-51.5 0l-55.8-55.8c-4.2-4.2-11.1-4.2-15.3 0l-55.8 55.8c-14.2-14.2-37.3-14.2-51.5 0l-57.7-57.7c-14.2-14.2-14.2-37.3 0-51.5l55.8-55.8c4.2-4.2 4.2-11.1 0-15.3l-55.8-55.8c-14.2-14.2-14.2-37.3 0-51.5l57.7-57.7z"
              fill="currentColor"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-xs truncate leading-tight">
            {pix.merchantName}
          </h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-300 truncate mt-0.5 font-medium">
            {pix.keyType}: {pix.key}
          </p>
        </div>
      </div>

      {/* Bottom Button Action */}
      <button
        type="button"
        onClick={handleCopy}
        className="w-full py-2.5 px-3 border-t border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center justify-center gap-2 text-whatsapp-green font-semibold text-xs active:scale-[0.98]"
      >
        {copied ? (
          <>
            <Check size={16} className="text-whatsapp-green" />
            <span>Chave copiada!</span>
          </>
        ) : (
          <>
            <Copy size={16} className="text-whatsapp-green" />
            <span>Copiar chave Pix</span>
          </>
        )}
      </button>
    </div>
  );
};

export default PixCard;
