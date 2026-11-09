import React from "react";
import { Search, X } from "lucide-react";
import { useTickets } from "../../context/TicketsContext";

export const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery, selectedTicket } = useTickets();

  return (
    <div className="p-2 bg-whatsapp-light-panel dark:bg-whatsapp-dark-panel border-b border-whatsapp-light-border dark:border-whatsapp-dark-border">
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-whatsapp-dark-hover rounded-lg px-3 py-1.5 focus-within:ring-1 focus-within:ring-whatsapp-green transition">
        <Search size={16} className="text-gray-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              // If no conversation is open, clear search and blur immediately
              if (!selectedTicket && searchQuery) {
                e.preventDefault();
                e.stopPropagation();
                setSearchQuery("");
                (e.target as HTMLElement).blur();
              }
            }
          }}
          placeholder="Pesquisar contatos ou mensagens..."
          className="w-full bg-transparent text-xs text-whatsapp-light-text dark:text-whatsapp-dark-text placeholder-gray-400 focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            type="button"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
