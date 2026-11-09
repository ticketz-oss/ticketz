import React, { useState, useEffect } from "react";
import { X, ArrowRightLeft, Layers, User, Loader2 } from "lucide-react";
import api from "../../services/api";
import { useTickets } from "../../context/TicketsContext";
import { useEscapeKey } from "../common/useEscapeKey";
import type { User as UserType } from "../../types";

export const TransferModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    selectedTicket,
    queues,
    transferTicket,
  } = useTickets();

  useEscapeKey(() => setActiveModal(null), activeModal === "transfer");

  const [users, setUsers] = useState<UserType[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedQueueId, setSelectedQueueId] = useState<number | "">(
    selectedTicket?.queueId || (queues.length > 0 ? queues[0].id : "")
  );
  const [selectedUserId, setSelectedUserId] = useState<number | "">(
    selectedTicket?.userId || ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (activeModal === "transfer") {
      setSelectedQueueId(selectedTicket?.queueId || (queues.length > 0 ? queues[0].id : ""));
      setSelectedUserId(selectedTicket?.userId || "");

      const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
          const { data } = await api.get<any>("/users/list");
          const list = Array.isArray(data) ? data : data.users || [];
          setUsers(list);
        } catch (err) {
          console.error("Error fetching users for transfer:", err);
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [activeModal, selectedTicket, queues]);

  if (activeModal !== "transfer" || !selectedTicket) return null;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      await transferTicket(selectedTicket.id, {
        queueId: selectedQueueId === "" ? null : Number(selectedQueueId),
        userId: selectedUserId === "" ? null : Number(selectedUserId),
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || "";
      if (msg.includes("ERR_OTHER_OPEN_TICKET")) {
        setErrorMsg("Já existe outro chamado aberto para este contato. Finalize o chamado anterior antes de transferir.");
      } else {
        setErrorMsg(msg || "Erro ao transferir atendimento.");
      }
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
        className="bg-white dark:bg-whatsapp-dark-panel rounded-2xl w-full max-w-md shadow-2xl border border-whatsapp-light-border dark:border-whatsapp-dark-border overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-whatsapp-light-border dark:border-whatsapp-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-sm">
              <ArrowRightLeft size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text">
                Transferir Atendimento
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Cliente: {selectedTicket.contact?.name || selectedTicket.contact?.number}
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

        {/* Content */}
        <form onSubmit={handleTransfer} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-2 text-xs rounded bg-red-500/10 text-red-500 border border-red-500/20">
              {errorMsg}
            </div>
          )}

          {/* Queue Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-whatsapp-light-text dark:text-whatsapp-dark-text flex items-center gap-1.5">
              <Layers size={14} className="text-whatsapp-green" />
              Transferir para a Fila / Setor:
            </label>
            <select
              value={selectedQueueId}
              onChange={(e) => setSelectedQueueId(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-whatsapp-dark-hover rounded-xl text-xs border border-whatsapp-light-border dark:border-whatsapp-dark-border focus:outline-hidden focus:border-whatsapp-green text-whatsapp-light-text dark:text-whatsapp-dark-text"
            >
              <option value="">Sem Fila</option>
              {queues.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name}
                </option>
              ))}
            </select>
          </div>

          {/* User Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-whatsapp-light-text dark:text-whatsapp-dark-text flex items-center gap-1.5">
              <User size={14} className="text-whatsapp-green" />
              Transferir para o Atendente:
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-whatsapp-dark-hover rounded-xl text-xs border border-whatsapp-light-border dark:border-whatsapp-dark-border focus:outline-hidden focus:border-whatsapp-green text-whatsapp-light-text dark:text-whatsapp-dark-text"
            >
              <option value="">Nenhum (retorna para a fila geral)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 rounded-xl text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || loadingUsers}
              className="px-5 py-2 rounded-xl bg-whatsapp-green text-white text-xs font-semibold hover:bg-whatsapp-green/90 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Transferindo...
                </>
              ) : (
                "Confirmar Transferência"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferModal;
