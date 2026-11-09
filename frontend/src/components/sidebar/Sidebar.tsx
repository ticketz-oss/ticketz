import React, { useState } from "react";
import SidebarHeader from "./SidebarHeader";
import TabsBar from "./TabsBar";
import SearchBar from "./SearchBar";
import TicketListItem from "./TicketListItem";
import { useTickets } from "../../context/TicketsContext";
import { MessageSquare, Loader2 } from "lucide-react";
import { ChatPeekModal } from "../common/ChatPeekModal";
import type { Ticket } from "../../types";

export const Sidebar: React.FC = () => {
  const {
    tickets,
    loading,
    selectedTicket,
    setSelectedTicket,
    searchQuery,
    searchResults,
    openOrCreateTicket,
    resolveTicket,
  } = useTickets();

  const [peekTicket, setPeekTicket] = useState<Ticket | null>(null);

  return (
    <div className="w-full md:w-[360px] lg:w-[380px] h-full flex flex-col bg-whatsapp-light-panel dark:bg-whatsapp-dark-panel border-r border-whatsapp-light-border dark:border-whatsapp-dark-border shrink-0 select-none">
      <SidebarHeader />
      <SearchBar />
      {!searchQuery && <TabsBar />}

      {/* Peek Sneak Preview Modal */}
      <ChatPeekModal
        ticket={peekTicket}
        onClose={() => setPeekTicket(null)}
        onOpenFullChat={(ticket) => setSelectedTicket(ticket)}
        onResolveTicket={(ticket) => resolveTicket(ticket.id)}
      />

      <div className="flex-1 overflow-y-auto">
        {loading && tickets.length === 0 && !searchQuery ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Loader2 className="animate-spin mb-2" size={24} />
            <span className="text-xs">Carregando atendimentos...</span>
          </div>
        ) : searchQuery && searchResults ? (
          <div className="p-2 space-y-4">
            <div>
              <div className="px-2 py-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Contatos ({searchResults.contacts.length})
              </div>
              {searchResults.contacts.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-400">Nenhum contato encontrado.</div>
              ) : (
                searchResults.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => openOrCreateTicket(contact)}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-whatsapp-light-hover dark:hover:bg-whatsapp-dark-hover cursor-pointer transition"
                  >
                    <div className="w-9 h-9 rounded-full bg-whatsapp-green/20 text-whatsapp-green font-bold text-xs flex items-center justify-center shrink-0">
                      {contact.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-whatsapp-light-text dark:text-whatsapp-dark-text truncate">
                        {contact.name}
                      </span>
                      <span className="text-[11px] text-gray-400">{contact.number}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div>
              <div className="px-2 py-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Mensagens ({searchResults.messages.length})
              </div>
              {searchResults.messages.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-400">Nenhuma mensagem encontrada.</div>
              ) : (
                searchResults.messages.map((match, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedTicket(match.ticket)}
                    className="flex flex-col p-2 rounded-lg hover:bg-whatsapp-light-hover dark:hover:bg-whatsapp-dark-hover cursor-pointer transition border-b border-whatsapp-light-border/40 dark:border-whatsapp-dark-border/40"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-whatsapp-light-text dark:text-whatsapp-dark-text mb-0.5">
                      <span>{match.ticket.contact?.name || match.ticket.contact?.number}</span>
                      <span className="text-[10px] text-gray-400 font-normal">
                        {new Date(match.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">
                      {match.body}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-gray-400 px-6 text-center">
            <MessageSquare size={36} className="mb-2 opacity-30" />
            <span className="text-xs font-medium">Nenhum atendimento nesta fila.</span>
            <span className="text-[11px] text-gray-400 mt-0.5">
              Novas mensagens recebidas aparecerão aqui em tempo real.
            </span>
          </div>
        ) : (
          tickets.map((ticket) => (
            <TicketListItem
              key={ticket.id}
              ticket={ticket}
              isSelected={selectedTicket?.id === ticket.id}
              onSelect={() => setSelectedTicket(ticket)}
              onPeek={(t) => setPeekTicket(t)}
              onResolve={(t) => resolveTicket(t.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;
