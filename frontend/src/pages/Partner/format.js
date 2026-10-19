// Formatadores compartilhados pelas telas do portal de parceiros.

export const formatCurrency = value =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

export const PAYOUT_STATUS_LABELS = {
  pending: "Pendente",
  processing: "Enviando",
  paid: "Repassado",
  failed: "Falhou",
  awaiting_pix_key: "Aguardando chave Pix"
};

export const payoutStatusLabel = status =>
  PAYOUT_STATUS_LABELS[status] || status || "-";
