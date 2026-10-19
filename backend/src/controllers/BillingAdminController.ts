import { Request, Response } from "express";
import * as Yup from "yup";
import { Op } from "sequelize";
import AppError from "../errors/AppError";
import Company from "../models/Company";
import Invoices from "../models/Invoices";
import Plan from "../models/Plan";
import UpdateCompanyService from "../services/CompanyService/UpdateCompanyService";
import UpdateInvoiceService from "../services/InvoicesService/UpdateInvoiceService";
import {
  payGatewayCreateCharge,
  checkInvoicePayment
} from "../services/PaymentGatewayServices/PaymentGatewayServices";
import { PaymentMethod } from "../services/PaymentGatewayServices/AbacatePayServices";
import GetSuperSettingService from "../services/SettingServices/GetSuperSettingService";
import BillingOverviewService from "../services/BillingAdminServices/BillingOverviewService";
import CreateBillingInvoiceService from "../services/BillingAdminServices/CreateBillingInvoiceService";
import ListBillingClientsService from "../services/BillingAdminServices/ListBillingClientsService";
import ListBillingInvoicesService from "../services/BillingAdminServices/ListBillingInvoicesService";
import SendBillingChargeService, {
  defaultChargeMessage
} from "../services/BillingAdminServices/SendBillingChargeService";
import DeleteBillingInvoiceService from "../services/BillingAdminServices/DeleteBillingInvoiceService";
import { serializeBillingInvoice } from "../services/BillingAdminServices/SerializeBillingInvoice";
import { BillingFilters } from "../services/BillingAdminServices/BillingAdminQuery";

const filtersFrom = (req: Request): BillingFilters => {
  const { startDate, endDate, status, planId, companyId, searchParam } =
    req.query as Record<string, string>;
  return { startDate, endDate, status, planId, companyId, searchParam };
};

const loadInvoice = async (id: string): Promise<Invoices> => {
  const invoice = await Invoices.findOne({
    where: { id, status: { [Op.ne]: "deleted" } },
    include: [
      {
        model: Company,
        as: "company",
        include: [{ model: Plan, as: "plan" }]
      }
    ]
  });
  if (!invoice) throw new AppError("ERR_NO_INVOICE_FOUND", 404);
  return invoice;
};

export const overview = async (
  req: Request,
  res: Response
): Promise<Response> => {
  return res.json(await BillingOverviewService(filtersFrom(req)));
};

export const invoices = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { pageNumber, perPage } = req.query as Record<string, string>;
  return res.json(
    await ListBillingInvoicesService({
      ...filtersFrom(req),
      pageNumber,
      perPage
    })
  );
};

// O detalhe sempre viaja com a mensagem sugerida: a tela usa ela no campo de
// envio, e ela muda junto com o link de pagamento.
const invoiceDetail = (invoice: Invoices) => ({
  ...serializeBillingInvoice(invoice),
  defaultMessage: defaultChargeMessage(invoice)
});

export const showInvoice = async (
  req: Request,
  res: Response
): Promise<Response> => {
  return res.json(invoiceDetail(await loadInvoice(req.params.id)));
};

export const clients = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { planId, searchParam } = req.query as Record<string, string>;
  return res.json(await ListBillingClientsService({ planId, searchParam }));
};

const storeSchema = Yup.object().shape({
  companyId: Yup.number().integer().positive().required(),
  dueDate: Yup.string()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  value: Yup.number().positive().nullable(),
  detail: Yup.string().nullable(),
  method: Yup.string().oneOf(["pix", "card", "boleto"]).nullable(),
  taxId: Yup.string().nullable()
});

