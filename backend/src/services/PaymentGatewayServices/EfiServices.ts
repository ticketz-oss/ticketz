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
import EfiPay, { EfiCredentials } from "sdk-typescript-apis-efi";
import path from "path";
import moment from "moment";
import GetSuperSettingService from "../SettingServices/GetSuperSettingService";
import { logger } from "../../utils/logger";
import Invoices from "../../models/Invoices";
import Company from "../../models/Company";
import AppError from "../../errors/AppError";
import {
  processInvoiceExpired,
  processInvoicePaid
} from "./PaymentGatewayServices";

const webhookUrl = `${process.env.BACKEND_URL}/subscription/ticketz/webhook`;
const boletoWebhookUrl = `${process.env.BACKEND_URL}/subscription/ticketz/webhook/boleto`;

const privateFolder = __dirname.endsWith("/dist")
  ? path.resolve(__dirname, "..", "private")
  : path.resolve(__dirname, "..", "..", "..", "private");

// Opções para PIX (requer certificado mTLS)
async function getEfiOptions(): Promise<EfiCredentials> {
  const cert = `${privateFolder}/${await GetSuperSettingService({
    key: "_efiCertFile"
  })}`;

  return {
    sandbox: false,
    client_id: await GetSuperSettingService({ key: "_efiClientId" }),
    client_secret: await GetSuperSettingService({ key: "_efiClientSecret" }),
    pix_cert: cert,
    validateMtls: false
  };
}

// Opções para Boleto (OAuth2 puro, sem certificado mTLS)
// Usa credenciais de produção separadas configuradas no painel Efí
async function getEfiBoletoOptions(): Promise<EfiCredentials> {
  const clientId = await GetSuperSettingService({ key: "_efiBoletoClientId" });
  const clientSecret = await GetSuperSettingService({
    key: "_efiBoletoClientSecret"
  });

  // Fallback para as credenciais PIX se as de boleto não estiverem configuradas
  return {
    sandbox: false,
    client_id: clientId || (await GetSuperSettingService({ key: "_efiClientId" })),
    client_secret:
      clientSecret ||
      (await GetSuperSettingService({ key: "_efiClientSecret" }))
  };
}

const newEfiPayInstance = async () => {
  const efiOptions = await getEfiOptions();
  return new EfiPay(efiOptions);
};

const createWebHook = async (efiPay: EfiPay) => {
  const params = {
    chave: await GetSuperSettingService({ key: "_efiPixKey" })
  };

  const body = {
    webhookUrl
  };

  return efiPay.pixConfigWebhook(params, body).then(
    (ok: unknown) => {
      logger.info({ result: ok }, "pixConfigWebhook ok");
    },
    (error: unknown) => {
      logger.error({ result: error }, "pixConfigWebhook error:");
    }
  );
};

export const efiInitialize = async () => {
  const paymentGateway = await GetSuperSettingService({
    key: "_paymentGateway"
  });

  if (!webhookUrl.startsWith("https://")) {
    logger.debug("efiInitialize: only SSL webhooks are supported");
    return;
  }

  try {
    if (paymentGateway === "efi") {
      const efiOptions = await getEfiOptions();
      const efiPay = new EfiPay(efiOptions);
      const params = {
        chave: await GetSuperSettingService({ key: "_efiPixKey" })
      };

      efiPay.pixDetailWebhook(params).then(
        (hooks: { webhookUrl: string }) => {
          if (hooks?.webhookUrl !== webhookUrl) {
            createWebHook(efiPay);
          } else {
            logger.debug(
              { result: hooks },
              "efiInitialize: webhook correto já instalado"
            );
          }
        },
        (error: { nome: string }) => {
          if (error?.nome === "webhook_nao_encontrado") {
            createWebHook(efiPay);
          } else {
            logger.error(
              error,
              "efiInitialize: fail to verify current webhook"
            );
          }
        }
      );
    }
  } catch (error) {
    logger.error(error, "efiInitialize: ");
  }
};

