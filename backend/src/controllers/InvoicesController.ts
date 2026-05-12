import * as Yup from "yup";
import { Request, Response } from "express";
import moment from "moment";
// import { getIO } from "../libs/socket";
import AppError from "../errors/AppError";
import Invoices from "../models/Invoices";
import Company from "../models/Company";
import { asaasEmitNfse, asaasFetchNfseUrl, asaasCheckStatus } from "../services/PaymentGatewayServices/AsaasServices";

import CreatePlanService from "../services/PlanService/CreatePlanService";
import UpdatePlanService from "../services/PlanService/UpdatePlanService";
import ShowPlanService from "../services/PlanService/ShowPlanService";
import DeletePlanService from "../services/PlanService/DeletePlanService";

import FindAllInvoiceService from "../services/InvoicesService/FindAllInvoiceService";
import ListInvoicesServices from "../services/InvoicesService/ListInvoicesServices";
import ShowInvoceService from "../services/InvoicesService/ShowInvoiceService";
import UpdateInvoiceService from "../services/InvoicesService/UpdateInvoiceService";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

type StorePlanData = {
  name: string;
  id?: number | string;
  users: number | 0;
  connections: number | 0;
  queues: number | 0;
  value: number;
};

type UpdateInvoiceData = {
  status: string;
  id?: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { invoices, count, hasMore } = await ListInvoicesServices({
    searchParam,
    pageNumber
  });

  return res.json({ invoices, count, hasMore });
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { Invoiceid } = req.params;

  const invoice = await ShowInvoceService(Invoiceid);

  return res.status(200).json(invoice);
};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const invoice: Invoices[] = await FindAllInvoiceService(companyId);

  return res.status(200).json(invoice);
};

export const emitNfse = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  const invoice = await Invoices.findByPk(id, {
    include: { model: Company, as: "company" }
  });

  if (!invoice) {
    throw new AppError("Fatura não encontrada", 404);
  }

  if (invoice.status !== "paid") {
    throw new AppError("Nota fiscal só pode ser emitida para faturas pagas", 400);
  }

  // Restrição: emissão apenas no mês corrente do pagamento
  const paidAt = moment(invoice.updatedAt);
  const now = moment();
  if (!paidAt.isSame(now, "month")) {
    throw new AppError(
      `Nota fiscal só pode ser emitida no mês do pagamento (${paidAt.format("MM/YYYY")}). Entre em contato para emissão retroativa.`,
      400
    );
  }

  const inv = invoice as any;

  // Se já emitiu (nfseId existe), verifica o status atual no Asaas
  if (inv.nfseId) {
    const { url, status } = await asaasFetchNfseUrl(inv.nfseId);

    // Nota em erro ou cancelada → limpa e reemite
    if (["ERROR", "CANCELLED"].includes(status)) {
      await invoice.update({ nfseId: null, nfseUrl: null, nfseStatus: null } as any);
      await asaasEmitNfse(invoice, invoice.company);
      await invoice.reload();
      return res.status(200).json({ ...invoice.toJSON(), _msg: "nfse_emitted" });
    }

    // Nota autorizada → atualiza URL se mudou
    if (status === "AUTHORIZED" || url) {
      if (url && url !== inv.nfseUrl) {
        await invoice.update({ nfseUrl: url, nfseStatus: status } as any);
        await invoice.reload();
        return res.status(200).json({ ...invoice.toJSON(), _msg: "url_found" });
      }
      // URL ainda indisponível mesmo autorizado — retorna o que tem
      await invoice.reload();
      const current = invoice as any;
      return res.status(200).json({
        ...invoice.toJSON(),
        _msg: current.nfseUrl ? "url_found" : "nfse_pending"
      });
    }

    // SCHEDULED ou status desconhecido — ainda processando
    await invoice.reload();
    return res.status(200).json({ ...invoice.toJSON(), _msg: "nfse_pending" });
  }

  await asaasEmitNfse(invoice, invoice.company);
  await invoice.reload();
  return res.status(200).json({ ...invoice.toJSON(), _msg: "nfse_emitted" });
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const InvoiceData: UpdateInvoiceData = req.body;

  const schema = Yup.object().shape({
    name: Yup.string()
  });

  try {
    await schema.validate(InvoiceData);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { id, status } = InvoiceData;

  const plan = await UpdateInvoiceService({
    id,
    status
  });

  // const io = getIO();
  // io.emit("plan", {
  //   action: "update",
  //   plan
  // });

  return res.status(200).json(plan);
};
/* export const store = async (req: Request, res: Response): Promise<Response> => {
  const newPlan: StorePlanData = req.body;

  const schema = Yup.object().shape({
    name: Yup.string().required()
  });

  try {
    await schema.validate(newPlan);
  } catch (err) {
    throw new AppError(err.message);
  }

  const plan = await CreatePlanService(newPlan);

  // const io = getIO();
  // io.emit("plan", {
  //   action: "create",
  //   plan
  // });

  return res.status(200).json(plan);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const plan = await ShowPlanService(id);

  return res.status(200).json(plan);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const planData: UpdateInvoiceData = req.body;

  const schema = Yup.object().shape({
    name: Yup.string()
  });

  try {
    await schema.validate(planData);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { id, name, users, connections, queues, value } = planData;

  const plan = await UpdatePlanService({
    id,
    name,
    users,
    connections,
    queues,
    value
  });

  // const io = getIO();
  // io.emit("plan", {
  //   action: "update",
  //   plan
  // });

  return res.status(200).json(plan);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  const plan = await DeletePlanService(id);

  return res.status(200).json(plan);
}; */

export const checkPayment = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  const invoice = await Invoices.findByPk(id, {
    include: { model: Company, as: "company" }
  });

  if (!invoice) {
    throw new AppError("Fatura não encontrada", 404);
  }

  if (invoice.status === "paid") {
    return res.status(200).json({ ...invoice.toJSON(), _paid: true });
  }

  if (!invoice.txId || invoice.payGw !== "asaas") {
    throw new AppError("Verificação automática disponível apenas para pagamentos Asaas", 400);
  }

  const paid = await asaasCheckStatus(invoice);
  await invoice.reload();
  return res.status(200).json({ ...invoice.toJSON(), _paid: paid });
};
