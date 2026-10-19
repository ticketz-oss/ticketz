import Company from "../../models/Company";
import Invoices from "../../models/Invoices";
import Plan from "../../models/Plan";
import PlatformApiError from "../../errors/PlatformApiError";

export const normalizePlanRef = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const tenantUrl = (slug: string): string => {
  const template = process.env.PLATFORM_TENANT_URL_TEMPLATE;
  if (template) return template.replace("{slug}", slug);
  const frontend = (
    process.env.FRONTEND_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
  try {
    const parsed = new URL(frontend);
    if (["localhost", "127.0.0.1"].includes(parsed.hostname)) return frontend;
    parsed.hostname = `${slug}.${parsed.hostname}`;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return frontend;
  }
};

export const centsToReais = (value: unknown): number => {
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new PlatformApiError(
      "validation_error",
      "Valor monetário deve ser um inteiro em centavos.",
      422
    );
  }
  return Number(value) / 100;
};

export const reaisToCents = (value: number | null): number =>
  Math.round(Number(value || 0) * 100);

export const planRef = (plan: Plan): string => normalizePlanRef(plan.name);

export const serializeTenant = (
  company: Company,
  plan: Plan,
  adminEmail?: string
): Record<string, unknown> => ({
  tenant_id: String(company.id),
  slug: company.slug,
  nome: company.name,
  whatsapp_mode: company.whatsappMode,
  status: company.platformStatus || (company.status ? "ativo" : "suspenso"),
  plano_ref: planRef(plan),
  ciclo: (company.recurrence || "MENSAL").toLowerCase(),
  vencimento: company.dueDate,
  dia_vencimento: company.dueDay,
  trial_dias: company.trialDays,
  trial_termina_em: company.trialEndsAt,
  url_acesso: tenantUrl(company.slug),
  email_admin: adminEmail || company.email,
  fuso_horario: company.timezone || null,
  criado_em: company.createdAt.toISOString(),
  faturamento: company.platformBilling || "sistema"
});

export const invoiceStatus = (invoice: Invoices): string => {
  if (invoice.status === "paid") return "pago";
  if (invoice.status === "cancelled") return "cancelado";
  if (
    invoice.status === "open" &&
    invoice.dueDate < new Date().toISOString().slice(0, 10)
  ) {
    return "vencido";
  }
  return "aberto";
};

export const internalInvoiceStatus = (status: string): string => {
  const map = {
    aberto: "open",
    pago: "paid",
    vencido: "open",
    cancelado: "cancelled"
  };
  return map[status] || "";
};

export const serializeInvoice = (
  invoice: Invoices
): Record<string, unknown> => ({
  lancamento_id: `inv_${invoice.id}`,
  external_ref: invoice.externalRef,
  tenant_id: String(invoice.companyId),
  competencia: invoice.competencia,
  descricao: invoice.detail,
  valor_centavos: reaisToCents(invoice.value),
  vencimento: invoice.dueDate,
  tipo_cobranca: invoice.billingType,
  periodo_inicio: invoice.periodStart,
  periodo_fim_exclusivo: invoice.periodEnd,
  ciclo: invoice.ciclo,
  forma: invoice.forma || "nenhuma",
  origem: invoice.origem || "sistema",
  status: invoiceStatus(invoice),
  pago_em: invoice.paidAt?.toISOString() || null,
  link_pagamento: invoice.linkPagamento || null,
  criado_em: invoice.createdAt.toISOString()
});

export const parseInvoiceId = (value: string): number => {
  const parsed = Number(String(value).replace(/^inv_/, ""));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
};