export const efiWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { evento } = req.body;
  if (evento === "teste_webhook") {
    return res.json({ ok: true });
  }
  if (req.body.pix) {
    req.body.pix.forEach(
      async (pix: { status: string; txid: string; valor: number }) => {
        logger.debug(pix, "Processando pagamento PIX");

        const invoice = await Invoices.findOne({
          where: {
            txId: pix.txid,
            status: "open"
          },
          include: { model: Company, as: "company" }
        });

        if (!invoice) {
          logger.debug("efiWebhook: Invoice not found or already paid");
          return true;
        }

        if (pix.valor < invoice.value) {
          logger.debug("Recebido valor menor");
          return true;
        }

        await processInvoicePaid(invoice);
        return true;
      }
    );
  }

  return res.json({ ok: true });
};

// Boleto webhook: Efí envia POST com token, consultamos a notificação para obter status
export const efiBoletoWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { token } = req.body;

  if (!token) {
    return res.json({ ok: true });
  }

  try {
    const efiPay = await newEfiPayInstance();
    const notification = await (efiPay as any).getNotification({ token });

    if (!notification?.data) {
      return res.json({ ok: true });
    }

    for (const item of notification.data) {
      const chargeId = item.identifiers?.charge_id;
      if (!chargeId) continue;

      const isPaid =
        item.status?.current === "paid" || item.situation === "pago";

      if (!isPaid) continue;

      const invoice = await Invoices.findOne({
        where: { txId: String(chargeId), status: "open" },
        include: { model: Company, as: "company" }
      });

      if (!invoice) {
        logger.debug(
          `efiBoletoWebhook: invoice not found for chargeId ${chargeId}`
        );
        continue;
      }

      await processInvoicePaid(invoice);
    }
  } catch (error) {
    logger.error(error, "efiBoletoWebhook error");
  }

  return res.json({ ok: true });
};

export const efiCheckStatus = async (
  invoice: Invoices,
  efiPay: EfiPay = null
): Promise<boolean> => {
  try {
    if (!efiPay) {
      efiPay = await newEfiPayInstance();
    }

    const txDetail = await efiPay.pixDetailCharge({ txid: invoice.txId });

    if (txDetail.status === "ATIVA" || txDetail.status !== "CONCLUIDA") {
      return false;
    }

    const { pix } = txDetail;
    if (pix[0].valor >= invoice.value) {
      await processInvoicePaid(invoice);
      return true;
    }

    return false;
  } catch (error) {
    logger.error(error, "Error getting detail of txid");
  }

  return false;
};

export const efiCheckBoletoStatus = async (
  invoice: Invoices,
  efiPay: EfiPay = null
): Promise<boolean> => {
  try {
    if (!efiPay) {
      efiPay = await newEfiPayInstance();
    }

    const detail = await (efiPay as any).detailCharge({ id: Number(invoice.txId) });

    if (detail?.data?.status === "paid" || detail?.data?.situation === "pago") {
      await processInvoicePaid(invoice);
      return true;
    }

    return false;
  } catch (error) {
    logger.error(error, "efiCheckBoletoStatus: Error checking boleto status");
  }

  return false;
};

const efiPollCheckStatus = async (
  efiPay: EfiPay,
  invoice: Invoices,
  retries = 10,
  interval = 30000
) => {
  let attempts = 0;

  async function pollStatus(): Promise<void> {
    await invoice.reload();

    if (invoice.status === "paid") {
      logger.debug(
        `efiPollCheckStatus: Invoice ${invoice.id} already paid, finishing polling`
      );
      return;
    }

    const successful = await efiCheckStatus(invoice, efiPay);
    if (successful) {
      return;
    }

    attempts += 1;

    if (attempts >= retries) {
      processInvoiceExpired(invoice);
      return;
    }

    await new Promise(resolve => {
      setTimeout(resolve, interval);
    });
    await pollStatus();
  }

  return pollStatus();
};

// Polling para boleto: verifica até 2 dias (1440 tentativas * 2 min = 2880 min = 48h)
export const efiPollBoletStatus = async (
  invoice: Invoices,
  retries = 1440,
  interval = 120000
) => {
  let attempts = 0;

  async function pollStatus(): Promise<void> {
    await invoice.reload();

    if (invoice.status === "paid") {
      return;
    }

    const successful = await efiCheckBoletoStatus(invoice);
    if (successful) {
      return;
    }

    attempts += 1;

    if (attempts >= retries) {
      processInvoiceExpired(invoice);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, interval));
    await pollStatus();
  }

  return pollStatus();
};

