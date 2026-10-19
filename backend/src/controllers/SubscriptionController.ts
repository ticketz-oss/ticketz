import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import {
  payGatewayCreateSubscription,
  payGatewayReceiveWebhook
} from "../services/PaymentGatewayServices/PaymentGatewayServices";
import {
  abacateQuote,
  abacateSimulatePayment
} from "../services/PaymentGatewayServices/AbacatePayServices";
import Invoices from "../models/Invoices";

export const createSubscription = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const schema = Yup.object().shape({
    invoiceId: Yup.mixed().required(),
    method: Yup.string().oneOf(["pix", "card", "boleto"]),
    installments: Yup.number(),
    taxId: Yup.string()
  });

  if (!(await schema.isValid(req.body))) {
    throw new AppError("Validation fails", 400);
  }

  return payGatewayCreateSubscription(req, res);
};

// Retorna a cotação (valor + taxa por método) de uma fatura, para exibir os
// totais na tela de pagamento.
export const quote = async (req: Request, res: Response): Promise<Response> => {
  const { invoiceId } = req.params;

  const invoice = await Invoices.findOne({
    where: { id: invoiceId, companyId: req.user.companyId }
  });
  if (!invoice) {
    throw new AppError("Invoice not found", 404);
  }

  const result = await abacateQuote(Number(invoice.value) || 0);
  return res.json(result);
};

// Simula o pagamento de uma fatura (somente dev mode da AbacatePay).
export const simulate = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { invoiceId } = req.params;

  const invoice = await Invoices.findOne({
    where: { id: invoiceId, companyId: req.user.companyId }
  });
  if (!invoice || !invoice.txId) {
    throw new AppError("Invoice not found or without charge", 404);
  }

  const paid = await abacateSimulatePayment(invoice);
  return res.json({ ok: true, paid });
};

export const webhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  return payGatewayReceiveWebhook(req, res);
};