export const store = async (req: Request, res: Response): Promise<Response> => {
  try {
    await storeSchema.validate(req.body);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { companyId, dueDate, value, detail, method, taxId } = req.body;

  const created = await CreateBillingInvoiceService({
    companyId,
    dueDate,
    value,
    detail
  });

  const invoice = await loadInvoice(String(created.id));

  // Gerar a cobrança no gateway é opcional: o financeiro pode só registrar o
  // lançamento e cobrar depois.
  let charge = null;
  if (method) {
    charge = await payGatewayCreateCharge(
      invoice,
      method as PaymentMethod,
      taxId
    );
    await invoice.reload();
  }

  return res.status(200).json({
    invoice: invoiceDetail(invoice),
    charge
  });
};

const chargeSchema = Yup.object().shape({
  method: Yup.string().oneOf(["pix", "card", "boleto"]).required(),
  taxId: Yup.string().nullable()
});

export const charge = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    await chargeSchema.validate(req.body);
  } catch (err) {
    throw new AppError(err.message);
  }

  const invoice = await loadInvoice(req.params.id);
  const result = await payGatewayCreateCharge(
    invoice,
    req.body.method as PaymentMethod,
    req.body.taxId
  );
  await invoice.reload();

  return res.json({
    invoice: invoiceDetail(invoice),
    charge: result
  });
};

const sendSchema = Yup.object().shape({
  number: Yup.string().nullable(),
  message: Yup.string().nullable()
});

export const send = async (req: Request, res: Response): Promise<Response> => {
  try {
    await sendSchema.validate(req.body);
  } catch (err) {
    throw new AppError(err.message);
  }

  const invoice = await loadInvoice(req.params.id);
  const result = await SendBillingChargeService({
    invoice,
    fromCompanyId: req.user.companyId,
    number: req.body.number,
    message: req.body.message
  });

  return res.json(result);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { status } = req.body;

  if (!["paid", "cancelled"].includes(status)) {
    throw new AppError("ERR_INVALID_INVOICE_TRANSITION", 400);
  }

  await UpdateInvoiceService({ id: req.params.id, status });

  return res.json(invoiceDetail(await loadInvoice(req.params.id)));
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await DeleteBillingInvoiceService(req.params.id);
  return res.status(204).send();
};

// Reconsulta o gateway sob demanda: o webhook é a via normal, mas o
// financeiro precisa de um "atualizar" quando o cliente diz que já pagou.
export const refresh = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const invoice = await loadInvoice(req.params.id);

  if (invoice.status === "open" && invoice.txId) {
    await checkInvoicePayment(invoice);
  }

  return res.json(invoiceDetail(await loadInvoice(req.params.id)));
};

const clientSchema = Yup.object().shape({
  planId: Yup.number().integer().positive().nullable(),
  saleValue: Yup.number().min(0).nullable(),
  trialDays: Yup.number().integer().min(0).max(3650).nullable(),
  dueDay: Yup.number().integer().min(1).max(31).nullable(),
  dueDate: Yup.string()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  recurrence: Yup.string()
    .oneOf(["MENSAL", "BIMESTRAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"])
    .nullable(),
  status: Yup.boolean().nullable()
});

export const updateClient = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    await clientSchema.validate(req.body);
  } catch (err) {
    throw new AppError(err.message);
  }

  const company = await Company.findByPk(req.params.id);
  if (!company) throw new AppError("ERR_NO_COMPANY_FOUND", 404);

  const fields = [
    "planId",
    "saleValue",
    "trialDays",
    "dueDay",
    "dueDate",
    "recurrence",
    "status"
  ];
  const payload: Record<string, unknown> = { id: company.id };
  fields.forEach(field => {
    if (req.body[field] !== undefined) payload[field] = req.body[field];
  });

  await UpdateCompanyService(payload as never, { billingCentralized: true });
  const [updated] = await ListBillingClientsService({
    searchParam: undefined,
    includeOwner: true
  }).then(list => list.filter(item => item.id === company.id));

  return res.json(updated || null);
};

// A tela monta os filtros e o editor de cliente com essa lista. Não dá pra
// reaproveitar /plans/list: aquela rota exige super, e o financeiro é admin.
export const plans = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  const list = await Plan.findAll({
    attributes: ["id", "name", "value", "currency", "users", "connections"],
    order: [["name", "ASC"]]
  });
  return res.json(list);
};

// A tela precisa saber se dá pra gerar cobrança antes de oferecer o botão.
export const gateway = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  const provider = await GetSuperSettingService({ key: "_paymentGateway" });
  const token =
    process.env.ABACATEPAY_TOKEN ||
    (await GetSuperSettingService({ key: "_abacatePayToken" }));

  return res.json({
    provider: provider || null,
    configured: !!provider && !!token
  });
};
