import React, { useState, useEffect } from "react";
import { X, Users, UserPlus, Edit2, Trash2, Shield, Loader2, Check, Smartphone, Lock } from "lucide-react";
import api from "../../services/api";
import { useTickets } from "../../context/TicketsContext";
import { useAuth } from "../../context/AuthContext";
import { useEscapeKey } from "../common/useEscapeKey";
import type { User as UserType } from "../../types";
import {
  getUserAllowedWhatsappIds,
  setUserAllowedWhatsappIds,
  isWhatsappPrivate,
  syncPrivacySettingsFromBackend,
} from "../../services/privacyService";

export const UsersModal: React.FC = () => {
  const { activeModal, setActiveModal, queues, whatsapps } = useTickets();
  const { user: currentUser } = useAuth();

  useEscapeKey(() => setActiveModal(null), activeModal === "users");

  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState<"admin" | "user">("user");
  const [selectedQueueIds, setSelectedQueueIds] = useState<number[]>([]);
  const [selectedAllowedWhatsappIds, setSelectedAllowedWhatsappIds] = useState<number[]>([]);
  const [selectedWhatsappId, setSelectedWhatsappId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<any>("/users");
      const list = Array.isArray(data) ? data : data.users || [];
      setUsers(list);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeModal === "users") {
      syncPrivacySettingsFromBackend();
      fetchUsers();
    }
  }, [activeModal]);

  if (activeModal !== "users") return null;

  const handleOpenCreate = () => {
    setEditingUserId(null);
    setName("");
    setEmail("");
    setPassword("");
    setProfile("user");
    setSelectedQueueIds([]);
    // By default, select all non-private whatsapps
    setSelectedAllowedWhatsappIds(
      whatsapps.filter((w) => !isWhatsappPrivate(w.id, w.name)).map((w) => w.id)
    );
    setSelectedWhatsappId("");
    setErrorMsg("");
    setShowForm(true);
  };

  const handleOpenEdit = (u: any) => {
    setEditingUserId(u.id);
    setName(u.name || "");
    setEmail(u.email || "");
    setPassword("");
    setProfile(u.profile || "user");
    const qIds = u.queues ? u.queues.map((q: any) => q.id) : [];
    setSelectedQueueIds(qIds);
    setSelectedWhatsappId(u.whatsappId || "");

    const perms = getUserAllowedWhatsappIds(u.id);
    if (perms !== null) {
      setSelectedAllowedWhatsappIds(perms);
    } else {
      // By default, NEVER auto-grant private lines unless explicitly chosen
      setSelectedAllowedWhatsappIds(
        whatsapps.filter((w) => !isWhatsappPrivate(w.id, w.name)).map((w) => w.id)
      );
    }

    setErrorMsg("");
    setShowForm(true);
  };

  const toggleQueue = (qId: number) => {
    setSelectedQueueIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const toggleAllowedWhatsapp = (wId: number) => {
    setSelectedAllowedWhatsappIds((prev) =>
      prev.includes(wId) ? prev.filter((id) => id !== wId) : [...prev, wId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg("Preencha nome e e-mail.");
      return;
    }
    if (!editingUserId && !password.trim()) {
      setErrorMsg("Informe uma senha para o novo usuário.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const payload: any = {
        name,
        email,
        profile,
        queueIds: selectedQueueIds,
        whatsappId: selectedWhatsappId || null,
      };
      if (password) {
        payload.password = password;
      }

      let savedUserId = editingUserId;
      if (editingUserId) {
        await api.put(`/users/${editingUserId}`, payload);
      } else {
        const { data } = await api.post<any>("/users", payload);
        savedUserId = data?.id || data?.user?.id;
      }

      if (savedUserId) {
        setUserAllowedWhatsappIds(savedUserId, selectedAllowedWhatsappIds);
      }

      setShowForm(false);
      await fetchUsers();
    } catch (err: any) {
      console.error("Error saving user:", err);
      setErrorMsg(err.response?.data?.error || err.response?.data?.message || "Erro ao salvar usuário.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (uId: number) => {
    if (uId === currentUser?.id) {
      alert("Você não pode excluir seu próprio usuário logado.");
      return;
    }
    if (!window.confirm("Deseja realmente excluir este usuário?")) return;

    try {
      await api.delete(`/users/${uId}`);
      await fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Não foi possível excluir o usuário.");
    }
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
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-sm">
              <Users size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-whatsapp-light-text dark:text-whatsapp-dark-text">
                Gerenciar Usuários ({users.length})
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Cadastre atendentes e configure permissões de filas e linhas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreate}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-whatsapp-green text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-whatsapp-green/90 transition shadow-sm"
            >
              <UserPlus size={14} />
              <span>Novo Atendente</span>
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

        {/* Explain line separation */}
        <div className="px-5 py-2 bg-blue-500/10 border-b border-blue-500/20 text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
          <Shield size={14} className="shrink-0" />
          <span>
            <strong>Separação por Linha / Setor:</strong> Cada atendente só tem acesso às Filas e Conexões que você marcar abaixo. Se não marcar sua Linha Particular para ele, ele nunca verá as conversas dela.
          </span>
        </div>

        {/* Form Collapsible */}
        {showForm && (
          <form
            onSubmit={handleSave}
            className="p-4 bg-gray-50 dark:bg-whatsapp-dark-hover/40 border-b border-whatsapp-light-border dark:border-whatsapp-dark-border space-y-3 animate-fadeIn"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-whatsapp-light-text dark:text-whatsapp-dark-text">
                {editingUserId ? "Editar Usuário" : "Novo Usuário"}
              </span>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                Cancelar
              </button>
            </div>

            {errorMsg && (
              <div className="p-2 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Nome do Atendente *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full px-3 py-1.5 bg-white dark:bg-whatsapp-dark-panel border border-whatsapp-light-border dark:border-whatsapp-dark-border rounded-lg text-xs text-whatsapp-light-text dark:text-whatsapp-dark-text focus:outline-none focus:border-whatsapp-green"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  E-mail (Login) *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: joao@empresa.com"
                  className="w-full px-3 py-1.5 bg-white dark:bg-whatsapp-dark-panel border border-whatsapp-light-border dark:border-whatsapp-dark-border rounded-lg text-xs text-whatsapp-light-text dark:text-whatsapp-dark-text focus:outline-none focus:border-whatsapp-green"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Senha {editingUserId && "(Deixe em branco para manter a atual)"}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingUserId ? "••••••••" : "Nova senha"}
                  className="w-full px-3 py-1.5 bg-white dark:bg-whatsapp-dark-panel border border-whatsapp-light-border dark:border-whatsapp-dark-border rounded-lg text-xs text-whatsapp-light-text dark:text-whatsapp-dark-text focus:outline-none focus:border-whatsapp-green"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Nível de Permissão
                </label>
                <select
                  value={profile}
                  onChange={(e: any) => setProfile(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-whatsapp-dark-panel border border-whatsapp-light-border dark:border-whatsapp-dark-border rounded-lg text-xs text-whatsapp-light-text dark:text-whatsapp-dark-text focus:outline-none focus:border-whatsapp-green"
                >
                  <option value="user">Atendente (Apenas suas filas e conversas)</option>
                  <option value="admin">Administrador (Acesso total)</option>
                </select>
              </div>
            </div>

            {/* Select Queues */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                Filas de Atendimento Permitidas para este Atendente:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {queues.map((q) => {
                  const isChecked = selectedQueueIds.includes(q.id);
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => toggleQueue(q.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition ${
                        isChecked
                          ? "bg-whatsapp-green text-white border-whatsapp-green"
                          : "bg-white dark:bg-whatsapp-dark-panel border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: q.color || "#1273DE" }}
                      />
                      <span>{q.name}</span>
                      {isChecked && <Check size={12} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Allowed WhatsApp Connections */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  Linhas / Conexões WhatsApp Permitidas para este Atendente:
                </label>
                <div className="flex gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSelectedAllowedWhatsappIds(whatsapps.map((w) => w.id))}
                    className="text-whatsapp-green hover:underline cursor-pointer"
                  >
                    Marcar todas
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedAllowedWhatsappIds([])}
                    className="text-gray-400 hover:underline cursor-pointer"
                  >
                    Desmarcar todas
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {whatsapps.map((w) => {
                  const isChecked = selectedAllowedWhatsappIds.includes(w.id);
                  const isPriv = isWhatsappPrivate(w.id, w.name);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => toggleAllowedWhatsapp(w.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition ${
                        isChecked
                          ? isPriv
                            ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                            : "bg-whatsapp-green text-white border-whatsapp-green shadow-xs"
                          : "bg-white dark:bg-whatsapp-dark-panel border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      <Smartphone size={13} />
                      <span>{w.name}</span>
                      {isPriv && (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-black/20 flex items-center gap-0.5">
                          <Lock size={9} /> Particular
                        </span>
                      )}
                      {isChecked && <Check size={12} />}
                    </button>
                  );
                })}
                {whatsapps.length === 0 && (
                  <span className="text-xs text-gray-400">Nenhuma conexão WhatsApp cadastrada.</span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Se desmarcado, o usuário não verá nenhuma conversa dessa conexão (inclusive linhas particulares permanecem totalmente invisíveis).
              </p>
            </div>

            {/* Default WhatsApp Connection */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                Conexão WhatsApp Padrão para Envio (Opcional):
              </label>
              <select
                value={selectedWhatsappId}
                onChange={(e) => setSelectedWhatsappId(Number(e.target.value) || "")}
                className="w-full px-3 py-1.5 bg-white dark:bg-whatsapp-dark-panel border border-whatsapp-light-border dark:border-whatsapp-dark-border rounded-lg text-xs text-whatsapp-light-text dark:text-whatsapp-dark-text focus:outline-none focus:border-whatsapp-green"
              >
                <option value="">Todas as permitidas / Sem preferência</option>
                {whatsapps.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.number || "Sem número"})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-whatsapp-dark-hover"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-whatsapp-green text-white text-xs font-semibold hover:bg-whatsapp-green/90 transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                <span>{editingUserId ? "Salvar Alterações" : "Criar Atendente"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Users list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 size={24} className="animate-spin mb-2" />
              <span className="text-xs">Carregando usuários...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              Nenhum usuário cadastrado.
            </div>
          ) : (
            users.map((u: any) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 rounded-xl border border-whatsapp-light-border dark:border-whatsapp-dark-border hover:bg-gray-50 dark:hover:bg-whatsapp-dark-hover/40 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-500/15 text-blue-500 font-bold flex items-center justify-center shrink-0 text-sm">
                    {u.name?.slice(0, 2).toUpperCase() || "US"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-whatsapp-light-text dark:text-whatsapp-dark-text truncate">
                        {u.name}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                          u.profile === "admin"
                            ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {u.profile === "admin" ? "Admin" : "Atendente"}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 block truncate">
                      {u.email}
                    </span>
                    {u.queues && u.queues.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {u.queues.map((q: any) => (
                          <span
                            key={q.id}
                            className="text-[9px] px-1.5 py-0.2 rounded font-medium"
                            style={{
                              backgroundColor: `${q.color || "#1273DE"}20`,
                              color: q.color || "#1273DE",
                            }}
                          >
                            {q.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Linhas WhatsApp Permitidas */}
                    {(() => {
                      const allowed = getUserAllowedWhatsappIds(u.id);
                      if (allowed !== null) {
                        const allowedWhatsapps = whatsapps.filter((w) => allowed.includes(w.id));
                        return (
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            <span className="text-[9px] text-gray-400">Linhas:</span>
                            {allowedWhatsapps.length === 0 ? (
                              <span className="text-[9px] text-red-500 font-medium">Nenhuma linha</span>
                            ) : (
                              allowedWhatsapps.map((w) => (
                                <span
                                  key={w.id}
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5 ${
                                    isWhatsappPrivate(w.id, w.name)
                                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  }`}
                                >
                                  {isWhatsappPrivate(w.id, w.name) && <Lock size={8} />}
                                  {w.name}
                                </span>
                              ))
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(u)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition"
                    title="Editar usuário"
                  >
                    <Edit2 size={15} />
                  </button>
                  {u.id !== currentUser?.id && (
                    <button
                      type="button"
                      onClick={() => handleDelete(u.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                      title="Excluir usuário"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersModal;
