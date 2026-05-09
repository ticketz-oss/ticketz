import axios, { AxiosInstance } from "axios";
import { Request, Response } from "express";
import moment from "moment";
import GetSuperSettingService from "../SettingServices/GetSuperSettingService";
import { logger } from "../../utils/logger";
import Invoices from "../../models/Invoices";
import Company from "../../models/Company";
import AppError from "../../errors/AppError";
import {
  processInvoicePaid,
  processInvoiceExpired
} from "./PaymentGatewayServices";

async function getAsaasApi(): Promise<{ api: AxiosInstance; sandbox: boolean }> {
  const apiKey = await GetSuperSettingService({ key: "_asaasApiKey" });
  const sandbox =
    (await GetSuperSettingService({ key: "_asaasSandbox" })) === "true";

  const baseUrl = sandbox
    ? "https://sandbox.asaas.com/api/v3"
    : "https://www.asaas.com/api/v3";

  const api = axios.create({
    baseURL: baseUrl,
    headers: { access_token: apiKey, "Content-Type": "application/json" },
    timeout: 30000
  });

  return { api, sandbox };
}

async function findOrCreateCustomer(
  api: AxiosInstance,
  name: string,
  cpfCnpj: string,
  email: string
): Promise<string> {
  const doc = cpfCnpj.replace(/\D/g, "");

  const search = await api.get("/customers", { params: { cpfCnpj: doc } });
  if (search.data?.data?.length > 0) {
    return search.data.data[0].id;
  }

  const ensureTwoWords = (n: string) => {
    const t = (n || "").trim();
    return t.includes(" ") ? t : `${t} Empresa`;
  };

  const customer = await api.post("/customers", {
    name: ensureTwoWords(name),
    cpfCnpj: doc,
    email: email || "",
    notificationDisabled: true
  });

  return customer.data.id;
}

export const asaasCheckStatus = async (
  invoice: Invoices
): Promise<boolean> => {
  try {
    const { api } = await getAsaasApi();
    const detail = await api.get(`/payments/${invoice.txId}`);
    const status: string = detail.data?.status || "";

    if (["RECEIVED", "CONFIRMED"].includes(status)) {
      await processInvoicePaid(invoice);
      return true;
    }

    return false;
  } catch (error) {
    logger.error(error, "asaasCheckStatus error");
    return false;
  }
};

export const asaasPollStatus = async (
  invoice: Invoices,
  retries = 1440,
  interval = 120000
): Promise<void> => {
  let attempts = 0;

  async function poll(): Promise<void> {
    await invoice.reload();
    if (invoice.status === "paid") return;

    const paid = await asaasCheckStatus(invoice);
    if (paid) return;

    attempts += 1;
    if (attempts >= retries) {
      processInvoiceExpired(invoice);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, interval));
    return poll();
  }

  return poll();
};

export const asaasCreatePix = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { price, invoiceId } = req.body;

  const invoice = await Invoices.findByPk(invoiceId, {
    include: { model: Company, as: "company" }
  });
  if (!invoice) throw new AppError("Invoice not found", 404);

  const { api } = await getAsaasApi();

  try {
    const company = invoice.company as any;
    const cpfCnpj = company?.document || company?.cnpj || "00000000000000";
    const customerId = await findOrCreateCustomer(
      api,
      company?.name || "Cliente",
      cpfCnpj,
      company?.email || ""
    );

    const payment = await api.post("/payments", {
      customer: customerId,
      billingType: "PIX",
      value: Number(price),
      dueDate: moment().add(1, "day").format("YYYY-MM-DD"),
      description: invoice.detail || `Fatura #${invoiceId}`,
      externalReference: String(invoiceId)
    });

    const paymentId: string = payment.data.id;
    const qrCode = await api.get(`/payments/${paymentId}/pixQrCode`);

    await invoice.update({
      value: price,
      txId: paymentId,
      payGw: "asaas",
      payGwData: JSON.stringify(payment.data),
      paymentMethod: "pix"
    });

    await invoice.reload();
    asaasPollStatus(invoice);

    return res.json({
      paymentMethod: "pix",
      qrcode: { qrcode: qrCode.data.payload },
      valor: { original: price }
    });
  } catch (error) {
    logger.error(
      { error: (error as any)?.response?.data || error },
      "asaasCreatePix error"
    );
    throw new AppError("Erro ao gerar PIX. Verifique as configurações do Asaas.", 400);
  }
};

