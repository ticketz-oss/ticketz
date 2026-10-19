import moment from "moment";
import AppError from "../../errors/AppError";
import Invoices from "../../models/Invoices";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { SendMessage } from "../../helpers/SendMessage";
import { logger } from "../../utils/logger";

interface Request {
  invoice: Invoices;
  // Tenant dono da plataforma: é a conexão dele que fala com os clientes.
  fromCompanyId: number;
  number?: string;
  message?: string;
}

const formatValue = (value: number, currency: string): string => {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL"
    }).format(value);
  } catch {
    return `R$ ${value.toFixed(2)}`;
  }
};

// O telefone da empresa é digitado por humano e quase nunca traz o DDI. Sem o
// 55 o normalizePhone devolve o número cru e a mensagem vai para um JID
// inexistente, então completamos quando o formato é claramente nacional.
export const toWhatsAppNumber = (raw: string): string => {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
};

// Mensagem padrão da cobrança. O financeiro pode sobrescrever pelo campo de
// texto da tela; o link entra no fim quando existe.
export const defaultChargeMessage = (invoice: Invoices): string => {
  const value = formatValue(Number(invoice.value) || 0, invoice.currency);
  const due = moment(invoice.dueDate).format("DD/MM/YYYY");
  const name = invoice.company?.name;

  const lines = [
    `Olá${name ? `, ${name}` : ""}! 👋`,
    "",
    `Segue a cobrança referente a *${invoice.detail || "assinatura"}*.`,
    `*Valor:* ${value}`,
    `*Vencimento:* ${due}`
  ];

  if (invoice.linkPagamento) {
    lines.push("");
    lines.push(
      invoice.forma === "pix" ? "*PIX copia e cola:*" : "*Link para pagamento:*"
    );
    lines.push(invoice.linkPagamento);
  }

  return lines.join("\n");
};

const SendBillingChargeService = async ({
  invoice,
  fromCompanyId,
  number,
  message
}: Request): Promise<{ sentTo: string }> => {
  const target = toWhatsAppNumber(number || invoice.company?.phone || "");

  if (!target) {
    throw new AppError("ERR_NO_CLIENT_PHONE", 400);
  }

  const whatsapp = await GetDefaultWhatsApp(fromCompanyId);

  await SendMessage(whatsapp, {
    number: target,
    body: message?.trim() || defaultChargeMessage(invoice),
    linkPreview: false
  });

  logger.info(
    `[billing] cobranca ${invoice.id} enviada para ${target} (empresa ${invoice.companyId})`
  );

  return { sentTo: target };
};

export default SendBillingChargeService;
