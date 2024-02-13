import { Request, Response } from "express";
import express from "express";
import * as Yup from "yup";
import EfiPay from "sdk-typescript-apis-efi";
import AppError from "../errors/AppError";

import options from "../config/Gn";
import Company from "../models/Company";
import Invoices from "../models/Invoices";
import { getIO } from "../libs/socket";
import { logger } from "../utils/logger";

const app = express();


const createWebHook = (efiPay: EfiPay) => {
	const params = {
	    chave: process.env.EFI_PIX_KEY,
	};
	
	const body = {
		webhookUrl: process.env.BACKEND_URL + '/subscription/webhook'
	}
	
	return efiPay.pixConfigWebhook(params, body).then(
		(ok) => {
			logger.info({ result: ok }, 'pixConfigWebhook ok');
		},
		(error: any) => {
			logger.error({ result: error }, 'pixConfigWebhook error:');
		}
	);
}

export const checkAndSetupWebhooks = () => {
    const efiPay = new EfiPay(options);
	const params = {
	    chave: process.env.EFI_PIX_KEY,
	};
	
    try {
	  if (JSON.parse(process.env.EFI_ENABLE_PIX)) {
		efiPay.pixDetailWebhook(params).then(
			(hooks: any) => {
			    if (hooks?.webhookUrl !== process.env.BACKEND_URL + '/subscription/webhook') {
					createWebHook(efiPay);
				} else {
					logger.info({ result: hooks }, 'checkAndSetupWebhooks: webhook correto já instalado');
				}
			},
			(error: any) => {
				if (error?.nome === 'webhook_nao_encontrado') {
					createWebHook(efiPay);
				} else {
					throw error;
				}
			}
		);
	  }
    } catch (error) {
		logger.error({ result: error }, 'checkAndSetupWebhooks:');
	}
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const efiPay = new EfiPay(options);
  return res.json(efiPay.getSubscriptions());
};

export const createSubscription = async (
  req: Request,
  res: Response
  ): Promise<Response> => {
    const efiPay = new EfiPay(options);
    const { companyId } = req.user;

  const schema = Yup.object().shape({
    price: Yup.string().required(),
    users: Yup.string().required(),
    connections: Yup.string().required()
  });

  if (!(await schema.isValid(req.body))) {
    
    throw new AppError("Validation fails", 400);
  }

  const {
    firstName,
    price,
    users,
    connections,
    address2,
    city,
    state,
    zipcode,
    country,
    plan,
    invoiceId
  } = req.body;

  const body = {
    calendario: {
      expiracao: 3600
    },
    valor: {
      original: price.toLocaleString("pt-br", { minimumFractionDigits: 2 }).replace(",", ".")
    },
    chave: process.env.EFI_PIX_KEY,
    solicitacaoPagador: `#Fatura:${invoiceId}`
    };
  try {
    const pix = await efiPay.pixCreateImmediateCharge([], body);
    
    const qrcode = await efiPay.pixGenerateQRCode({
      id: pix.loc.id
    });

    const updateCompany = await Company.findOne();

    if (!updateCompany) {
      throw new AppError("Company not found", 404);
    }

    return res.json({
      ...pix,
      qrcode,

    });
  } catch (error) {
    logger.error('createSubscription error:', error);
    throw new AppError("Problema encontrado, entre em contato com o suporte!", 400);
  }
};

export const webhook = async (
  req: Request,
  res: Response
  ): Promise<Response> => {
  const { type } = req.params;
  const { evento } = req.body;
  if (evento === "teste_webhook") {
    return res.json({ ok: true });
  }
  if (req.body.pix) {
	logger.info({ request: req }, "informação sobre PIX recebida por webhoook");
    const efiPay = new EfiPay(options);
    req.body.pix.forEach(async (pix: any) => {
      const detalhe = await efiPay.pixDetailCharge({
        txid: pix.txid
      });

      if (detalhe.status === "CONCLUIDA") {
        const { solicitacaoPagador } = detalhe;
        const invoiceID = solicitacaoPagador.replace("#Fatura:", "");
        const invoices = await Invoices.findByPk(invoiceID);
        const companyId =invoices.companyId;
        const company = await Company.findByPk(companyId);

        const expiresAt = new Date(company.dueDate);
        expiresAt.setDate(expiresAt.getDate() + 30);
        const date = expiresAt.toISOString().split("T")[0];

        if (company) {
          await company.update({
            dueDate: date
          });
         const invoi = await invoices.update({
            id: invoiceID,
            status: 'paid'
          });
          await company.reload();
          const io = getIO();
          const companyUpdate = await Company.findOne({
            where: {
              id: companyId
            }
          });

          io.emit(`company-${companyId}-payment`, {
            action: detalhe.status,
            company: companyUpdate
          });
        }

      }
    });

  }

  return res.json({ ok: true });
};
