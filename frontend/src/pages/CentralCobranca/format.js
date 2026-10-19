import moment from "moment";

export const formatCurrency = (value, currency = "BRL") => {
  const amount = Number(value) || 0;
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL"
    }).format(amount);
  } catch (e) {
    return `R$ ${amount.toFixed(2)}`;
  }
};

export const formatDate = value =>
  value ? moment(value).format("DD/MM/YYYY") : "-";

export const formatDateTime = value =>
  value ? moment(value).format("DD/MM/YYYY HH:mm") : "-";

export const SITUACOES = {
  open: { label: "Em aberto", color: "#2f80ed" },
  overdue: { label: "Vencida", color: "#eb5757" },
  paid: { label: "Paga", color: "#27ae60" },
  cancelled: { label: "Cancelada", color: "#828282" }
};

export const situacaoLabel = situacao =>
  SITUACOES[situacao]?.label || situacao || "-";

export const situacaoColor = situacao =>
  SITUACOES[situacao]?.color || "#828282";

export const METODOS = [
  { value: "pix", label: "PIX" },
  { value: "boleto", label: "Boleto" },
  { value: "card", label: "Cartão" }
];

export const metodoLabel = forma =>
  METODOS.find(metodo => metodo.value === forma)?.label || "-";

export const inicioDoMes = () => moment().startOf("month").format("YYYY-MM-DD");
export const fimDoMes = () => moment().endOf("month").format("YYYY-MM-DD");
