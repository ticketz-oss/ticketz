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
  efiCheckStatus,
  efiCreateSubscription,
  efiInitialize,
  efiWebhook
} from "./EfiServices";
import {
  owenCheckStatus,
  owenCreateSubscription,
  owenWebhook
} from "./OwenServices";
import Invoices from "../../models/Invoices";
import { getIO } from "../../libs/socket";
import Company from "../../models/Company";

export const payGatewayInitialize = async () => {
  const paymentGateway = await GetSuperSettingService({
    key: "_paymentGateway"
  });

  if (paymentGateway === "efi") {
    return efiInitialize();
  }
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
};

export const payGatewayReceiveWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const paymentGateway = await GetSuperSettingService({
    key: "_paymentGateway"
  });

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
};

export const processInvoicePaid = async (invoice: Invoices) => {
  const company =
    invoice.company || (await Company.findByPk(invoice.companyId));

  if (company) {
    const currentDueDate = moment(company.dueDate);
    let { dueDate } = company;

    switch (company.recurrence) {
      case "BIMESTRAL":
        dueDate = currentDueDate.add(2, "month").format("YYYY-MM-DD");
        break;
      case "TRIMESTRAL":
        dueDate = currentDueDate.add(3, "month").format("YYYY-MM-DD");
        break;
      case "SEMESTRAL":
        dueDate = currentDueDate.add(6, "month").format("YYYY-MM-DD");
        break;
      case "ANUAL":
        dueDate = currentDueDate.add(12, "month").format("YYYY-MM-DD");
        break;
      case "MENSAL":
      default:
        dueDate = currentDueDate.add(1, "month").format("YYYY-MM-DD");
        break;
    }

    await company.update({
      dueDate
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
        invoiceId: invoice.id
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
  if (invoice.payGw === "efi") {
    efiCheckStatus(invoice);
  } else if (invoice.payGw === "owen") {
    owenCheckStatus(invoice);
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