export const asaasCreateBoleto = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { price, invoiceId, cpfCnpj, customerName, customerEmail } = req.body;

  if (!cpfCnpj) {
    throw new AppError("CPF/CNPJ é obrigatório para emissão de boleto.", 400);
  }

  const invoice = await Invoices.findByPk(invoiceId, {
    include: { model: Company, as: "company" }
  });
  if (!invoice) throw new AppError("Invoice not found", 404);

  const { api } = await getAsaasApi();

  try {
    const company = invoice.company as any;
    const customerId = await findOrCreateCustomer(
      api,
      customerName || company?.name || "Cliente",
      cpfCnpj,
      customerEmail || company?.email || ""
    );

    const expireAt = moment().add(3, "days").format("YYYY-MM-DD");

    const payment = await api.post("/payments", {
      customer: customerId,
      billingType: "BOLETO",
      value: Number(price),
      dueDate: expireAt,
      description: invoice.detail || `Fatura #${invoiceId}`,
      externalReference: String(invoiceId)
    });

    const paymentId: string = payment.data.id;
    const boletoUrl =
      payment.data.bankSlipUrl || payment.data.invoiceUrl || "";
    const boletoBarcode = payment.data.nossoNumero || "";

    await invoice.update({
      value: price,
      txId: paymentId,
      payGw: "asaas",
      payGwData: JSON.stringify(payment.data),
      paymentMethod: "boleto",
      boletoUrl,
      boletoBarcode
    });

    await invoice.reload();
    asaasPollStatus(invoice);

    return res.json({
      paymentMethod: "boleto",
      boletoUrl,
      boletoBarcode,
      valor: { original: price },
      expireAt
    });
  } catch (error) {
    logger.error(
      { error: (error as any)?.response?.data || error },
      "asaasCreateBoleto error"
    );
    throw new AppError(
      "Erro ao gerar boleto. Verifique as configurações do Asaas.",
      400
    );
  }
};

export const asaasWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { event, payment } = req.body;

  if (!event || !payment) return res.json({ ok: true });

  if (!["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"].includes(event)) {
    return res.json({ ok: true });
  }

  const invoice = await Invoices.findOne({
    where: { txId: payment.id, status: "open" },
    include: { model: Company, as: "company" }
  });

  if (invoice) {
    await processInvoicePaid(invoice);
  } else if (payment.externalReference) {
    const byRef = await Invoices.findOne({
      where: { id: payment.externalReference, status: "open" },
      include: { model: Company, as: "company" }
    });
    if (byRef) await processInvoicePaid(byRef);
  }

  return res.json({ ok: true });
};

export const asaasEmitNfse = async (
  invoice: Invoices,
  company: Company
): Promise<void> => {
  try {
    const [apiKey, sandbox, serviceDesc, serviceCode, issRate] =
      await Promise.all([
        GetSuperSettingService({ key: "_asaasApiKey" }),
        GetSuperSettingService({ key: "_asaasSandbox" }),
        GetSuperSettingService({ key: "_asaasNfseServiceDesc" }),
        GetSuperSettingService({ key: "_asaasNfseServiceCode" }),
        GetSuperSettingService({ key: "_asaasNfseIssRate" })
      ]);

    if (!apiKey) {
      logger.debug("asaasEmitNfse: Asaas não configurado, pulando emissão");
      return;
    }

    const baseUrl =
      sandbox === "true"
        ? "https://sandbox.asaas.com/api/v3"
        : "https://www.asaas.com/api/v3";

    const api = axios.create({
      baseURL: baseUrl,
      headers: { access_token: apiKey, "Content-Type": "application/json" },
      timeout: 30000
    });

    const valor = Number(invoice.value);

    const body: Record<string, any> = {
      serviceDescription:
        serviceDesc || `Licença de uso de software SaaS - Fatura #${invoice.id}`,
      value: valor,
      deductions: 0,
      observations: `Fatura #${invoice.id}`,
      taxes: {
        retainIss: false,
        iss: Number(issRate) || 0
      }
    };

    if (serviceCode) {
      body.municipalServiceId = serviceCode;
    }

    // Vincula ao pagamento Asaas se disponível
    if (invoice.payGw === "asaas" && invoice.txId) {
      body.payment = invoice.txId;
    } else {
      // NFS-e avulsa: precisa do cliente
      const doc = (company as any).document?.replace(/\D/g, "") || "";
      if (doc) {
        const isCnpj = doc.length === 14;
        body.customer = {
          name: company.name || "Cliente",
          [isCnpj ? "cnpj" : "cpf"]: doc,
          email: company.email || ""
        };
      }
    }

    const response = await api.post("/invoices", body);
    const nfseData = response.data;

    await invoice.update({
      nfseId: nfseData.id || "",
      nfseUrl: nfseData.pdfUrl || nfseData.invoiceUrl || "",
      nfseStatus: nfseData.status || "pending"
    });

    logger.info(
      { invoiceId: invoice.id, nfseId: nfseData.id },
      "NFS-e Asaas emitida"
    );
  } catch (error) {
    logger.error(
      { error: (error as any)?.response?.data || error },
      `asaasEmitNfse: erro para fatura ${invoice.id}`
    );
  }
};
