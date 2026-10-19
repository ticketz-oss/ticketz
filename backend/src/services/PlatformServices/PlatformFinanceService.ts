/* eslint-disable @typescript-eslint/no-explicit-any */
import { UniqueConstraintError, Op } from "sequelize";
import sequelize from "../../database";
import PlatformApiError from "../../errors/PlatformApiError";
import Company from "../../models/Company";
import Invoices from "../../models/Invoices";
import { enqueueWebhook } from "./PlatformWebhookService";
import {
  centsToReais,
  internalInvoiceStatus,
  parseInvoiceId,
  serializeInvoice
} from "./PlatformSerializers";

const getCompany = async (id: string): Promise<Company> => {
  const company = await Company.findByPk(id);
  if (!company)
    throw new PlatformApiError(
      "tenant_not_found",
      "Tenant não encontrado.",
      404
    );
  return company;
};

const getInvoice = async (id: string): Promise<Invoices> => {
  const invoice = await Invoices.findByPk(parseInvoiceId(id));
  if (!invoice) {
    throw new PlatformApiError(
      "lancamento_not_found",
      "Lançamento não encontrado.",
      404
    );
  }
  return invoice;
};

const validateDate = (value: unknown, field: string): void => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new PlatformApiError("validation_error", "Dados inválidos.", 422, {
      campo: field
    });
  }
};

const immutable = (): never => {
  throw new PlatformApiError(
    "lancamento_imutavel",
    "Lançamento pago ou cancelado é imutável.",
    409
  );
};

export const listPlatformFinance = async (
  tenantId: string,
  query: Record<string, any>
): Promise<Record<string, unknown>> => {
  const company = await getCompany(tenantId);
  const page = Math.max(1, Number(query.page) || 1);
  const perPage = Math.min(100, Math.max(1, Number(query.per_page) || 50));
  const where: Record<string, any> = { companyId: company.id };
  if (query.competencia) where.competencia = query.competencia;
  if (query.status) {
    const internal = internalInvoiceStatus(query.status);
    if (!internal) {
      throw new PlatformApiError("validation_error", "Status inválido.", 422);
    }
    where.status = internal;
    if (query.status === "vencido")
      where.dueDate = { [Op.lt]: new Date().toISOString().slice(0, 10) };
    if (query.status === "aberto")
      where.dueDate = { [Op.gte]: new Date().toISOString().slice(0, 10) };
  }
  const { rows, count } = await Invoices.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: perPage,
    offset: (page - 1) * perPage
  });
  return {
    data: rows.map(serializeInvoice),
    page,
    per_page: perPage,
    total: count
  };
};

const createResponse = (invoice: Invoices): Record<string, unknown> => ({
  lancamento_id: `inv_${invoice.id}`,
  external_ref: invoice.externalRef,
  status: serializeInvoice(invoice).status,
  link_pagamento: invoice.linkPagamento || null,
  id_externo: `inv_${invoice.id}`
});

