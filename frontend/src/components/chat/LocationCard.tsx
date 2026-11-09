import React from "react";
import { MapPin, ExternalLink } from "lucide-react";
import type { LocationInfo } from "../../utils/locationParser";

interface LocationCardProps {
  location: LocationInfo;
  fromMe?: boolean;
}

export const LocationCard: React.FC<LocationCardProps> = ({ location }) => {
  const handleOpenMaps = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(location.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      onClick={handleOpenMaps}
      className="flex flex-col min-w-[240px] max-w-[320px] rounded-lg overflow-hidden my-1 bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10 select-none cursor-pointer group hover:opacity-95 transition"
    >
      {/* Map Thumbnail or Map Placeholder */}
      <div className="relative w-full h-36 bg-[#242f3e] flex items-center justify-center overflow-hidden">
        {location.thumbnail ? (
          <img
            src={location.thumbnail}
            alt="Localização"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-[#1e293b] to-[#0f172a] flex flex-col items-center justify-center p-3 relative">
            {/* Grid pattern overlay */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#38bdf8 1px, #1e293b 1px)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-1 z-10 animate-bounce">
              <MapPin size={22} className="fill-red-500 text-white" />
            </div>
            <span className="text-[11px] font-bold text-white z-10 tracking-wide drop-shadow-sm">
              Google Maps
            </span>
          </div>
        )}

        {/* Small Google Logo / Pin Badge */}
        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] text-white font-semibold flex items-center gap-1">
          <MapPin size={11} className="text-red-500 fill-red-500" />
          <span>Google</span>
        </div>
      </div>

      {/* Info Details */}
      <div className="p-3">
        <h4 className="font-bold text-xs text-whatsapp-green truncate leading-tight">
          {location.name || "Localização"}
        </h4>
        {location.address && (
          <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2 mt-1 leading-snug">
            {location.address}
          </p>
        )}
      </div>

      {/* Open Button */}
      <div className="w-full py-2 px-3 border-t border-black/10 dark:border-white/10 flex items-center justify-center gap-1.5 text-whatsapp-green font-semibold text-xs group-hover:bg-black/5 dark:group-hover:bg-white/5 transition">
        <ExternalLink size={13} />
        <span>Abrir no Google Maps</span>
      </div>
    </div>
  );
};

export default LocationCard;
