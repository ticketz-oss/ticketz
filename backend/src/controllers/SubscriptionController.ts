import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import { payGatewayCreateSubscription, payGatewayReceiveWebhook } from "../services/PaymentGatewayServices/PaymentGatewayServices";

export const createSubscription = async (
  req: Request,
  res: Response
): Promise<Response> => {

  const schema = Yup.object().shape({
    price: Yup.string().required(),
    users: Yup.string().required(),
    connections: Yup.string().required()
  });

  if (!(await schema.isValid(req.body))) {
    throw new AppError("Validation fails", 400);
  }

  return payGatewayCreateSubscription(req, res);
}

export const webhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  return payGatewayReceiveWebhook(req, res);
}