export const createPlatformFinance = async (
  tenantId: string,
  body: Record<string, any>
): Promise<{ statusCode: number; body: Record<string, unknown> }> => {
  const company = await getCompany(tenantId);
  const required = [
    "external_ref",
    "competencia",
    "descricao",
    "valor_centavos",
    "vencimento",
    "ciclo",
    "forma",
    "origem",
    "status"
  ];
  const missing = required.filter(
    field => body[field] === undefined || body[field] === ""
  );
  if (missing.length) {
    throw new PlatformApiError("validation_error", "Dados inválidos.", 422, {
      campos: missing
    });
  }
  validateDate(body.vencimento, "vencimento");
  if (!/^\d{4}-\d{2}$/.test(body.competencia)) {
    throw new PlatformApiError(
      "validation_error",
      "Competência inválida.",
      422
    );
  }
  if (!["plataforma", "sistema"].includes(body.origem)) {
    throw new PlatformApiError("validation_error", "Origem inválida.", 422);
  }
  const status = internalInvoiceStatus(body.status);
  if (!status)
    throw new PlatformApiError("validation_error", "Status inválido.", 422);
  const value = centsToReais(body.valor_centavos);

  const existing = await Invoices.findOne({
    where: { companyId: company.id, externalRef: String(body.external_ref) }
  });
  if (existing) return { statusCode: 200, body: createResponse(existing) };

  try {
    return await sequelize.transaction(async transaction => {
      const invoice = await Invoices.create(
        {
          detail: body.descricao,
          status,
          value,
          currency: "BRL",
          dueDate: body.vencimento,
          companyId: company.id,
          externalRef: String(body.external_ref),
          origem: body.origem,
          competencia: body.competencia,
          ciclo: body.ciclo,
          forma: body.forma,
          linkPagamento: body.link_pagamento || null,
          paidAt:
            status === "paid" ? new Date(body.pago_em || Date.now()) : null,
          txId: null,
          payGw: null,
          payGwData: null
        } as any,
        { transaction }
      );
      await enqueueWebhook(
        "fatura.criada",
        company.id,
        serializeInvoice(invoice),
        transaction
      );
      return { statusCode: 201, body: createResponse(invoice) };
    });
  } catch (error) {
    if (!(error instanceof UniqueConstraintError)) throw error;
    const duplicate = await Invoices.findOne({
      where: { companyId: company.id, externalRef: String(body.external_ref) }
    });
    if (!duplicate) throw error;
    return { statusCode: 200, body: createResponse(duplicate) };
  }
};

export const getPlatformFinance = async (
  id: string
): Promise<Record<string, unknown>> => {
  const invoice = await getInvoice(id);
  let gatewayData: Record<string, any> = {};
  try {
    gatewayData =
      typeof invoice.payGwData === "string"
        ? JSON.parse(invoice.payGwData)
        : invoice.payGwData || {};
  } catch {
    gatewayData = {};
  }
  return {
    ...serializeInvoice(invoice),
    tentativas: [],
    comprovante_url:
      gatewayData.comprovante_url || gatewayData.receiptUrl || null,
    nota_fiscal: null
  };
};

export const updatePlatformFinance = async (
  id: string,
  body: Record<string, any>
): Promise<Record<string, unknown>> => {
  const invoice = await getInvoice(id);
  if (invoice.status !== "open") immutable();
  if (body.vencimento !== undefined)
    validateDate(body.vencimento, "vencimento");
  if (body.status !== undefined && !["aberto", "pago"].includes(body.status)) {
    throw new PlatformApiError("validation_error", "Status inválido.", 422);
  }
  const changes: Record<string, unknown> = {};
  if (body.descricao !== undefined) changes.detail = body.descricao;
  if (body.valor_centavos !== undefined)
    changes.value = centsToReais(body.valor_centavos);
  if (body.vencimento !== undefined) changes.dueDate = body.vencimento;
  if (body.link_pagamento !== undefined)
    changes.linkPagamento = body.link_pagamento;
  if (body.forma !== undefined) changes.forma = body.forma;
  if (body.status === "pago") {
    changes.status = "paid";
    changes.paidAt = new Date(body.pago_em || Date.now());
  }

  await sequelize.transaction(async transaction => {
    const locked = await Invoices.findByPk(invoice.id, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!locked || locked.status !== "open") immutable();
    await locked.update(changes, { transaction });
    if (changes.status === "paid" && locked.origem === "sistema") {
      await enqueueWebhook(
        "fatura.paga",
        locked.companyId,
        {
          lancamento_id: `inv_${locked.id}`,
          external_ref: locked.externalRef,
          valor_centavos: Math.round(Number(locked.value) * 100),
          pago_em: locked.paidAt.toISOString(),
          forma: locked.forma,
          comprovante_url: null
        },
        transaction
      );
    }
  });
  return getPlatformFinance(id);
};

export const deletePlatformFinance = async (id: string): Promise<void> => {
  const invoice = await getInvoice(id);
  if (invoice.status !== "open") immutable();
  const deleted = await Invoices.destroy({
    where: { id: invoice.id, status: "open" }
  });
  if (!deleted) immutable();
};
