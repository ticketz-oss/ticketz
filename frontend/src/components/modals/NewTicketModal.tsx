import React, { useState, useEffect } from "react";
import { X, Search, Phone, User, Layers, Smartphone, Loader2, ArrowRight } from "lucide-react";
import api from "../../services/api";
import { useTickets } from "../../context/TicketsContext";
import { useEscapeKey } from "../common/useEscapeKey";
import type { Contact } from "../../types";

export const NewTicketModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    queues,
    whatsapps,
    selectedWhatsappId,
    openOrCreateTicket,
  } = useTickets();

  useEscapeKey(() => setActiveModal(null), activeModal === "newTicket");

  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // New contact manual inputs if not found
  const [manualName, setManualName] = useState("");
  const [manualNumber, setManualNumber] = useState("");

  const [queueId, setQueueId] = useState<number>(() =>
    queues.length > 0 ? queues[0].id : 1
  );
  const [whatsappId, setWhatsappId] = useState<number>(() =>
    selectedWhatsappId || (whatsapps.length > 0 ? whatsapps[0].id : 1)
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (queues.length > 0 && !queueId) {
      setQueueId(queues[0].id);
    }
  }, [queues, queueId]);

  useEffect(() => {
    if (whatsapps.length > 0 && !whatsappId) {
      setWhatsappId(whatsapps[0].id);
    }
  }, [whatsapps, whatsappId]);

  // Search contacts with debounce
  useEffect(() => {
    if (!search.trim() || selectedContact) {
      setContacts([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingContacts(true);
      try {
        const cleanQuery = search.trim();
        const cleanDigits = cleanQuery.replace(/\D/g, "");
        const { data } = await api.get<any>("/contacts", {
          params: { searchParam: cleanDigits.length >= 4 ? cleanDigits : cleanQuery },
        });
        const list = data.contacts || data || [];
        setContacts(list.slice(0, 8));
      } catch (err) {
        console.error("Error searching contacts:", err);
      } finally {
        setLoadingContacts(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, selectedContact]);

  if (activeModal !== "newTicket") return null;

  const handleStartTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    let name = "";
    let number = "";
    let contactId: number | undefined;

    if (selectedContact) {
      name = selectedContact.name;
      number = selectedContact.number;
      contactId = selectedContact.id;
    } else {
      name = manualName.trim();
      number = manualNumber.replace(/\D/g, "");
      if (!name) {
        setErrorMsg("Por favor, informe o nome do contato.");
        return;
      }
      if (number.length < 10) {
        setErrorMsg("Informe um número de WhatsApp válido com DDD (mínimo 10 dígitos).");
        return;
      }
    }

    setSubmitting(true);
    try {
      const ticket = await openOrCreateTicket({
        id: contactId,
        name,
        number,
        queueId,
        whatsappId,
      });

      if (!ticket) {
        setErrorMsg("Não foi possível iniciar o atendimento. Verifique os dados.");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Erro ao criar atendimento.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={() => setActiveModal(null)}
    >
      <div
        className="bg-white dark:bg-whatsapp-dark-panel rounded-2xl w-full max-w-md shadow-2xl border border-whatsapp-light-border dark:border-whatsapp-dark-border overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-whatsapp-light-border dark:border-whatsapp-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-whatsapp-green/10 text-whatsapp-green flex items-center justify-center font-bold text-sm">
              ➕
            </div>
            <div>
              <h2 className="text-base font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text">
                Novo Atendimento
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Inicie uma conversa no WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            type="button"
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleStartTicket} className="p-5 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Contact Search / Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-whatsapp-light-text dark:text-whatsapp-dark-text">
              Buscar Contato Existente
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Nome ou número de telefone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedContact(null);
                }}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-whatsapp-dark-hover rounded-xl text-xs border border-whatsapp-light-border dark:border-whatsapp-dark-border focus:outline-hidden focus:border-whatsapp-green text-whatsapp-light-text dark:text-whatsapp-dark-text"
              />
              {loadingContacts && (
                <Loader2
                  size={15}
                  className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-whatsapp-green"
                />
              )}
            </div>

            {/* Contact search autocomplete dropdown */}
            {contacts.length > 0 && !selectedContact && (
              <div className="mt-1 bg-white dark:bg-whatsapp-dark-panel border border-whatsapp-light-border dark:border-whatsapp-dark-border rounded-xl shadow-lg max-h-44 overflow-y-auto divide-y divide-whatsapp-light-border/40 dark:divide-whatsapp-dark-border/40">
                {contacts.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedContact(c);
                      setSearch(c.name);
                      setContacts([]);
                    }}
                    className="p-2.5 flex items-center justify-between hover:bg-whatsapp-light-hover dark:hover:bg-whatsapp-dark-hover cursor-pointer transition text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-whatsapp-green/20 text-whatsapp-green font-bold text-[11px] flex items-center justify-center">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-whatsapp-light-text dark:text-whatsapp-dark-text block">
                          {c.name}
                        </span>
                        <span className="text-[11px] text-gray-400">{c.number}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-whatsapp-green font-medium">Selecionar</span>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Contact Indicator */}
            {selectedContact && (
              <div className="mt-2 p-2.5 rounded-xl bg-whatsapp-green/10 border border-whatsapp-green/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-whatsapp-green" />
                  <div>
                    <span className="font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text">
                      {selectedContact.name}
                    </span>
                    <span className="text-gray-500 block text-[11px]">
                      {selectedContact.number}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedContact(null);
                    setSearch("");
                  }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Alterar
                </button>
              </div>
            )}
          </div>

          {/* Or Manual Input */}
          {!selectedContact && (
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-whatsapp-dark-hover/50 border border-whatsapp-light-border dark:border-whatsapp-dark-border space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Ou digite os dados diretamente
              </span>
              <div className="space-y-1">
                <label className="text-[11px] text-gray-500 dark:text-gray-400">Nome:</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ex: João da Silva"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-whatsapp-dark-panel rounded-lg text-xs border border-whatsapp-light-border dark:border-whatsapp-dark-border focus:outline-hidden focus:border-whatsapp-green text-whatsapp-light-text dark:text-whatsapp-dark-text"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-gray-500 dark:text-gray-400">
                  Número de WhatsApp (com DDD):
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ex: 5511999998888 ou (11) 99999-8888"
                    value={manualNumber}
                    onChange={(e) => setManualNumber(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-whatsapp-dark-panel rounded-lg text-xs border border-whatsapp-light-border dark:border-whatsapp-dark-border focus:outline-hidden focus:border-whatsapp-green text-whatsapp-light-text dark:text-whatsapp-dark-text"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Queue & WhatsApp Line Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Queue */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-whatsapp-light-text dark:text-whatsapp-dark-text flex items-center gap-1">
                <Layers size={13} className="text-whatsapp-green" /> Fila / Setor:
              </label>
              <select
                value={queueId}
                onChange={(e) => setQueueId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-whatsapp-dark-hover rounded-xl text-xs border border-whatsapp-light-border dark:border-whatsapp-dark-border focus:outline-hidden focus:border-whatsapp-green text-whatsapp-light-text dark:text-whatsapp-dark-text"
              >
                {queues.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name}
                  </option>
                ))}
              </select>
            </div>

            {/* WhatsApp Line */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-whatsapp-light-text dark:text-whatsapp-dark-text flex items-center gap-1">
                <Smartphone size={13} className="text-whatsapp-green" /> Linha de Envio:
              </label>
              <select
                value={whatsappId}
                onChange={(e) => setWhatsappId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-whatsapp-dark-hover rounded-xl text-xs border border-whatsapp-light-border dark:border-whatsapp-dark-border focus:outline-hidden focus:border-whatsapp-green text-whatsapp-light-text dark:text-whatsapp-dark-text"
              >
                {whatsapps.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.status === "CONNECTED" ? "🟢" : "🔴"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-whatsapp-green text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-whatsapp-green/90 active:scale-98 transition shadow-md shadow-whatsapp-green/20 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Iniciando atendimento...
                </>
              ) : (
                <>
                  Iniciar Conversa
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTicketModal;
