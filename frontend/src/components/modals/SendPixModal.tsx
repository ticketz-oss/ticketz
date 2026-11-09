import React, { useState } from "react";
import { X, Send, AlertCircle } from "lucide-react";
import { useEscapeKey } from "../common/useEscapeKey";

interface SendPixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (pixData: { key: string; keyType: string; merchantName: string }) => Promise<void>;
}

export const SendPixModal: React.FC<SendPixModalProps> = ({ isOpen, onClose, onSend }) => {
  useEscapeKey(onClose, isOpen);

  const [keyType, setKeyType] = useState<string>("CNPJ");
  const [key, setKey] = useState<string>("");
  const [merchantName, setMerchantName] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!key.trim() || !merchantName.trim()) {
      setErrorMessage("Por favor, preencha a chave e o nome do titular.");
      return;
    }

    setSending(true);
    try {
      await onSend({
        key: key.trim(),
        keyType,
        merchantName: merchantName.trim(),
      });
      onClose();
    } catch (err: any) {
      console.error("Error sending Pix key:", err);
      setErrorMessage(err?.response?.data?.message || err?.message || "Erro ao enviar chave Pix.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#374248] p-5 animate-scaleUp text-[#111b21] dark:text-[#e9edef]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-[#374248] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#00a884]/15 text-[#00a884] flex items-center justify-center font-bold text-sm">
              ❖
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-[#e9edef]">
                Enviar Chave Pix
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Gera o cartão oficial Pix no chat
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Inline Error Message */}
        {errorMessage && (
          <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
            <AlertCircle size={15} className="shrink-0" />
            <span className="leading-tight">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Chave
            </label>
            <select
              value={keyType}
              onChange={(e) => setKeyType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-[#111b21] border border-gray-300 dark:border-[#2a3942] text-gray-900 dark:text-[#e9edef] focus:outline-hidden focus:ring-2 focus:ring-[#00a884] transition"
            >
              <option value="CNPJ" className="bg-white dark:bg-[#111b21] text-gray-900 dark:text-[#e9edef]">CNPJ</option>
              <option value="CPF" className="bg-white dark:bg-[#111b21] text-gray-900 dark:text-[#e9edef]">CPF</option>
              <option value="Telefone" className="bg-white dark:bg-[#111b21] text-gray-900 dark:text-[#e9edef]">Telefone / Celular</option>
              <option value="E-mail" className="bg-white dark:bg-[#111b21] text-gray-900 dark:text-[#e9edef]">E-mail</option>
              <option value="Aleatória" className="bg-white dark:bg-[#111b21] text-gray-900 dark:text-[#e9edef]">Chave Aleatória (EVP)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Chave Pix
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Digite a chave Pix..."
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-[#111b21] border border-gray-300 dark:border-[#2a3942] text-gray-900 dark:text-[#e9edef] placeholder-gray-400 dark:placeholder-gray-500 focus:outline-hidden focus:ring-2 focus:ring-[#00a884] transition font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Nome do Titular / Razão Social
            </label>
            <input
              type="text"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder="Nome da empresa ou titular..."
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-[#111b21] border border-gray-300 dark:border-[#2a3942] text-gray-900 dark:text-[#e9edef] placeholder-gray-400 dark:placeholder-gray-500 focus:outline-hidden focus:ring-2 focus:ring-[#00a884] transition"
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-gray-300 dark:border-[#2a3942] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#111b21] transition font-medium text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 bg-[#00a884] hover:bg-[#008069] text-white rounded-lg font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 shadow-sm text-xs cursor-pointer"
            >
              <Send size={13} />
              <span>{sending ? "Enviando..." : "Enviar Pix"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendPixModal;
