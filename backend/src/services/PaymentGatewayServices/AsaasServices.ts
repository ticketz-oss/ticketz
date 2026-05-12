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

async function buildCustomerPayload(c: any): Promise<Record<string, any>> {
  const ensureTwoWords = (n: string) => {
    const t = (n || "").trim();
    return t.includes(" ") ? t : `${t} Empresa`;
  };

  const payload: Record<string, any> = {
    name: ensureTwoWords(c.name || "Cliente"),
    cpfCnpj: (c.document || "").replace(/\D/g, ""),
    email: c.fiscalEmail || c.email || "",
    notificationDisabled: true
  };

  if (c.postalCode) payload.postalCode = c.postalCode.replace(/\D/g, "");
  if (c.address) payload.address = c.address;
  if (c.addressNumber) payload.addressNumber = c.addressNumber;
  if (c.province) payload.province = c.province;
  if (c.city) payload.city = c.city;
  if (c.state) payload.state = c.state;
  if (c.municipalRegistration) payload.municipalInscription = c.municipalRegistration;
  if (c.stateRegistration) payload.stateInscription = c.stateRegistration;

  return payload;
}

async function findOrCreateCustomer(
  api: AxiosInstance,
  company: Company
): Promise<string> {
  const c = company as any;

  const doc = (c.document || "").replace(/\D/g, "");
  if (!doc) throw new Error("CPF/CNPJ não cadastrado nos dados fiscais da empresa");

  const payload = await buildCustomerPayload(c);

  // Se já tem ID cacheado, atualiza os dados e retorna
  if (c.asaasCustomerId) {
    await api.put(`/customers/${c.asaasCustomerId}`, payload).catch(() => {});
    return c.asaasCustomerId;
  }

  // Busca por CPF/CNPJ no Asaas
  const search = await api.get("/customers", { params: { cpfCnpj: doc } });
  if (search.data?.data?.length > 0) {
    const customerId = search.data.data[0].id;
    // Atualiza endereço e dados fiscais do cliente existente
    await api.put(`/customers/${customerId}`, payload).catch(() => {});
    await company.update({ asaasCustomerId: customerId } as any);
    return customerId;
  }

  // Cria novo cliente
  const customer = await api.post("/customers", payload);
  const customerId: string = customer.data.id;

  await company.update({ asaasCustomerId: customerId } as any);
  return customerId;
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
    const customerId = await findOrCreateCustomer(api, invoice.company);

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
    const customerId = await findOrCreateCustomer(api, invoice.company);

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
  const [apiKey, sandbox, serviceDesc, serviceCode, issRate] =
    await Promise.all([
      GetSuperSettingService({ key: "_asaasApiKey" }),
      GetSuperSettingService({ key: "_asaasSandbox" }),
      GetSuperSettingService({ key: "_asaasNfseServiceDesc" }),
      GetSuperSettingService({ key: "_asaasNfseServiceCode" }),
      GetSuperSettingService({ key: "_asaasNfseIssRate" })
    ]);

  if (!apiKey) {
    throw new AppError("Asaas não configurado. Cadastre a API Key nas configurações.", 400);
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

  const description =
    serviceDesc || `Licença de uso de software SaaS - Fatura #${invoice.id}`;

  const effectiveDate = moment().format("YYYY-MM-DD");

  // Busca o serviço padrão já configurado no painel do Asaas
  // para evitar criar serviços duplicados a cada emissão
  let configuredServiceId: string | null = null;
  try {
    const servicesResp = await api.get("/invoices/services");
    const services: any[] = servicesResp.data?.data || servicesResp.data || [];
    // Prefere o marcado como padrão (isDefault), senão o primeiro da lista
    const svc =
      services.find((s: any) => s.isDefault === true) || services[0];
    if (svc?.id) configuredServiceId = svc.id;
    logger.debug({ configuredServiceId }, "asaasEmitNfse: serviço Asaas encontrado");
  } catch (err) {
    logger.warn({ err }, "asaasEmitNfse: não foi possível buscar serviços Asaas, usando campos inline");
  }

  const body: Record<string, any> = {
    serviceDescription: description,
    value: valor,
    deductions: 0,
    effectiveDate,
    observations: `Fatura #${invoice.id}`,
    taxes: {
      retainIss: false,
      iss: Number(issRate) || 0
    }
  };

  if (configuredServiceId) {
    // Usa o serviço já cadastrado no Asaas — NÃO cria novo
    body.serviceId = configuredServiceId;
  } else {
    // Fallback: envia campos inline (pode criar novo serviço no Asaas)
    body.municipalServiceName = description;
    body.municipalServiceDescription = description;
    if (serviceCode) {
      body.municipalServiceId = serviceCode;
      body.municipalServiceExternalId = serviceCode;
    }
  }

  // Sempre inclui customer (dados do tomador) — obrigatório para emissão
  const customerId = await findOrCreateCustomer(api, company);
  body.customer = customerId;

  if (invoice.payGw === "asaas" && invoice.txId) {
    body.payment = invoice.txId;
  }

  try {
    const response = await api.post("/invoices", body);
    const nfseData = response.data;

    logger.info(
      { invoiceId: invoice.id, nfseId: nfseData.id, nfseData },
      "NFS-e Asaas emitida"
    );

    const nfseUrl =
      nfseData.invoiceUrl ||
      nfseData.pdfUrl ||
      nfseData.bankSlipUrl ||
      "";

    await invoice.update({
      nfseId: nfseData.id || "",
      nfseUrl,
      nfseStatus: nfseData.status || "pending"
    });
  } catch (error) {
    const asaasError = (error as any)?.response?.data;
    logger.error(
      { asaasError, invoiceId: invoice.id },
      "asaasEmitNfse: erro na API Asaas"
    );
    const msg =
      asaasError?.errors?.[0]?.description ||
      asaasError?.description ||
      "Erro ao emitir NFS-e no Asaas.";
    throw new AppError(msg, 400);
  }
};
