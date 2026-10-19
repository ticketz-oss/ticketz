/*

   DO NOT REMOVE / NÃO REMOVER

   VERSÃO EM PORTUGUÊS MAIS ABAIXO

   
   BASIC LICENSE INFORMATION:

   Author: Claudemir Todo Bom
   Email: claudemir@todobom.com
   
   Licensed under the AGPLv3 as stated on LICENSE.md file
   
   Any work that uses code from this file is obligated to 
   give access to its source code to all of its users (not only
   the system's owner running it)
   
   EXCLUSIVE LICENSE to use on closed source derived work can be
   purchased from the author and put at the root of the source
   code tree as proof-of-purchase.



   INFORMAÇÕES BÁSICAS DE LICENÇA

   Autor: Claudemir Todo Bom
   Email: claudemir@todobom.com

   Licenciado sob a licença AGPLv3 conforme arquivo LICENSE.md
    
   Qualquer sistema que inclua este código deve ter o seu código
   fonte fornecido a todos os usuários do sistema (não apenas ao
   proprietário da infraestrutura que o executa)
   
   LICENÇA EXCLUSIVA para uso em produto derivado em código fechado
   pode ser adquirida com o autor e colocada na raiz do projeto
   como prova de compra. 
   
 */

import { Request, Response } from "express";
import { Op } from "sequelize";
import moment from "moment";
import AppError from "../../errors/AppError";
import GetSuperSettingService from "../SettingServices/GetSuperSettingService";
import {
  AbacateChargeResult,
  abacateCheckStatus,
  abacateCreateCharge,
  abacateCreateSubscription,
  abacateReceiptUrl,
  abacateWebhook,
  PaymentMethod
} from "./AbacatePayServices";
import Invoices from "../../models/Invoices";
import { getIO } from "../../libs/socket";
import Company from "../../models/Company";
import AccrualPartnerPayoutService from "../PartnerServices/AccrualPartnerPayoutService";
import SendPartnerPayoutsService from "../PartnerServices/SendPartnerPayoutsService";
import { logger } from "../../utils/logger";
import sequelize from "../../database";
import { enqueueWebhook } from "../PlatformServices/PlatformWebhookService";
import { dueDateAfterPayment } from "../BillingServices/BillingDateService";

export const payGatewayInitialize = async () => {
  // AbacatePay não requer inicialização de webhook via API (configurado no
  // painel). Mantido para compatibilidade com o boot do servidor.
  return null;
};

export const payGatewayCreateSubscription = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const paymentGateway = await GetSuperSettingService({
    key: "_paymentGateway"
  });

  switch (paymentGateway) {
    case "abacatepay": {
      return abacateCreateSubscription(req, res);
    }
    default: {
      throw new AppError("Unsupported payment gateway", 400);
    }
  }
};

// Cria a cobrança de uma fatura arbitrária (usado pela Central de Cobrança,
// que lança cobranças em nome de outros tenants).
export const payGatewayCreateCharge = async (
  invoice: Invoices,
  method: PaymentMethod,
  taxId?: string
): Promise<AbacateChargeResult> => {
  const paymentGateway = await GetSuperSettingService({
    key: "_paymentGateway"
  });

  switch (paymentGateway) {
    case "abacatepay": {
      return abacateCreateCharge(invoice, method, taxId);
    }
    default: {
      throw new AppError("ERR_PAYMENT_GATEWAY_NOT_CONFIGURED", 400);
    }
  }
};

export const payGatewayReceiptUrl = (invoice: Invoices): string | null => {
  if (invoice.payGw === "abacatepay") return abacateReceiptUrl(invoice);
  return null;
};

export const payGatewayReceiveWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const paymentGateway = await GetSuperSettingService({
    key: "_paymentGateway"
  });

  switch (paymentGateway) {
    case "abacatepay": {
      return abacateWebhook(req, res);
    }
    default: {
      throw new AppError("Unsupported payment gateway", 400);
    }
  }
};

export const processInvoicePaid = async (invoice: Invoices) => {
  let company: Company | null = null;
  let processedInvoice: Invoices | null = null;

  await sequelize.transaction(async transaction => {
    const lockedInvoice = await Invoices.findByPk(invoice.id, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!lockedInvoice) return;

    if (lockedInvoice.status === "paid") {
      processedInvoice = lockedInvoice;
      company = await Company.findByPk(lockedInvoice.companyId, {
        transaction
      });
      return;
    }

    company = await Company.findByPk(lockedInvoice.companyId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!company) return;

    const dueDay = company.dueDay || moment.utc(company.dueDate).date();
    const dueDate = dueDateAfterPayment({
      billingType: lockedInvoice.billingType,
      periodEnd: lockedInvoice.periodEnd,
      currentDueDate: company.dueDate,
      dueDay,
      recurrence: company.recurrence
    });

    await company.update({ dueDate }, { transaction });
    await lockedInvoice.update(
      { status: "paid", paidAt: new Date() },
      { transaction }
    );
    processedInvoice = lockedInvoice;

    if (["sistema", "manual"].includes(lockedInvoice.origem)) {
      await enqueueWebhook(
        "fatura.paga",
        lockedInvoice.companyId,
        {
          lancamento_id: `inv_${lockedInvoice.id}`,
          external_ref: lockedInvoice.externalRef,
          valor_centavos: Math.round(Number(lockedInvoice.value) * 100),
          pago_em: lockedInvoice.paidAt.toISOString(),
          forma: lockedInvoice.forma,
          comprovante_url: null
        },
        transaction
      );
    }
  });

  if (company && processedInvoice) {
    await company.reload();

    if (company.partnerId) {
      // O accrual e idempotente (invoiceId unico), entao um replay do webhook
      // nao gera segunda comissao.
      const payout = await AccrualPartnerPayoutService(processedInvoice);

      if (payout?.mode === "immediate" && payout.status === "pending") {
        // Dispara sem await: a fila a cada 5 min e a rede de seguranca.
        SendPartnerPayoutsService({ partnerId: payout.partnerId }).catch(
          error => {
            logger.error(
              `[partnerPayouts] envio imediato falhou para o parceiro ${payout.partnerId}: ${error?.message}`
            );
          }
        );
      }
    }

    const io = getIO();

    io.to(`company-${processedInvoice.companyId}-mainchannel`)
      .to("super")
      .emit(`company-${processedInvoice.companyId}-payment`, {
        action: "CONCLUIDA",
        company,
        invoiceId: processedInvoice.id
      });
  }
};

export const processInvoiceExpired = async (invoice: Invoices) => {
  const io = getIO();

  await invoice.update({
    txId: null,
    payGw: null,
    payGwData: null
  });

  await invoice.reload();

  io.to(`company-${invoice.companyId}-mainchannel`)
    .to("super")
    .emit(`company-${invoice.companyId}-payment`, {
      action: "EXPIRADA",
      company: invoice.company || (await Invoices.findByPk(invoice.companyId)),
      invoiceId: invoice.id
    });
};

export const checkInvoicePayment = async (invoice: Invoices) => {
  if (invoice.payGw === "abacatepay") {
    abacateCheckStatus(invoice);
  }
};

export const checkOpenInvoices = async () => {
  const invoices = await Invoices.findAll({
    where: {
      status: "open",
      txId: {
        [Op.or]: [{ [Op.not]: "" }, { [Op.not]: null }]
      }
    },
    include: { model: Company, as: "company" }
  });

  invoices.forEach(invoice => {
    checkInvoicePayment(invoice);
  });
};
