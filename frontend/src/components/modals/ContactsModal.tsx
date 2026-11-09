import React, { useState, useEffect } from "react";
import { X, Search, UserPlus, Phone, Mail, MessageSquare, Loader2, Edit2, Copy, Check } from "lucide-react";
import api from "../../services/api";
import { useTickets } from "../../context/TicketsContext";
import { useEscapeKey } from "../common/useEscapeKey";
import type { Contact } from "../../types";

export const ContactsModal: React.FC = () => {
  const { activeModal, setActiveModal, openOrCreateTicket } = useTickets();

  useEscapeKey(() => setActiveModal(null), activeModal === "contacts");

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, text: string, key: string) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fetchContacts = async (searchParam = "") => {
    setLoading(true);
    try {
      const cleanDigits = searchParam.replace(/\D/g, "");
      const { data } = await api.get<any>("/contacts", {
        params: { searchParam: cleanDigits.length >= 4 ? cleanDigits : searchParam },
      });
      const list = data.contacts || data || [];
      setContacts(list);
    } catch (err) {
      console.error("Error fetching contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeModal === "contacts") {
      fetchContacts(search);
    }
  }, [activeModal]);

  useEffect(() => {
    if (activeModal !== "contacts") return;
    const timer = setTimeout(() => {
      fetchContacts(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, activeModal]);

  if (activeModal !== "contacts") return null;

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Informe o nome.");
      return;
    }
    const cleanNumber = number.replace(/\D/g, "");
    if (cleanNumber.length < 10) {
      setFormError("Número inválido (mínimo 10 dígitos com DDD).");
      return;
    }

    setSaving(true);
    try {
      if (editingContact) {
        await api.put(`/contacts/${editingContact.id}`, {
          name: name.trim(),
          number: cleanNumber,
          email: email.trim() || undefined,
        });
      } else {
        await api.post("/contacts", {
          name: name.trim(),
          number: cleanNumber,
          email: email.trim() || undefined,
        });
      }

      setName("");
      setNumber("");
      setEmail("");
      setEditingContact(null);
      setShowAddForm(false);
      fetchContacts(search);
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Erro ao salvar contato.");
    } finally {
      setSaving(false);
    }
  };

  const handleStartChat = async (contact: Contact) => {
    await openOrCreateTicket(contact);
  };

  const openEdit = (contact: Contact) => {
    setEditingContact(contact);
    setName(contact.name);
    setNumber(contact.number);
    setEmail(contact.email || "");
    setShowAddForm(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={() => setActiveModal(null)}
    >
      <div
        className="bg-white dark:bg-whatsapp-dark-panel rounded-2xl w-full max-w-2xl shadow-2xl border border-whatsapp-light-border dark:border-whatsapp-dark-border overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-whatsapp-light-border dark:border-whatsapp-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-whatsapp-green/10 text-whatsapp-green flex items-center justify-center font-bold text-sm">
              👥
            </div>
            <div>
              <h2 className="text-base font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text">
                Contatos ({contacts.length})
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Gerencie sua agenda de clientes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingContact(null);
                setName("");
                setNumber("");
                setEmail("");
                setShowAddForm(!showAddForm);
              }}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-whatsapp-green text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-whatsapp-green/90 transition shadow-sm"
            >
              <UserPlus size={14} />
              <span>{showAddForm ? "Fechar Formulário" : "Novo Contato"}</span>
            </button>

            <button
              onClick={() => setActiveModal(null)}
              type="button"
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Add/Edit Form Collapsible */}
        {showAddForm && (
          <form
            onSubmit={handleSaveContact}
            className="p-4 bg-gray-50 dark:bg-whatsapp-dark-hover/50 border-b border-whatsapp-light-border dark:border-whatsapp-dark-border space-y-3 animate-fadeIn"
          >
            <div className="text-xs font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text">
              {editingContact ? "Editar Contato" : "Cadastrar Novo Contato"}
            </div>

            {formError && (
              <div className="p-2 text-xs rounded bg-red-500/10 text-red-500 border border-red-500/20">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Nome completo *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-whatsapp-dark-panel text-xs border border-whatsapp-light-border dark:border-whatsapp-dark-border focus:outline-hidden focus:border-whatsapp-green"
              />
              <input
                type="text"
                placeholder="Número WhatsApp com DDD *"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-whatsapp-dark-panel text-xs border border-whatsapp-light-border dark:border-whatsapp-dark-border focus:outline-hidden focus:border-whatsapp-green"
              />
              <input
                type="email"
                placeholder="Email (opcional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-whatsapp-dark-panel text-xs border border-whatsapp-light-border dark:border-whatsapp-dark-border focus:outline-hidden focus:border-whatsapp-green"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-200 dark:hover:bg-whatsapp-dark-hover transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-whatsapp-green text-white text-xs font-semibold hover:bg-whatsapp-green/90 transition disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar Contato"}
              </button>
            </div>
          </form>
        )}

        {/* Search Input */}
        <div className="p-3 border-b border-whatsapp-light-border dark:border-whatsapp-dark-border">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Pesquisar por nome ou número..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-whatsapp-dark-hover rounded-xl text-xs border border-whatsapp-light-border dark:border-whatsapp-dark-border focus:outline-hidden focus:border-whatsapp-green text-whatsapp-light-text dark:text-whatsapp-dark-text"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto divide-y divide-whatsapp-light-border/40 dark:divide-whatsapp-dark-border/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Loader2 className="animate-spin mb-2" size={24} />
              <span className="text-xs">Carregando contatos...</span>
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <span className="text-xs">Nenhum contato encontrado.</span>
            </div>
          ) : (
            contacts.map((c) => (
              <div
                key={c.id}
                className="px-4 py-3 flex items-center justify-between hover:bg-whatsapp-light-hover dark:hover:bg-whatsapp-dark-hover transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-whatsapp-green/20 text-whatsapp-green font-bold text-xs flex items-center justify-center shrink-0">
                    {c.profilePicUrl ? (
                      <img
                        src={c.profilePicUrl}
                        alt=""
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      c.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 select-text">
                    <div className="flex items-center gap-1.5">
                      <span
                        data-selectable="true"
                        className="text-xs font-semibold text-whatsapp-light-text dark:text-whatsapp-dark-text truncate select-text cursor-text"
                        title="Clique e arraste para selecionar o nome"
                      >
                        {c.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(e, c.name, `name-${c.id}`)}
                        className="p-0.5 rounded text-gray-400 hover:text-whatsapp-green transition shrink-0 cursor-pointer"
                        title="Copiar nome"
                      >
                        {copiedField === `name-${c.id}` ? (
                          <Check size={11} className="text-whatsapp-green" />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 select-text">
                      <span className="flex items-center gap-1">
                        <Phone size={11} />
                        <span
                          data-selectable="true"
                          className="select-text cursor-text font-mono"
                          title="Clique e arraste para selecionar o número"
                        >
                          {c.number}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(e, c.number, `num-${c.id}`)}
                          className="p-0.5 rounded text-gray-400 hover:text-whatsapp-green transition shrink-0 cursor-pointer"
                          title="Copiar número"
                        >
                          {copiedField === `num-${c.id}` ? (
                            <Check size={10} className="text-whatsapp-green" />
                          ) : (
                            <Copy size={10} />
                          )}
                        </button>
                      </span>
                      {c.email && (
                        <span className="hidden sm:flex items-center gap-1 truncate select-text">
                          <Mail size={11} />
                          <span
                            data-selectable="true"
                            className="select-text cursor-text"
                          >
                            {c.email}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => openEdit(c)}
                    type="button"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover transition"
                    title="Editar contato"
                  >
                    <Edit2 size={14} />
                  </button>

                  <button
                    onClick={() => handleStartChat(c)}
                    type="button"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-whatsapp-green/10 text-whatsapp-green font-medium text-xs hover:bg-whatsapp-green hover:text-white transition active:scale-95"
                    title="Iniciar conversa"
                  >
                    <MessageSquare size={13} />
                    <span>Conversar</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactsModal;
