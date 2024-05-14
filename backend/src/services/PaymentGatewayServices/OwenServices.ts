import { Request, Response } from "express";
import axios from "axios";
import GetSuperSettingService from "../SettingServices/GetSuperSettingService";
import { logger } from "../../utils/logger";
import { getIO } from "../../libs/socket";
import Invoices from "../../models/Invoices";
import Company from "../../models/Company";
import AppError from "../../errors/AppError";
import GetPublicSettingService from "../SettingServices/GetPublicSettingService";

const owenBaseURL = "https://pix.owenbrasil.com.br";

export const owenWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { data } = req.body;
  if (data.status === "APPROVED") {
    const { qrcodeId } = data;
    const invoice = await Invoices.findOne({
      where: {
        txId: qrcodeId,
        status: "open",
      },
      include: { model: Company, as: "company" }
    });
    
    if (!invoice || data.valor < invoice.value) {
      return res.json({ ok: true });
    }

    const expiresAt = new Date(invoice.company.dueDate);
    expiresAt.setDate(expiresAt.getDate() + 30);
    const date = expiresAt.toISOString().split("T")[0];

    await invoice.company.update({
      dueDate: date
    });
    await invoice.update({
      status: "paid"
    });
    await invoice.company.reload();
    const io = getIO();

    io.to(`company-${invoice.companyId}-mainchannel`)
      .to("super")
      .emit(`company-${invoice.companyId}-payment`, {
      action: "CONCLUIDA",
      company: invoice.company,
      invoiceId: invoice.id,
    });

  }
  return res.json({ ok: true });
}


export const owenCreateSubscription = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const {
    price,
    invoiceId
  } = req.body;

  const config = {
    params: {
      valor: price.toFixed([2]),
      minutos: 5,
      mensagem: `#Fatura:${invoiceId}`,
      user: await GetSuperSettingService({ key: "_owenCnpj" }),
      password: await GetSuperSettingService({ key: "_owenToken" }),
      secretkey: await GetSuperSettingService({ key: "_owenSecretKey" })
    }
  };

  try {
    const invoice = await Invoices.findByPk(invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }
    const qrResult = await axios.get( `${owenBaseURL}/api/v1/qrdinamico`, config);
    invoice.update({
      txId: qrResult.data.data.qrcodeId,
      payGw: "owen",
      payGwData: JSON.stringify(qrResult.data.data)
    });
    return res.json({
      qrcode: { qrcode: qrResult.data.data.qrcode },
      valor: { original: price }
    })
  } catch (error) {
    logger.error({ error }, "owenCreateSubscription error");
    throw new AppError("Problema encontrado, entre em contato com o suporte!", 400);
  }
};
