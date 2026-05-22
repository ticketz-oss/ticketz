import { format, parseISO } from "date-fns";

const reasonLabels = {
  forbidden_403: "Sessao invalidada pelo provedor",
  logged_out: "Sessao encerrada",
  manual_delete: "Conexao removida manualmente"
};

const emailStatusLabels = {
  sent: "E-mail enviado",
  failed: "Falha no e-mail",
  skipped: "Sem destinatarios",
  pending: "Envio pendente"
};

export const getConnectionAlertTypeLabel = eventType => {
  return eventType === "deleted" ? "Conexao deletada" : "Conexao desconectada";
};

export const getConnectionAlertReasonLabel = reason => {
  return reasonLabels[reason] || reason || "Motivo nao informado";
};

export const getConnectionAlertEmailStatusLabel = status => {
  return emailStatusLabels[status] || status || "Status desconhecido";
};

export const formatConnectionAlertTime = value => {
  if (!value) {
    return "-";
  }

  try {
    return format(parseISO(value), "dd/MM HH:mm");
  } catch (error) {
    return "-";
  }
};

export const getConnectionAlertCompanyName = alert => {
  if (alert?.company?.name) {
    return alert.company.name;
  }

  if (!alert?.metadata) {
    return "-";
  }

  try {
    const parsedMetadata = JSON.parse(alert.metadata);
    return parsedMetadata.companyName || "-";
  } catch (error) {
    return "-";
  }
};