export const efiCreateSubscription = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { price, invoiceId } = req.body;

  const body = {
    calendario: {
      expiracao: 300
    },
    valor: {
      original: (Number(price) || 0).toFixed(2)
    },
    chave: await GetSuperSettingService({ key: "_efiPixKey" }),
    solicitacaoPagador: `#Fatura:${invoiceId}`
  };
  const efiOptions = await getEfiOptions();
  try {
    const invoice = await Invoices.findByPk(invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    await efiInitialize();

    const efiPay = new EfiPay(efiOptions);
    const pix = await efiPay.pixCreateImmediateCharge([], body);
    await invoice.update({
      value: price,
      txId: pix.txid,
      payGw: "efi",
      payGwData: JSON.stringify(pix),
      paymentMethod: "pix"
    });

    await invoice.reload();

    efiPollCheckStatus(efiPay, invoice);

    return res.json({
      paymentMethod: "pix",
      qrcode: { qrcode: pix.pixCopiaECola },
      valor: { original: price }
    });
  } catch (error) {
    logger.error({ efiOptions, error }, "efiCreateSubscription error");
    throw new AppError(
      "Problema encontrado, entre em contato com o suporte!",
      400
    );
  }
};

export const efiCreateBoleto = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { price, invoiceId, cpfCnpj, customerName, customerEmail } = req.body;

  if (!cpfCnpj) {
    throw new AppError("CPF/CNPJ é obrigatório para emissão de boleto.", 400);
  }

  const efiOptions = await getEfiBoletoOptions();

  try {
    const invoice = await Invoices.findByPk(invoiceId, {
      include: { model: Company, as: "company" }
    });
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const efiPay = new EfiPay(efiOptions);

    const expireAt = moment().add(3, "days").format("YYYY-MM-DD");
    const valueInCents = Math.round(Number(price) * 100);

    const docClean = cpfCnpj.replace(/\D/g, "");
    const isCnpj = docClean.length === 14;

    // Efí exige nome com pelo menos duas palavras (nome + sobrenome)
    const ensureTwoWords = (name: string) => {
      const trimmed = (name || "").trim();
      return trimmed.includes(" ") ? trimmed : `${trimmed} Empresa`;
    };

    const rawName =
      customerName || invoice.company?.name || "Cliente Ticketz";

    const customer = isCnpj
      ? {
          juridical_person: {
            corporate_name: ensureTwoWords(rawName),
            cnpj: docClean
          },
          email: customerEmail || invoice.company?.email || ""
        }
      : {
          name: ensureTwoWords(rawName),
          cpf: docClean,
          email: customerEmail || invoice.company?.email || ""
        };

    const body = {
      items: [
        {
          name: invoice.detail || "Assinatura Ticketz",
          value: valueInCents,
          amount: 1
        }
      ],
      metadata: {
        notification_url: boletoWebhookUrl,
        custom_id: String(invoiceId)
      },
      payment: {
        banking_billet: {
          expire_at: expireAt,
          customer
        }
      }
    };

    const charge = await (efiPay as any).createOneStepCharge([], body);

    const chargeId = charge?.data?.charge?.id;
    const boletoUrl = charge?.data?.link || charge?.data?.billet_link || "";
    const boletoBarcode = charge?.data?.barcode || "";

    await invoice.update({
      value: price,
      txId: String(chargeId),
      payGw: "efi",
      payGwData: JSON.stringify(charge),
      paymentMethod: "boleto",
      boletoUrl,
      boletoBarcode
    });

    await invoice.reload();

    efiPollBoletStatus(invoice);

    return res.json({
      paymentMethod: "boleto",
      boletoUrl,
      boletoBarcode,
      valor: { original: price },
      expireAt
    });
  } catch (error) {
    logger.error(
      { clientId: efiOptions.client_id, error: (error as any)?.message || error },
      "efiCreateBoleto error"
    );
    throw new AppError(
      "Não foi possível gerar o boleto. Verifique os dados e tente novamente.",
      400
    );
  }
};
