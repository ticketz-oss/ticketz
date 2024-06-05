import AppError from "../../errors/AppError";
import GetSuperSettingService from "../SettingServices/GetSuperSettingService";
import { efiCheckStatus, efiCreateSubscription, efiInitialize, efiWebhook } from "./EfiServices";
import { Request, Response } from "express";
import { owenCreateSubscription, owenWebhook } from "./OwenServices";
import Invoices from "../../models/Invoices";
import { getIO } from "../../libs/socket";
import { Op } from "sequelize";
import Company from "../../models/Company";

export const payGatewayInitialize = async () => {
  const paymentGateway = await GetSuperSettingService({ key: "_paymentGateway" });

  if (paymentGateway === "efi") {
    return efiInitialize();
  }
  throw new AppError("Unsupported payment gateway", 400);
}

export const payGatewayCreateSubscription = async (req: Request, res: Response): Promise<Response> => {
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

export const payGatewayReceiveWebhook = async (req: Request, res: Response): Promise<Response> => {
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

export const processInvoicePaid = async (invoice: Invoices) => {
  const company = invoice.company || await Company.findByPk(invoice.companyId);
  
  if (company) {
    const expiresAt = new Date(company.dueDate);
    expiresAt.setDate(expiresAt.getDate() + 30);
    const date = expiresAt.toISOString().split("T")[0];

    await company.update({
      dueDate: date
    });
    await invoice.update({
      status: "paid"
    });
    await company.reload();
    const io = getIO();

    io.to(`company-${invoice.companyId}-mainchannel`)
      .to("super")
      .emit(`company-${invoice.companyId}-payment`, {
      action: "CONCLUIDA",
      company,
      invoiceId: invoice.id,
    });
  }
}

export const processInvoiceExpired = async (invoice: Invoices) => {
  const io = getIO();
  
  await invoice.update({
    txId: null,
    payGw: null,
    payGwData: null,
  });
  
  await invoice.reload();
  
  io.to(`company-${invoice.companyId}-mainchannel`)
    .to("super")
    .emit(`company-${invoice.companyId}-payment`, {
    action: "EXPIRADA",
    company: invoice.company || await Invoices.findByPk(invoice.companyId) ,
    invoiceId: invoice.id,
  });
}

export const checkInvoicePayment = async (invoice: Invoices) => {
  if (invoice.payGw === "efi") {
    efiCheckStatus(invoice);
  }
} 

export const checkOpenInvoices = async () => {
  const invoices = await Invoices.findAll({
    where: {
      status: "open",
      txId: {
        [Op.or]: [
          { [Op.not]: "" },
          { [Op.not]: null }
        ],
      }
    },
    include: { model: Company, as: "company" }
  });
  
  invoices.forEach( (invoice) => {
    checkInvoicePayment(invoice);
  });
}