import { Request, Response } from "express";
import EfiPay, { EfiCredentials } from "sdk-typescript-apis-efi";
import path from "path";
import GetSuperSettingService from "../SettingServices/GetSuperSettingService";
import { logger } from "../../utils/logger";
import { getIO } from "../../libs/socket";
import Invoices from "../../models/Invoices";
import Company from "../../models/Company";
import AppError from "../../errors/AppError";

const webhookUrl = `${process.env.BACKEND_URL}/subscription/ticketz/webhook`;

async function getEfiOptions(): Promise<EfiCredentials> {
  const cert = path.join(
    __dirname,
    `../../../private/${await GetSuperSettingService({ key: "_efiCertFile"})}`
  );

  return {
    sandbox: false,
    client_id: await GetSuperSettingService({ key: "_efiClientId" }),
    client_secret: await GetSuperSettingService({ key: "_efiClientSecret" }),
    pix_cert: cert,
    validateMtls: false,
  }
}

const createWebHook = async (efiPay: EfiPay) => {
  const params = {
    chave: await GetSuperSettingService({ key: "_efiPixKey" }),
  };

  const body = {
    webhookUrl
  }

  return efiPay.pixConfigWebhook(params, body).then(
    (ok: unknown) => {
      logger.info({ result: ok }, "pixConfigWebhook ok");
    },
    (error: unknown) => {
      logger.error({ result: error }, "pixConfigWebhook error:");
    }
  );
}

export const efiInitialize = async () => {
  const paymentGateway = await GetSuperSettingService({ key: "_paymentGateway" });

  try {
    if (paymentGateway === "efi") {
      const efiOptions = await getEfiOptions();
      const efiPay = new EfiPay(efiOptions);
      const params = {
        chave: await GetSuperSettingService({ key: "_efiPixKey" }),
      };

      efiPay.pixDetailWebhook(params).then(
        (hooks: { webhookUrl: string; }) => {
          if (hooks?.webhookUrl !== webhookUrl) {
            createWebHook(efiPay);
          } else {
            logger.info({ result: hooks }, "checkAndSetupWebhooks: webhook correto já instalado");
          }
        },
        (error: { nome: string; }) => {
          if (error?.nome === "webhook_nao_encontrado") {
            createWebHook(efiPay);
          } else {
            logger.error(error, "Fail to verify current Efí webhook");
          }
        }
      );
    }
  } catch (error) {
    logger.error(error, "checkAndSetupWebhooks: ");
  }
}

export const efiWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { evento } = req.body;
  if (evento === "teste_webhook") {
    return res.json({ ok: true });
  }
  if (req.body.pix) {
    req.body.pix.forEach( async (pix: { status: string; txid: string; valor: number; }) => {
      logger.debug( pix, "Processando pagamento");

      const invoice = await Invoices.findOne({
        where: {
          txId: pix.txid,
          status: "open",
        },
        include: { model: Company, as: "company" }
      });
      
      if (!invoice || pix.valor < invoice.value) {
        logger.debug( "Recebido valor menor" );
        return true;
      }
  
      const expiresAt = new Date(invoice.company.dueDate);
      expiresAt.setDate(expiresAt.getDate() + 30);
      const date = expiresAt.toISOString().split("T")[0];

      if (invoice.company) {
        await invoice.company.update({
          dueDate: date
        });
        await invoice.update({
          status: "paid"
        });
        await invoice.company.reload();
        const io = getIO();

        io.emit(`company-${invoice.companyId}-payment`, {
          action: "CONCLUIDA",
          company: invoice.company
        });
      }
      
      return true;
    });
  }

  return res.json({ ok: true });
};


export const efiCreateSubscription = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const {
    price,
    invoiceId
  } = req.body;

  const body = {
    calendario: {
      expiracao: 3600
    },
    valor: {
      original: price.toLocaleString("pt-br", { minimumFractionDigits: 2 }).replace(",", ".")
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
    const efiPay = new EfiPay(efiOptions);
    const pix = await efiPay.pixCreateImmediateCharge([], body);
    invoice.update({
      txId: pix.txid,
      payGw: "efi",
      payGwData: JSON.stringify(pix)
    });

    return res.json({
      qrcode: { qrcode: pix.pixCopiaECola },
      valor: { original: price }
    });
  } catch (error) {
    logger.error({ efiOptions, error }, "efiCreateSubscription error");
    throw new AppError("Problema encontrado, entre em contato com o suporte!", 400);
  }
};
