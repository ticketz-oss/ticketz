import Invoices from "../../models/Invoices";
import { payGatewayReceiptUrl } from "../PaymentGatewayServices/PaymentGatewayServices";
import { invoiceStatusLabel } from "./BillingAdminQuery";

export interface SerializedBillingInvoice {
  id: number;
  companyId: number;
  detail: string;
  value: number;
  currency: string;
  dueDate: string;
  status: string;
  situacao: string;
  origem: string;
  billingType: string;
  periodStart: string;
  periodEnd: string;
  paidAt: Date;
  createdAt: Date;
  forma: string;
  payGw: string;
  txId: string;
  paymentLink: string | null;
  receiptUrl: string | null;
  company: {
    id: number;
    name: string;
    email: string;
    phone: string;
    planId: number;
    planName: string | null;
  } | null;
}

export const serializeBillingInvoice = (
  invoice: Invoices
): SerializedBillingInvoice => ({
  id: invoice.id,
  companyId: invoice.companyId,
  detail: invoice.detail,
  value: Number(invoice.value) || 0,
  currency: invoice.currency || "BRL",
  dueDate: invoice.dueDate,
  status: invoice.status,
  // "situacao" é o status que o financeiro enxerga: separa vencido de aberto,
  // coisa que a coluna do banco não faz.
  situacao: invoiceStatusLabel(invoice.status, invoice.dueDate),
  origem: invoice.origem,
  billingType: invoice.billingType,
  periodStart: invoice.periodStart,
  periodEnd: invoice.periodEnd,
  paidAt: invoice.paidAt,
  createdAt: invoice.createdAt,
  forma: invoice.forma,
  payGw: invoice.payGw,
  txId: invoice.txId,
  paymentLink: invoice.linkPagamento || null,
  receiptUrl: payGatewayReceiptUrl(invoice),
  company: invoice.company
    ? {
        id: invoice.company.id,
        name: invoice.company.name,
        email: invoice.company.email,
        phone: invoice.company.phone,
        planId: invoice.company.planId,
        planName: invoice.company.plan?.name || null
      }
    : null
});
