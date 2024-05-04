import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import GetSuperSettingService from "../services/SettingServices/GetSuperSettingService";
import { efiCreateSubscription, efiWebhook } from "../services/PaymentGatewayServices/EfiServices";
import { owenCreateSubscription, owenWebhook } from "../services/PaymentGatewayServices/OwenServices";

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

  const paymentGateway = await GetSuperSettingService({ key: "_paymentGateway" });

  switch (paymentGateway) {
    case "efi": {
      return efiCreateSubscription(req, res);
    }    
    case "owen": {
      return owenCreateSubscription(req, res);
    }    
    default: {
      throw new AppError("Unsupported payment gateway", 400);
    }
  }

}

export const webhook = async (
  req: Request,
  res: Response
): Promise<Response> => {

  const paymentGateway = await GetSuperSettingService({ key: "_paymentGateway" });

  switch (paymentGateway) {
    case "efi": {
      return efiWebhook(req, res);
    }    
    case "owen": {
      return owenWebhook(req, res);
    }    
    default: {
      throw new AppError("Unsupported payment gateway", 400);
    }
  }
}
